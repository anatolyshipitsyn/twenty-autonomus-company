import { defineField, FieldType, RelationType, OnDeleteAction } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: 'b2cb81d7-4c77-41da-bab8-e7342d8063e2',
  name: 'project',
  label: 'Project',
  type: FieldType.RELATION,
  objectUniversalIdentifier: '729e12b4-81f5-4e3e-b379-98e33bffdb23',
  relationTargetObjectMetadataUniversalIdentifier: '26e1baf7-31be-4eb2-9fc9-6bcf0d8b4867',
  relationTargetFieldMetadataUniversalIdentifier: '4eaba910-22cb-4401-bc50-58f3ca865a85',
  universalSettings: { relationType: RelationType.MANY_TO_ONE, onDelete: OnDeleteAction.RESTRICT, joinColumnName: 'projectId' },
});
