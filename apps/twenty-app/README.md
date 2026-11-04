# Autonomus Company

Standalone Twenty app package for the local autonomous-company orchestrator. It defines the Project, AI Task, AI Run, and AI Run Journal records; the Operator and Worker roles; and the workflows used by the current MVP. The NestJS worker and Codex App Server integration are separate components and are not implemented in this app package.

## Local setup

Use [SETUP.md](SETUP.md) for Node/Yarn and Twenty CLI versions, local workspace login, Compose behavior, worker-key settings, and safe sync commands. The local server is started from the repository root using [docs/local-environment.md](../../docs/local-environment.md).

## App checks

From this directory:

```bash
yarn lint
yarn typecheck
yarn test:unit
```

Run the full integration suite only against an isolated test workspace and provide its URL and local test credentials through environment variables. Do not run it against a development workspace.

## Sync

The root Compose stack starts an `app-dev` watcher for local development. For a bounded sync with `twenty app apply`, stop that watcher first; see [SETUP.md](SETUP.md#bounded-sync).
