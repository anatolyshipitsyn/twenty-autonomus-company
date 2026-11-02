import { defineIndex } from 'twenty-sdk/define';
import { AI_RUN_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { AI_RUN_KEY_FIELD_UNIVERSAL_IDENTIFIER } from 'src/objects/ai-run';

export default defineIndex({
  universalIdentifier: '46d87f8f-ab0b-47eb-978e-18ce82f62a33',
  objectUniversalIdentifier: AI_RUN_OBJECT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: 'de42a875-2c70-4711-9a31-5f196a5d4655',
      fieldUniversalIdentifier: AI_RUN_KEY_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});
