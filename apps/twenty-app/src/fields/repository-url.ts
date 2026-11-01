import { defineField, FieldType } from 'twenty-sdk/define';
import {
  PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  PROJECT_REPOSITORY_URL_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: PROJECT_REPOSITORY_URL_FIELD_UNIVERSAL_IDENTIFIER,
  name: 'repositoryUrl',
  label: 'Repository URL',
  type: FieldType.TEXT,
  objectUniversalIdentifier: PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  description: 'Canonical GitHub repository URL allowed for this project',
});
