import { defineWorkflow as defineWorkflowFromSdk } from 'twenty-sdk/define';

// Сохраняем прямой export-вызов для AST-сборщика Twenty; SDK возвращает приватные типы.
const defineWorkflow: (config: Parameters<typeof defineWorkflowFromSdk>[0]) => any =
  defineWorkflowFromSdk;

import {
  AI_TASK_OBJECT_UNIVERSAL_IDENTIFIER,
  OPERATOR_TASK_ACTION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  SUBMIT_TASK_WORKFLOW_UNIVERSAL_IDENTIFIER,
  TASK_ACTION_STEP_UNIVERSAL_IDENTIFIER,
  TASK_ACTION_TRIGGER_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineWorkflow({
  universalIdentifier: SUBMIT_TASK_WORKFLOW_UNIVERSAL_IDENTIFIER,
  name: 'Передать оркестратору',
  version: {
    trigger: {
      universalIdentifier: TASK_ACTION_TRIGGER_UNIVERSAL_IDENTIFIER,
      type: 'MANUAL',
      settings: {
        availability: { type: 'SINGLE_RECORD', objectUniversalIdentifier: AI_TASK_OBJECT_UNIVERSAL_IDENTIFIER },
        icon: 'IconPlayerPlay',
        isPinned: true,
      },
      nextStepIds: [TASK_ACTION_STEP_UNIVERSAL_IDENTIFIER],
    },
    steps: [
      {
        universalIdentifier: TASK_ACTION_STEP_UNIVERSAL_IDENTIFIER,
        name: 'Validate and submit task',
        type: 'LOGIC_FUNCTION',
        logicFunctionUniversalIdentifier: OPERATOR_TASK_ACTION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
        input: { taskId: '{{trigger.payload.id}}', action: 'SUBMIT' },
        nextStepIds: [],
      },
    ],
  },
});
