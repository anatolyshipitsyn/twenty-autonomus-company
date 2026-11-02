import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '7d1de77e-d1f6-4f7e-b5e6-0e54f828672e',
  name: 'journalEntries',
  label: 'Journal Entries',
  type: FieldType.RELATION,
  objectUniversalIdentifier: '318342d0-6860-4b32-bc33-dc615100d9bd',
  relationTargetObjectMetadataUniversalIdentifier: '33dc6563-3c21-4f10-953b-27a2b9189b85',
  relationTargetFieldMetadataUniversalIdentifier: '86351467-fa7e-43d5-999d-a33c8e1fcd20',
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
