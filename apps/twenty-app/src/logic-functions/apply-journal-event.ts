import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import { APPLY_JOURNAL_EVENT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { AiRunJournalDirection } from 'src/types/ai-run-journal-direction';
import { AiRunJournalEventType } from 'src/types/ai-run-journal-event-type';
import { AiRunJournalState } from 'src/types/ai-run-journal-state';
import { applyDispatchRequest } from 'src/utils/apply-dispatch-request.util';
import { applyWorkerRunEvent } from 'src/utils/apply-worker-run-event.util';

type ApplyJournalPayload = { journalId: string };

const handler = async ({ journalId }: ApplyJournalPayload) => {
  if (!journalId) throw new Error('A Journal record id is required.');
  const client = new CoreApiClient({ runAs: 'application' });
  const response = await client.query({
    aiRunJournals: {
      __args: { filter: { id: { eq: journalId } }, first: 1 },
      edges: {
        node: {
          id: true,
          taskId: true,
          runId: true,
          runKey: true,
          operationKey: true,
          direction: true,
          eventType: true,
          state: true,
          payload: true,
        },
      },
    },
  });
  const journal = (response as any).aiRunJournals?.edges?.[0]?.node;
  if (!journal) throw new Error('Journal record was not found.');
  if (journal.state !== AiRunJournalState.PENDING) return { ok: true, duplicate: true };
  if (journal.direction !== AiRunJournalDirection.INBOUND) return { ok: true, ignored: true };

  if (journal.eventType === AiRunJournalEventType.DISPATCH_REQUEST) return applyDispatchRequest(client, journal);
  if (![AiRunJournalEventType.STARTED, AiRunJournalEventType.RESULT, AiRunJournalEventType.ERROR, AiRunJournalEventType.PR_CREATED].includes(journal.eventType)) {
    return finishJournal(client, journal, AiRunJournalState.APPLIED, { ignored: true, reason: 'not a worker lifecycle event' });
  }

  const taskResponse = await client.query({
    aiTasks: {
      __args: { filter: { id: { eq: journal.taskId } }, first: 1 },
      edges: {
        node: {
          id: true,
          status: true,
          requestVersion: true,
          activeRunId: true,
        },
      },
    },
  });
  const task = (taskResponse as any).aiTasks?.edges?.[0]?.node;
  if (!task) {
    return finishJournal(client, journal, AiRunJournalState.REJECTED, { reason: 'task not found' });
  }
  return applyWorkerRunEvent(client, journal, task);
};

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

export default defineLogicFunction({
  universalIdentifier: APPLY_JOURNAL_EVENT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'apply-journal-event',
  description: 'Applies validated worker Journal events and serialized dispatch requests.',
  timeoutSeconds: 25,
  handler,
  workflowActionTriggerSettings: { label: 'Apply Journal event', icon: 'IconBolt' },
});
