import { defineField, FieldType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '9cc55d6e-85b2-4712-b54f-f176c77278e0',
  name: 'status',
  label: 'Status',
  type: FieldType.SELECT,
  objectUniversalIdentifier: '95867ede-7b17-465f-990c-40675d1dec71',
  description: 'Lifecycle status; only explicit workflow actions may change it',
  isUIEditable: false,
  defaultValue: "'TODO'",
  isNullable: false,
  options: [
    { position: 0, label: 'To do', value: 'TODO', color: 'sky' },
    { position: 1, label: 'Ready', value: 'READY', color: 'turquoise' },
    { position: 2, label: 'Running', value: 'RUNNING', color: 'orange' },
    { position: 3, label: 'Waiting', value: 'WAITING', color: 'yellow' },
    { position: 4, label: 'Done', value: 'DONE', color: 'green' },
    { position: 5, label: 'Cancelled', value: 'CANCELLED', color: 'red' },
  ],
});
