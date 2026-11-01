import { defineField, FieldType } from 'twenty-sdk/define';
import {
  PROJECT_BASE_REF_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: PROJECT_BASE_REF_FIELD_UNIVERSAL_IDENTIFIER,
  name: 'baseRef',
  label: 'Base ref',
  type: FieldType.TEXT,
  objectUniversalIdentifier: PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  description: 'Allowed GitHub base branch for this project',
});
