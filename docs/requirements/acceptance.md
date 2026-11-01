# Pilot acceptance

Version: 1.6 · Date: 1 November 2026 · Status: Not verified for NestJS/Codex App Server runtime.

[Русская версия](acceptance.ru.md) · [All requirements](../requirements.md) · [PRD](../PRD.md)

## 1. Acceptance matrix

All 28 SAI IDs and statuses are preserved from the transferred baseline; expected runtime evidence targets the NestJS worker and pinned Codex App Server protocol. Every row is **Not verified**. Execute checks on a test repository/workspace with pinned versions; runtime evidence is mandatory.

| ID | Check | Expected result |
| --- | --- | --- |
| SAI-01 | Full Project → READY → specialist → PR → acceptance path | One run; agent, progress, checks, PR, and report saved; DONE only after operator decision |
| SAI-02 | Repeated polls and repeated authorization of the same command | One runKey, one execution; behavior persists after restart |
| SAI-03 | Answer a question and deny approval | Same run; the correct question gets its answer; denial is not treated as permission |
| SAI-04 | Codex App Server execution or acceptance check failure | Run FAILED, task WAITING/ERROR; no automatic retry |
| SAI-05 | Rework after a successful run | New requestVersion and run; previous SUCCEEDED retained in history |
| SAI-06 | Cancel active execution | CANCELLED only after shutdown; repeated cancellation is safe |
| SAI-07 | local Twenty API/network outage, including worker restart before recovery | No new turn starts; reconcile outcome from Twenty Journal, Codex thread/turn history, and workspace artifacts or remain WAITING/RECOVERY |
| SAI-08 | Worker restart and lost JSON-RPC acknowledgement | Read the recorded thread/turn history and artifacts; confirm the previous execution or remain WAITING/RECOVERY; no duplicate turn |
| SAI-09 | Exhaust 60 minutes, including restart and human waiting | Budget retained; waiting excluded; shutdown and outcome recorded |
| SAI-10 | Second worker instance; unavailable/corrupt Twenty journal | Start blocked; no new Codex App Server commands; no concurrent execution |
| SAI-11 | Stale answer/cancel/events and wrong version | Actions do not affect another run; terminal outcome is not overwritten |
| SAI-12 | API permissions, client row-level isolation, Telegram identity/bot-secret isolation, Codex process isolation, and workspace sandbox | Client A cannot read/search client B data; client cannot change lifecycle or approve developer action; secrets stay outside the agent workspace; prohibited repositories/actions are rejected |
| SAI-13 | Workspace API, client access, Telegram authorization, and pinned Codex App Server protocol | Schema/permissions, runKey/operationKey, PENDING recovery, JSON-RPC invocation, thread/turn events, approval response, cancellation, history reconciliation, and client answers verified on selected versions |
| SAI-14 | Repeated/concurrent workflow triggers and EVENT/APPLIED | One START/runKey; idempotent event application; no loops |
| SAI-15 | Workflow and worker permissions | Workflows apply business transitions; worker cannot change status or authorize retry |
| SAI-16 | Router and specialist profile | Allowed agentKey selected; instruction/question validated; STARTED assigns specialist; workflow owns lifecycle and acceptance is manual |
| SAI-17 | Form/Telegram: client INPUT, developer reply/approval, and stale question | Client answers only addressed INPUT; bound developer may allow/deny addressed APPROVAL; both channels deduplicate and first valid reply wins; wrong-recipient, revoked binding, and stale answers rejected |
| SAI-18 | Unique indexes and Upsert | Duplicate keys rejected; redelivery does not overwrite outcome; four workflows operate without Jobs/KV or a separate orchestrator queue |
| SAI-19 | Native client Kanban, operator UI, history, and versions | Client employee signs in and sees only own client’s permitted Kanban/task details; an addressed question can be answered in Twenty or verified Telegram; only permitted data appears on board; rollback does not replay old commands |
| SAI-20 | Twenty/Codex limits and selected versions | Quotas, permissions, and protocol methods actually available; quota failure creates no new turn; polling/heartbeat creates no workflow storm |
| SAI-21 | Report, backup/restore, and private app | Concise report and allowed link available to operator; test restore retains journal; app update preserves history/secrets; no file upload required |
| SAI-22 | Langfuse: trace, version, and human score | Run linked to trace, template versions distinguished; tests and ACCEPT/REWORK delivered without duplicates; Langfuse failure blocks neither START, answer, RESULT, nor acceptance; export retried from Twenty after recovery |
| SAI-23 | Analytics completeness and secrets | Unknown tokens/cost remain empty; credentials not exported; first-pass uses tasks with decisions, attempts are not conflated, and unfinished tasks shown separately |
| SAI-24 | Project and GitHub repository | Project mandatory; missing/inaccessible repository blocks START; Project repository changes do not modify active run snapshot |
| SAI-25 | Specialist selection and acknowledgement | Router selects allowed profile; worker records the Codex thread/turn and emits STARTED before RUNNING; selection failure starts no turn |
| SAI-26 | Handoff and recovery | A → B within the same task/run/worktree; previous specialist execution demonstrably finished; assignmentVersion/context saved; duplicates, stale answer/result, and restart do not start a second specialist |
| SAI-27 | PR creation and GitHub failure | One PR after checks in correct repository/base/head; ambiguous response triggers an existing-PR lookup; publication retry does not repeat Codex execution; link/report saved, description preserved |
| SAI-28 | Ten-step operator and client journey | Project creation, client login and scoped Kanban, routing, progress, addressed client input through either channel, continuation, handoff, and PR verified end to end; cross-channel duplicate/stale/revoked identity tests pass; specialist history present in Journal/Langfuse |

