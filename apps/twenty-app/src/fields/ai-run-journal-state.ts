import { defineField, FieldType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: 'c168593d-3c0c-4358-8349-cb73dbd742b4',
  name: 'state',
  label: 'State',
  type: FieldType.SELECT,
  objectUniversalIdentifier: '33dc6563-3c21-4f10-953b-27a2b9189b85',
  defaultValue: "'PENDING'",
  options: [
    { position: 0, label: 'Pending', value: 'PENDING', color: 'gray' },
    { position: 1, label: 'Applied', value: 'APPLIED', color: 'green' },
    { position: 2, label: 'Rejected', value: 'REJECTED', color: 'red' },
    { position: 3, label: 'Failed', value: 'FAILED', color: 'orange' },
  ],
});
