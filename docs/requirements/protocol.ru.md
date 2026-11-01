# Workflows и протокол исполнения

Версия: 1.6 · Дата: 1 ноября 2026 · Статус: предлагаемый NestJS/Codex App Server adapter-контракт; Не проверено.

[English version](protocol.md) · [Все требования](../requirements.ru.md) · [PRD](../PRD.ru.md)

## 1. Workflow и протокол

### Четыре процесса

| ID | Workflow / триггер | Обязанность |
| --- | --- | --- |
| PROTO-01 | Operator action / Single manual trigger + Form | Все операторские действия, permissions и корреляция; одна версия разрешения на ключ действия |
| PROTO-02 | Dispatch / Schedule | READY без activeRun, свободный worker, Project validation, маршрутизатор, snapshot, run и START; сериализованный Dispatch |
| PROTO-03 | Apply worker event / новый бизнес-EVENT Journal | Идемпотентное применение STARTED/QUESTION/ASSIGNED/RESULT, маршрутизация HANDOFF_REQUEST → ASSIGN, WORK_COMPLETED → PUBLISH_PR, PR_CREATED и итог |
| PROTO-04 | Recovery monitor / Schedule | Последняя связь/прогресс, повторное применение сохранённых фактов, RECONCILE при reconnect и WAITING/RECOVERY при неизвестном исходе |

Schedule defaults — раз в минуту; timezone расписания проверяется в compatibility gate. Heartbeat/APPLIED и технический экспорт не запускают бизнес-циклы.

### Операции Journal

**COMMAND**

- `START`
- `RESUME`
- `ASSIGN`
- `PUBLISH_PR`
- `CANCEL`
- `RECONCILE`

**EVENT**

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
