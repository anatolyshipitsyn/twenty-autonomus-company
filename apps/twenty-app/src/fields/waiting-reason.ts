import { defineField, FieldType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: 'b6e66160-54e5-427c-bafc-bc81e8cf4238',
  name: 'waitingReason',
  label: 'Waiting reason',
  type: FieldType.SELECT,
  objectUniversalIdentifier: '95867ede-7b17-465f-990c-40675d1dec71',
  options: [
    { position: 0, label: 'Input', value: 'INPUT', color: 'sky' },
    { position: 1, label: 'Approval', value: 'APPROVAL', color: 'orange' },
    { position: 2, label: 'Review', value: 'REVIEW', color: 'purple' },
    { position: 3, label: 'Error', value: 'ERROR', color: 'red' },
    { position: 4, label: 'Recovery', value: 'RECOVERY', color: 'yellow' },
  ],
});
