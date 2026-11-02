import { defineObject, FieldType } from 'twenty-sdk/define';
import { AI_RUN_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export const AI_RUN_KEY_FIELD_UNIVERSAL_IDENTIFIER =
  '3d3628a7-2705-4ec6-9763-00b3c885073b';

export default defineObject({
  universalIdentifier: AI_RUN_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'aiRun',
  namePlural: 'aiRuns',
  labelSingular: 'AI Run',
  labelPlural: 'AI Runs',
  icon: 'IconBox',
  labelIdentifierFieldMetadataUniversalIdentifier: AI_RUN_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: AI_RUN_KEY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'runKey',
      label: 'Run Key',
      isNullable: false,
      defaultValue: null,
      description: 'Stable identifier for this execution attempt',
      icon: 'IconAbc',
      disabledFieldPermissionActions: ['canUpdateFieldValue'],
    },
  ],
});
