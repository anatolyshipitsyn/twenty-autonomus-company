import { defineField, FieldType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '3cc26611-c9cc-47ec-9a9b-6b0301ef0814',
  name: 'priority',
  label: 'Priority',
  type: FieldType.SELECT,
  objectUniversalIdentifier: '729e12b4-81f5-4e3e-b379-98e33bffdb23',
  defaultValue: "'NORMAL'",
  options: [
    { position: 0, label: 'Low', value: 'LOW', color: 'gray' },
    { position: 1, label: 'Normal', value: 'NORMAL', color: 'blue' },
    { position: 2, label: 'High', value: 'HIGH', color: 'red' },
  ],
});
