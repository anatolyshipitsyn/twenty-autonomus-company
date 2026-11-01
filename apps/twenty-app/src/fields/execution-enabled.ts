import { defineField, FieldType } from 'twenty-sdk/define';
import {
  PROJECT_EXECUTION_ENABLED_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: PROJECT_EXECUTION_ENABLED_FIELD_UNIVERSAL_IDENTIFIER,
  name: 'executionEnabled',
  label: 'Execution enabled',
  type: FieldType.BOOLEAN,
  objectUniversalIdentifier: PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  description: 'Explicit operator-controlled gate for starting work in this project',
  defaultValue: false,
  isNullable: false,
});
