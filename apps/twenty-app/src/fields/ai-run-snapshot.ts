import { defineField, FieldType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '7d3bd12c-1479-45b2-8f86-a363081cd0b8',
  name: 'snapshot',
  label: 'Input Snapshot',
  type: FieldType.RAW_JSON,
  objectUniversalIdentifier: '318342d0-6860-4b32-bc33-dc615100d9bd',
  description: 'Immutable task, Project, repository commit, profile and protocol config references; no secrets, logs or local paths',
  disabledFieldPermissionActions: ['canUpdateFieldValue'],
});
