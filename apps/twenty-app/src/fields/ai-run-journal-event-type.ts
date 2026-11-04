import { defineField, FieldType } from 'twenty-sdk/define';
import { AiRunJournalEventType } from 'src/types/ai-run-journal-event-type';

export default defineField({
  universalIdentifier: 'f4bc18da-6d5c-4b7c-ac9e-3a92f995fb81',
  name: 'eventType',
  label: 'Event Type',
  type: FieldType.SELECT,
  objectUniversalIdentifier: '33dc6563-3c21-4f10-953b-27a2b9189b85',
  options: [
    { position: 0, label: AiRunJournalEventType.START, value: AiRunJournalEventType.START, color: 'blue' },
    { position: 1, label: AiRunJournalEventType.STARTED, value: AiRunJournalEventType.STARTED, color: 'cyan' },
    { position: 2, label: AiRunJournalEventType.RESULT, value: AiRunJournalEventType.RESULT, color: 'green' },
    { position: 3, label: AiRunJournalEventType.ERROR, value: AiRunJournalEventType.ERROR, color: 'red' },
    { position: 4, label: AiRunJournalEventType.PR_CREATED, value: AiRunJournalEventType.PR_CREATED, color: 'purple' },
    { position: 5, label: AiRunJournalEventType.DISPATCH_REQUEST, value: AiRunJournalEventType.DISPATCH_REQUEST, color: 'blue' },
    { position: 6, label: AiRunJournalEventType.ACCEPT, value: AiRunJournalEventType.ACCEPT, color: 'green' },
    { position: 7, label: AiRunJournalEventType.REWORK, value: AiRunJournalEventType.REWORK, color: 'orange' },
    { position: 8, label: AiRunJournalEventType.ACK, value: AiRunJournalEventType.ACK, color: 'gray' },
  ],
});
