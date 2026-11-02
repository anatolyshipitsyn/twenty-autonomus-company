import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '4b1f84bb-936a-498d-8af5-af7b3a195365',
  name: 'activeForTasks',
  label: 'Active for Tasks',
  type: FieldType.RELATION,
  objectUniversalIdentifier: '318342d0-6860-4b32-bc33-dc615100d9bd',
  relationTargetObjectMetadataUniversalIdentifier: '729e12b4-81f5-4e3e-b379-98e33bffdb23',
  relationTargetFieldMetadataUniversalIdentifier: 'eecad782-c3ec-4bae-8c26-06965eb6ee92',
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
