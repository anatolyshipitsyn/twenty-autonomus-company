import { Injectable } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { StartCommand } from './twenty-api-client';

const execFileAsync = promisify(execFile);
const CHECK_TIMEOUT_MS = 15 * 60 * 1_000;

export class UnknownPublicationOutcomeError extends Error {}

export type PublishedResult = {
  resultSummary: string;
  evidence: {
    draftPr: true;
    checks: Array<{ name: string; passed: true; details: string }>;
  };
  prUrl: string;
  headCommit: string;
};

@Injectable()
export class ResultPublisher {
  async publish(workspace: string, command: StartCommand, assistantMessage: string): Promise<PublishedResult> {
    const resultSummary = assistantMessage.trim().slice(0, 8000);
    if (!resultSummary) throw new Error('Codex completed without a final assistant summary.');

    const baseRef = command.payload.snapshot.project.baseRef;
    const repository = command.payload.snapshot.project.repositoryUrl;
    const branch = `codex/${command.taskId}-${command.payload.requestVersion}`;
    const existing = await this.findExistingPullRequest(workspace, branch, baseRef);
    if (existing) {
      await this.git(workspace, ['fetch', 'origin', branch]);
      const headCommit = (await this.git(workspace, ['rev-parse', `origin/${branch}`])).trim();
      if (!existing.isDraft || existing.baseRefName !== baseRef || existing.headRefOid !== headCommit) {
        throw new Error('An existing pull request for this run does not match the expected draft, base, and commit.');
      }
      await this.git(workspace, ['switch', '-c', branch, '--track', `origin/${branch}`]);
      const checks = await this.runMandatoryChecks(workspace);
      await this.git(workspace, ['switch', baseRef]);
      return { resultSummary, evidence: { draftPr: true, checks }, prUrl: existing.url, headCommit };
    }

    const actualRepository = (await this.exec('gh', ['repo', 'view', '--json', 'url', '--jq', '.url'], workspace)).stdout.trim().replace(/\.git$/, '');
    if (actualRepository !== repository.replace(/\.git$/, '')) {
      throw new Error('The GitHub repository selected by gh does not match the Project repository allowlist.');
    }
    const changes = (await this.git(workspace, ['status', '--porcelain'])).trim();
    if (!changes) throw new Error('Codex completed without file changes; a result PR cannot be created.');

    await this.git(workspace, ['switch', '-c', branch]);
    const checks = await this.runMandatoryChecks(workspace);
    await this.git(workspace, ['add', '--all']);
    await this.git(workspace, ['diff', '--cached', '--check']);
    const staged = (await this.git(workspace, ['diff', '--cached', '--name-only'])).trim();
    if (!staged) throw new Error('No tracked changes remain after staging.');
    await this.exec('git', ['-c', 'user.name=Autonomus Company Worker', '-c', 'user.email=worker@users.noreply.github.com', 'commit', '-m', `AI task ${command.taskId} attempt ${command.payload.requestVersion}`], workspace);
    const headCommit = (await this.git(workspace, ['rev-parse', 'HEAD'])).trim();
    try {
      await this.git(workspace, ['push', '--set-upstream', 'origin', branch]);
    } catch (error) {
      throw new UnknownPublicationOutcomeError(`Git push outcome is unknown; run remains locked for reconciliation: ${this.message(error)}`);
    }

    let created: string;
    try {
      created = (await this.exec('gh', [
        'pr', 'create', '--draft', '--base', baseRef, '--head', branch,
      '--title', `AI task ${command.taskId}: ${command.payload.snapshot.task.title}`.slice(0, 120),
        '--body', resultSummary,
      ], workspace)).stdout;
    } catch (error) {
      const reconciled = await this.findExistingPullRequest(workspace, branch, baseRef).catch(() => undefined);
      if (reconciled?.isDraft && reconciled.baseRefName === baseRef && reconciled.headRefOid === headCommit) {
        await this.git(workspace, ['switch', baseRef]);
        return { resultSummary, evidence: { draftPr: true, checks }, prUrl: reconciled.url, headCommit };
      }
      throw new UnknownPublicationOutcomeError(`Draft pull request outcome is unknown; run remains locked for reconciliation: ${this.message(error)}`);
    }
    const prUrl = created.trim().split(/\s+/).find((value) => /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/.test(value));
    if (!prUrl) {
      throw new UnknownPublicationOutcomeError('GitHub may have created a draft pull request but returned no verifiable URL.');
    }

    try {
      await this.git(workspace, ['switch', baseRef]);
    } catch (error) {
      throw new UnknownPublicationOutcomeError(`Draft PR was created but the workspace could not return to its base branch: ${this.message(error)}`);
    }
    return { resultSummary, evidence: { draftPr: true, checks }, prUrl, headCommit };
  }

  private async runMandatoryChecks(workspace: string): Promise<PublishedResult['evidence']['checks']> {
    const checks: Array<{ name: string; passed: true; details: string }> = [];
    const packageChecks = [
      { name: 'app lint', cwd: `${workspace}/apps/twenty-app`, args: ['yarn', 'lint'] },
      { name: 'app typecheck', cwd: `${workspace}/apps/twenty-app`, args: ['yarn', 'typecheck'] },
      { name: 'app unit tests', cwd: `${workspace}/apps/twenty-app`, args: ['yarn', 'test:unit'] },
      { name: 'worker build', cwd: `${workspace}/services/worker`, args: ['yarn', 'build'] },
    ];
    for (const check of packageChecks) {
      await this.exec('corepack', check.args, check.cwd, CHECK_TIMEOUT_MS);
      checks.push({ name: check.name, passed: true, details: `Completed with exit code 0.` });
    }
    return checks;
  }

  private async findExistingPullRequest(workspace: string, branch: string, baseRef: string): Promise<{
    url: string; isDraft: boolean; baseRefName: string; headRefOid: string;
  } | undefined> {
    const output = await this.exec('gh', ['pr', 'list', '--state', 'all', '--head', branch,
      '--json', 'url,isDraft,baseRefName,headRefOid'], workspace);
    const rows = JSON.parse(output.stdout) as Array<{ url: string; isDraft: boolean; baseRefName: string; headRefOid: string }>;
    if (rows.length > 1) throw new Error('Multiple pull requests exist for the deterministic run branch.');
    return rows[0];
  }

  private async git(workspace: string, args: string[]): Promise<string> {
    return (await this.exec('git', ['-C', workspace, ...args], workspace)).stdout;
  }

  private async exec(binary: string, args: string[], cwd: string, timeout = 60_000): Promise<{ stdout: string; stderr: string }> {
    try {
      return await execFileAsync(binary, args, {
        cwd,
        timeout,
        maxBuffer: 1024 * 1024,
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          TMPDIR: process.env.TMPDIR,
          LANG: process.env.LANG,
          LC_ALL: process.env.LC_ALL,
          USER: process.env.USER,
          SHELL: process.env.SHELL,
        },
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown process error';
      throw new Error(`${binary} ${args[0] ?? ''} failed: ${detail}`);
    }
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : 'unknown process error';
  }
}
