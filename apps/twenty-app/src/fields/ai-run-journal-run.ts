import { defineField, FieldType, RelationType, OnDeleteAction } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '86351467-fa7e-43d5-999d-a33c8e1fcd20',
  name: 'run',
  label: 'Run',
  type: FieldType.RELATION,
  objectUniversalIdentifier: '33dc6563-3c21-4f10-953b-27a2b9189b85',
  relationTargetObjectMetadataUniversalIdentifier: '318342d0-6860-4b32-bc33-dc615100d9bd',
  relationTargetFieldMetadataUniversalIdentifier: '7d1de77e-d1f6-4f7e-b5e6-0e54f828672e',
  isNullable: false,
  disabledFieldPermissionActions: ['canUpdateFieldValue'],
  universalSettings: { relationType: RelationType.MANY_TO_ONE, onDelete: OnDeleteAction.RESTRICT, joinColumnName: 'runId' },
});
