# Local Twenty environment

The default Compose stack runs the pinned upstream Twenty image, PostgreSQL, Redis, and the Twenty worker. A fresh PostgreSQL volume is initialized from the local database snapshot, including its workspace and a configurable administrator account.

This Compose stack does not start the orchestrator worker or Codex App Server. The selected NestJS/Codex integration is a separate target component and has not yet been implemented here.

## Start

1. Review local connection and secret values in the private `.env` file.
2. Start the stack and wait for the server healthcheck. The `app-dev` service also starts automatically; it syncs the mounted `apps/twenty-app` source into the local workspace:

   ```sh
   docker compose up -d --wait
   ```

3. Open `http://localhost:3000` and sign in with the default administrator credentials below. Existing database volumes retain their existing accounts. Follow app sync output with `docker compose logs -f app-dev`.

## Behavior and limits

- `IS_MULTIWORKSPACE_ENABLED` defaults to `false`; registration remains limited to the configured local workspace behavior.
- The upstream image is pinned by `TAG` (default `v2.54.0`). Recheck compatibility before changing the pinned version.
- `LOGIC_FUNCTION_TYPE` defaults to `LOCAL` so the app's local Twenty Workflows can run logic functions. `LOCAL` executes trusted app code inside the server/worker process; use this only for the isolated local development stack, and set a different supported driver or disable it for other environments.
- The Compose healthcheck covers the server endpoint. It does not verify account creation or workspace setup.
- `app-dev` authenticates as the local administrator using `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` from `.env` (or the Compose defaults). The database init script uses the same values on a fresh `db-data` volume. The entrypoint obtains a new Twenty access token each time the watcher starts and restarts it before the token expires, so `docker compose down -v` does not leave it dependent on an old OAuth session.
- A fresh `db-data` volume also gets the local `stage4-operator@lvh.me` account. Set `ORCHESTRATOR_OPERATOR_EMAIL` and `ORCHESTRATOR_OPERATOR_PASSWORD` in `.env` to change its credentials. After app sync, `app-dev` assigns the app's Orchestrator Operator role to that seeded member through Twenty's metadata API. The password default in Compose is for local development only; do not reuse it elsewhere.
- `app-dev` mounts the app source and keeps Linux dependencies in the `app-dev-node-modules` volume. Rebuild only this helper image after changing its Dockerfile or pinned CLI version; app source changes are watched live.
- Keep `.env` private; it may contain API credentials and local secrets.

On the first initialization of an empty PostgreSQL data volume, the official Postgres entrypoint runs `entrypoint-initdb/00-extensions.sql`, `entrypoint-initdb/10-default.sql`, `entrypoint-initdb/20-default-admin.sh`, and `entrypoint-initdb/30-orchestrator-operator.sh` in name order. The SQL dump is a snapshot of the local `default` database. Init scripts do not run again when the existing `db-data` volume is reused; reinitializing it requires intentionally replacing that volume.

The `20-default-admin.sh` init script replaces the snapshot's administrator email and bcrypt password hash using `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD`, and synchronizes the email in the workspace member record. The `30-orchestrator-operator.sh` script creates the operator user, workspace membership and initial Member role target using `ORCHESTRATOR_OPERATOR_EMAIL` and `ORCHESTRATOR_OPERATOR_PASSWORD`. After the app watcher syncs the role declared in `apps/twenty-app/src/roles/orchestrator-operator.role.ts`, the entrypoint assigns it to this member by stable role identifier. Compose defaults are `admin@lvh.me` / `LocalTwentyAdmin2026` and `stage4-operator@lvh.me` / `LocalStage4Operator2026`; set the password variables in `.env` before initializing a fresh volume. These local defaults are for development only. Init scripts run only on an empty PostgreSQL volume: changing `.env` or restarting with an existing volume does not create missing accounts or change existing credentials. `docker compose down -v` removes all local Twenty data, so use it only when that reset is intended.
