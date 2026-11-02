# Workflows and execution protocol

Version: 1.7 · Date: 2 November 2026 · Status: proposed NestJS/Codex App Server adapter contract; not verified.

[Русская версия](protocol.ru.md) · [All requirements](../requirements.md) · [PRD](../PRD.md)

## 1. Workflows and protocol

### MVP workflows

| ID | Workflow / trigger | Responsibility |
| --- | --- | --- |
| PROTO-01 | Operator actions / three single-record manual triggers | SUBMIT, ACCEPT, and REWORK verify the caller's membership in Orchestrator Operator; record permissions alone do not replace this check |
| PROTO-02 | Apply Journal event / new DISPATCH_REQUEST | One Worker selects one READY task, persists a request, and waits for START; the workflow validates the task and Project, rejects another activeRun, then creates the snapshot, AiRun, and START |
| PROTO-03 | Apply Journal event / new Worker event | Idempotently applies STARTED/RESULT/ERROR/PR_CREATED; heartbeat/ACK and operator decisions do not trigger lifecycle transitions |
| PROTO-04 | Recovery monitor / Schedule | Deferred; progress checks, RECONCILE on reconnect, and WAITING/RECOVERY on unknown outcomes |

Dispatch is driven by one Worker poller, not a Twenty schedule. The Worker submits no next request until the current run has a confirmed outcome; an unknown outcome keeps the queue blocked. Recovery monitor remains a separate scheduled workflow for later scope.

For the MVP, `runKey = taskId:requestVersion`. The `DISPATCH_REQUEST` key is `<runKey>:DISPATCH_REQUEST`; the request contains `taskId`, `runKey`, and `payload.requestVersion`, which must match the task's current version. Worker event keys are `<runKey>:<eventType>` and remain stable on redelivery; events carry `taskId`, `runId`, `runKey`, and `payload.requestVersion`. `RESULT` also contains `resultSummary`, `prUrl`, `headCommit`, and `evidence` with `draftPr: true` and a non-empty set of passing mandatory checks. Transitions reject mismatched keys or versions.

### Journal operations

**COMMAND**

- `START`
- `RESUME`
- `ASSIGN`
- `PUBLISH_PR`
- `CANCEL`
- `RECONCILE`

**EVENT**

- `DISPATCH_REQUEST`
- `STARTED`
- `QUESTION`
- `HANDOFF_REQUEST`
- `ASSIGNED`
- `WORK_COMPLETED`
- `PR_CREATED`
- `RESULT`
- `ERROR`
- `STOPPED`
- `HEARTBEAT`
- `RECOVERY_REPORT`
- `CHECKPOINT`
- `ACCEPT`
- `REWORK`

`PROTO-05`: PENDING denotes an unacknowledged command/unprocessed event; APPLIED denotes an executed command/applied event. ACK includes resultCode OK/ERROR/REJECTED; PENDING after a network error is an unknown outcome. operationKey remains stable on delivery; validate task/runKey/assignmentVersion/questionId/handoffId as applicable. Reject wrong versions or conflicting payloads while retaining diagnostics.

PUBLISH_PR recovery and retry:

1. Redelivery of an APPLIED operation returns the saved outcome; it does not execute the command again or change its acknowledgement.
2. For PENDING with an unknown GitHub outcome, reconcile the existing attempt and look up the PR by repository/base/head. If found, deliver PR_CREATED/RESULT without creating another PR. If lookup is inconclusive, keep the operation unresolved; do not start a new attempt.
3. Only after a confirmed failure has been saved as APPLIED/ERROR may Operator action authorize a new command attempt. One operator action produces one new operationKey and records publicationKey/retryOfOperationKey. Duplicate submissions reuse that attempt.
4. Before the new attempt publishes, search again for an existing PR. Reuse the same runKey, requestVersion, repository/base/head and already prepared changes; preserve any known headCommit. Do not start a second Codex App Server execution, recreate changes, or reset the run budget.
5. Persist the new attempt's intent and acknowledgement independently of the previous command. Workflow applies a confirmed publication outcome to the same AI Run / AI Task; a retry does not create a new engineering run.

`PROTO-06`: Codex App Server adapter contract (proposed; validate against the pinned Codex build):

- Launch a local `codex app-server` child process over stdio. Initialize each connection once, then use the version-specific generated TypeScript/JSON schema. The pilot does not use the experimental remote WebSocket listener.
- Map Twenty `runKey` to one persisted Codex `threadId`; map each authorized assignment to a `turnId`; store JSON-RPC request ids, operation keys, and event checkpoints in Journal. Runtime identifiers never authorize business transitions.
- Use supported thread/turn methods and notifications only. Record the exact method/schema version for thread start/resume, turn start/interrupt, approval requests/responses, and history reads. Do not infer that thread resume restarts an interrupted turn or that RPC delivery is exactly once.
- Handle App Server approvals as server-initiated JSON-RPC requests: persist the pending request id, thread/turn/item identity, exact action and policy version before exposing it for human review; answer that same request id only after the authorized Twenty decision is durably recorded. A cleared or completed request is not approval for a later action.
- Persist CHECKPOINT intent before every execution-changing request. After a lost response, inspect the same thread's status/history and workspace artifacts. If the result remains ambiguous, retain PENDING and block the queue in RECOVERY; never issue a replacement turn automatically.
- Translate confirmed App Server notifications and final item states into existing Journal `EVENT` tokens. Journal remains the only durable command/event authority and the source for Twenty lifecycle updates.
- Enforce one active run and sequential specialist profiles in the NestJS worker. Handoff starts only after the prior turn and its tools are confirmed complete.

`PROTO-07`: NestJS components (proposed):

- TwentyClient (pagination/timeouts)
- CommandExecutor (sequential commands)
- CodexAppServerClient (stdio lifecycle, JSON-RPC correlation, schema validation, event stream)
- CodexRunAdapter (thread/turn/approval/reconciliation mapping; pinned interface)
- WorkspaceService
- AgentExecutor
- GitHubPublisher
- RunJournal
- LangfuseExporter

They do not contain a custom business workflow engine. A polling scheduler does not replace an overlap lock. Core API serves records, Metadata API serves initial setup; obtain routes and filters from target schema.


`PROTO-08`: client answers use the native Twenty Form action or an optional Telegram transport. The worker verifies the Twenty session or administrator-bound Telegram user with a client/developer role, derives actor/client scope/authority, checks Project/client relation, addressed recipient, business INPUT kind, task/run/question/request/assignment versions, and unresolved status. Deduplicate both channels against the same question and persist one Journal answer event before responding to an active Codex approval request or issuing a separately authorized continuation. Never infer that a completed/interrupted turn can continue in place. The first valid answer wins. Reject stale, duplicate, wrong-recipient, and revoked-binding attempts. A client identity can submit INPUT only; APPROVAL allow/deny is accepted only from an authenticated/bound developer with current authority. Client replies cannot change lifecycle or authorize execution. No shared API key is exposed to clients.
