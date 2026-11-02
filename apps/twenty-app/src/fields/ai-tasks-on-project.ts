import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '0c17d892-1389-4c85-ba2d-29e747d91014',
  name: 'aiTasks',
  label: 'AI Tasks',
  type: FieldType.RELATION,
  objectUniversalIdentifier: '26e1baf7-31be-4eb2-9fc9-6bcf0d8b4867',
  relationTargetObjectMetadataUniversalIdentifier: '95867ede-7b17-465f-990c-40675d1dec71',
  relationTargetFieldMetadataUniversalIdentifier: '572cf480-7281-49ea-9b7f-d4758bab42c5',
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
