# Эксплуатация, восстановление и аналитика

Версия: 1.6 · Дата: 1 ноября 2026 · Статус: предлагаемый дизайн NestJS/Codex App Server/local Docker; Не проверено.

[English version](operations.md) · [Все требования](../requirements.ru.md) · [PRD](../PRD.ru.md)

## 1. Эксплуатационные требования

### Настраиваемые defaults

| ID | Параметр | Предлагаемое значение / смысл |
| --- | --- | --- |
| OPS-01 | concurrency | 1; обязательная граница MVP |
| OPS-02 | command poll / heartbeat | 10 / 30 секунд; значения до утверждения config |
| OPS-03 | потеря связи | Heartbeat старше 90 секунд; только индикатор, не доказательство остановки |
| OPS-04 | Dispatch / Recovery / progress apply | 1 минута / 1 минута / не чаще 1 раза в минуту |
| OPS-05 | run active budget | 60 минут; START payload задаёт бюджет, WAITING человека исключается лишь при подтверждении |
| OPS-06 | graceful shutdown | До 30 секунд на запрос остановки через закреплённый Codex App Server interface и подтверждение завершения execution/tools; недоказанная остановка блокирует очередь |
| OPS-07 | retention | Предлагаемый срок технической очистки — 30 дней для terminal run после доставки результата; защита приёмки/экспорта и минимум аудита ниже имеют приоритет. Расписание и backup настраивает администратор. |

Это проектные значения, не SLA. Изменения согласуются с конфигурацией проверок, включая SAI-09.

Правила retention по OPS-07:

- Default 30 дней применяется к удаляемым техническим данным, например подробным tool logs и файлам workspace. Это не срок удаления AI Run, истории задачи или минимума аудита в Journal.
- Очистка требует terminal run и подтверждённой доставки результата. Удалять только данные, которые больше не нужны для приёмки, восстановления, ожидающей публикации или экспорта аналитики; одного возраста недостаточно.
- Пока задача находится в WAITING/REVIEW, сохранять evidence для проверки успешного run и PR и выполнения ACCEPT/REWORK. Run SUCCEEDED терминален, но приёмка ещё ожидается.
- До подтверждённой доставки Langfuse сохранять все необходимые факты, решения и checkpoints ожидающего экспорта. Отказ Langfuse продлевает защиту данных без блокировки исполнения или человеческой приёмки.
- Сохранять доступный для запросов минимум аудита в существующих AI Run / Journal Twenty для каждой попытки задачи, включая FAILED/CANCELLED, пока хранится история задачи. Это сохраняет возможность поздних решений приёмки и атрибуции стоимости/версий; новый объект или сервис не требуется.
- Минимум аудита включает идентичность/status run и связь с task, snapshot/version references, историю назначений, результаты checks, summary/PR/headCommit, решения/reasons/timestamps приёмки, active-time и доступные факты cost/tokens, идентичность/исходы операций и идентичность/checkpoints экспорта. Сохранять payload, нужный для восстановления ожидающей доставки.
- Backup или недоступный архив не заменяют этот минимум для запросов. Техническая очистка должна сохранять операторские действия, идемпотентность и метрики после очистки и backup/restore.
- Удаление бизнес-истории задачи и её минимума аудита требует отдельной явно заданной retention policy. Default технической очистки 30 дней не разрешает такое удаление.

### Локальная сеть, secrets и изоляция runtime

`OPS-08`: в локальном Docker-пилоте сервисы взаимодействуют через Compose network, а bridge аутентифицируется в Twenty через поддерживаемый API. Интерфейсы разработки привязать к loopback; runtime, database и admin endpoints не публиковать наружу. SSH forwarding рассматривается только для будущей удалённой топологии Twenty и не требуется для локальной Compose-сети. При пересечении host/network boundary сохранять проверку TLS.

Worker запускает Codex App Server как локальный child process в разрешённом workspace. Настроить и проверить наиболее ограниченную sandbox/approval policy закреплённой версии; не использовать unrestricted host access в пилоте. Хранить Twenty, GitHub, SSH, Langfuse и Docker/admin credentials вне environment Codex и workspace агента, если они не нужны для явно ограниченной операции. Негативными проверками доказать границы filesystem, shell и network. Это блокирующий compatibility/security gate.

Доступ к доске — через личную учётную запись Twenty и серверный client scope. Telegram ответы требуют управляемой администратором привязки verified user ID, проверки адресата, дедупликации и отзыва привязки; повтор уведомления не создаёт новый Codex turn. Telegram не даёт доступ к доске. Bot token хранится на сервере вне environment Codex, Task/Journal payloads, repository и analytics. Проверять отправителя, адресата, назначение и текущие права для каждого update/callback; stale и чужие ответы отклонять.

### Сбои и восстановление

