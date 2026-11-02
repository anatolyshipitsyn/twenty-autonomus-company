import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { ORCHESTRATOR_OPERATOR_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export async function assertOperatorMember(workspaceMemberId: string | null): Promise<void> {
  if (!workspaceMemberId) {
    throw new Error('Operator actions require an authenticated workspace member.');
  }

  // Read only the triggering user's own membership and roles. Listing all
  // workspace roles requires admin access and is unnecessary here.
  const metadataClient = new MetadataApiClient({ runAs: 'user' });
  let response: unknown;
  try {
    response = await metadataClient.query({
      currentUser: {
        workspaceMember: {
          id: true,
          roles: { universalIdentifier: true },
        },
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to verify the current user's Operator role: ${reason}`);
  }
  const currentWorkspaceMember = (response as any).currentUser?.workspaceMember;
  const isCurrentMember = currentWorkspaceMember?.id === workspaceMemberId;
  const isOperator = currentWorkspaceMember?.roles?.some(
    (role: any) => role.universalIdentifier === ORCHESTRATOR_OPERATOR_ROLE_UNIVERSAL_IDENTIFIER,
  );
  if (!isCurrentMember || !isOperator) {
    throw new Error('Only an assigned Orchestrator Operator can run this action.');
  }
}
