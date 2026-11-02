import { defineField, FieldType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '11d36175-4054-4658-aca1-209a5b52f125',
  name: 'status',
  label: 'Status',
  type: FieldType.SELECT,
  objectUniversalIdentifier: '318342d0-6860-4b32-bc33-dc615100d9bd',
  defaultValue: "'PENDING'",
  options: [
    { position: 0, label: 'Pending', value: 'PENDING', color: 'gray' },
    { position: 1, label: 'Running', value: 'RUNNING', color: 'blue' },
    { position: 2, label: 'Succeeded', value: 'SUCCEEDED', color: 'green' },
    { position: 3, label: 'Error', value: 'ERROR', color: 'red' },
    { position: 4, label: 'Unknown', value: 'UNKNOWN', color: 'orange' },
  ],
  disabledFieldPermissionActions: ['canUpdateFieldValue'],
});
