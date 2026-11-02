import { defineField, FieldType, RelationType, OnDeleteAction } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: 'eecad782-c3ec-4bae-8c26-06965eb6ee92',
  name: 'activeRun',
  label: 'Active Run',
  type: FieldType.RELATION,
  objectUniversalIdentifier: '729e12b4-81f5-4e3e-b379-98e33bffdb23',
  relationTargetObjectMetadataUniversalIdentifier: '318342d0-6860-4b32-bc33-dc615100d9bd',
  relationTargetFieldMetadataUniversalIdentifier: '4b1f84bb-936a-498d-8af5-af7b3a195365',
  disabledFieldPermissionActions: ['canUpdateFieldValue'],
  universalSettings: { relationType: RelationType.MANY_TO_ONE, onDelete: OnDeleteAction.RESTRICT, joinColumnName: 'activeRunId' },
});
