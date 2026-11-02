import { isCanonicalGitHubRepositoryUrl } from 'src/utils/is-canonical-github-repository-url.util';

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
  if (!task) return finishJournal(client, journal, 'REJECTED', { reason: 'task not found' });

  const requestedVersion = Number(payload.requestVersion);
  const runKey = `${task.id}:${requestedVersion}`;
  if (!Number.isInteger(requestedVersion) || requestedVersion !== Number(task.requestVersion)) {
    return finishJournal(client, journal, 'REJECTED', { reason: 'requestVersion is stale or invalid' });
  }
  if (journal.runKey !== runKey || journal.operationKey !== `${runKey}:DISPATCH_REQUEST`) {
    return finishJournal(client, journal, 'REJECTED', { reason: 'dispatch request identity or operationKey is invalid' });
  }
  if (
    !task.title?.trim() ||
    !task.description?.trim() ||
    !task.acceptanceCriteria?.trim() ||
    !task.project?.executionEnabled ||
    !isCanonicalGitHubRepositoryUrl(task.project.repositoryUrl) ||
    !task.project.baseRef?.trim()
  ) {
    return finishJournal(client, journal, 'REJECTED', { reason: 'task or Project is missing required execution data' });
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
    return finishJournal(client, journal, 'REJECTED', { reason: 'runKey conflicts with another request' });
  }
  if (!run && (task.status !== 'READY' || task.activeRunId)) {
    return finishJournal(client, journal, 'REJECTED', { reason: 'task is not READY without an active run' });
  }

  const activeRunsResponse = await client.query({
    aiRuns: {
      __args: { filter: { status: { in: ['PENDING', 'RUNNING', 'UNKNOWN'] } }, first: 10 },
      edges: { node: { id: true, runKey: true } },
    },
  });
  const otherActiveRun = (activeRunsResponse as any).aiRuns?.edges?.find(
    (edge: any) => edge.node.runKey !== runKey,
  )?.node;
  if (otherActiveRun) {
    return finishJournal(client, journal, 'REJECTED', {
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
          data: { taskId: task.id, requestVersion: requestedVersion, runKey, status: 'PENDING', snapshot },
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

  if (['SUCCEEDED', 'ERROR', 'UNKNOWN'].includes(run.status)) {
    return finishJournal(client, journal, 'REJECTED', { reason: 'run is terminal or its outcome is unknown', runKey });
  }
  if (
    (task.activeRunId && task.activeRunId !== run.id) ||
    (task.status !== 'READY' && !(task.status === 'RUNNING' && task.activeRunId === run.id))
  ) {
    return finishJournal(client, journal, 'REJECTED', { reason: 'task already has a different or invalid active run' });
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
      return finishJournal(client, journal, 'REJECTED', {
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
            direction: 'OUTBOUND',
            eventType: 'START',
            state: 'PENDING',
            receivedAt: new Date().toISOString(),
            payload: { requestVersion: requestedVersion, snapshot: run.snapshot },
          },
        },
        id: true,
      },
    });
  }
  return finishJournal(client, journal, 'APPLIED', { runKey, runId: run.id, startOperationKey });
}

async function finishJournal(client: any, journal: any, state: 'APPLIED' | 'REJECTED', result: unknown) {
  await client.mutation({
    updateAiRunJournal: {
      __args: {
        id: journal.id,
        data: { state, result, appliedAt: new Date().toISOString() },
      },
      id: true,
    },
  });
  return { ok: state === 'APPLIED', state, result };
}
