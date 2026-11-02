#!/usr/bin/env bash
set -Eeuo pipefail

: "${ORCHESTRATOR_OPERATOR_EMAIL:?ORCHESTRATOR_OPERATOR_EMAIL must be set}"
: "${ORCHESTRATOR_OPERATOR_PASSWORD:?ORCHESTRATOR_OPERATOR_PASSWORD must be set}"
: "${DEFAULT_ADMIN_EMAIL:?DEFAULT_ADMIN_EMAIL must be set}"

if [[ ${#ORCHESTRATOR_OPERATOR_PASSWORD} -lt 8 || ${#ORCHESTRATOR_OPERATOR_PASSWORD} -gt 50 ]]; then
  printf '%s\n' 'ORCHESTRATOR_OPERATOR_PASSWORD must be between 8 and 50 characters.' >&2
  exit 1
fi

if [[ "${ORCHESTRATOR_OPERATOR_EMAIL,,}" == "${DEFAULT_ADMIN_EMAIL,,}" ]]; then
  printf '%s\n' 'ORCHESTRATOR_OPERATOR_EMAIL must differ from DEFAULT_ADMIN_EMAIL.' >&2
  exit 1
fi

psql -X --single-transaction --set ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
\getenv operator_email ORCHESTRATOR_OPERATOR_EMAIL
\getenv operator_password ORCHESTRATOR_OPERATOR_PASSWORD
SELECT set_config('operator_seed.email', :'operator_email', true);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM core."user"
    WHERE email = current_setting('operator_seed.email')::public.citext
      AND id <> '16a58f46-20fe-4d75-9f0d-1a93d36f3b82'::uuid
  ) THEN
    RAISE EXCEPTION 'Orchestrator Operator email already belongs to a different user';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM core.role
    WHERE id = '7ca9ad02-580c-442b-a7ac-fe259154940a'::uuid
      AND "workspaceId" = '773b8101-5a6a-467b-b12c-f16751bbf8c4'::uuid
  ) THEN
    RAISE EXCEPTION 'Default Member role was not found in the seeded workspace';
  END IF;
END
$$;

INSERT INTO core."user" (
  id, "firstName", "lastName", email, "isEmailVerified", disabled,
  "passwordHash", "canImpersonate", "canAccessFullAdminPanel", locale
)
VALUES (
  '16a58f46-20fe-4d75-9f0d-1a93d36f3b82', 'Stage 4', 'Operator',
  :'operator_email', false, false,
  public.crypt(:'operator_password', public.gen_salt('bf', 10)),
  false, false, 'ru-RU'
);

INSERT INTO core."userWorkspace" (id, "userId", "workspaceId", locale)
VALUES (
  '5cfaec91-a8f3-4d28-b7ea-a97448e6642e',
  '16a58f46-20fe-4d75-9f0d-1a93d36f3b82',
  '773b8101-5a6a-467b-b12c-f16751bbf8c4',
  'ru-RU'
);

INSERT INTO workspace_7249nh2dhrl2ca1lcdcu82f2c."workspaceMember" (
  id, "nameFirstName", "nameLastName", "userEmail", "userId", locale,
  "createdByName", "updatedByName"
)
VALUES (
  '8c186882-2fab-4afb-8dba-c315318b9ce2', 'Stage 4', 'Operator',
  :'operator_email', '16a58f46-20fe-4d75-9f0d-1a93d36f3b82', 'ru-RU',
  'Local bootstrap', 'Local bootstrap'
);

INSERT INTO core."roleTarget" (
  id, "workspaceId", "roleId", "userWorkspaceId", "universalIdentifier", "applicationId"
)
SELECT
  'f795805a-d42b-489a-a931-3db04c747ee4',
  role."workspaceId", role.id, user_workspace.id,
  '27f27d70-4557-46cd-91f2-7a3dda3c1e75', role."applicationId"
FROM core.role AS role
CROSS JOIN core."userWorkspace" AS user_workspace
WHERE role.id = '7ca9ad02-580c-442b-a7ac-fe259154940a'::uuid
  AND user_workspace.id = '5cfaec91-a8f3-4d28-b7ea-a97448e6642e'::uuid;
SQL
