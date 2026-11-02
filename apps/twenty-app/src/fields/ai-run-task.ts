import { defineField, FieldType, RelationType, OnDeleteAction } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: 'ba4cddd6-6ff6-40f4-acc6-8ed1d1794487',
  name: 'task',
  label: 'Task',
  type: FieldType.RELATION,
  objectUniversalIdentifier: '318342d0-6860-4b32-bc33-dc615100d9bd',
  relationTargetObjectMetadataUniversalIdentifier: '729e12b4-81f5-4e3e-b379-98e33bffdb23',
  relationTargetFieldMetadataUniversalIdentifier: '57c20d1a-f18e-4370-825d-51e8f1bf7ccd',
  isNullable: false,
  universalSettings: { relationType: RelationType.MANY_TO_ONE, onDelete: OnDeleteAction.RESTRICT, joinColumnName: 'taskId' },
});
