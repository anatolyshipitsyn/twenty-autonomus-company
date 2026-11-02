import { defineObject, FieldType } from 'twenty-sdk/define';

export const AI_TASK_TITLE_FIELD_UNIVERSAL_IDENTIFIER =
  '5e74303b-ebd2-4d8b-ab81-f66d84f65e73';

export default defineObject({
  universalIdentifier: '729e12b4-81f5-4e3e-b379-98e33bffdb23',
  nameSingular: 'aiTask',
  namePlural: 'aiTasks',
  labelSingular: 'AI Task',
  labelPlural: 'AI Tasks',
  icon: 'IconChecklist',
  labelIdentifierFieldMetadataUniversalIdentifier: AI_TASK_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: AI_TASK_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'title',
      label: 'Title',
      description: 'Short title of the task',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: 'e3a5798a-a7f7-5f45-b4c5-dab889c0c2a0',
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      isNullable: true,
      defaultValue: null,
    },
  ],
});
