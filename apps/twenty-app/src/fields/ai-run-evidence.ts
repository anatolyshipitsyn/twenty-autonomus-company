import { defineField, FieldType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '9556cb97-3e11-47e6-ab0c-5bb1d99a8ef0',
  name: 'evidence',
  label: 'Evidence',
  type: FieldType.RAW_JSON,
  objectUniversalIdentifier: '318342d0-6860-4b32-bc33-dc615100d9bd',
  description: 'Structured evidence references and check outcomes; no secrets, tool logs or local paths',
});
