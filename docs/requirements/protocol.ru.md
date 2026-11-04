# Workflows и протокол исполнения

Версия: 1.8 · Дата: 4 ноября 2026 · Статус: контракт Journal для этапа 5; worker ещё не реализован/проверен.

[English version](protocol.md) · [Все требования](../requirements.ru.md) · [PRD](../PRD.ru.md)

## 1. Workflow и протокол

### Процессы MVP

| ID | Workflow / триггер | Обязанность |
| --- | --- | --- |
| PROTO-01 | Operator actions / три ручных триггера на одной записи | SUBMIT, ACCEPT и REWORK проверяют членство вызвавшего в Orchestrator Operator; права на изменение записи сами по себе не заменяют эту проверку |
| PROTO-02 | Apply Journal event / новый DISPATCH_REQUEST | Единственный Worker выбирает одну READY-задачу, создаёт запрос и ждёт START; workflow проверяет задачу и Project, отсутствие другого activeRun, затем создаёт snapshot, AiRun и START |
| PROTO-03 | Apply Journal event / новое событие Worker | Идемпотентно применяет STARTED/RESULT/ERROR/PR_CREATED; heartbeat/ACK и операторские решения не запускают lifecycle-переходы |
| PROTO-04 | Recovery monitor / Schedule | Отложено; проверка прогресса, RECONCILE при reconnect и WAITING/RECOVERY при неизвестном исходе |

Dispatch запускается одиночным worker poller, не расписанием Twenty. Worker не подаёт следующую заявку до подтверждённого результата текущей; неизвестный исход оставляет очередь заблокированной. Recovery monitor остаётся отдельным scheduled workflow будущего объёма.

#### Контракт Journal v1 (schema приложения `autonomus-company` 0.1.0, Twenty SDK 2.54.3)

Используются реальные поля `AiRunJournal`: `taskId` (обязательная связь), `runId` (nullable связь), `runKey`, `operationKey`, `direction` (`INBOUND`/`OUTBOUND`), `eventType`, `state` (`PENDING`/`APPLIED`/`REJECTED`/`FAILED`), `payload` (RAW_JSON), `result` (RAW_JSON), `receivedAt`, `appliedAt`. `AiRun` содержит `taskId`, `requestVersion`, `runKey`, `status`, `snapshot`, `threadId`, `turnId`, `resultSummary`, `evidence`, `prUrl`, `headCommit`, `startedAt`, `finishedAt`. Версия данных задачи — `AiTask.requestVersion`; версия протокола — это версия данного контракта (`protocolVersion: 1` внутри каждого payload). Поле `protocolVersion` не отдельная колонка.

| Запись | Направление / ключ | Обязательные поля | Payload |
| --- | --- | --- | --- |
| Запрос `DISPATCH_REQUEST` | `INBOUND`, `operationKey=<runKey>:DISPATCH_REQUEST`, `runKey=<taskId>:<requestVersion>`, `taskId`, `runId=null`, `state=PENDING` | `taskId`, `runKey`, `operationKey`, `direction`, `eventType`, `state`, `receivedAt` | `{protocolVersion:1, requestVersion}` |
| Команда `START` | `OUTBOUND`, `operationKey=<runKey>:START`, те же `taskId`, `runId`, `runKey`, `state=PENDING` | те же базовые поля; `runId` указывает на созданный AiRun | `{protocolVersion:1, requestVersion, snapshot}`; snapshot копируется из `AiRun.snapshot` |
| Событие `STARTED` | `INBOUND`, `operationKey=<runKey>:STARTED`, те же три ID/ключа, `state=PENDING` | базовые поля, `runId` обязателен | `{protocolVersion:1, requestVersion, threadId, turnId}`; оба ID — непустые строки |
| Checkpoint `PR_CREATED` | `INBOUND`, `operationKey=<runKey>:PR_CREATED`, те же три ID/ключа, `state=PENDING` | базовые поля, `runId` обязателен | `{protocolVersion:1, requestVersion, resultSummary, evidence, prUrl, headCommit}`; требует непустую сводку, `evidence.draftPr=true`, непустые успешные проверки, GitHub PR URL и SHA коммита; Twenty сначала сохраняет полный bundle в активной `AiRun` |
| Событие `RESULT` | `INBOUND`, `operationKey=<runKey>:RESULT`, те же три ID/ключа, `state=PENDING` | базовые поля, `runId` обязателен | `{protocolVersion:1, requestVersion, resultSummary, evidence, prUrl?, headCommit?}`; `evidence.draftPr=true`, `evidence.checks` — непустой массив, каждый элемент имеет `passed=true`; payload должен совпадать с bundle из `PR_CREATED`, `prUrl`/`headCommit` разрешено опустить, поскольку они уже сохранены |
| Событие `ERROR` | `INBOUND`, `operationKey=<runKey>:ERROR`, те же три ID/ключа, `state=PENDING` | базовые поля, `runId` обязателен | `{protocolVersion:1, requestVersion, message}`; непустое сообщение Worker, сохраняемое в пределах 4000 символов |

