import { spawn } from 'child_process';
import { delimiter, join } from 'path';

type TwentyCliError = {
  code: string;
  message: string;
  hint?: string;
};

export type TwentyCliResult =
  | { ok: true; data: unknown }
  | { ok: false; error: TwentyCliError };

function withoutProjectBinaries(pathValue: string) {
  return pathValue
    .split(delimiter)
    .filter(
      (entry) =>
        entry !== process.env.BERRY_BIN_FOLDER &&
        !entry.endsWith(join('node_modules', '.bin')),
    )
    .join(delimiter);
}

export function runTwenty(cliArguments: string[]): Promise<TwentyCliResult> {
  const executable = process.env.TWENTY_CLI ?? 'twenty';

  const childEnvironment: NodeJS.ProcessEnv = {
    ...process.env,
    PATH: withoutProjectBinaries(process.env.PATH ?? ''),
  };

  // These credentials belong to the Core API test client. They must not
  // redirect Twenty CLI operations away from its explicitly configured remote.
  delete childEnvironment.TWENTY_API_URL;
  delete childEnvironment.TWENTY_API_KEY;

  return new Promise((resolve, reject) => {
    const child = spawn(executable, [...cliArguments, '--json'], {
      env: childEnvironment,
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    let stdout = '';

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') {
        reject(error);

        return;
      }

      reject(
        new Error(
          `${executable} was not found. Install the Twenty CLI globally, or set TWENTY_CLI to its path.`,
        ),
      );
    });

    child.on('close', (exitCode) => {
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(
          new Error(
            `${executable} ${cliArguments.join(' ')} exited with code ${exitCode} without a JSON result. ` +
              'Check that it is the Twenty CLI (twenty --version), or set TWENTY_CLI to its path.',
          ),
        );
      }
    });
  });
}
