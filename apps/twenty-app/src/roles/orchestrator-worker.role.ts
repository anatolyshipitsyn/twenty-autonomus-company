import {
  defineRole,
  RowLevelPermissionPredicateOperand,
} from 'twenty-sdk/define';

import {
  AI_TASK_OBJECT_UNIVERSAL_IDENTIFIER,
  AI_RUN_JOURNAL_OBJECT_UNIVERSAL_IDENTIFIER,
  AI_RUN_OBJECT_UNIVERSAL_IDENTIFIER,
  ORCHESTRATOR_WORKER_ROLE_UNIVERSAL_IDENTIFIER,
  PROJECT_EXECUTION_ENABLED_FIELD_UNIVERSAL_IDENTIFIER,
  PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { AI_RUN_STATUS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/ai-run-status';
import { AI_TASK_OWNER_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/owner';

export default defineRole({
  universalIdentifier: ORCHESTRATOR_WORKER_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Orchestrator Worker',
  description: 'Can read execution-enabled Projects, assigned AI Tasks, and active AI Runs; can create or update AI Run Journal records. Cannot update AI Tasks or AI Runs.',
  canUpdateAllSettings: false,
  canAccessAllTools: false,
  canAccessAllAgentChatChannels: false,
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canBeAssignedToUsers: false,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: true,
  objectPermissions: [
    {
      objectUniversalIdentifier: PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: false,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
    {
      objectUniversalIdentifier: AI_TASK_OBJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: false,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
    {
      objectUniversalIdentifier: AI_RUN_OBJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: false,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
    {
      objectUniversalIdentifier: AI_RUN_JOURNAL_OBJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      // Twenty uses this permission for both inserts and updates. The worker
      // needs it to append Journal events and can also update existing entries.
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
  ],
  rowLevelPermissionPredicates: [
    {
      universalIdentifier: 'bfbd512e-22c4-4a0b-8677-a107cbf62d4d',
      objectUniversalIdentifier: PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: PROJECT_EXECUTION_ENABLED_FIELD_UNIVERSAL_IDENTIFIER,
      operand: RowLevelPermissionPredicateOperand.IS,
      value: true,
    },
    {
      universalIdentifier: '2be49dbe-38e9-466e-87e5-a5baac7de0a4',
      objectUniversalIdentifier: AI_TASK_OBJECT_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: AI_TASK_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
      operand: RowLevelPermissionPredicateOperand.IS_NOT_EMPTY,
    },
    {
      universalIdentifier: '81019b91-7c3b-43f0-88f3-a9d14a05825b',
      objectUniversalIdentifier: AI_RUN_OBJECT_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: AI_RUN_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      operand: RowLevelPermissionPredicateOperand.IS,
      value: ['PENDING', 'RUNNING', 'UNKNOWN'],
    },
  ],
});
