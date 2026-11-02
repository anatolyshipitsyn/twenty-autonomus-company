import { defineField, FieldType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '9c40985c-59b4-4381-9480-1b22fb5056a4',
  name: 'payload',
  label: 'Payload',
  type: FieldType.RAW_JSON,
  objectUniversalIdentifier: '33dc6563-3c21-4f10-953b-27a2b9189b85',
  description: 'Protocol data without secrets, tool logs or local paths',
});
