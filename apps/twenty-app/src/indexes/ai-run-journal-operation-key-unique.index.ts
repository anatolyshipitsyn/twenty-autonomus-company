import { defineIndex } from 'twenty-sdk/define';
import { AI_RUN_JOURNAL_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { AI_RUN_JOURNAL_OPERATION_KEY_FIELD_UNIVERSAL_IDENTIFIER } from 'src/objects/ai-run-journal';

export default defineIndex({
  universalIdentifier: '1ceaa64b-c7c5-4fe3-86cb-af5838b1028e',
  objectUniversalIdentifier: AI_RUN_JOURNAL_OBJECT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: '5120d2ee-9326-4d59-8d4d-baa795ba0a32',
      fieldUniversalIdentifier: AI_RUN_JOURNAL_OPERATION_KEY_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});