For every SAI, retain:

- environment/config versions
- preconditions and steps
- expected/actual outcome
- task/runKey/operationKey/assignmentVersion
- sanitized API/Journal/RPC evidence
- check results
- PR URL where applicable

For cancellation/recovery, include proof of shutdown or an existing previous turn and absence of duplicates; heartbeat/PID alone is insufficient. For analytics, retain IDs/decisions, completeness, and failure scenario. For backup, retain test restore evidence.

Verification states:

- **Met** — expected outcome proven
- **Partially met** — only part proven
- **Not verified** — insufficient execution
- **Not met** — a confirmed mismatch with defect/evidence

Static documentation checks do not close SAI. Pilot acceptance requires all 28 criteria to be met; criterion/scope changes must be explicit in both language versions.

## 2. P2 regression scenarios

These scenarios clarify the existing criteria; they introduce no new SAI identifiers. They remain Not verified until an integration run provides evidence.

Publication retry under SAI-27:

- Simulate a confirmed GitHub publication failure saved as APPLIED/ERROR. Authorize retry: one new operationKey, the same publicationKey/runKey/requestVersion/repository/base/head, and retryOfOperationKey referencing the old command. Preserve the old acknowledgement and prepared changes; start no Codex App Server execution.
- Submit the same retry action twice and redeliver its command. Observe one new command attempt; after APPLIED, delivery returns its saved outcome without re-execution.
- Lose the GitHub response after PR creation. Reconcile the original PENDING operation and deliver the existing PR URL without creating a new PR or attempt. If lookup remains inconclusive, keep the operation unresolved and start no retry.
- Before an authorized new attempt publishes, verify the existing-PR lookup; assert one PR and saved PR_CREATED/RESULT.

Retention under SAI-21, SAI-22, and SAI-23:

- Advance beyond the configured technical retention period with a SUCCEEDED run and a task still WAITING/REVIEW. Run cleanup; verify that the run, PR, checks, snapshot/version references, and required Journal evidence remain queryable. Exercise ACCEPT and REWORK on separate fixtures.
- Keep Langfuse unavailable beyond that period, including an ACCEPT/REWORK decision awaiting export. Run cleanup and restart the exporter; verify delivery from retained facts/checkpoints using the original trace/observation/score IDs without duplicates.
- Retain a task with multiple attempts, including FAILED/CANCELLED older than the technical retention period. After cleanup, verify preserved assignment/version history and available cost/time facts across all attempts for first-pass and cost attribution.
- Perform backup/restore after cleanup; verify the protected audit minimum, pending export checkpoints, and idempotent publication outcomes survive.

## Codex App Server evidence gate

All criteria remain **Not verified** until a pinned local integration proves one Twenty `runKey` maps to the recorded Codex `threadId`, authorized assignments map to turns, supported JSON-RPC methods/events are used, approval responses are bound to the reviewed action, and cancellation/restart reconcile without automatically starting a duplicate turn. Negative tests must prove the agent cannot access secrets or repositories outside its approved workspace. Client-access tests must prove individual authentication, own-client-only visibility, addressed INPUT answers, and denial of cross-client/lifecycle actions. These additions clarify existing SAI rows and add no new identifiers.
