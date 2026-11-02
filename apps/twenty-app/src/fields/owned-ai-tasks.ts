import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: 'efc65384-0e5b-4352-a76b-d84c2836a432',
  name: 'ownedAiTasks',
  label: 'Owned AI Tasks',
  type: FieldType.RELATION,
  objectUniversalIdentifier: '20202020-3319-4234-a34c-82d5c0e881a6',
  relationTargetObjectMetadataUniversalIdentifier: '95867ede-7b17-465f-990c-40675d1dec71',
  relationTargetFieldMetadataUniversalIdentifier: '5b80fd3a-3293-4d6e-a095-fb395a1c562c',
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
