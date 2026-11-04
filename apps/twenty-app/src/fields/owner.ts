import { defineField, FieldType, RelationType, OnDeleteAction } from 'twenty-sdk/define';

export const AI_TASK_OWNER_FIELD_UNIVERSAL_IDENTIFIER =
  '6ccba282-8d22-40c1-a6b4-cf5ccdfcd199';

export default defineField({
  universalIdentifier: AI_TASK_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
  name: 'owner',
  label: 'Owner',
  type: FieldType.RELATION,
  objectUniversalIdentifier: '729e12b4-81f5-4e3e-b379-98e33bffdb23',
  relationTargetObjectMetadataUniversalIdentifier: '20202020-3319-4234-a34c-82d5c0e881a6',
  relationTargetFieldMetadataUniversalIdentifier: '565c72be-41ae-42ef-aab6-6dfe1841050d',
  universalSettings: { relationType: RelationType.MANY_TO_ONE, onDelete: OnDeleteAction.RESTRICT, joinColumnName: 'ownerId' },
});
