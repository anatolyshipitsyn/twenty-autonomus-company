import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AiRunJournalDirection } from 'src/types/ai-run-journal-direction';
import { AiRunJournalEventType } from 'src/types/ai-run-journal-event-type';
import { AiRunJournalState } from 'src/types/ai-run-journal-state';
import { AiRunStatus } from 'src/types/ai-run-status';

type GraphqlResult<T> = {
  data?: T;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
};

const apiUrl = process.env.TWENTY_API_URL;
const workerApiKey = process.env.TWENTY_API_KEY;
const adminEmail = process.env.TWENTY_ADMIN_EMAIL;
const adminPassword = process.env.TWENTY_ADMIN_PASSWORD;
const authOrigin = process.env.TWENTY_AUTH_ORIGIN ?? apiUrl;

if (!apiUrl || !workerApiKey || !adminEmail || !adminPassword || !authOrigin) {
  throw new Error(
    'TWENTY_API_URL, TWENTY_API_KEY, TWENTY_ADMIN_EMAIL, TWENTY_ADMIN_PASSWORD, and TWENTY_AUTH_ORIGIN are required for Stage 3 integration checks.',
  );
}

const graphQLEndpoint = `${apiUrl}/graphql`;
const metadataEndpoint = `${apiUrl}/metadata`;

