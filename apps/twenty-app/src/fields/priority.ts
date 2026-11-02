import { defineField, FieldType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: 'a81cdb79-10fa-42e0-9d05-462cf7f47338',
  name: 'priority',
  label: 'Priority',
  type: FieldType.SELECT,
  objectUniversalIdentifier: '95867ede-7b17-465f-990c-40675d1dec71',
  defaultValue: "'MEDIUM'",
  isNullable: false,
  options: [
    { position: 0, label: 'Low', value: 'LOW', color: 'sky' },
    { position: 1, label: 'Medium', value: 'MEDIUM', color: 'turquoise' },
    { position: 2, label: 'High', value: 'HIGH', color: 'orange' },
    { position: 3, label: 'Urgent', value: 'URGENT', color: 'red' },
  ],
});
