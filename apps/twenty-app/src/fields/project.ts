import { defineField, FieldType, RelationType, OnDeleteAction } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '572cf480-7281-49ea-9b7f-d4758bab42c5',
  name: 'project',
  label: 'Project',
  type: FieldType.RELATION,
  objectUniversalIdentifier: '95867ede-7b17-465f-990c-40675d1dec71',
  relationTargetObjectMetadataUniversalIdentifier: '26e1baf7-31be-4eb2-9fc9-6bcf0d8b4867',
  relationTargetFieldMetadataUniversalIdentifier: '0c17d892-1389-4c85-ba2d-29e747d91014',
  isNullable: false,
  universalSettings: { relationType: RelationType.MANY_TO_ONE, onDelete: OnDeleteAction.RESTRICT, joinColumnName: 'projectId' },
});
