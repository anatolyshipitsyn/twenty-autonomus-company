import { isCanonicalGitHubRepositoryUrl } from 'src/utils/is-canonical-github-repository-url.util';
import { AiRunJournalDirection } from 'src/types/ai-run-journal-direction';
import { AiRunJournalEventType } from 'src/types/ai-run-journal-event-type';
import { AiRunJournalState } from 'src/types/ai-run-journal-state';
import { AiRunStatus } from 'src/types/ai-run-status';
import { AiTaskStatus } from 'src/types/ai-task-status';

export async function applyDispatchRequest(client: any, journal: any) {
  const payload = journal.payload ?? {};
  const taskResponse = await client.query({
    aiTasks: {
      __args: { filter: { id: { eq: journal.taskId } }, first: 1 },
      edges: {
        node: {
          id: true,
          title: true,
          description: true,
          acceptanceCriteria: true,
          status: true,
          requestVersion: true,
          activeRunId: true,
          project: { id: true, repositoryUrl: true, baseRef: true, executionEnabled: true },
        },
      },
    },
  });
  const task = (taskResponse as any).aiTasks?.edges?.[0]?.node;
  if (!task) return finishJournal(client, journal, AiRunJournalState.REJECTED, { reason: 'task not found' });

  const requestedVersion = Number(payload.requestVersion);
  const runKey = `${task.id}:${requestedVersion}`;
  if (payload.protocolVersion !== 1 || !Number.isInteger(requestedVersion) || requestedVersion !== Number(task.requestVersion)) {
    return finishJournal(client, journal, AiRunJournalState.REJECTED, { reason: 'protocolVersion or requestVersion is unsupported, stale, or invalid' });
  }
  if (journal.runKey !== runKey || journal.operationKey !== `${runKey}:DISPATCH_REQUEST`) {
    return finishJournal(client, journal, AiRunJournalState.REJECTED, { reason: 'dispatch request identity or operationKey is invalid' });
  }
  if (
    !task.title?.trim() ||
    !task.description?.trim() ||
    !task.acceptanceCriteria?.trim() ||
    !task.project?.executionEnabled ||
    !isCanonicalGitHubRepositoryUrl(task.project.repositoryUrl) ||
    !task.project.baseRef?.trim()
  ) {
    return finishJournal(client, journal, AiRunJournalState.REJECTED, { reason: 'task or Project is missing required execution data' });
  }

  const existingRunResponse = await client.query({
    aiRuns: {
      __args: { filter: { runKey: { eq: runKey } }, first: 1 },
      edges: {
        node: {
          id: true,
          runKey: true,
          taskId: true,
          requestVersion: true,
          status: true,
          snapshot: true,
        },
      },
    },
  });
  let run = (existingRunResponse as any).aiRuns?.edges?.[0]?.node;
  if (run && (run.taskId !== task.id || Number(run.requestVersion) !== requestedVersion)) {
    return finishJournal(client, journal, AiRunJournalState.REJECTED, { reason: 'runKey conflicts with another request' });
  }
  if (!run && (task.status !== AiTaskStatus.READY || task.activeRunId)) {
    return finishJournal(client, journal, AiRunJournalState.REJECTED, { reason: 'task is not READY without an active run' });
  }

  const activeRunsResponse = await client.query({
    aiRuns: {
      __args: { filter: { status: { in: [AiRunStatus.PENDING, AiRunStatus.RUNNING, AiRunStatus.UNKNOWN] } }, first: 10 },
      edges: { node: { id: true, runKey: true } },
    },
  });
  const otherActiveRun = (activeRunsResponse as any).aiRuns?.edges?.find(
    (edge: any) => edge.node.runKey !== runKey,
  )?.node;
  if (otherActiveRun) {
    return finishJournal(client, journal, AiRunJournalState.REJECTED, {
      reason: 'another run is still active',
      runKey: otherActiveRun.runKey,
    });
  }

  if (!run) {
    const snapshot = {
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        acceptanceCriteria: task.acceptanceCriteria,
      },
      project: {
        id: task.project.id,
        repositoryUrl: task.project.repositoryUrl,
        baseRef: task.project.baseRef,
      },
      requestVersion: requestedVersion,
    };
    const createResponse = await client.mutation({
      createAiRun: {
        __args: {
          data: { taskId: task.id, requestVersion: requestedVersion, runKey, status: AiRunStatus.PENDING, snapshot },
        },
        id: true,
        runKey: true,
        taskId: true,
        requestVersion: true,
        status: true,
        snapshot: true,
      },
    });
    run = (createResponse as any).createAiRun;
  }

  if ([AiRunStatus.SUCCEEDED, AiRunStatus.ERROR, AiRunStatus.UNKNOWN].includes(run.status)) {
    return finishJournal(client, journal, AiRunJournalState.REJECTED, { reason: 'run is terminal or its outcome is unknown', runKey });
  }
  if (
    (task.activeRunId && task.activeRunId !== run.id) ||
    (task.status !== AiTaskStatus.READY && !(task.status === AiTaskStatus.RUNNING && task.activeRunId === run.id))
  ) {
    return finishJournal(client, journal, AiRunJournalState.REJECTED, { reason: 'task already has a different or invalid active run' });
  }

  if (!task.activeRunId) {
    const activeTaskResponse = await client.query({
      aiTasks: {
        __args: { filter: { activeRunId: { is: 'NOT_NULL' } }, first: 10 },
        edges: { node: { id: true, activeRunId: true } },
      },
    });
    const otherActiveTask = (activeTaskResponse as any).aiTasks?.edges?.find(
      (edge: any) => edge.node.activeRunId !== run.id,
    )?.node;
    if (otherActiveTask) {
      return finishJournal(client, journal, AiRunJournalState.REJECTED, {
        reason: 'another task still holds an active run',
        taskId: otherActiveTask.id,
      });
    }
    await client.mutation({
      updateAiTask: { __args: { id: task.id, data: { activeRunId: run.id } }, id: true },
    });
  }

  const startOperationKey = `${runKey}:START`;
  const startResponse = await client.query({
    aiRunJournals: {
      __args: { filter: { operationKey: { eq: startOperationKey } }, first: 1 },
      edges: { node: { id: true } },
    },
  });
  if (!(startResponse as any).aiRunJournals?.edges?.[0]?.node) {
    await client.mutation({
      createAiRunJournal: {
        __args: {
          data: {
            operationKey: startOperationKey,
            taskId: task.id,
            runId: run.id,
            runKey,
            direction: AiRunJournalDirection.OUTBOUND,
            eventType: AiRunJournalEventType.START,
            state: AiRunJournalState.PENDING,
            receivedAt: new Date().toISOString(),
            payload: { protocolVersion: 1, requestVersion: requestedVersion, snapshot: run.snapshot },
          },
        },
        id: true,
      },
    });
  }
  return finishJournal(client, journal, AiRunJournalState.APPLIED, { runKey, runId: run.id, startOperationKey });
}

async function finishJournal(client: any, journal: any, state: AiRunJournalState.APPLIED | AiRunJournalState.REJECTED, result: unknown) {
  await client.mutation({
    updateAiRunJournal: {
      __args: {
        id: journal.id,
        data: { state, result, appliedAt: new Date().toISOString() },
      },
      id: true,
    },
  });
  return { ok: state === AiRunJournalState.APPLIED, state, result };
}
