import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

type GraphqlError = { message: string };
type GraphqlResponse<T> = { data?: T; errors?: GraphqlError[] };

export type StartCommand = {
  id: string;
  taskId: string;
  runId: string;
  runKey: string;
  operationKey: string;
  payload: {
    protocolVersion: 1;
    requestVersion: number;
    snapshot: {
      task: { id: string; title: string; description: string; acceptanceCriteria: string };
      project: { id: string; repositoryUrl: string; baseRef: string };
      requestVersion: number;
    };
  };
};

export type ReadyTask = {
  id: string;
  title: string;
  requestVersion: number;
};

type JournalQuery = {
  aiRunJournals: {
    edges: Array<{
      node: {
        id: string;
        taskId: string;
        runId: string | null;
        runKey: string;
        operationKey: string;
        direction: string;
        eventType: string;
        state: string;
        payload: unknown;
        result: unknown;
      };
    }>;
  };
};

const PENDING_START_QUERY = `
  query PendingStartCommands($filter: AiRunJournalFilterInput!) {
    aiRunJournals(filter: $filter, first: 100) {
      edges {
        node {
          id taskId runId runKey operationKey direction eventType state payload result
        }
      }
    }
  }
`;

@Injectable()
export class TwentyApiClient implements OnModuleInit {
  private readonly logger = new Logger(TwentyApiClient.name);
  private endpoint!: string;
  private apiKey!: string;

  onModuleInit(): void {
    const baseUrl = process.env.TWENTY_API_URL?.replace(/\/$/, '');
    const apiKey = process.env.TWENTY_API_KEY;
    if (!baseUrl || !apiKey) {
      throw new Error('TWENTY_API_URL and TWENTY_API_KEY are required.');
    }
    this.endpoint = `${baseUrl}/graphql`;
    this.apiKey = apiKey;
  }

