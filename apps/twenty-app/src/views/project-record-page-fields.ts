import { defineView } from 'twenty-sdk/define';
import {
  PROJECT_BASE_REF_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_EXECUTION_ENABLED_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  PROJECT_RECORD_BASE_REF_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_RECORD_EXECUTION_ENABLED_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_RECORD_FIELDS_VIEW_UNIVERSAL_IDENTIFIER,
  PROJECT_RECORD_NAME_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_RECORD_REPOSITORY_URL_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_REPOSITORY_URL_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: PROJECT_RECORD_FIELDS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'project-record-page-fields',
  objectUniversalIdentifier: PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: 'FIELDS_WIDGET',
  icon: 'IconListDetails',
  position: 0,
  fields: [
    {
      universalIdentifier: PROJECT_RECORD_NAME_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PROJECT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: PROJECT_RECORD_REPOSITORY_URL_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PROJECT_REPOSITORY_URL_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 260,
    },
    {
      universalIdentifier: PROJECT_RECORD_BASE_REF_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PROJECT_BASE_REF_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: PROJECT_RECORD_EXECUTION_ENABLED_VIEW_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PROJECT_EXECUTION_ENABLED_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 140,
    },
  ],
});
