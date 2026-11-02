import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import { OPERATOR_TASK_ACTION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { assertOperatorMember } from 'src/utils/assert-operator-member.util';
import { reviewTask } from 'src/utils/review-task.util';
import { submitTask } from 'src/utils/submit-task.util';

type TaskActionPayload = {
  taskId: string;
  action: 'SUBMIT' | 'ACCEPT' | 'REWORK';
};

const handler = async (
  { taskId, action }: TaskActionPayload,
  context: { workspaceMemberId: string | null },
) => {
  if (!taskId || !['SUBMIT', 'ACCEPT', 'REWORK'].includes(action)) {
    throw new Error('A task and supported operator action are required.');
  }
  await assertOperatorMember(context.workspaceMemberId);

  const client = new CoreApiClient({ runAs: 'application' });
  const response = await client.query({
    aiTasks: {
      __args: { filter: { id: { eq: taskId } } },
      edges: {
        node: {
          id: true,
          title: true,
          description: true,
          acceptanceCriteria: true,
          status: true,
          requestVersion: true,
          activeRunId: true,
          project: {
            id: true,
            repositoryUrl: true,
            baseRef: true,
            executionEnabled: true,
          },
        },
      },
    },
  });
  const task = (response as any).aiTasks?.edges?.[0]?.node;
  if (!task) throw new Error('Task was not found.');

  if (action === 'SUBMIT') return submitTask(client, task);
  return reviewTask(client, task, action, context.workspaceMemberId as string);
};

export default defineLogicFunction({
  universalIdentifier: OPERATOR_TASK_ACTION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'operator-task-action',
  description: 'Validates and applies explicit submit, accept, or rework decisions.',
  timeoutSeconds: 20,
  handler,
  workflowActionTriggerSettings: { label: 'Apply operator task action', icon: 'IconChecklist' },
});