  async getPendingStartCommands(): Promise<StartCommand[]> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        query: PENDING_START_QUERY,
        variables: {
          filter: {
            direction: { eq: 'OUTBOUND' },
            eventType: { eq: 'START' },
            state: { eq: 'PENDING' },
          },
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Twenty GraphQL request failed with HTTP ${response.status}.`);
    }

    const result = this.expectData<JournalQuery>(await response.json());

    const commands: StartCommand[] = [];
    for (const edge of result.aiRunJournals.edges) {
      const command = this.validateStartCommand(edge.node);
      if (command) commands.push(command);
    }
    return commands;
  }

  async getNextReadyTask(): Promise<ReadyTask | undefined> {
    const activeRuns = await this.request<{
      aiRuns: { edges: Array<{ node: { id: string } }> };
    }>(
      `query ActiveRuns($filter: AiRunFilterInput!) {
        aiRuns(filter: $filter, first: 1) { edges { node { id } } }
      }`,
      { filter: { status: { in: ['PENDING', 'RUNNING', 'UNKNOWN'] } } },
    );
    if (activeRuns.aiRuns.edges.length > 0) return undefined;

    const result = await this.request<{
      aiTasks: { edges: Array<{ node: { id: string; title: string; requestVersion: number; createdAt: string } }> };
    }>(
      `query ReadyTasks($filter: AiTaskFilterInput!) {
        aiTasks(filter: $filter, first: 100) {
          edges { node { id title requestVersion createdAt } }
        }
      }`,
      { filter: { status: { eq: 'READY' }, activeRunId: { is: 'NULL' } } },
    );
    const task = result.aiTasks.edges
      .map((edge) => edge.node)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0];
    if (!task || !Number.isInteger(Number(task.requestVersion)) || Number(task.requestVersion) < 1) return undefined;
    return { id: task.id, title: task.title, requestVersion: Number(task.requestVersion) };
  }

  async requestDispatch(task: ReadyTask): Promise<void> {
    const runKey = `${task.id}:${task.requestVersion}`;
    const operationKey = `${runKey}:DISPATCH_REQUEST`;
    const payload = { protocolVersion: 1, requestVersion: task.requestVersion };
    const existing = await this.request<{
      aiRunJournals: { edges: Array<{ node: {
        taskId: string; runId: string | null; runKey: string; operationKey: string;
        direction: string; eventType: string; state: string; payload: unknown;
      } }> };
    }>(
      `query ExistingDispatchRequest($filter: AiRunJournalFilterInput!) {
        aiRunJournals(filter: $filter, first: 1) {
          edges { node { taskId runId runKey operationKey direction eventType state payload } }
        }
      }`,
      { filter: { operationKey: { eq: operationKey } } },
    );
    const saved = existing.aiRunJournals.edges[0]?.node;
    if (saved) {
      if (
        saved.taskId !== task.id || saved.runId !== null || saved.runKey !== runKey ||
        saved.operationKey !== operationKey || saved.direction !== 'INBOUND' ||
        saved.eventType !== 'DISPATCH_REQUEST' || JSON.stringify(saved.payload) !== JSON.stringify(payload)
      ) throw new Error(`Existing dispatch operation ${operationKey} conflicts with the READY task.`);
      if (!['PENDING', 'APPLIED'].includes(saved.state)) {
        throw new Error(`Dispatch operation ${operationKey} is ${saved.state}; operator reconciliation is required.`);
      }
      return;
    }

    await this.request(
      `mutation CreateDispatchRequest($data: AiRunJournalCreateInput!) {
        createAiRunJournal(data: $data) { id }
      }`,
      {
        data: {
          taskId: task.id,
          runKey,
          operationKey,
          direction: 'INBOUND',
          eventType: 'DISPATCH_REQUEST',
          state: 'PENDING',
          receivedAt: new Date().toISOString(),
          payload,
        },
      },
    ).catch(async (error: unknown) => {
      const confirmed = await this.request<{
        aiRunJournals: { edges: Array<{ node: { taskId: string; runId: string | null; runKey: string; operationKey: string; direction: string; eventType: string; state: string; payload: unknown } }> };
      }>(
        `query ConfirmDispatchRequest($filter: AiRunJournalFilterInput!) {
          aiRunJournals(filter: $filter, first: 1) {
            edges { node { taskId runId runKey operationKey direction eventType state payload } }
          }
        }`,
        { filter: { operationKey: { eq: operationKey } } },
      ).catch(() => undefined);
      const inserted = confirmed?.aiRunJournals.edges[0]?.node;
      if (
        inserted?.taskId === task.id && inserted.runId === null && inserted.runKey === runKey &&
        inserted.operationKey === operationKey && inserted.direction === 'INBOUND' &&
        inserted.eventType === 'DISPATCH_REQUEST' && JSON.stringify(inserted.payload) === JSON.stringify(payload)
      ) return;
      throw error;
    });
  }

  async acknowledgeStart(command: StartCommand, threadId: string): Promise<void> {
    const checkpoint = {
      protocolVersion: 1,
      runKey: command.runKey,
      threadId,
      phase: 'THREAD_CREATED',
    };
    const result = await this.request<{
      updateAiRunJournal: { id: string; state: string; result: unknown };
    }>(
      `mutation AcknowledgeStart($id: UUID!, $data: AiRunJournalUpdateInput!) {
        updateAiRunJournal(id: $id, data: $data) { id state result }
      }`,
      {
        id: command.id,
        data: {
          state: 'APPLIED',
          result: checkpoint,
          appliedAt: new Date().toISOString(),
        },
      },
    );

    const journal = result.updateAiRunJournal;
    if (
      journal.state !== 'APPLIED' ||
      (journal.result as Record<string, unknown> | null)?.threadId !== threadId
    ) {
      throw new Error('Twenty did not persist the START acknowledgement.');
    }
  }

  async recordStarted(
    command: StartCommand,
    threadId: string,
    turnId: string,
  ): Promise<void> {
    await this.createInboundEvent(command, 'STARTED', {
      protocolVersion: 1,
      requestVersion: command.payload.requestVersion,
      threadId,
      turnId,
    });
  }

  async recordError(command: StartCommand, message: string): Promise<void> {
    await this.createInboundEvent(command, 'ERROR', {
      protocolVersion: 1,
      requestVersion: command.payload.requestVersion,
      message: message.slice(0, 4000),
    });
  }

  async recordResult(
    command: StartCommand,
    result: {
      resultSummary: string;
      evidence: { draftPr: true; checks: Array<{ name: string; passed: true; details?: string }> };
      prUrl: string;
      headCommit: string;
    },
  ): Promise<void> {
    await this.createInboundEvent(command, 'RESULT', {
      protocolVersion: 1,
      requestVersion: command.payload.requestVersion,
      resultSummary: result.resultSummary.slice(0, 8000),
      evidence: result.evidence,
      prUrl: result.prUrl,
      headCommit: result.headCommit,
    });
  }

  async waitForEventApplication(
    command: StartCommand,
    eventType: 'RESULT',
    timeoutMs = 120_000,
  ): Promise<'APPLIED' | 'REJECTED'> {
    const operationKey = `${command.runKey}:${eventType}`;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const response = await this.request<{
        aiRunJournals: { edges: Array<{ node: { state: string } }> };
      }>(
        `query WorkerEventState($filter: AiRunJournalFilterInput!) {
          aiRunJournals(filter: $filter, first: 1) { edges { node { state } } }
        }`,
        { filter: { operationKey: { eq: operationKey } } },
      );
      const state = response.aiRunJournals.edges[0]?.node.state;
      if (state === 'APPLIED' || state === 'REJECTED') return state;
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
    throw new Error(`Timed out waiting for Twenty to apply ${eventType}; run remains locked for reconciliation.`);
  }

  private async createInboundEvent(
    command: StartCommand,
    eventType: 'STARTED' | 'ERROR' | 'RESULT',
    payload: Record<string, unknown>,
  ): Promise<void> {
    const operationKey = `${command.runKey}:${eventType}`;
    const result = await this.request<{
      aiRunJournals: {
        edges: Array<{
          node: {
            id: string;
            taskId: string;
            runId: string;
            runKey: string;
            operationKey: string;
            eventType: string;
            direction: string;
            payload: unknown;
          };
        }>;
      };
    }>(
      `query ExistingWorkerEvent($filter: AiRunJournalFilterInput!) {
        aiRunJournals(filter: $filter, first: 1) {
          edges { node { id taskId runId runKey operationKey eventType direction payload } }
        }
      }`,
      { filter: { operationKey: { eq: operationKey } } },
    );
    const existing = result.aiRunJournals.edges[0]?.node;
    if (existing) {
      if (
        existing.taskId !== command.taskId ||
        existing.runId !== command.runId ||
        existing.runKey !== command.runKey ||
        existing.operationKey !== operationKey ||
        existing.eventType !== eventType ||
        existing.direction !== 'INBOUND' ||
        JSON.stringify(existing.payload) !== JSON.stringify(payload)
      ) {
        throw new Error(`Existing ${eventType} operation conflicts with this run.`);
      }
      return;
    }

    try {
      await this.request(
        `mutation CreateWorkerEvent($data: AiRunJournalCreateInput!) {
          createAiRunJournal(data: $data) { id }
        }`,
        {
          data: {
            taskId: command.taskId,
            runId: command.runId,
            runKey: command.runKey,
            operationKey,
            direction: 'INBOUND',
            eventType,
            state: 'PENDING',
            receivedAt: new Date().toISOString(),
            payload,
          },
        },
      );
    } catch (error) {
      const confirmed = await this.request<{
        aiRunJournals: { edges: Array<{ node: {
          taskId: string; runId: string; runKey: string; operationKey: string;
          eventType: string; direction: string; payload: unknown;
        } }> };
      }>(
        `query ConfirmWorkerEvent($filter: AiRunJournalFilterInput!) {
          aiRunJournals(filter: $filter, first: 1) {
            edges { node { taskId runId runKey operationKey eventType direction payload } }
          }
        }`,
        { filter: { operationKey: { eq: operationKey } } },
      ).catch(() => undefined);
      const saved = confirmed?.aiRunJournals.edges[0]?.node;
      if (
        !saved || saved.taskId !== command.taskId || saved.runId !== command.runId ||
        saved.runKey !== command.runKey || saved.operationKey !== operationKey ||
        saved.eventType !== eventType || saved.direction !== 'INBOUND' ||
        JSON.stringify(saved.payload) !== JSON.stringify(payload)
      ) throw error;
    }
  }

  private async request<T>(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Twenty GraphQL request failed with HTTP ${response.status}.`);
    }
    return this.expectData<T>(await response.json());
  }

  private expectData<T>(value: unknown): T {
    const result = value as GraphqlResponse<T>;
    if (result.errors?.length || !result.data) {
      const details = result.errors?.map(({ message }) => message).join('; ');
      throw new Error(`Twenty GraphQL request failed${details ? `: ${details}` : '.'}`);
    }
    return result.data;
  }

  private validateStartCommand(
    node: JournalQuery['aiRunJournals']['edges'][number]['node'],
  ): StartCommand | undefined {
    if (
      node.direction !== 'OUTBOUND' ||
      node.eventType !== 'START' ||
      node.state !== 'PENDING'
    ) {
      return undefined;
    }

    const payload = node.payload as Record<string, unknown> | null;
    const requestVersion = Number(payload?.requestVersion);
    const runKey = node.runKey;
    const snapshot = payload?.snapshot as StartCommand['payload']['snapshot'] | undefined;
    if (
      payload?.protocolVersion !== 1 ||
      !Number.isInteger(requestVersion) ||
      !node.id || !node.taskId || !node.runId ||
      !runKey || node.operationKey !== `${runKey}:START` ||
      runKey !== `${node.taskId}:${requestVersion}` ||
      !snapshot || snapshot.task?.id !== node.taskId ||
      snapshot.requestVersion !== requestVersion ||
      !snapshot.task?.title?.trim() ||
      !snapshot.task?.description?.trim() ||
      !snapshot.task?.acceptanceCriteria?.trim() ||
      !snapshot.project?.id ||
      !/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(
        snapshot.project?.repositoryUrl ?? '',
      ) ||
      !snapshot.project?.baseRef?.trim()
    ) {
      this.logger.warn(`Ignoring malformed START command ${node.id || '(missing id)'}.`);
      return undefined;
    }

    return {
      id: node.id,
      taskId: node.taskId,
      runId: node.runId,
      runKey,
      operationKey: node.operationKey,
      payload: {
        protocolVersion: 1,
        requestVersion,
        snapshot,
      },
    };
  }
}
