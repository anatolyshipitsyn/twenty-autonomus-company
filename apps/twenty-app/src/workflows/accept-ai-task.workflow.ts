import { defineWorkflow as defineWorkflowFromSdk } from 'twenty-sdk/define';

// Сохраняем прямой export-вызов для AST-сборщика Twenty; SDK возвращает приватные типы.
const defineWorkflow: (config: Parameters<typeof defineWorkflowFromSdk>[0]) => any =
  defineWorkflowFromSdk;

import {
  ACCEPT_STEP_UNIVERSAL_IDENTIFIER,
  ACCEPT_TASK_WORKFLOW_UNIVERSAL_IDENTIFIER,
  ACCEPT_TRIGGER_UNIVERSAL_IDENTIFIER,
  AI_TASK_OBJECT_UNIVERSAL_IDENTIFIER,
  OPERATOR_TASK_ACTION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { OperatorTaskAction } from 'src/types/operator-task-action';

export default defineWorkflow({
  universalIdentifier: ACCEPT_TASK_WORKFLOW_UNIVERSAL_IDENTIFIER,
  name: 'Принять результат',
  version: {
    trigger: {
      universalIdentifier: ACCEPT_TRIGGER_UNIVERSAL_IDENTIFIER,
      type: 'MANUAL',
      settings: {
        availability: { type: 'SINGLE_RECORD', objectUniversalIdentifier: AI_TASK_OBJECT_UNIVERSAL_IDENTIFIER },
        icon: 'IconCheck',
        isPinned: true,
      },
      nextStepIds: [ACCEPT_STEP_UNIVERSAL_IDENTIFIER],
    },
    steps: [
      {
        universalIdentifier: ACCEPT_STEP_UNIVERSAL_IDENTIFIER,
        name: 'Validate and accept result',
        type: 'LOGIC_FUNCTION',
        logicFunctionUniversalIdentifier: OPERATOR_TASK_ACTION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
        input: { taskId: '{{trigger.payload.id}}', action: OperatorTaskAction.ACCEPT },
        nextStepIds: [],
      },
    ],
  },
});
