#!/usr/bin/env bash
set -Eeuo pipefail

: "${DEFAULT_ADMIN_EMAIL:?DEFAULT_ADMIN_EMAIL must be set}"
: "${DEFAULT_ADMIN_PASSWORD:?DEFAULT_ADMIN_PASSWORD must be set}"

if [[ ${#DEFAULT_ADMIN_PASSWORD} -lt 8 || ${#DEFAULT_ADMIN_PASSWORD} -gt 50 ]]; then
  printf '%s\n' 'DEFAULT_ADMIN_PASSWORD must be between 8 and 50 characters.' >&2
  exit 1
fi

psql -X --single-transaction --set ON_ERROR_STOP=1 --set workspace_member_id=48cc4cfc-e711-45c1-809e-bb4e54fc5508 \
  --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
\getenv default_admin_email DEFAULT_ADMIN_EMAIL
\getenv default_admin_password DEFAULT_ADMIN_PASSWORD

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM workspace_7249nh2dhrl2ca1lcdcu82f2c."workspaceMember" wm
    JOIN core."user" u ON u.id = wm."userId"
    WHERE wm.id = '48cc4cfc-e711-45c1-809e-bb4e54fc5508'::uuid
      AND wm."deletedAt" IS NULL
      AND u."deletedAt" IS NULL
  ) THEN
    RAISE EXCEPTION 'Default admin workspace member was not found';
  END IF;
END
$$;

UPDATE core."user" u
SET email = :'default_admin_email',
    "passwordHash" = public.crypt(:'default_admin_password', public.gen_salt('bf', 10))
FROM workspace_7249nh2dhrl2ca1lcdcu82f2c."workspaceMember" wm
WHERE wm.id = :'workspace_member_id'::uuid
  AND wm."deletedAt" IS NULL
  AND u.id = wm."userId"
  AND u."deletedAt" IS NULL;

UPDATE workspace_7249nh2dhrl2ca1lcdcu82f2c."workspaceMember"
SET "userEmail" = :'default_admin_email'
WHERE id = :'workspace_member_id'::uuid
  AND "deletedAt" IS NULL;
SQL