| ID | Сбой | Обязательный исход |
| --- | --- | --- |
| OPS-09 | Потерян ответ run creation/START/ASSIGN | Найти run по runKey и сохранённым Codex thread/turn identity; прочитать status/history thread и workspace artifacts; подтвердить прежний turn либо WAITING/RECOVERY; повторный start запрещён |
| OPS-10 | local network/API outage и restart worker | До подключения восстановление отложено; buffer мог исчезнуть. Сверить persistent history/artifacts, записать итог либо WAITING/RECOVERY; новые RPC запрещены |
| OPS-11 | RESULT не сохранился | Доставить доказанный исход, восстановить связи task/run; работу не повторять |
| OPS-12 | Codex App Server disconnect/session или process death | Неясный исход → reconciliation/RECOVERY; подтверждённый сбой turn/process → FAILED/WAITING/ERROR; повтор решает человек |
| OPS-13 | Journal недоступен/повреждён | Блокировать новые задачи и команды Codex App Server; после восстановления сверить факты, при неоднозначности — ручной разбор |
| OPS-14 | API rate/quota failure | Jitter/backoff/Retry-After и pagination; нет нового turn и workflow storm |
| OPS-15 | Langfuse outage | Ограниченный export buffer/backoff, техническая ошибка без изменения lifecycle; доставка из Twenty с прежними IDs, incomplete trace отмечен |

Решение оператора о восстановлении не доказывает остановку прежнего исполнения. Локальные логи и workflow history не заменяют Journal. Сохранение всех промежуточных tool logs при одновременном outage и restart не гарантируется.

### Аналитический контракт

`OPS-16`: trace metadata включает:

- taskId/projectId
- runId/runKey
- requestVersion
- workflowVersionId/protocolVersion
- repository/base commit/PR
- model/config
- template versions/hashes

Session группирует attempts задачи; assignment spans сохраняют agentKey/assignmentVersion/reason. Экспортер сохраняет валидные SDK traceId/URL в run и checkpoints доставки в Journal. Доставка не запускает бизнес-workflow.

`OPS-17`: сначала сохранить facts/decisions в Twenty, потом экспортировать. Native агенты Twenty и model calls Codex App Server не считаются автоматически инструментированными. Привязка prompt к generation и точные tokens/cost требуют проверенной интеграции. ACCEPT/REWORK — решение человека, execution error не является таким score. Разрешённые project inputs/outputs очищаются от credentials.

`OPS-18`: клиентский доступ включается только после проверки закреплённых плана/версии Twenty: индивидуальный login, назначение client membership администратором, default-deny row-level права на задачи и связанные записи через UI/API/search и запрет lifecycle/developer approval. Фильтр представления не считается защитой. Telegram transport должен привязывать numeric user ID к private chat, проверять адресата/актуальную роль на каждом update/callback, поддерживать отзыв привязки, дедуплицировать ответы каналов и хранить bot token только на сервере вне Codex App Server/Journal/repository/traces.

## 2. Compatibility gate и открытые решения

До реализации зафиксировать версии Twenty server/SDK/plan, Codex CLI/App Server release и generated protocol schema, authentication mode и Langfuse SDK/API.

Доказательства совместимости Codex App Server не перенесены. Gate остаётся Not verified до проверки выбранного локального стека.

Проверить:

- приватный app
- три объекта и Project
- relations/indexes/Upsert
- router response/profiles
- четыре workflows/Form/ветки
- permissions/ingress/secrets
- Sandbox/approval policy Codex App Server, изоляция workspace и границы secrets
- клиентский login и row-level изоляция UI/API/search; клиентские INPUT-ответы через Twenty/Telegram; developer authorization через привязанный Telegram; изоляция bot secret; запрет cross-client/lifecycle действий
- конкурентный Dispatch
- PENDING recovery
- Codex App Server invocation, вопросы/approval, продолжение, отмена, history и shutdown/reconciliation interfaces
- GitHub rights/PR idempotency
- native UI
- quotas
- backup/restore

В исходнике отмечены:

- alpha-статус Skills & Agents
- плоский structured response
- Search Records до 200 результатов
- Logic Function до 900 секунд
- Schedule в UTC
- отсутствие предполагаемого автоматического retry failed workflow

Эти сведения не перепроверены здесь: совместимость/лимиты устанавливаются на целевой версии. Journal API должен поддерживать pagination; долгое Codex App Server execution остаётся на выбранном host. If/else и enforcement permissions также проверяются фактически.

| Решение перед реализацией | Требуемая фиксация |
| --- | --- |
| Host / «remote server» | Один local Docker host для Twenty и Codex App Server bridge/runtime в пилоте; remote topology требует явного изменения требований |
| Twenty workspace / local network | Схема, API URL, Compose network, authentication и TLS на границах доверия; SSH только при отдельном решении об удалённой топологии |
| Protocol / serialization | Закреплённые версии, event schemas, Dispatch guard, Codex App Server identity mapping, продолжение/отмена/рестарт того же run, сверка ledger и поддерживаемое подтверждение |
| Project policies | Repository allowlist/baseRef, доступы GitHub, профили/models, обязательные команды проверок |
| Security / operations | Secret storage/изоляция, supervisor, backup/restore schedule, retention и утверждённые defaults |
| Langfuse | Cloud/self-host, URL/credentials/SDK, разрешённые данные, стабильные IDs, полнота измерения cost |

Конкретные адреса, secrets, команды тестов и поддержка API не выдуманы. Исследование возможностей Twenty из другого документа не расширяет объём MVP автоматически.
