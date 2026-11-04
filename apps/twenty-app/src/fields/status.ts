import { defineField, FieldType } from 'twenty-sdk/define';
import { AiTaskStatus } from 'src/types/ai-task-status';

export default defineField({
  universalIdentifier: '28f8a0f4-0c44-4750-8261-280ba2a3993f',
  name: 'status',
  label: 'Status',
  type: FieldType.SELECT,
  objectUniversalIdentifier: '729e12b4-81f5-4e3e-b379-98e33bffdb23',
  disabledFieldPermissionActions: ['canUpdateFieldValue'],
  defaultValue: `'${AiTaskStatus.TODO}'`,
  options: [
    { position: 0, label: 'To do', value: AiTaskStatus.TODO, color: 'gray' },
    { position: 1, label: 'Ready', value: AiTaskStatus.READY, color: 'blue' },
    { position: 2, label: 'Running', value: AiTaskStatus.RUNNING, color: 'orange' },
    { position: 3, label: 'Waiting for review', value: AiTaskStatus.WAITING_REVIEW, color: 'yellow' },
    { position: 4, label: 'Done', value: AiTaskStatus.DONE, color: 'green' },
    { position: 5, label: 'Error', value: AiTaskStatus.ERROR, color: 'red' },
  ],
});
