import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { access, realpath } from 'node:fs/promises';
import { promisify } from 'node:util';
import { CodexAppServerClient } from './codex-app-server-client';
import { ResultPublisher, UnknownPublicationOutcomeError } from './result-publisher';
import { StartCommand, TwentyApiClient } from './twenty-api-client';

const execFileAsync = promisify(execFile);

@Injectable()
export class ExecutionCoordinator {
  private readonly logger = new Logger(ExecutionCoordinator.name);
  private active = false;

  constructor(
    private readonly codex: CodexAppServerClient,
    private readonly twenty: TwentyApiClient,
    private readonly results: ResultPublisher,
  ) {}

  isEnabled(): boolean {
    return process.env.CODEX_ENABLED === 'true';
  }

  isBusy(): boolean {
    return this.active;
  }

  async execute(command: StartCommand): Promise<void> {
    if (!this.isEnabled() || this.active) return;
    this.active = true;
    let threadId: string | undefined;
    let resultSubmitted = false;
    try {
      const workspace = await this.validateWorkspace(command);
      await this.codex.start();
      threadId = await this.codex.startThread(workspace);
      await this.codex.nameThread(threadId, `AC ${command.runKey}`);
      await this.twenty.acknowledgeStart(command, threadId);

      const turnId = await this.codex.startTurn(
        threadId,
        workspace,
        this.buildPrompt(command),
      );
      await this.twenty.recordStarted(command, threadId, turnId);
      this.logger.log(`STARTED saved for ${command.runKey}; thread ${threadId}, turn ${turnId}.`);

      const completion = await this.codex.waitForTurnCompletion(threadId, turnId);
      if (completion.turn.status !== 'completed') {
        throw new Error(`Codex turn ended with status ${completion.turn.status}; no successful result will be published.`);
      }
      const result = await this.results.publish(workspace, command, completion.assistantMessage);
      await this.twenty.recordResult(command, result);
      resultSubmitted = true;
      const applied = await this.twenty.waitForEventApplication(command, 'RESULT');
      if (applied !== 'APPLIED') throw new Error('Twenty rejected RESULT; run remains locked for reconciliation.');
      this.active = false;
      this.logger.log(`RESULT applied for ${command.runKey}; task is ready for review.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown execution error';
      this.logger.error(`Run ${command.runKey} is blocked and will not be retried automatically: ${message}`);
      if (threadId && !resultSubmitted && !(error instanceof UnknownPublicationOutcomeError)) {
        await this.twenty.recordError(command, message).catch((recordError: unknown) => {
          const recordMessage = recordError instanceof Error ? recordError.message : 'unknown API error';
          this.logger.error(`Could not save ERROR for ${command.runKey}: ${recordMessage}`);
        });
      }
    } finally {
      await this.codex.close().catch(() => undefined);
    }
  }

  private async validateWorkspace(command: StartCommand): Promise<string> {
    const configuredRoot = process.env.CODEX_WORKSPACE_ROOT;
    const expectedRepository = process.env.CODEX_ALLOWED_REPOSITORY_URL;
    const expectedBaseRef = process.env.CODEX_ALLOWED_BASE_REF;
    const snapshot = command.payload.snapshot;
    if (!configuredRoot || !expectedRepository || !expectedBaseRef) {
      throw new Error('CODEX_WORKSPACE_ROOT, CODEX_ALLOWED_REPOSITORY_URL, and CODEX_ALLOWED_BASE_REF are required.');
    }
    if (
      snapshot.project.repositoryUrl !== expectedRepository ||
      snapshot.project.baseRef !== expectedBaseRef
    ) {
      throw new Error('START snapshot repository or base ref does not match the worker allowlist.');
    }

    const workspace = await realpath(configuredRoot);
    await access(workspace);
    const remote = (await execFileAsync('git', ['-C', workspace, 'remote', 'get-url', 'origin'])).stdout.trim();
    const branch = (await execFileAsync('git', ['-C', workspace, 'branch', '--show-current'])).stdout.trim();
    if (remote !== expectedRepository || branch !== expectedBaseRef) {
      throw new Error('Workspace origin or checked-out branch does not match the worker allowlist.');
    }
    const status = (await execFileAsync('git', ['-C', workspace, 'status', '--porcelain'])).stdout.trim();
    if (status) throw new Error('Workspace must be clean before starting a run.');
    return workspace;
  }

  private buildPrompt(command: StartCommand): string {
    const { task, project } = command.payload.snapshot;
    return [
      `Repository: ${project.repositoryUrl}`,
      `Base ref: ${project.baseRef}`,
      `Task: ${task.title}`,
      `Description:\n${task.description}`,
      `Acceptance criteria:\n${task.acceptanceCriteria}`,
      'Work only in the supplied workspace. Do not access the network or request approvals.',
    ].join('\n\n');
  }
}