`runKey` детерминирован: `<taskId>:<requestVersion>`. `requestVersion` — целое число, равное актуальному `AiTask.requestVersion`; новый run появляется только после операторского изменения задачи, увеличивающего эту версию. У каждого вида сообщения свой стабильный `operationKey`; повторная доставка использует тот же ключ и те же поля/payload. Неизменяемость payload после первой записи обязательна по протоколу. `ERROR.message` обязателен; приложение сохраняет не более 4000 символов.

**ACK:** отдельная строка `eventType=ACK` не создаётся: у schema нет отдельного ACK code/status поля. Worker подтверждает чтение команды её сохранённым состоянием и `result`. Обработчик завершает входную запись как `APPLIED` или `REJECTED` и сохраняет JSON в `result`; для `DISPATCH_REQUEST` успешный ACK имеет форму `{runKey, runId, startOperationKey}`, отказ — `{reason, ...diagnostic fields}`. Применение Worker-события отвечает `{applied, runKey}` либо `{reason}`. `FAILED`/оставшийся `PENDING` не являются успешным ACK; после сетевой ошибки Worker перечитывает ту же запись по `operationKey` и не отправляет новую команду/событие с другим ключом.

Повтор `DISPATCH_REQUEST` сначала разрешается по существующему `runKey`. Уникальный индекс `AiRun.runKey` служит последним барьером при одновременной доставке; уникальный `AiRunJournal.operationKey` дедуплицирует повтор той же заявки. При неизвестном результате create Worker/workflow перечитывает запись и Run по прежним ключам. Новый `AiRun` нельзя создавать с новым `runKey` для повтора этой заявки. Эти правила соответствуют текущему обработчику `applyDispatchRequest`; реальная интеграционная проверка Stage 5 ещё нужна.

### Операции Journal

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

`PROTO-05`: PENDING означает неподтверждённую команду/необработанное событие; APPLIED означает исполненную команду/применённое событие. ACK включает resultCode OK/ERROR/REJECTED; PENDING после сетевой ошибки является неизвестным исходом. operationKey стабилен при доставке; task/runKey/assignmentVersion/questionId/handoffId проверяются по применимости. Неверная версия или конфликтующий payload отклоняется с сохранением диагностики.

Сверка и повтор PUBLISH_PR:

1. Повторная доставка APPLIED возвращает сохранённый исход; команда не исполняется заново, подтверждение не меняется.
2. Для PENDING с неизвестным исходом GitHub сверить существующую попытку и найти PR по repository/base/head. Если найден, доставить PR_CREATED/RESULT без нового PR. Если поиск не доказывает исход, операция остаётся неопределённой; новая попытка запрещена.
3. Только после сохранения подтверждённой ошибки как APPLIED/ERROR Operator action может разрешить новую попытку команды. Одно операторское действие создаёт один новый operationKey и сохраняет publicationKey/retryOfOperationKey. Повторные подачи используют ту же попытку.
4. Перед публикацией новой попытки снова искать существующий PR. Сохранить runKey, requestVersion, repository/base/head и уже подготовленные изменения; сохранить известный headCommit. Не запускать второе исполнение Codex App Server, не выполнять изменения заново и не сбрасывать бюджет run.
5. Сохранять намерение и подтверждение новой попытки отдельно от прежней команды. Workflow применяет подтверждённый исход публикации к тем же AI Run / AI Task; повтор не создаёт новый инженерный run.

