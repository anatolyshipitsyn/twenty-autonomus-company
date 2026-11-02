import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const remoteName = 'autonomus-local';
const serverUrl = process.env.TWENTY_SERVER_URL;
const authOrigin = process.env.TWENTY_AUTH_ORIGIN;
const adminEmail = process.env.TWENTY_ADMIN_EMAIL;
const adminPassword = process.env.TWENTY_ADMIN_PASSWORD;

if (!serverUrl || !authOrigin || !adminEmail || !adminPassword) {
  throw new Error(
    'TWENTY_SERVER_URL, TWENTY_AUTH_ORIGIN, TWENTY_ADMIN_EMAIL and TWENTY_ADMIN_PASSWORD are required',
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
  clearTimeout(renewalTimer);
  process.exitCode = code ?? (signal ? 1 : 0);
});
