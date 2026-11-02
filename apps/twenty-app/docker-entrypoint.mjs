import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const remoteName = 'autonomus-local';
const sourceConfigPath = process.env.TWENTY_CLI_CONFIG_FILE;
const serverUrl = process.env.TWENTY_SERVER_URL;

if (!sourceConfigPath || !serverUrl) {
  throw new Error('TWENTY_CLI_CONFIG_FILE and TWENTY_SERVER_URL are required');
}

const home = process.env.HOME ?? '/tmp/twenty-app-dev-home';
const configDirectory = join(home, '.twenty');
const targetConfigPath = join(configDirectory, 'config.json');
let sourceConfig;

try {
  sourceConfig = JSON.parse(await readFile(targetConfigPath, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw error;
  }

  sourceConfig = JSON.parse(await readFile(sourceConfigPath, 'utf8'));
}

const remote = sourceConfig.remotes?.[remoteName];

if (!remote || !(remote.twentyCLIAccessToken || remote.apiKey)) {
  throw new Error(
    `Authenticated Twenty CLI remote "${remoteName}" was not found in ${sourceConfigPath}`,
  );
}

await mkdir(configDirectory, { recursive: true, mode: 0o700 });
await writeFile(
  targetConfigPath,
  JSON.stringify({
    version: sourceConfig.version ?? 1,
    defaultRemote: remoteName,
    remotes: {
      [remoteName]: {
        ...remote,
        apiUrl: serverUrl,
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

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
