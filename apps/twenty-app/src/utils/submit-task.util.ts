import { isCanonicalGitHubRepositoryUrl } from 'src/utils/is-canonical-github-repository-url.util';

import { AiTaskStatus } from 'src/types/ai-task-status';

export async function submitTask(client: any, task: any) {
  if (task.status === AiTaskStatus.READY && Number(task.requestVersion) > 0) {
    return { ok: true, taskId: task.id, action: 'SUBMIT', duplicate: true };
  }
  if (task.status !== 'TODO') throw new Error('Only TODO tasks can be submitted.');
  if (!task.title?.trim() || !task.description?.trim() || !task.acceptanceCriteria?.trim()) {
    throw new Error('Title, description, and acceptance criteria are required.');
  }
  if (
    !task.project?.executionEnabled ||
    !isCanonicalGitHubRepositoryUrl(task.project.repositoryUrl) ||
    !task.project.baseRef?.trim()
  ) {
    throw new Error('The linked Project must be enabled and have a canonical repository URL and base ref.');
  }

  const requestVersion = Number(task.requestVersion ?? 0) + 1;
  await client.mutation({
    updateAiTask: {
      __args: {
        id: task.id,
        data: {
          status: AiTaskStatus.READY,
          requestVersion,
          readyAt: new Date().toISOString(),
          waitingReason: null,
          error: null,
        },
      },
      id: true,
    },
  });
  return { ok: true, taskId: task.id, action: 'SUBMIT', requestVersion };
}
