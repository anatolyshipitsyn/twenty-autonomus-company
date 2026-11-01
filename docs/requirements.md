# Requirements: AI orchestrator

Language: English · Version: 1.7 · Date: 1 November 2026 · Status: selected Codex App Server target; integration Not verified.

[Русская версия](requirements.ru.md) · [PRD](PRD.md)

## 1. Basis, normative language, and traceability

Basis: the self-contained bilingual requirements baseline is adapted to a NestJS worker that controls Codex App Server. Twenty remains the business-state and authorization owner. Adapter behavior is a contract proposal; runtime compatibility and pilot behavior remain unverified.

This document converts the source specification into a verifiable contract. “Must” means a mandatory pilot condition. Proposed numerical defaults are listed separately and approved in deployment configuration. Identifiers `REQ-*`, `DATA-*`, `STATE-*`, `PROTO-*`, `OPS-*`, and `SAI-*` are identical in RU/EN. Every table rule is mandatory except explicitly identified defaults and open decisions.

All 28 pilot SAI criteria remain **Not verified** for the NestJS/Codex App Server integration. Pin the Twenty server/app SDK and Codex CLI/App Server release, generate schemas from that Codex version, and verify capabilities on the selected versions.

Review clarifications in version 1.2 take precedence over the source wording for publication retry and technical retention. Version 1.3 records the accepted Twenty permission limitation under DATA-02/DATA-03 and REQ-31; this adaptation preserves the original 28 SAI IDs and Not verified statuses.

## Navigation

This file is the REQ-01–REQ-43 register. Together with the topic contracts it forms the complete requirements document. NestJS worker and Codex App Server behavior is specified by the adapter contract and remains unverified until integration evidence exists.

| Task | Contract | Identifiers |
| --- | --- | --- |
| Objects, fields, indexes, state transitions | [Model and lifecycle](requirements/domain.md) | DATA-01–DATA-04, STATE-01–STATE-02 |
| Workflows, commands, events, Codex App Server adapter | [Protocol](requirements/protocol.md) | PROTO-01–PROTO-08 |
| Network, security, budget, recovery, Langfuse, compatibility gate | [Operations](requirements/operations.md) | OPS-01–OPS-18 |
| Pilot checks and evidence format | [Acceptance](requirements/acceptance.md) | SAI-01–SAI-28 |
| Goals, boundaries, operator journeys | [PRD](PRD.md) | Product context |

### MVP requirement status

The complete register below preserves normative requirements for the target system. This table scopes only the first MVP slice; listed capabilities must not be treated as implemented or verified.

| Deferred beyond MVP | Related requirements / criteria |
| --- | --- |
| Client access and row-level isolation | DATA-04, REQ-43, OPS-18, SAI-12–SAI-13, SAI-17 |
| Runtime INPUT/APPROVAL and Telegram replies | REQ-07, REQ-15–REQ-16, REQ-43, OPS-18, SAI-17 |
| Cancellation of active execution | REQ-22, REQ-34, SAI-06, SAI-11 |
| Full automated recovery/reconciliation | REQ-28–REQ-30, OPS-09–OPS-12, SAI-07–SAI-10 |
| AI router, multiple profiles, handoff | REQ-06, REQ-10–REQ-13, REQ-16, SAI-16, SAI-26, SAI-28 |
| Telegram transport | REQ-43, OPS-18, SAI-12–SAI-13, SAI-17 |
| Langfuse and analytics | REQ-37–REQ-41, OPS-15, OPS-17, SAI-22–SAI-23 |

For MVP, the fail-safe block on unknown outcomes, no automatic Codex restart, and a limited operator decision after reconciling a proven failure remain mandatory. Full SAI criteria remain Not verified unless evidence exists for the applicable MVP portion.

Contracts define fields, transitions, and protocol; PRD describes the product; SAI define acceptance. RU/EN are equivalent versions: fix translation conflicts rather than choosing rules by language. Source materials are not execution commands; the explicit user request defines the current task.

