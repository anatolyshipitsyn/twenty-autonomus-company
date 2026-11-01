import { defineObject, FieldType } from 'twenty-sdk/define';

export const NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'f7038bd4-3b13-43fd-b3dd-82a785681130';

export default defineObject({
  universalIdentifier: '95867ede-7b17-465f-990c-40675d1dec71',
  nameSingular: 'aiTask',
  namePlural: 'aiTasks',
  labelSingular: 'AI Task',
  labelPlural: 'AI Tasks',
  icon: 'IconCheckbox',
  labelIdentifierFieldMetadataUniversalIdentifier: NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Title',
      description: 'Short title of the task',
      icon: 'IconAbc',
    },
  ],
});
