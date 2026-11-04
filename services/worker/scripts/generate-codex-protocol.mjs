import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, copyFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, relative, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workerRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(workerRoot, 'protocol/codex-app-server.json'), 'utf8'));
const codexBin = process.env.CODEX_CLI_PATH || 'codex';
const versionOutput = execFileSync(codexBin, ['--version'], { encoding: 'utf8' });
const actualVersion = versionOutput.match(/codex-cli\s+(\S+)/)?.[1];

if (actualVersion !== manifest.cliVersion) {
  throw new Error(`Expected Codex CLI ${manifest.cliVersion}, received ${actualVersion || 'unknown'}.`);
}

const temporaryRoot = mkdtempSync(join(tmpdir(), 'codex-app-server-protocol-'));
const generatedRoot = join(temporaryRoot, 'generated');
const outputRoot = join(workerRoot, 'src/codex-protocol/generated');
const initialFiles = [
  'InitializeParams.ts',
  'v2/ThreadStartParams.ts',
  'v2/ThreadSetNameParams.ts',
  'v2/TurnStartParams.ts',
];

try {
  const generation = spawnSync(codexBin, ['app-server', 'generate-ts', '--out', generatedRoot], {
    cwd: workerRoot,
    encoding: 'utf8',
  });
  if (generation.status !== 0) {
    throw new Error(generation.stderr || generation.stdout || 'Codex protocol generation failed.');
  }

  const visited = new Set();
  const visit = (relativePath) => {
    if (visited.has(relativePath)) return;
    visited.add(relativePath);
    const sourcePath = join(generatedRoot, relativePath);
    const source = readFileSync(sourcePath, 'utf8');
    const importPattern = /import\s+type\s+[^;]+\s+from\s+["']([^"']+)["'];/g;
    for (const match of source.matchAll(importPattern)) {
      const importedPath = resolve(dirname(sourcePath), `${match[1]}.ts`);
      visit(relative(generatedRoot, importedPath));
    }
  };

  for (const file of initialFiles) visit(file);

  rmSync(outputRoot, { recursive: true, force: true });
  mkdirSync(outputRoot, { recursive: true });
  for (const relativePath of visited) {
    const targetPath = join(outputRoot, relativePath);
    mkdirSync(dirname(targetPath), { recursive: true });
    copyFileSync(join(generatedRoot, relativePath), targetPath);
  }
  writeFileSync(
    join(outputRoot, 'version.ts'),
    `// Generated from codex app-server ${actualVersion}.\nexport const CODEX_APP_SERVER_VERSION = '${actualVersion}' as const;\n`,
  );

  console.log(`Generated ${visited.size} Codex App Server protocol files for ${actualVersion}.`);
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
