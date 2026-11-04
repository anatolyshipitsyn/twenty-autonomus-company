import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ChildProcessWithoutNullStreams, spawn, execFile } from 'node:child_process';
import { createInterface, Interface } from 'node:readline';
import { promisify } from 'node:util';
import type { InitializeParams } from './codex-protocol/generated/InitializeParams';
import type { ThreadStartParams } from './codex-protocol/generated/v2/ThreadStartParams';
import type { ThreadSetNameParams } from './codex-protocol/generated/v2/ThreadSetNameParams';
import type { TurnStartParams } from './codex-protocol/generated/v2/TurnStartParams';
import type { SandboxPolicy } from './codex-protocol/generated/v2/SandboxPolicy';
import { CODEX_APP_SERVER_VERSION } from './codex-protocol/generated/version';

const execFileAsync = promisify(execFile);
const RPC_TIMEOUT_MS = 30_000;
const TURN_TIMEOUT_MS = 60 * 60 * 1_000;

type RpcMessage = {
  id?: number;
  method?: string;
  result?: unknown;
  params?: Record<string, unknown>;
  error?: { code?: number; message?: string };
};

type TurnStartResult = { turn?: { id?: string; status?: string } };
export type TurnCompletion = {
  threadId: string;
  turn: { id: string; status: 'completed' | 'failed' | 'interrupted'; error?: { message?: string } };
  assistantMessage: string;
};