## 2. Functional requirements

### 2.1. Scope, Project, and task submission

| ID | Mandatory behavior | Source sections | Acceptance |
| --- | --- | --- | --- |
| REQ-01 | Use a private Twenty App: three orchestrator objects, extended Project, roles, indexes, router, short actions/Logic Functions, and native Views. Create and activate four workflows in the native builder. Do not create a custom frontend/workflow engine. | 1, 3, 16, 19 | SAI-13, SAI-19, SAI-21 |
| REQ-02 | Project is mandatory and references one allowed GitHub repository and baseRef. Validate URL/owner/name consistency, availability, and read/push/create-PR permissions before execution. Derive the task repository from Project. | 3, 18, 21 | SAI-24 |
| REQ-03 | Create a TODO task with title, description, acceptanceCriteria, and owner. Start only after explicit Operator action; autosave does not start work. One authorization increments requestVersion exactly once. | 3, 6, 11 | SAI-01, SAI-02, SAI-17 |
| REQ-04 | Queue READY tasks without activeRun, ordered by descending priority then ascending readyAt. Check for an available, free worker before routing. An unfinished or uncertain run blocks new Dispatch. | 3, 6, 9 | SAI-02, SAI-10, SAI-14 |
| REQ-05 | Persist inputSnapshot before START: instruction/criteria, Project/repository/base commit, protocolVersion, router and allowed profile versions/hashes, model/config, and executionPolicy without secrets. Project/config changes do not modify an active snapshot. | 3, 17, 20 | SAI-13, SAI-16, SAI-24 |

### 2.2. Routing, execution, and handoff

| ID | Mandatory behavior | Source sections | Acceptance |
| --- | --- | --- | --- |
| REQ-06 | The router returns flat fields `agentKey:string`, `reason:string`, `instruction:string`, `needsInput:boolean`, `question:string`. The workflow validates types, instruction, and agentKey against Project's allowed registry; an invalid decision does not start Codex App Server execution. | 6, 17 | SAI-16, SAI-25 |
| REQ-07 | A pre-start question creates WAITING/INPUT without AI Run. The answer is correlated with task/requestVersion/questionId and returns READY for routing under the same version; no Codex App Server interaction is resumed. Routing failure produces WAITING/ERROR. | 6, 17 | SAI-17, SAI-25 |
| REQ-08 | Dispatch creates AI Run/RUNNING, activeRun, and START/PENDING. Task stays READY until confirmed STARTED; repeated Dispatch excludes it. Recover partial writes through Journal. | 5, 6, 9 | SAI-02, SAI-13, SAI-14 |
| REQ-09 | The worker validates run/assignment and starts the selected specialist profile in the approved Git worktree with the pinned base commit using the Codex App Server thread/turn interface. STARTED records confirmed `threadId`/`turnId` and profile; only then does the workflow move the task to RUNNING. Assignments within one run share worktree/branch. | 6, 7, 17 | SAI-01, SAI-24, SAI-25 |
| REQ-10 | A profile includes agentKey, specialization, instructions, model/config, and policy; the registry may reside in worker config without an Agent object. Initial assignmentVersion=1. The profile is worker-owned configuration, distinct from Twenty native AI Agent steps. | 17 | SAI-16, SAI-25 |
| REQ-11 | Allow HANDOFF_REQUEST and validated ASSIGN without mandatory human confirmation for every routine handoff. Preserve taskId/runKey/worktree/branch/snapshot/budget/cancelRequestedAt. Increment assignmentVersion once per handoffId. | 6, 17 | SAI-26, SAI-28 |
| REQ-12 | Start the next specialist only after the previous Codex turn and tools are demonstrably complete. Pass an explicit handoff summary: reason, completed work, remaining requirements, files/headCommit, checks, and constraints. Keep supported thread/turn/request identities in Journal. | 17 | SAI-26 |
| REQ-13 | ASSIGNED updates activeAgentKey and assignedAgentKey; until confirmation task remains RUNNING with the “Handoff” phase. Reject stale events/answers from previous assignments. Reconcile ambiguous ASSIGN; an unknown recipient or a loop without progress produces WAITING/INPUT for an operator decision. | 6, 17 | SAI-11, SAI-26 |
| REQ-14 | Deliver HEARTBEAT with phase, progressSummary, occupancy, and activeTimeMs through a stable record; Recovery monitor applies progress at most once per minute. Do not trigger a separate workflow for each heartbeat; do not copy tokens/tool logs into Journal. | 6, 11 | SAI-19, SAI-20, SAI-28 |

