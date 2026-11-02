import { defineWorkflow as defineWorkflowFromSdk } from 'twenty-sdk/define';

// Сохраняем прямой export-вызов для AST-сборщика Twenty; SDK возвращает приватные типы.
const defineWorkflow: (config: Parameters<typeof defineWorkflowFromSdk>[0]) => any =
  defineWorkflowFromSdk;

import {
  AI_RUN_JOURNAL_OBJECT_UNIVERSAL_IDENTIFIER,
  APPLY_EVENT_STEP_UNIVERSAL_IDENTIFIER,
  APPLY_EVENT_TRIGGER_UNIVERSAL_IDENTIFIER,
  APPLY_JOURNAL_EVENT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  APPLY_JOURNAL_EVENT_WORKFLOW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineWorkflow({
  universalIdentifier: APPLY_JOURNAL_EVENT_WORKFLOW_UNIVERSAL_IDENTIFIER,
  name: 'Orchestrator: apply new Journal event',
  version: {
    trigger: {
      universalIdentifier: APPLY_EVENT_TRIGGER_UNIVERSAL_IDENTIFIER,
      type: 'DATABASE_EVENT',
      settings: {
        objectUniversalIdentifier: AI_RUN_JOURNAL_OBJECT_UNIVERSAL_IDENTIFIER,
        action: 'created',
      },
      nextStepIds: [APPLY_EVENT_STEP_UNIVERSAL_IDENTIFIER],
    },
    steps: [
      {
        universalIdentifier: APPLY_EVENT_STEP_UNIVERSAL_IDENTIFIER,
        name: 'Validate and apply Journal event',
        type: 'LOGIC_FUNCTION',
        logicFunctionUniversalIdentifier: APPLY_JOURNAL_EVENT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
        input: { journalId: '{{trigger.properties.after.id}}' },
        nextStepIds: [],
      },
    ],
  },
});
