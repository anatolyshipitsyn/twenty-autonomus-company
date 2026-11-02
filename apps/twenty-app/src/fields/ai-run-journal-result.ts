import { defineField, FieldType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '46b231ce-dd8b-4d44-93ce-e1576d3f3d21',
  name: 'result',
  label: 'Result',
  type: FieldType.RAW_JSON,
  objectUniversalIdentifier: '33dc6563-3c21-4f10-953b-27a2b9189b85',
  description: 'Sanitized processing result without secrets, logs or local paths',
  disabledFieldPermissionActions: ['canUpdateFieldValue'],
});