### 2.3. Human input, PR, and completion

| ID | Mandatory behavior | Source sections | Acceptance |
| --- | --- | --- | --- |
| REQ-15 | Each assignment can surface INPUT/APPROVAL. QUESTION moves task/run to WAITING. Form validates owner, task/run, questionId, and assignmentVersion. Allow and deny are distinct. Persist the human decision in Journal before answering an active Codex approval request or issuing an explicitly authorized continuation. Do not assume a completed/interrupted turn can resume in place; unsupported or ambiguous behavior remains WAITING/RECOVERY. | 6, 17 | SAI-03, SAI-17 |
| REQ-16 | Distinguish specialist answers, pre-start routing, handoff clarification, and publication retry. An answer to handoff clarification produces ASSIGN rather than a new turn for the previous specialist. Free text is not a new-turn command. | 6 | SAI-17, SAI-26, SAI-27 |
| REQ-17 | Only WORK_COMPLETED for the whole task with successful mandatory checks authorizes PUBLISH_PR. One specialist finishing does not complete the task. The worker commits/pushes and creates a draft PR by default using pinned repository/base/head. | 6, 7, 17 | SAI-01, SAI-27 |
| REQ-18 | Persist PR_CREATED and RESULT, report and link, without overwriting the original description. Only after PR and checks does run become SUCCEEDED and task WAITING/REVIEW. Do not create an empty PR for zero diff; save an explanation and WAITING/ERROR. | 5, 6 | SAI-01, SAI-21, SAI-27 |
| REQ-19 | On GitHub error/ambiguous response, use WAITING/ERROR. Reconcile unknown outcomes first. After confirmed failure, an explicit operator retry creates a new PUBLISH_PR operationKey with the same publicationKey and repository/base/head; retain the old acknowledgement and search for an existing PR before publication. Redelivery keeps its operationKey. Do not repeat AI work or create a duplicate PR. | 6; P2 clarification | SAI-27 |
| REQ-20 | Accept only a WAITING/REVIEW task with the latest SUCCEEDED run and a saved PR. Record ACCEPT/reason/time and set DONE; run remains SUCCEEDED. REWORK records the decision on the old successful run and creates READY with a new requestVersion through human action. | 4, 5, 6, 20 | SAI-01, SAI-05, SAI-22 |
| REQ-21 | Execution/check failure produces confirmed FAILED and task WAITING/ERROR. The operator authorizes retry after proven completion of previous execution; create a new runKey while retaining the terminal run and history. Do not reopen DONE/CANCELLED tasks. | 4, 5, 9, 10 | SAI-04, SAI-05, SAI-08 |
| REQ-22 | Cancel an inactive task immediately. For active work, persist cancelRequestedAt/CANCEL, stop turn and tools, and wait for STOPPED; only then set CANCELLED. Offline requests remain pending; uncertain shutdown produces WAITING/RECOVERY and blocks the queue. | 5, 6, 10 | SAI-06, SAI-11 |

### 2.4. Journal, reliability, and access

