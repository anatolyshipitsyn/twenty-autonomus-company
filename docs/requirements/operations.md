# Operations, recovery, and analytics

Version: 1.6 · Date: 1 November 2026 · Status: proposed NestJS/Codex App Server/local-Docker design; Not verified.

[Русская версия](operations.ru.md) · [All requirements](../requirements.md) · [PRD](../PRD.md)

## 1. Operational requirements

### Configurable defaults

| ID | Parameter | Proposed value / meaning |
| --- | --- | --- |
| OPS-01 | concurrency | 1; mandatory MVP boundary |
| OPS-02 | command poll / heartbeat | 10 / 30 seconds; pending configuration approval |
| OPS-03 | loss of contact | Heartbeat older than 90 seconds; an indicator only, not proof of shutdown |
| OPS-04 | Dispatch / Recovery / progress apply | 1 minute / 1 minute / at most once per minute |
| OPS-05 | run active budget | 60 minutes; START payload sets budget, human WAITING excluded only when confirmed |
| OPS-06 | graceful shutdown | Up to 30 seconds to request shutdown through the pinned Codex App Server interface and confirm execution/tools stopped; unproven shutdown blocks the queue |
| OPS-07 | retention | Proposed 30-day technical cleanup period for terminal runs after result delivery; review/export holds and the retained audit minimum below take precedence. Administrator configures schedule and backup. |

These are design values, not an SLA. Changes must align with check configuration, including SAI-09.

Retention rules under OPS-07:

- The 30-day default applies to disposable technical data, such as detailed tool logs and workspace files. It is not a deletion deadline for AI Run, task history, or the audit minimum in Journal.
- Cleanup requires a terminal run and confirmed result delivery. Delete only data no longer needed for review, recovery, pending publication, or analytics export; age alone is insufficient.
- While a task is WAITING/REVIEW, retain the evidence required to validate the successful run and PR and to perform ACCEPT/REWORK. A SUCCEEDED run is terminal but its review is still pending.
- Retain all facts, decisions, and delivery checkpoints required by a pending Langfuse export until delivery is confirmed. A Langfuse outage extends this hold without blocking execution or human acceptance.
- Keep a queryable audit minimum in existing Twenty AI Run / Journal objects for every task attempt, including FAILED/CANCELLED, for as long as task history is retained. This preserves later review decisions and cost/version attribution; it does not require a new object or service.
- The audit minimum includes run identity/status and task relation, snapshot/version references, assignment history, check results, summary/PR/headCommit, review decisions/reasons/timestamps, active-time and available cost/token facts, operation identities/outcomes, and export identities/checkpoints. Include any payload needed to reconstruct pending delivery.
- Backup or inaccessible archives do not replace this queryable minimum. Technical cleanup must preserve operator actions, idempotency, and metrics after cleanup and after backup/restore.
- Deletion of business task history and its audit minimum requires a separate explicit retention policy. The 30-day technical default never authorizes that deletion.

### Local network, secrets, and runtime isolation

`OPS-08`: for the local Docker pilot, services communicate over the Compose network and the bridge authenticates to Twenty through its supported API. Bind development interfaces to loopback; do not expose runtime, database, or admin endpoints publicly. SSH forwarding is conditional for a later remote-Twenty topology and is not required for local Compose networking. Preserve TLS verification whenever traffic crosses a host or trusted network boundary.

The worker runs Codex App Server as a local child process in the approved workspace. Configure and verify the narrowest supported sandbox and approval policy for the pinned Codex version; do not use unrestricted host access for the pilot. Keep Twenty, GitHub, SSH, Langfuse, Docker/admin credentials outside the Codex process environment and agent-visible workspace unless an explicitly scoped operation requires them. Verify filesystem, shell, and network boundaries with negative tests. This is a blocking compatibility/security gate.

Client board access uses individual Twenty accounts and server-side client scope. Telegram replies require administrator-controlled verified user-ID binding, recipient checks, deduplication, and revocation; retrying a notification must not create a new Codex turn. Telegram grants no board access. Keep the bot token server-side outside the Codex environment, Task/Journal payloads, repository, and analytics. Check sender, recipient, assignment, and current authority on every update/callback; reject stale and wrong-recipient replies.

### Failures and recovery

