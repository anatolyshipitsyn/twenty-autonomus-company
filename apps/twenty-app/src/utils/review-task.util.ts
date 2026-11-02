type ReviewAction = 'ACCEPT' | 'REWORK';

export async function reviewTask(
  client: any,
  task: any,
  action: ReviewAction,
  actorWorkspaceMemberId: string,
) {
  if (action === 'REWORK' && task.status === 'READY' && !task.activeRunId) {
    return { ok: true, taskId: task.id, action, duplicate: true };
  }

  const response = await client.query({
    aiRuns: {
      __args: {
        filter: { taskId: { eq: task.id }, requestVersion: { eq: task.requestVersion } },
        first: 10,
      },
      edges: {
        node: {
          id: true,
          runKey: true,
          requestVersion: true,
          status: true,
          resultSummary: true,
          evidence: true,
          prUrl: true,
          headCommit: true,
        },
      },
    },
  });
  const runs = (response as any).aiRuns?.edges?.map((edge: any) => edge.node) ?? [];
  const run = runs.find((item: any) => Number(item.requestVersion) === Number(task.requestVersion));
  if (!run) throw new Error('The current request has no recorded run.');

  const operationKey = `${run.runKey}:${action}`;
  const decisionResponse = await client.query({
    aiRunJournals: {
      __args: { filter: { operationKey: { eq: operationKey } }, first: 1 },
      edges: { node: { id: true, state: true } },
    },
  });
  const decision = (decisionResponse as any).aiRunJournals?.edges?.[0]?.node;

  if (action === 'ACCEPT') {
    if (task.status === 'DONE') return { ok: true, taskId: task.id, action, duplicate: true };
    if (task.status !== 'WAITING_REVIEW' || run.status !== 'SUCCEEDED') {
      throw new Error('Only the latest successful result awaiting review can be accepted.');
    }
    const checks = run.evidence?.checks;
    if (
      !run.resultSummary?.trim() ||
      !/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(run.prUrl ?? '') ||
      !/^[a-f0-9]{7,40}$/i.test(run.headCommit ?? '') ||
      run.evidence?.draftPr !== true ||
      !Array.isArray(checks) ||
      checks.length === 0 ||
      checks.some((check: any) => check?.passed !== true)
    ) {
      throw new Error('The latest result is missing its summary, passing checks, draft PR, or commit.');
    }
    if (!decision) await createDecision(client, task, run, operationKey, action, actorWorkspaceMemberId);
    await client.mutation({
      updateAiTask: { __args: { id: task.id, data: { status: 'DONE' } }, id: true },
    });
    await markDecisionApplied(client, operationKey);
    return { ok: true, taskId: task.id, action };
  }

  if (!['ERROR', 'WAITING_REVIEW'].includes(task.status)) {
    throw new Error('Only an errored task or a reviewed result can be sent for rework.');
  }
  if (
    (task.status === 'ERROR' && run.status !== 'ERROR') ||
    (task.status === 'WAITING_REVIEW' && run.status !== 'SUCCEEDED')
  ) {
    throw new Error('The task status does not match the latest run outcome.');
  }
  if (!decision) await createDecision(client, task, run, operationKey, action, actorWorkspaceMemberId);
  const requestVersion = Number(task.requestVersion ?? 0) + 1;
  await client.mutation({
    updateAiTask: {
      __args: {
        id: task.id,
        data: {
          status: 'READY',
          requestVersion,
          readyAt: new Date().toISOString(),
          activeRunId: null,
          waitingReason: null,
          error: null,
        },
      },
      id: true,
    },
  });
  await markDecisionApplied(client, operationKey);
  return { ok: true, taskId: task.id, action, requestVersion };
}

async function createDecision(
  client: any,
  task: any,
  run: any,
  operationKey: string,
  action: ReviewAction,
  actorWorkspaceMemberId: string,
) {
  await client.mutation({
    createAiRunJournal: {
      __args: {
        data: {
          operationKey,
          taskId: task.id,
          runId: run.id,
          runKey: run.runKey,
          direction: 'INBOUND',
          eventType: action,
          state: 'PENDING',
          receivedAt: new Date().toISOString(),
          payload: { requestVersion: task.requestVersion, actorWorkspaceMemberId },
        },
      },
      id: true,
    },
  });
}

async function markDecisionApplied(client: any, operationKey: string) {
  const response = await client.query({
    aiRunJournals: {
      __args: { filter: { operationKey: { eq: operationKey } }, first: 1 },
      edges: { node: { id: true, state: true } },
    },
  });
  const decision = (response as any).aiRunJournals?.edges?.[0]?.node;
  if (decision?.id && decision.state !== 'APPLIED') {
    await client.mutation({
      updateAiRunJournal: {
        __args: {
          id: decision.id,
          data: { state: 'APPLIED', appliedAt: new Date().toISOString() },
        },
        id: true,
      },
    });
  }
}