async function request<T>(
  endpoint: string,
  query: string,
  variables: Record<string, unknown> = {},
  bearerToken?: string,
): Promise<GraphqlResult<T>> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(bearerToken ? { authorization: `Bearer ${bearerToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  expect(response.ok).toBe(true);

  return response.json() as Promise<GraphqlResult<T>>;
}

function expectNoGraphQLErrors<T>(result: GraphqlResult<T>): T {
  expect(result.errors).toBeUndefined();
  expect(result.data).toBeDefined();

  return result.data as T;
}

async function getAdminToken(): Promise<string> {
  const login = expectNoGraphQLErrors(
    await request<{
      getLoginTokenFromCredentials: { loginToken: { token: string } };
    }>(
      metadataEndpoint,
      `mutation Login($email: String!, $password: String!, $origin: String!) {
        getLoginTokenFromCredentials(email: $email, password: $password, origin: $origin) {
          loginToken { token }
        }
      }`,
      { email: adminEmail, password: adminPassword, origin: authOrigin },
    ),
  );

  const auth = expectNoGraphQLErrors(
    await request<{
      getAuthTokensFromLoginToken: {
        tokens: { accessOrWorkspaceAgnosticToken: { token: string } };
      };
    }>(
      metadataEndpoint,
      `mutation Exchange($loginToken: String!, $origin: String!) {
        getAuthTokensFromLoginToken(loginToken: $loginToken, origin: $origin) {
          tokens { accessOrWorkspaceAgnosticToken { token } }
        }
      }`,
      {
        loginToken: login.getLoginTokenFromCredentials.loginToken.token,
        origin: authOrigin,
      },
    ),
  );

  return auth.getAuthTokensFromLoginToken.tokens.accessOrWorkspaceAgnosticToken
    .token;
}

describe('Stage 3 worker journal contract', () => {
  const suffix = randomUUID();
  const taskTitle = `Stage 3 integration ${suffix}`;
  const runKey = `stage3-run-${suffix}`;
  const operationKey = `stage3-operation-${suffix}`;
  const adminOnlyOperationKey = `stage3-applied-${suffix}`;
  const terminalRunKey = `stage3-terminal-run-${suffix}`;
  let adminToken: string;
  let workerRoleId: string;
  let taskId: string;
  let runId: string;
  let terminalRunId: string;
  let journalId: string;
  let appliedJournalId: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();

    const roles = expectNoGraphQLErrors(
      await request<{ getRoles: Array<{ id: string; label: string }> }>(
        metadataEndpoint,
        '{ getRoles { id label } }',
        {},
        adminToken,
      ),
    );
    const workerRole = roles.getRoles.find(
      (role) => role.label === 'Orchestrator Worker',
    );
    expect(workerRole).toBeDefined();
    workerRoleId = workerRole!.id;

    const task = expectNoGraphQLErrors(
      await request<{ createAiTask: { id: string } }>(
        graphQLEndpoint,
        `mutation CreateTask($data: AiTaskCreateInput!) {
          createAiTask(data: $data) { id }
        }`,
        { data: { title: taskTitle } },
        adminToken,
      ),
    );
    taskId = task.createAiTask.id;

    const run = expectNoGraphQLErrors(
      await request<{ createAiRun: { id: string } }>(
        graphQLEndpoint,
        `mutation CreateRun($data: AiRunCreateInput!) {
          createAiRun(data: $data) { id }
        }`,
        { data: { runKey, taskId, status: AiRunStatus.PENDING } },
        adminToken,
      ),
    );
    runId = run.createAiRun.id;

    const terminalRun = expectNoGraphQLErrors(
      await request<{ createAiRun: { id: string } }>(
        graphQLEndpoint,
        `mutation CreateTerminalRun($data: AiRunCreateInput!) {
          createAiRun(data: $data) { id }
        }`,
        { data: { runKey: terminalRunKey, taskId, status: AiRunStatus.SUCCEEDED } },
        adminToken,
      ),
    );
    terminalRunId = terminalRun.createAiRun.id;
  });

  afterAll(async () => {
    if (adminToken && appliedJournalId) {
      await request(
        graphQLEndpoint,
        'mutation DeleteJournal($id: UUID!) { destroyAiRunJournal(id: $id) { id } }',
        { id: appliedJournalId },
        adminToken,
      );
    }
    if (adminToken && journalId) {
      await request(
        graphQLEndpoint,
        'mutation DeleteJournal($id: UUID!) { destroyAiRunJournal(id: $id) { id } }',
        { id: journalId },
        adminToken,
      );
    }
    if (adminToken && terminalRunId) {
      await request(
        graphQLEndpoint,
        'mutation DeleteRun($id: UUID!) { destroyAiRun(id: $id) { id } }',
        { id: terminalRunId },
        adminToken,
      );
    }
    if (adminToken && runId) {
      await request(
        graphQLEndpoint,
        'mutation DeleteRun($id: UUID!) { destroyAiRun(id: $id) { id } }',
        { id: runId },
        adminToken,
      );
    }
    if (adminToken && taskId) {
      await request(
        graphQLEndpoint,
        'mutation DeleteTask($id: UUID!) { destroyAiTask(id: $id) { id } }',
        { id: taskId },
        adminToken,
      );
    }
  });

  it('allows Worker Journal writes and verifies operation-key conflicts', async () => {
    const originalPayload = { event: AiRunJournalEventType.STARTED, detail: 'first delivery' };
    const shareWithWorkerReadOnly = [
      { roleId: workerRoleId, accessLevel: 'READ' },
    ];

    const created = expectNoGraphQLErrors(
      await request<{ createAiRunJournal: { id: string } }>(
      graphQLEndpoint,
        `mutation CreateJournal($data: AiRunJournalCreateInput!) {
          createAiRunJournal(data: $data) { id }
        }`,
      {
        data: {
          operationKey,
          runKey,
          taskId,
          runId,
          direction: AiRunJournalDirection.INBOUND,
          eventType: AiRunJournalEventType.STARTED,
          state: AiRunJournalState.PENDING,
          payload: originalPayload,
        },
      },
      workerApiKey,
      ),
    );
    journalId = created.createAiRunJournal.id;

    const duplicate = await request(
      graphQLEndpoint,
      `mutation Duplicate($data: AiRunJournalCreateInput!) {
        createAiRunJournal(data: $data) { id }
      }`,
      {
        data: {
          operationKey,
          runKey,
          taskId,
          runId,
          direction: AiRunJournalDirection.INBOUND,
          eventType: AiRunJournalEventType.STARTED,
          state: AiRunJournalState.PENDING,
          payload: originalPayload,
        },
      },
      workerApiKey,
    );
    expect(duplicate.errors).toBeDefined();

    const conflictingPayload = await request(
      graphQLEndpoint,
      `mutation Conflict($data: AiRunJournalCreateInput!) {
        createAiRunJournal(data: $data) { id }
      }`,
      {
        data: {
          operationKey,
          runKey,
          taskId,
          runId,
          direction: AiRunJournalDirection.INBOUND,
          eventType: AiRunJournalEventType.STARTED,
          state: AiRunJournalState.PENDING,
          payload: { event: AiRunJournalEventType.STARTED, detail: 'conflicting delivery' },
        },
      },
      workerApiKey,
    );
    expect(conflictingPayload.errors).toBeDefined();

    const originalAfterConflict = expectNoGraphQLErrors(
      await request<{
        aiRunJournal: { id: string; payload: unknown };
      }>(
        graphQLEndpoint,
        `query ReadOriginalJournal($filter: AiRunJournalFilterInput!) {
          aiRunJournal(filter: $filter) { id payload }
        }`,
        { filter: { id: { eq: journalId } } },
        adminToken,
      ),
    );
    expect(originalAfterConflict.aiRunJournal.payload).toEqual(originalPayload);

    const applied = expectNoGraphQLErrors(
      await request<{ createAiRunJournal: { id: string } }>(
        graphQLEndpoint,
        `mutation CreateAppliedJournal(
          $data: AiRunJournalCreateInput!,
          $shareWith: [ShareWithInput!]!
        ) {
          createAiRunJournal(data: $data, shareWith: $shareWith) { id }
        }`,
        {
          data: {
            operationKey: adminOnlyOperationKey,
            runKey: terminalRunKey,
            taskId,
            runId: terminalRunId,
            direction: AiRunJournalDirection.INBOUND,
            eventType: AiRunJournalEventType.RESULT,
            state: AiRunJournalState.APPLIED,
            payload: { event: AiRunJournalEventType.RESULT, detail: 'already applied' },
          },
          shareWith: shareWithWorkerReadOnly,
        },
        adminToken,
      ),
    );
    appliedJournalId = applied.createAiRunJournal.id;

    const journalRewrite = await request(
      graphQLEndpoint,
      `mutation RewriteJournal($id: UUID!, $data: AiRunJournalUpdateInput!) {
        updateAiRunJournal(id: $id, data: $data) { id }
      }`,
      {
        id: appliedJournalId,
        data: { state: AiRunJournalState.FAILED, payload: { detail: 'worker rewrite' } },
      },
      workerApiKey,
    );
    expect(journalRewrite.errors).toBeUndefined();

    const appliedAfterRewrite = expectNoGraphQLErrors(
      await request<{
        aiRunJournal: { id: string; state: string; payload: unknown };
      }>(
        graphQLEndpoint,
        `query ReadAppliedJournal($filter: AiRunJournalFilterInput!) {
          aiRunJournal(filter: $filter) { id state payload }
        }`,
        { filter: { id: { eq: appliedJournalId } } },
        adminToken,
      ),
    );
    expect(appliedAfterRewrite.aiRunJournal.state).toBe(AiRunJournalState.FAILED);
    expect(appliedAfterRewrite.aiRunJournal.payload).toEqual({
      detail: 'worker rewrite',
    });

    const runRewrite = await request(
      graphQLEndpoint,
      `mutation RewriteTerminalRun($id: UUID!, $data: AiRunUpdateInput!) {
        updateAiRun(id: $id, data: $data) { id }
      }`,
      { id: terminalRunId, data: { status: AiRunStatus.ERROR } },
      workerApiKey,
    );
    expect(runRewrite.errors).toBeDefined();

    const terminalRunAfterRewrite = expectNoGraphQLErrors(
      await request<{ aiRun: { id: string; status: string } }>(
        graphQLEndpoint,
        `query ReadTerminalRun($filter: AiRunFilterInput!) {
          aiRun(filter: $filter) { id status }
        }`,
        { filter: { id: { eq: terminalRunId } } },
        adminToken,
      ),
    );
    expect(terminalRunAfterRewrite.aiRun.status).toBe(AiRunStatus.SUCCEEDED);
  });
});