| ID | Failure | Mandatory outcome |
| --- | --- | --- |
| OPS-09 | Lost response to run creation/START/ASSIGN | Find run by runKey and persisted Codex thread/turn identity; read thread status/history and workspace artifacts; confirm the prior turn or WAITING/RECOVERY; repeated start is prohibited |
| OPS-10 | local network/API outage and worker restart | Recovery waits for connectivity; the buffer may be lost. Reconcile persistent history/artifacts, persist outcome or WAITING/RECOVERY; no new RPC |
| OPS-11 | RESULT not persisted | Deliver proven outcome and restore task/run relations; do not repeat work |
| OPS-12 | Codex App Server disconnect/session or process death | Uncertain outcome → reconciliation/RECOVERY; confirmed turn/process failure → FAILED/WAITING/ERROR; human decides retry |
| OPS-13 | Journal unavailable/corrupt | Block new tasks and Codex App Server commands; reconcile facts after recovery, request manual investigation on ambiguity |
| OPS-14 | API rate/quota failure | Jitter/backoff/Retry-After and pagination; no new turn or workflow storm |
| OPS-15 | Langfuse outage | Bounded export buffer/backoff, technical error without lifecycle changes; delivery from Twenty with the same IDs, incomplete trace marked |

A human recovery decision does not prove previous execution has stopped. Local logs and workflow history do not replace Journal. Preservation of every intermediate tool log during simultaneous outage and restart is not guaranteed.

### Analytics contract

`OPS-16`: trace metadata includes:

- taskId/projectId
- runId/runKey
- requestVersion
- workflowVersionId/protocolVersion
- repository/base commit/PR
- model/config
- template versions/hashes

Session groups task attempts; assignment spans retain agentKey/assignmentVersion/reason. The exporter saves SDK-valid traceId/URL in run and delivery checkpoints in Journal. Delivery does not trigger business workflows.

`OPS-17`: persist facts/decisions in Twenty before export. Native Twenty agents and Codex App Server model calls are not automatically instrumented. Prompt-to-generation linking and exact tokens/cost require a verified integration. ACCEPT/REWORK is a human decision; execution error is not that score. Allowed project inputs/outputs are sanitized for credentials.

`OPS-18`: client access is enabled only after the pinned Twenty plan/version proves individual login, administrator-controlled client membership, default-deny row-level permission on task and related records across UI/API/search, and denial of lifecycle/developer approvals. View filters do not qualify. Optional Telegram transport must bind numeric user IDs to private chats, enforce recipient/current-role checks on every update/callback, support revocation, deduplicate cross-channel replies, and keep bot tokens server-side outside Codex App Server/Journals/repositories/traces.

## 2. Compatibility gate and open decisions

Before implementation, record Twenty server/SDK/plan, Codex CLI/App Server release and generated protocol schema, authentication mode, and Langfuse SDK/API versions.

No Codex App Server compatibility evidence is transferred. The gate remains Not verified until the selected local stack is tested.

Validate:

- the private app
- three objects and Project
- relations/indexes/Upsert
- router response/profiles
- four workflows/Form/branches
- permissions/ingress/secrets
- Codex App Server sandbox/approval policy, workspace isolation, and secret boundaries
- client login and row-level isolation across UI/API/search; client INPUT answers through Twenty/Telegram; developer authorization through bound Telegram; bot-secret isolation; denial of cross-client/lifecycle actions
- concurrent Dispatch
- PENDING recovery
- Codex App Server invocation, questions/approval, continuation, cancellation, history, and shutdown/reconciliation interfaces
- GitHub rights/PR idempotency
- native UI
- quotas
- backup/restore

The source notes:

- alpha status for Skills & Agents
- flat structured responses
- Search Records limited to 200 results
- Logic Function limited to 900 seconds
- Schedule in UTC
- no assumed automatic retry of failed workflows

These claims have not been reverified here: determine capabilities/limits on the target version. Journal API must support pagination; long Codex App Server execution remains on the selected host. Also verify If/else support and permission enforcement in practice.

| Decision before implementation | Required record |
| --- | --- |
| Host / “remote server” | One local Docker host for Twenty and the Codex App Server bridge/runtime in the pilot; remote topology requires an explicit requirements change |
| Twenty workspace / local network | Schema, API URL, Compose network, authentication, and TLS across trust boundaries; SSH only if a remote topology is later approved |
| Protocol / serialization | Pinned Codex release/schema, event mapping, Dispatch guard, thread/turn identity mapping, same-run approval/continuation/cancel/restart, reconciliation, and acknowledgement mechanism |
| Project policies | Repository allowlist/baseRef, GitHub permissions, profiles/models, mandatory check commands |
| Security / operations | Secret storage/isolation, supervisor, backup/restore schedule, retention, and approved defaults |
| Langfuse | Cloud/self-host, URL/credentials/SDK, allowed data, stable IDs, and cost measurement completeness |

No concrete addresses, secrets, test commands, or API support are invented. The separate Twenty capabilities research does not automatically expand MVP scope.
