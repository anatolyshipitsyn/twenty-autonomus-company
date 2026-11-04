# Orchestrator Worker

This package reads persisted `OUTBOUND / START / PENDING` Journal records from
Twenty GraphQL and validates the Journal identity and protocol v1 snapshot.
Codex execution is opt-in with `CODEX_ENABLED=true` and is disabled by default.

The package uses the supported Twenty GraphQL API. It has no database driver or
SQL access. Supply `TWENTY_API_URL` and a dedicated `TWENTY_API_KEY` assigned to
the `Orchestrator Worker` role through the local environment; do not commit
either value.

```sh
corepack yarn install
TWENTY_API_URL=http://localhost:3000 TWENTY_API_KEY=your-local-worker-key yarn start:dev
```

When execution is enabled, set `CODEX_WORKSPACE_ROOT`,
`CODEX_ALLOWED_REPOSITORY_URL`, and `CODEX_ALLOWED_BASE_REF`. The worker
requires a clean Git workspace whose origin and branch match the allowlist. It
creates a thread, saves the `THREAD_CREATED` checkpoint in the START record,
starts one turn with network access disabled and that workspace as its only
writable root, and saves `STARTED` with the thread and turn IDs.

When enabled, the worker first persists one `DISPATCH_REQUEST` for the oldest
READY task without an active run. The Twenty workflow creates the run and START;
the worker consumes only that saved START command. After a completed turn, the
worker requires a final assistant summary and
changes in the workspace. It runs the app's `lint`, `typecheck`, and
`test:unit` package scripts, then the worker's `build` script. It commits the
changes on a deterministic per-run branch, pushes that branch, and opens a
draft pull request with `gh`. Only after it has the PR URL and head commit does
it persist RESULT in the Twenty Journal. The worker waits for Twenty to apply
RESULT before releasing its in-process lock. GitHub push/PR outcomes that
cannot be confirmed leave the run locked for manual reconciliation. The host
must have `gh` authenticated for the allowlisted repository with push and PR
creation access; GitHub credentials stay out of the Codex child environment.

The App Server protocol is generated from and pinned to Codex CLI 0.165.0.
Execution remains disabled by default. Restart reconciliation and durable
recovery for uncertain App Server or GitHub outcomes are not implemented yet.
