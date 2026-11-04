import { defineField, FieldType } from 'twenty-sdk/define';
import { AiRunStatus } from 'src/types/ai-run-status';

export const AI_RUN_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  '11d36175-4054-4658-aca1-209a5b52f125';

export default defineField({
  universalIdentifier: AI_RUN_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  name: 'status',
  label: 'Status',
  type: FieldType.SELECT,
  objectUniversalIdentifier: '318342d0-6860-4b32-bc33-dc615100d9bd',
  defaultValue: `'${AiRunStatus.PENDING}'`,
  options: [
    { position: 0, label: 'Pending', value: AiRunStatus.PENDING, color: 'gray' },
    { position: 1, label: 'Running', value: AiRunStatus.RUNNING, color: 'blue' },
    { position: 2, label: 'Succeeded', value: AiRunStatus.SUCCEEDED, color: 'green' },
    { position: 3, label: 'Error', value: AiRunStatus.ERROR, color: 'red' },
    { position: 4, label: 'Unknown', value: AiRunStatus.UNKNOWN, color: 'orange' },
  ],
});