@Injectable()
export class CodexAppServerClient implements OnModuleDestroy {
  private child?: ChildProcessWithoutNullStreams;
  private lines?: Interface;
  private requestId = 0;
  private readonly pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }>();
  private readonly turnCompletions = new Map<string, TurnCompletion>();
  private readonly completionWaiters = new Map<string, Array<(completion: TurnCompletion) => void>>();
  private readonly assistantMessages = new Map<string, string>();
  private activeTurn?: { threadId: string; turnId: string };

  async start(): Promise<void> {
    const binary = process.env.CODEX_CLI_PATH || 'codex';
    const { stdout } = await execFileAsync(binary, ['--version'], {
      env: this.sanitizedEnvironment(),
      timeout: 10_000,
    });
    const actualVersion = stdout.match(/codex-cli\s+(\S+)/)?.[1];
    if (actualVersion !== CODEX_APP_SERVER_VERSION) {
      throw new Error(`Codex CLI version must be ${CODEX_APP_SERVER_VERSION}; found ${actualVersion || 'unknown'}.`);
    }

    this.child = spawn(binary, ['app-server', '--listen', 'stdio://'], {
      env: this.sanitizedEnvironment(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const child = this.child;
    child.stderr.resume();
    child.on('error', () => this.rejectPending('Codex App Server could not start.'));
    child.on('exit', () => this.rejectPending('Codex App Server exited.'));
    this.lines = createInterface({ input: child.stdout });
    this.lines.on('line', (line) => this.handleLine(line));

    const initialize: InitializeParams = {
      clientInfo: {
        name: 'autonomus_company_worker',
        title: 'Autonomus Company Worker',
        version: '0.1.0',
      },
      capabilities: null,
    };
    await this.request('initialize', initialize);
    this.sendNotification('initialized', {});
  }

  async startThread(workspace: string): Promise<string> {
    const params: ThreadStartParams = {
      cwd: workspace,
      approvalPolicy: 'never',
      sandbox: 'workspace-write',
      ephemeral: false,
    };
    const result = (await this.request('thread/start', params)) as { thread?: { id?: string } };
    if (!result.thread?.id) throw new Error('Codex App Server did not return a thread id.');
    return result.thread.id;
  }

  async nameThread(threadId: string, name: string): Promise<void> {
    const params: ThreadSetNameParams = { threadId, name };
    await this.request('thread/name/set', params);
  }

  async startTurn(threadId: string, workspace: string, prompt: string): Promise<string> {
    const sandboxPolicy: SandboxPolicy = {
      type: 'workspaceWrite',
      writableRoots: [workspace],
      networkAccess: false,
      excludeTmpdirEnvVar: true,
      excludeSlashTmp: true,
    };
    const params: TurnStartParams = {
      threadId,
      input: [{ type: 'text', text: prompt, text_elements: [] }],
      cwd: workspace,
      approvalPolicy: 'never',
      sandboxPolicy,
    };
    const result = (await this.request('turn/start', params)) as TurnStartResult;
    const turnId = result.turn?.id;
    if (!turnId) throw new Error('Codex App Server did not return a turn id.');
    this.activeTurn = { threadId, turnId };
    return turnId;
  }

  async waitForTurnCompletion(threadId: string, turnId: string): Promise<TurnCompletion> {
    const key = `${threadId}:${turnId}`;
    const existing = this.turnCompletions.get(key);
    if (existing) return existing;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Codex turn exceeded its active-time limit.')), TURN_TIMEOUT_MS);
      const waiters = this.completionWaiters.get(key) ?? [];
      waiters.push((completion) => {
        clearTimeout(timer);
        resolve(completion);
      });
      this.completionWaiters.set(key, waiters);
    });
  }

  async close(): Promise<void> {
    if (!this.child) return;
    if (this.activeTurn) {
      await this.request('turn/interrupt', this.activeTurn).catch(() => undefined);
      this.activeTurn = undefined;
    }
    const child = this.child;
    this.lines?.close();
    child.stdin.end();
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        resolve();
      }, 2_000);
      child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
    this.child = undefined;
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  private sanitizedEnvironment(): NodeJS.ProcessEnv {
    const allowedKeys = ['PATH', 'HOME', 'TMPDIR', 'LANG', 'LC_ALL', 'USER', 'SHELL', 'CODEX_HOME'];
    return Object.fromEntries(
      allowedKeys.flatMap((key) => process.env[key] ? [[key, process.env[key]!]] : []),
    );
  }

  private async request(method: string, params: unknown): Promise<unknown> {
    if (!this.child || this.child.killed) throw new Error('Codex App Server is not running.');
    const id = ++this.requestId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Codex App Server request ${method} timed out.`));
      }, RPC_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, timer });
      this.child!.stdin.write(`${JSON.stringify({ id, method, params })}\n`, (error) => {
        if (!error) return;
        clearTimeout(timer);
        this.pending.delete(id);
        reject(new Error(`Codex App Server request ${method} could not be sent.`));
      });
    });
  }

  private sendNotification(method: string, params: unknown): void {
    this.child?.stdin.write(`${JSON.stringify({ method, params })}\n`);
  }

  private handleLine(line: string): void {
    let message: RpcMessage;
    try {
      message = JSON.parse(line) as RpcMessage;
    } catch {
      this.rejectPending('Codex App Server returned a malformed JSON-RPC message.');
      return;
    }

    if (typeof message.id === 'number') {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(`Codex App Server request failed (${message.error.code ?? 'unknown'}).`));
      } else {
        pending.resolve(message.result);
      }
      return;
    }

    if (message.method === 'item/agentMessage/delta') {
      const params = message.params as { threadId?: string; turnId?: string; delta?: string } | undefined;
      if (params?.threadId && params.turnId && typeof params.delta === 'string') {
        const key = `${params.threadId}:${params.turnId}`;
        this.assistantMessages.set(key, (this.assistantMessages.get(key) ?? '') + params.delta);
      }
      return;
    }

    if (message.method === 'turn/completed') {
      const params = message.params as { threadId?: string; turn?: { id?: string; status?: string; error?: { message?: string } } } | undefined;
      const threadId = params?.threadId;
      const turnId = params?.turn?.id;
      const status = params?.turn?.status;
      if (!threadId || !turnId || !['completed', 'failed', 'interrupted'].includes(status ?? '')) return;
      const completion: TurnCompletion = {
        threadId,
        assistantMessage: this.assistantMessages.get(`${threadId}:${turnId}`) ?? '',
        turn: {
          id: turnId,
          status: status as TurnCompletion['turn']['status'],
          ...(params?.turn?.error ? { error: { message: params.turn.error.message } } : {}),
        },
      };
      const key = `${threadId}:${turnId}`;
      this.turnCompletions.set(key, completion);
      this.assistantMessages.delete(key);
      this.activeTurn = undefined;
      for (const resolve of this.completionWaiters.get(key) ?? []) resolve(completion);
      this.completionWaiters.delete(key);
    }
  }

  private rejectPending(message: string): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error(message));
    }
    this.pending.clear();
  }
}
