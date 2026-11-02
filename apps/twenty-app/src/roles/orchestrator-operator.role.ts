import { defineRole, SystemPermissionFlag } from 'twenty-sdk/define';

import {
  AI_TASK_OBJECT_UNIVERSAL_IDENTIFIER,
  AI_RUN_JOURNAL_OBJECT_UNIVERSAL_IDENTIFIER,
  AI_RUN_OBJECT_UNIVERSAL_IDENTIFIER,
  ORCHESTRATOR_OPERATOR_ROLE_UNIVERSAL_IDENTIFIER,
  PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  WORKSPACE_MEMBER_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineRole({
  universalIdentifier: ORCHESTRATOR_OPERATOR_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Orchestrator Operator',
  description: 'Trusted pilot operator: can configure Projects, manage AI Tasks, AI Runs, Journal records, and workflows.',
  canUpdateAllSettings: false,
  canAccessAllTools: false,
  canAccessAllAgentChatChannels: false,
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: false,
  permissionFlagUniversalIdentifiers: [SystemPermissionFlag.WORKFLOWS],
  objectPermissions: [
    {
      objectUniversalIdentifier: PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
    {
      objectUniversalIdentifier: AI_TASK_OBJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
    {
      objectUniversalIdentifier: WORKSPACE_MEMBER_OBJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: false,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
    {
      objectUniversalIdentifier: AI_RUN_OBJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
    {
      objectUniversalIdentifier: AI_RUN_JOURNAL_OBJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
  ],
});
