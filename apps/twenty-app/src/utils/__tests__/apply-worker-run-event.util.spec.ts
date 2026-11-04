import { describe, expect, it, vi } from 'vitest';

import { AiRunJournalEventType } from 'src/types/ai-run-journal-event-type';
import { AiRunJournalState } from 'src/types/ai-run-journal-state';
import { AiRunStatus } from 'src/types/ai-run-status';
import { AiTaskStatus } from 'src/types/ai-task-status';
import { applyWorkerRunEvent } from 'src/utils/apply-worker-run-event.util';

const resultBundle = {
  resultSummary: 'Implemented the requested documentation change.',
  evidence: {
    draftPr: true,
    checks: [{ name: 'worker build', passed: true, details: 'Completed with exit code 0.' }],
  },
  prUrl: 'https://github.com/example/repository/pull/42',
  headCommit: 'abcdef1234567890',
};

const makeContext = (eventType: AiRunJournalEventType, savedBundle?: typeof resultBundle) => {
  const run = {
    id: 'run-1',
    runKey: 'task-1:1',
    status: AiRunStatus.RUNNING,
    requestVersion: 1,
    threadId: 'thread-1',
    turnId: 'turn-1',
    resultSummary: savedBundle?.resultSummary ?? null,
    evidence: savedBundle?.evidence ?? null,
    prUrl: savedBundle?.prUrl ?? null,
    headCommit: savedBundle?.headCommit ?? null,
  };
  const journal = {
    id: 'journal-1',
    taskId: 'task-1',
    runId: 'run-1',
    runKey: 'task-1:1',
    operationKey: `task-1:1:${eventType}`,
    eventType,
    payload: {
      protocolVersion: 1,
      requestVersion: 1,
      ...resultBundle,
    },
  };
  const task = {
    id: 'task-1',
    status: AiTaskStatus.RUNNING,
    requestVersion: 1,
    activeRunId: 'run-1',
  };
  const client = {
    query: vi.fn().mockResolvedValue({ aiRuns: { edges: [{ node: run }] } }),
    mutation: vi.fn().mockResolvedValue({}),
  };

  return { client, journal, run, task };
};

describe('applyWorkerRunEvent result checkpoint', () => {
  it('persists the full result bundle on AiRun before acknowledging PR_CREATED', async () => {
    const context = makeContext(AiRunJournalEventType.PR_CREATED);

    await applyWorkerRunEvent(context.client, context.journal, context.task);

    expect(context.client.mutation).toHaveBeenNthCalledWith(1, {
      updateAiRun: {
        __args: { id: 'run-1', data: resultBundle },
        id: true,
      },
    });
    expect(context.client.mutation).toHaveBeenNthCalledWith(2, {
      updateAiRunJournal: {
        __args: {
          id: 'journal-1',
          data: expect.objectContaining({ state: AiRunJournalState.APPLIED }),
        },
        id: true,
      },
    });
  });

  it('rejects RESULT when the result bundle was not checkpointed first', async () => {
    const context = makeContext(AiRunJournalEventType.RESULT);

    await applyWorkerRunEvent(context.client, context.journal, context.task);

    expect(context.client.mutation).toHaveBeenCalledTimes(1);
    expect(context.client.mutation).toHaveBeenCalledWith({
      updateAiRunJournal: {
        __args: {
          id: 'journal-1',
          data: expect.objectContaining({ state: AiRunJournalState.REJECTED }),
        },
        id: true,
      },
    });
  });

  it('completes the run and moves its task to review after a matching checkpoint', async () => {
    const context = makeContext(AiRunJournalEventType.RESULT, resultBundle);

    await applyWorkerRunEvent(context.client, context.journal, context.task);

    expect(context.client.mutation).toHaveBeenNthCalledWith(1, {
      updateAiRun: {
        __args: {
          id: 'run-1',
          data: { status: AiRunStatus.SUCCEEDED, finishedAt: expect.any(String) },
        },
        id: true,
      },
    });
    expect(context.client.mutation).toHaveBeenNthCalledWith(2, {
      updateAiTask: {
        __args: {
          id: 'task-1',
          data: {
            status: AiTaskStatus.WAITING_REVIEW,
            activeRunId: null,
            resultSummary: resultBundle.resultSummary,
            resultUrl: resultBundle.prUrl,
            waitingReason: null,
          },
        },
        id: true,
      },
    });
    expect(context.client.mutation).toHaveBeenNthCalledWith(3, {
      updateAiRunJournal: {
        __args: {
          id: 'journal-1',
          data: expect.objectContaining({ state: AiRunJournalState.APPLIED }),
        },
        id: true,
      },
    });
  });
});
