import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '27461ae3-060d-45f4-a2e8-eaa99f31ecd2',
  name: 'journalEntries',
  label: 'Journal Entries',
  type: FieldType.RELATION,
  objectUniversalIdentifier: '729e12b4-81f5-4e3e-b379-98e33bffdb23',
  relationTargetObjectMetadataUniversalIdentifier: '33dc6563-3c21-4f10-953b-27a2b9189b85',
  relationTargetFieldMetadataUniversalIdentifier: '77380daa-339d-4867-9645-b885fbdab1df',
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