`PROTO-06`: Codex App Server adapter-контракт (предложение; проверить на закреплённой версии Codex):

- Запускать локальный child process `codex app-server` через stdio. Один раз инициализировать каждое соединение, затем использовать TypeScript/JSON schema, сгенерированную для закреплённой версии. Экспериментальный удалённый WebSocket listener в пилоте не используется.
- Сопоставлять Twenty `runKey` одному сохранённому Codex `threadId`, каждому разрешённому назначению — `turnId`; сохранять JSON-RPC request ID, operation keys и event checkpoints в Journal. Runtime identities не разрешают бизнес-переходы.
- Использовать только поддержанные thread/turn methods и notifications. Зафиксировать точные method/schema для thread start/resume, turn start/interrupt, approval request/response и чтения истории. Не считать, что resume thread возобновляет прерванный turn или что доставка RPC exactly-once.
- Обрабатывать App Server approval как server-initiated JSON-RPC request: до показа человеку сохранить request ID, thread/turn/item identity, точное действие и policy version; ответить на этот request ID только после долговечного сохранения разрешённого решения Twenty. Очищенный или завершённый request не разрешает последующее действие.
- До каждого запроса, меняющего исполнение, сохранять CHECKPOINT intent. При потере ответа читать состояние/историю того же thread и проверять workspace artifacts. Если исход остаётся неоднозначным, оставить PENDING, заблокировать очередь в RECOVERY и не отправлять новый turn автоматически.
- Подтверждённые App Server notifications и итоговые item states отображать на существующие `EVENT` Journal. Journal остаётся единственным долговечным источником команд/событий и источником lifecycle updates Twenty.
- NestJS worker обеспечивает один активный run и последовательные профили специалистов. Handoff запускается только после подтверждения окончания предыдущего turn и его tools.

`PROTO-07`: компоненты NestJS (предложение):

- TwentyClient (pagination/timeouts)
- CommandExecutor (последовательные команды)
- CodexAppServerClient (stdio lifecycle, JSON-RPC correlation, schema validation, event stream)
- CodexRunAdapter (mapping thread/turn/approval/reconciliation; закреплённый interface)
- WorkspaceService
- AgentExecutor
- GitHubPublisher
- RunJournal
- LangfuseExporter

Они не содержат собственный business workflow engine. Polling scheduler не заменяет блокировку пересечения итераций. Core API обслуживает записи, Metadata API — первоначальную настройку; маршруты и фильтры получают из целевой schema.


`PROTO-08`: клиент отвечает через штатную Twenty Form action либо дополнительный Telegram transport. Worker проверяет Twenty session или Telegram user с ролью клиента/разработчика, привязанный администратором, получает actor/client scope/authority, проверяет Project/client relation, адресата, тип бизнес-вопроса INPUT, версии task/run/question/request/assignment и нерешённое состояние. Оба канала дедуплицируются по одному question; до ответа на активный Codex approval request или отдельного разрешённого continuation сохраняется одно событие Journal. Не считать, что завершённый или прерванный turn можно продолжить на месте. Первый валидный ответ принимается; устаревшие, повторные, чужие ответы и отозванная привязка отклоняются. Клиентская identity отправляет только INPUT; APPROVAL allow/deny принимает только авторизованный разработчик с актуальными полномочиями. Ответ клиента не меняет lifecycle и не разрешает исполнение. Общий API key клиентам не выдаётся.
