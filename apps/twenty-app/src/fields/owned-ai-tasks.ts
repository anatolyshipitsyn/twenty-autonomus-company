import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '565c72be-41ae-42ef-aab6-6dfe1841050d',
  name: 'ownedAiTasks',
  label: 'Owned AI Tasks',
  type: FieldType.RELATION,
  objectUniversalIdentifier: '20202020-3319-4234-a34c-82d5c0e881a6',
  relationTargetObjectMetadataUniversalIdentifier: '729e12b4-81f5-4e3e-b379-98e33bffdb23',
  relationTargetFieldMetadataUniversalIdentifier: '6ccba282-8d22-40c1-a6b4-cf5ccdfcd199',
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
