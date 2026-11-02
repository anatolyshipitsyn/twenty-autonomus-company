export async function applyWorkerRunEvent(client: any, journal: any, task: any) {
  const payload = journal.payload ?? {};
  const runKey = journal.runKey;
  const requestVersion = Number(payload.requestVersion);
  if (
    !runKey || !journal.runId ||
    !Number.isInteger(requestVersion) ||
    requestVersion !== Number(task.requestVersion) ||
    journal.operationKey !== `${runKey}:${journal.eventType}`
  ) {
    return finishJournal(client, journal, 'REJECTED', { reason: 'event identity, requestVersion, or operationKey is invalid' });
  }
  const runResponse = await client.query({
    aiRuns: {
      __args: { filter: { runKey: { eq: runKey }, taskId: { eq: task.id } }, first: 1 },
      edges: {
        node: {
          id: true,
          runKey: true,
          status: true,
          requestVersion: true,
          threadId: true,
          turnId: true,
          resultSummary: true,
          evidence: true,
          prUrl: true,
          headCommit: true,
        },
      },
    },
  });
  const run = (runResponse as any).aiRuns?.edges?.[0]?.node;
  if (!run || run.id !== journal.runId || Number(run.requestVersion) !== Number(task.requestVersion)) {
    return finishJournal(client, journal, 'REJECTED', { reason: 'event does not match current task and run' });
  }

  const errorMessage = typeof payload.message === 'string'
    ? payload.message.slice(0, 4000)
    : 'Worker reported an execution error.';
  const replayedResult = journal.eventType === 'RESULT' && run.status === 'SUCCEEDED' &&
    run.resultSummary === payload.resultSummary && run.prUrl === (payload.prUrl ?? run.prUrl) &&
    run.headCommit === (payload.headCommit ?? run.headCommit) &&
    stableStringify(run.evidence) === stableStringify(payload.evidence);
  const replayedError = journal.eventType === 'ERROR' && run.status === 'ERROR' && run.resultSummary === errorMessage;
  if (['SUCCEEDED', 'ERROR'].includes(run.status) && !replayedResult && !replayedError) {
    return finishJournal(client, journal, 'REJECTED', { reason: 'late or conflicting event for terminal run' });
  }

  if (journal.eventType === 'STARTED') {
    if (
      task.activeRunId !== run.id ||
      (run.status !== 'PENDING' &&
        !(run.status === 'RUNNING' && run.threadId === payload.threadId && run.turnId === payload.turnId))
    ) {
      return finishJournal(client, journal, 'REJECTED', { reason: 'STARTED does not match active pending run' });
    }
    if (typeof payload.threadId !== 'string' || typeof payload.turnId !== 'string') {
      return finishJournal(client, journal, 'REJECTED', { reason: 'STARTED requires confirmed threadId and turnId' });
    }
    if (run.status === 'PENDING') {
      await client.mutation({
        updateAiRun: {
          __args: {
            id: run.id,
            data: {
              status: 'RUNNING',
              threadId: payload.threadId,
              turnId: payload.turnId,
              startedAt: new Date().toISOString(),
            },
          },
          id: true,
        },
      });
    }
    if (task.status !== 'RUNNING') {
      await client.mutation({
        updateAiTask: { __args: { id: task.id, data: { status: 'RUNNING' } }, id: true },
      });
    }
  } else if (journal.eventType === 'PR_CREATED') {
    if (
      run.status !== 'RUNNING' || task.activeRunId !== run.id ||
      payload.draftPr !== true ||
      !/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(payload.prUrl ?? '') ||
      !/^[a-f0-9]{7,40}$/i.test(payload.headCommit ?? '')
    ) {
      return finishJournal(client, journal, 'REJECTED', { reason: 'PR_CREATED has invalid run identity, PR URL, or commit' });
    }
    await client.mutation({
      updateAiRun: {
        __args: {
          id: run.id,
          data: {
            prUrl: payload.prUrl,
            headCommit: payload.headCommit,
            evidence: { ...(run.evidence ?? {}), draftPr: true },
          },
        },
        id: true,
      },
    });
  } else if (journal.eventType === 'RESULT') {
    const checks = payload.evidence?.checks;
    const prUrl = payload.prUrl ?? run.prUrl;
    const headCommit = payload.headCommit ?? run.headCommit;
    if (
      (run.status !== 'RUNNING' && !replayedResult) ||
      (task.activeRunId !== run.id && !(replayedResult && task.status === 'WAITING_REVIEW')) ||
      typeof payload.resultSummary !== 'string' || !payload.resultSummary.trim() ||
      payload.evidence?.draftPr !== true ||
      !Array.isArray(checks) || checks.length === 0 || checks.some((check: any) => check?.passed !== true) ||
      !/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(prUrl ?? '') ||
      !/^[a-f0-9]{7,40}$/i.test(headCommit ?? '')
    ) {
      return finishJournal(client, journal, 'REJECTED', { reason: 'RESULT lacks summary, passing checks, draft PR, or head commit' });
    }
    if (!replayedResult) {
      await client.mutation({
        updateAiRun: {
          __args: {
            id: run.id,
            data: {
              status: 'SUCCEEDED',
              resultSummary: payload.resultSummary,
              evidence: payload.evidence,
              prUrl,
              headCommit,
              finishedAt: new Date().toISOString(),
            },
          },
          id: true,
        },
      });
    }
    if (task.status !== 'WAITING_REVIEW') {
      await client.mutation({
        updateAiTask: {
          __args: {
            id: task.id,
            data: {
              status: 'WAITING_REVIEW',
              activeRunId: null,
              resultSummary: payload.resultSummary,
              resultUrl: prUrl,
              waitingReason: null,
            },
          },
          id: true,
        },
      });
    }
  } else if (journal.eventType === 'ERROR') {
    if (
      (!['RUNNING', 'PENDING'].includes(run.status) && !replayedError) ||
      (task.activeRunId !== run.id && !(replayedError && task.status === 'ERROR'))
    ) {
      return finishJournal(client, journal, 'REJECTED', { reason: 'ERROR does not match active run' });
    }
    if (!replayedError) {
      await client.mutation({
        updateAiRun: {
          __args: {
            id: run.id,
            data: { status: 'ERROR', resultSummary: errorMessage, finishedAt: new Date().toISOString() },
          },
          id: true,
        },
      });
    }
    if (task.status !== 'ERROR') {
      await client.mutation({
        updateAiTask: {
          __args: {
            id: task.id,
            data: { status: 'ERROR', activeRunId: null, error: errorMessage, waitingReason: 'WORKER_ERROR' },
          },
          id: true,
        },
      });
    }
  }

  return finishJournal(client, journal, 'APPLIED', { applied: journal.eventType, runKey });
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}

async function finishJournal(client: any, journal: any, state: 'APPLIED' | 'REJECTED', result: unknown) {
  await client.mutation({
    updateAiRunJournal: {
      __args: { id: journal.id, data: { state, result, appliedAt: new Date().toISOString() } },
      id: true,
    },
  });
  return { ok: state === 'APPLIED', state, result };
}
