import { defineObject, FieldType } from 'twenty-sdk/define';
import { AI_RUN_JOURNAL_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export const AI_RUN_JOURNAL_OPERATION_KEY_FIELD_UNIVERSAL_IDENTIFIER =
  '383aba52-46ce-4e52-9032-c57a5e7f1839';

export default defineObject({
  universalIdentifier: AI_RUN_JOURNAL_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'aiRunJournal',
  namePlural: 'aiRunJournals',
  labelSingular: 'AI Run Journal',
  labelPlural: 'AI Run Journals',
  icon: 'IconBox',
  labelIdentifierFieldMetadataUniversalIdentifier: AI_RUN_JOURNAL_OPERATION_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: AI_RUN_JOURNAL_OPERATION_KEY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'operationKey',
      label: 'Operation Key',
      isNullable: false,
      defaultValue: "''",
      description: 'Idempotency key for a command or event',
      icon: 'IconAbc',
    },
  ],
});
