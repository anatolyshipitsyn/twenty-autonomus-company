import { defineField, FieldType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: 'f4bc18da-6d5c-4b7c-ac9e-3a92f995fb81',
  name: 'eventType',
  label: 'Event Type',
  type: FieldType.SELECT,
  objectUniversalIdentifier: '33dc6563-3c21-4f10-953b-27a2b9189b85',
  options: [
    { position: 0, label: 'START', value: 'START', color: 'blue' },
    { position: 1, label: 'STARTED', value: 'STARTED', color: 'cyan' },
    { position: 2, label: 'RESULT', value: 'RESULT', color: 'green' },
    { position: 3, label: 'ERROR', value: 'ERROR', color: 'red' },
    { position: 4, label: 'PR_CREATED', value: 'PR_CREATED', color: 'purple' },
    { position: 5, label: 'DISPATCH_REQUEST', value: 'DISPATCH_REQUEST', color: 'blue' },
    { position: 6, label: 'ACCEPT', value: 'ACCEPT', color: 'green' },
    { position: 7, label: 'REWORK', value: 'REWORK', color: 'orange' },
    { position: 8, label: 'ACK', value: 'ACK', color: 'gray' },
  ],
});