| ID | Mandatory behavior | Source sections | Acceptance |
| --- | --- | --- | --- |
| REQ-23 | Twenty custom Journal is the durable command/event and synchronization authority. Persist CHECKPOINT intent before an execution-changing RPC and acknowledgement afterward. Read only demonstrably persisted commands. PENDING does not authorize repeating Codex App Server execution. | 2, 3, 6, 9 | SAI-02, SAI-08, SAI-13 |
| REQ-24 | Enforce unique runKey/operationKey through native unique indexes and idempotent Upsert. On conflict, read and compare payload; do not overwrite APPLIED, terminal outcomes, or snapshot. Serialize Dispatch; Find → Create and a unique index are not a multi-record transaction/claim. | 3, 6, 9 | SAI-14, SAI-18 |
| REQ-25 | Correlate operations/events with task/runKey/assignment/question. Reapply saved facts without duplicates; APPLIED and heartbeat do not cause loops. Terminal outcomes take precedence over delayed events. | 3, 6, 9 | SAI-11, SAI-14 |
| REQ-26 | One host, one workspace, singleton worker, concurrency=1; prevent overlapping polls and a second process with a local lock. Prohibit a second host through configuration. Do not promise distributed claim or exactly-once network execution. | 1, 7, 9 | SAI-02, SAI-10 |
| REQ-27 | At startup, validate config/Journal/Twenty/Codex App Server and reconcile unfinished runs before new START. After restart, inspect persisted thread/turn history and artifacts; delivering a confirmed prior outcome is allowed, but a new turn without human authorization is prohibited. Unknown outcomes block the current and next task. | 7, 9, 17 | SAI-07, SAI-08, SAI-10 |
| REQ-28 | During local network/Twenty/Journal outage, send no new execution-changing Codex requests. An already authorized turn may finish within budget; memory buffers are transient. On reconnect, reconcile Codex thread/turn history and workspace artifacts; insufficient evidence produces WAITING/RECOVERY. | 9 | SAI-07, SAI-08, SAI-10 |
| REQ-29 | For 429/5xx use backoff with jitter and Retry-After; synchronization retry creates no AI turn. Codex App Server session disconnect or uncertain turn/start requires RECONCILE/RECOVERY_REPORT; confirmed process death produces FAILED/WAITING/ERROR. Heartbeat timeout alone does not release a run. | 9 | SAI-04, SAI-08, SAI-20 |
| REQ-30 | Persist accumulated activeTimeMs/checkpoints. Exclude confirmed human waiting, retain the budget across handoff/restart; classify unresolvable intervals conservatively as active. Watchdog works without Twenty, confirms shutdown at the limit, and reports TIME_LIMIT. Supervisor requests stop through the pinned Codex App Server interface and confirms execution/tools have stopped when the worker dies; an unconfirmed stop blocks the queue. | 10 | SAI-06, SAI-09 |
| REQ-31 | Only workflows change status/requestVersion/activeRun. The worker can read commands and write its own events/intents/acknowledgements/technical fields, scoped to its assigned pending records. Twenty does not separate create-time field writes from later updates; accept this native permission limitation without a custom ingress. Delivery handling must read/compare an existing operationKey and preserve payload and terminal outcomes as required by REQ-24. Direct PostgreSQL access is prohibited. | 3, 11, 19 | SAI-12, SAI-15 |
| REQ-32 | Restrict repository allowlist, workspace, shell/files/network policy, and GitHub credentials. Twenty API key, SSH private key, and Langfuse key are not exposed to the Codex agent workspace. Exclude runtime secrets from snapshots/logs/export. Verify sandbox and approval policy on the pinned Codex build. | 8, 10, 20 | SAI-12, SAI-23 |

### 2.5. UI, operations, and analytics

