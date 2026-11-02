import { defineField, FieldType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '28f8a0f4-0c44-4750-8261-280ba2a3993f',
  name: 'status',
  label: 'Status',
  type: FieldType.SELECT,
  objectUniversalIdentifier: '729e12b4-81f5-4e3e-b379-98e33bffdb23',
  disabledFieldPermissionActions: ['canUpdateFieldValue'],
  defaultValue: "'TODO'",
  options: [
    { position: 0, label: 'To do', value: 'TODO', color: 'gray' },
    { position: 1, label: 'Ready', value: 'READY', color: 'blue' },
    { position: 2, label: 'Running', value: 'RUNNING', color: 'orange' },
    { position: 3, label: 'Waiting for review', value: 'WAITING_REVIEW', color: 'yellow' },
    { position: 4, label: 'Done', value: 'DONE', color: 'green' },
    { position: 5, label: 'Error', value: 'ERROR', color: 'red' },
  ],
});
