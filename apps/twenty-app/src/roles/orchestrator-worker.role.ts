import { defineRole } from 'twenty-sdk/define';

import {
  AI_TASK_OBJECT_UNIVERSAL_IDENTIFIER,
  AI_RUN_JOURNAL_OBJECT_UNIVERSAL_IDENTIFIER,
  AI_RUN_OBJECT_UNIVERSAL_IDENTIFIER,
  ORCHESTRATOR_WORKER_ROLE_UNIVERSAL_IDENTIFIER,
  PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineRole({
  universalIdentifier: ORCHESTRATOR_WORKER_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Orchestrator Worker',
  description: 'Can read approved Project and AI Tasks, and create or update AI Run Journal records. Cannot update AI Tasks or AI Runs.',
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
});
