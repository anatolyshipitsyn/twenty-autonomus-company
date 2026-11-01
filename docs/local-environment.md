# Local Twenty environment

The default Compose stack runs the pinned upstream Twenty image, PostgreSQL, Redis, and the Twenty worker. A fresh PostgreSQL volume is initialized from the local database snapshot, including its workspace and a configurable administrator account.

This Compose stack does not start the orchestrator worker or Codex App Server. The selected NestJS/Codex integration is a separate target component and has not yet been implemented here.

## Start

1. Review local connection and secret values in the private `.env` file.
2. Start the stack and wait for the server healthcheck:

   ```sh
   docker compose up -d --wait
   ```

3. Open `http://localhost:3000` and sign in with the default administrator credentials below. Existing database volumes retain their existing accounts.

## Behavior and limits

- `IS_MULTIWORKSPACE_ENABLED` defaults to `false`; registration remains limited to the configured local workspace behavior.
- The upstream image is pinned by `TAG` (default `v2.54.0`). Recheck compatibility before changing the pinned version.
- The Compose healthcheck covers the server endpoint. It does not verify account creation or workspace setup.
- Keep `.env` private; it may contain API credentials and local secrets.

On the first initialization of an empty PostgreSQL data volume, the official Postgres entrypoint runs `entrypoint-initdb/00-extensions.sql` followed by `entrypoint-initdb/10-default.sql`. The SQL dump is a snapshot of the local `default` database. Init scripts do not run again when the existing `db-data` volume is reused; reinitializing it requires intentionally replacing that volume.

The `20-default-admin.sh` init script replaces the snapshot's administrator email and bcrypt password hash using `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD`, and synchronizes the email in the workspace member record. The script checks the fixed workspace member ID and applies both updates in one transaction; if a check or update fails, the transaction rolls back. Compose defaults are `admin@lvh.me` and `LocalTwentyAdmin2026`; set either variable in `.env` to override it before initializing a fresh volume. These local defaults are for development only. Changing `.env` does not change credentials in an already initialized database.
