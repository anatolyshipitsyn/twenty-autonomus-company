import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const remoteName = 'autonomus-local';
const serverUrl = process.env.TWENTY_SERVER_URL;
const authOrigin = process.env.TWENTY_AUTH_ORIGIN;
const adminEmail = process.env.TWENTY_ADMIN_EMAIL;
const adminPassword = process.env.TWENTY_ADMIN_PASSWORD;
const operatorEmail = process.env.ORCHESTRATOR_OPERATOR_EMAIL;
// Keep this in sync with ORCHESTRATOR_OPERATOR_ROLE_UNIVERSAL_IDENTIFIER.
const operatorRoleUniversalIdentifier = 'bf7ef328-ce56-4dba-933b-fe71893bca90';

if (!serverUrl || !authOrigin || !adminEmail || !adminPassword || !operatorEmail) {
  throw new Error(
    'TWENTY_SERVER_URL, TWENTY_AUTH_ORIGIN, TWENTY_ADMIN_EMAIL, TWENTY_ADMIN_PASSWORD and ORCHESTRATOR_OPERATOR_EMAIL are required',
  );
}

async function metadataRequest(query, variables) {
  const response = await fetch(`${serverUrl}/metadata`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Twenty authentication request failed with HTTP ${response.status}`);
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(`Twenty authentication failed: ${payload.errors[0].message}`);
  }

  return payload.data;
}

const loginData = await metadataRequest(
  'mutation GetLoginToken($email: String!, $password: String!, $origin: String!) { getLoginTokenFromCredentials(email: $email, password: $password, origin: $origin) { loginToken { token } } }',
  { email: adminEmail, password: adminPassword, origin: authOrigin },
);
const loginToken = loginData.getLoginTokenFromCredentials?.loginToken?.token;

if (!loginToken) {
  throw new Error('Twenty did not return a login token for the configured local administrator');
}

const authData = await metadataRequest(
  'mutation GetAuthTokens($loginToken: String!, $origin: String!) { getAuthTokensFromLoginToken(loginToken: $loginToken, origin: $origin) { tokens { accessOrWorkspaceAgnosticToken { token expiresAt } } } }',
  { loginToken, origin: authOrigin },
);
const accessTokenData =
  authData.getAuthTokensFromLoginToken?.tokens?.accessOrWorkspaceAgnosticToken;
const accessToken = accessTokenData?.token;
const accessTokenExpiresAt = Date.parse(accessTokenData?.expiresAt ?? '');

if (!accessToken || !Number.isFinite(accessTokenExpiresAt) || accessTokenExpiresAt <= Date.now()) {
  throw new Error('Twenty did not return a valid access token for the configured local administrator');
}

async function authenticatedRequest(endpoint, query) {
  const response = await fetch(`${serverUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Twenty bootstrap request to ${endpoint} failed with HTTP ${response.status}`);
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message);
  }

  return payload.data;
}

async function ensureOperatorRoleAssignment(isChildRunning) {
  const operatorEmailLiteral = JSON.stringify(operatorEmail);
  let lastError;

  for (let attempt = 0; attempt < 120 && isChildRunning(); attempt += 1) {
    try {
      const memberData = await authenticatedRequest(
        '/graphql',
        `{ workspaceMembers(first: 1, filter: { userEmail: { eq: ${operatorEmailLiteral} } }) { edges { node { id userEmail } } } }`,
      );
      const member = memberData.workspaceMembers?.edges?.[0]?.node;

      if (!member) {
        if (attempt >= 4) {
          console.warn(
            `No seeded workspace member found for ${operatorEmail}; role assignment is skipped. It is created only when PostgreSQL initializes an empty volume.`,
          );
          return;
        }
      } else {
        const roleData = await authenticatedRequest(
          '/metadata',
          '{ getRoles { id universalIdentifier } }',
        );
        const role = roleData.getRoles?.find(
          (candidate) => candidate.universalIdentifier === operatorRoleUniversalIdentifier,
        );

        if (role) {
          await authenticatedRequest(
            '/metadata',
            `mutation { updateWorkspaceMemberRole(workspaceMemberId: "${member.id}", roleId: "${role.id}") { id } }`,
          );
          console.info(`Assigned Orchestrator Operator to ${operatorEmail}`);
          return;
        }
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  if (lastError) {
    console.error(`Could not assign Orchestrator Operator to ${operatorEmail}: ${lastError.message}`);
  } else if (isChildRunning()) {
    console.error(`Timed out waiting for the Orchestrator Operator role to sync for ${operatorEmail}`);
  }
}

const home = process.env.HOME ?? '/tmp/twenty-app-dev-home';
const configDirectory = join(home, '.twenty');
const targetConfigPath = join(configDirectory, 'config.json');
await mkdir(configDirectory, { recursive: true, mode: 0o700 });
await writeFile(
  targetConfigPath,
  JSON.stringify({
    version: 1,
    defaultRemote: remoteName,
    remotes: {
      [remoteName]: {
        apiUrl: serverUrl,
        apiKey: accessToken,
      },
    },
  }),
  { mode: 0o600 },
);
await chmod(targetConfigPath, 0o600);

const [command, ...args] = process.argv.slice(2);

if (!command) {
  throw new Error('No command was provided for the Twenty app dev container');
}

const { spawn } = await import('node:child_process');
const child = spawn(command, args, { stdio: 'inherit' });
let childRunning = true;
ensureOperatorRoleAssignment(() => childRunning).catch((error) => {
  console.error(`Could not provision ${operatorEmail}: ${error.message}`);
});
const renewalDelay = Math.max(1_000, accessTokenExpiresAt - Date.now() - 60_000);
const renewalTimer = setTimeout(() => {
  console.info('Restarting app-dev to renew its local Twenty session');
  child.kill('SIGTERM');
}, renewalDelay);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    clearTimeout(renewalTimer);
    child.kill(signal);
  });
}

child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  childRunning = false;
  clearTimeout(renewalTimer);
  process.exitCode = code ?? (signal ? 1 : 0);
});
