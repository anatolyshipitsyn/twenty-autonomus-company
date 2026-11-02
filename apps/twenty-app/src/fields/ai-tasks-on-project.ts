import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '4eaba910-22cb-4401-bc50-58f3ca865a85',
  name: 'aiTasks',
  label: 'AI Tasks',
  type: FieldType.RELATION,
  objectUniversalIdentifier: '26e1baf7-31be-4eb2-9fc9-6bcf0d8b4867',
  relationTargetObjectMetadataUniversalIdentifier: '729e12b4-81f5-4e3e-b379-98e33bffdb23',
  relationTargetFieldMetadataUniversalIdentifier: 'b2cb81d7-4c77-41da-bab8-e7342d8063e2',
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
