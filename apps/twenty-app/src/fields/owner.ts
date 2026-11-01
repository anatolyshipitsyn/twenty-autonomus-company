import { defineField, FieldType, RelationType, OnDeleteAction } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '5b80fd3a-3293-4d6e-a095-fb395a1c562c',
  name: 'owner',
  label: 'Owner',
  type: FieldType.RELATION,
  objectUniversalIdentifier: '95867ede-7b17-465f-990c-40675d1dec71',
  relationTargetObjectMetadataUniversalIdentifier: '20202020-3319-4234-a34c-82d5c0e881a6',
  relationTargetFieldMetadataUniversalIdentifier: 'efc65384-0e5b-4352-a76b-d84c2836a432',
  isNullable: false,
  universalSettings: { relationType: RelationType.MANY_TO_ONE, onDelete: OnDeleteAction.RESTRICT, joinColumnName: 'ownerId' },
});
