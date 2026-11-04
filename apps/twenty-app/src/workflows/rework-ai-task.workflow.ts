import { defineWorkflow as defineWorkflowFromSdk } from 'twenty-sdk/define';

// Сохраняем прямой export-вызов для AST-сборщика Twenty; SDK возвращает приватные типы.
const defineWorkflow: (config: Parameters<typeof defineWorkflowFromSdk>[0]) => any =
  defineWorkflowFromSdk;

import {
  AI_TASK_OBJECT_UNIVERSAL_IDENTIFIER,
  OPERATOR_TASK_ACTION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  REWORK_STEP_UNIVERSAL_IDENTIFIER,
  REWORK_TASK_WORKFLOW_UNIVERSAL_IDENTIFIER,
  REWORK_TRIGGER_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { OperatorTaskAction } from 'src/types/operator-task-action';

export default defineWorkflow({
  universalIdentifier: REWORK_TASK_WORKFLOW_UNIVERSAL_IDENTIFIER,
  name: 'Вернуть на доработку / разрешить повтор',
  version: {
    trigger: {
      universalIdentifier: REWORK_TRIGGER_UNIVERSAL_IDENTIFIER,
      type: 'MANUAL',
      settings: {
        availability: { type: 'SINGLE_RECORD', objectUniversalIdentifier: AI_TASK_OBJECT_UNIVERSAL_IDENTIFIER },
        icon: 'IconRefresh',
        isPinned: true,
      },
      nextStepIds: [REWORK_STEP_UNIVERSAL_IDENTIFIER],
    },
    steps: [
      {
        universalIdentifier: REWORK_STEP_UNIVERSAL_IDENTIFIER,
        name: 'Validate and authorize rework',
        type: 'LOGIC_FUNCTION',
        logicFunctionUniversalIdentifier: OPERATOR_TASK_ACTION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
        input: { taskId: '{{trigger.payload.id}}', action: OperatorTaskAction.REWORK },
        nextStepIds: [],
      },
    ],
  },
});