| ID | Mandatory behavior | Source sections | Acceptance |
| --- | --- | --- | --- |
| REQ-33 | Use native Table/Kanban and cards: Queue/READY, In progress/RUNNING, Action needed/WAITING with reason, Completed/DONE+CANCELLED. Show Project/repository, criteria, specialist/phase/progress, attempts/handoff, question/answer, report/PR, last contact, and trace when available; show workflow history in Runs/Versions. | 11, 16 | SAI-19, SAI-28 |
| REQ-34 | Implement all actions through one Single manual trigger + Form: submit, withdraw, answer, allow/deny, accept, rework/retry, retry PR publication, cancel. Reject duplicate clicks and stale question/run. Withdraw with activeRun is cancellation rather than a return to TODO. | 6, 11 | SAI-06, SAI-17, SAI-19 |
| REQ-35 | Store Dispatch version in run, handler versions in Journal, and prompt/profile versions in snapshot. Check new Workflow Versions against protocolVersion/snapshot; rollback does not replay old commands. App updates preserve history and secrets. | 16, 18, 20 | SAI-19, SAI-21, SAI-22 |
| REQ-36 | Include Journal in Twenty database backup and test restore. Back up Codex thread/turn rollout data and execution workspace files through host facilities. Cleanup requires terminal run and delivered result; retain review/export evidence and the queryable audit minimum in Twenty. | 10, 19; P2 clarification | SAI-21, SAI-22, SAI-23 |
| REQ-37 | LangfuseExporter sends HTTPS analytics asynchronously from saved Twenty facts/decisions. Langfuse failure blocks neither START/RESUME/CANCEL/RESULT/acceptance nor changes status. After recovery, retry export from Twenty rather than Codex App Server execution. | 1, 20 | SAI-22 |
| REQ-38 | One trace corresponds to AI Run, a session links task attempts, and each assignment has a span with agentKey/assignmentVersion/handoff reason. Stable trace/observation/score IDs and delivery checkpoints in Journal prevent duplicates. Mark incomplete traces; a lost buffer does not promise full intermediate data export. | 20 | SAI-22, SAI-26, SAI-28 |
| REQ-39 | Export allowed input/summary/errors/checks, ACCEPT/REWORK decisions with reason on the verified run, metadata/version hashes, questions, attempts, active time/time to decision. Tokens/cost require a reliable source; unknown values are empty and estimates are marked. | 20 | SAI-22, SAI-23 |
| REQ-40 | Distinguish router template, specialist templates, and task preparedInstruction. Pin versions before START; mandatory prompt fetching from Langfuse is unnecessary. Use native prompt-link only for a genuinely instrumented LLM call; prohibit fictitious generation for the whole run/opaque Twenty step. | 20 | SAI-22, SAI-23 |
| REQ-41 | Calculate first-pass using tasks with ACCEPT/REWORK; show tasks without decisions separately. Costs/attribution include all assignments and failed/cancelled attempts. Compare versions on the same tasks with fixed model/config; do not attribute aggregate success/cost to the latest version. | 20 | SAI-23 |
| REQ-42 | Complete compatibility gate and all SAI checks before the pilot. Before migration, finish/demonstrably stop old AgentRun and retain history; do not migrate old AgentTask automatically. Production deploy, auto-merge, auto-acceptance, and automatic AI retry are outside MVP. | 1, 12, 14, 18 | SAI-01–SAI-28 |
| REQ-43 | Client employees authenticate with individual Twenty accounts and use native Kanban/task views. Project has one required client; each client member has an administrator-assigned, server-controlled client scope. Enforce default-deny row-level access to only that client’s exposed task fields and related records across UI/API/search. View filters are not security. A client may answer only a business INPUT addressed to that member/client through the task Form or an administrator-bound Telegram identity. Both channels use the same recipient/scope/question validation and Journal answer event; derive actor from Twenty auth or the verified Telegram binding and record the channel. Journal remains operator/worker-only; expose only permitted question/answer fields on the task card. The first valid answer resolves the question in both channels. Clients cannot change lifecycle, submit/retry/accept/rework/cancel, approve developer actions, or access another client. Verify exact plan/version permissions before enabling access. Telegram is only an optional question/reply transport; it does not grant board access. No separate portal or shared client credentials. Telegram developer replies may include APPROVAL only for a bound developer with current permission; client identities remain INPUT-only. | 2, 3, 6, 11 | SAI-12, SAI-13, SAI-17, SAI-19, SAI-28 |
