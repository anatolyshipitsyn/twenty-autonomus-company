import { defineField, FieldType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '40e007db-7b87-4894-9306-2cd861647430',
  name: 'runKey',
  description: 'Stable run identity copied for operation lookup',
  disabledFieldPermissionActions: ['canUpdateFieldValue'],
  label: 'Run Key',
  type: FieldType.TEXT,
  objectUniversalIdentifier: '33dc6563-3c21-4f10-953b-27a2b9189b85',
});
