# План разработки Twenty app для минимального оркестратора

Версия: 1.1 · Дата: 1 ноября 2026 · Статус: объём MVP согласован; совместимость и реализация не проверены.

[PRD](PRD.ru.md) · [Реестр требований](requirements.ru.md) · [Модель и lifecycle](requirements/domain.ru.md) · [Протокол](requirements/protocol.ru.md) · [План локальной разработки](twenty-app-local-development-plan.ru.md)

## Цель и принцип объёма

Реализовать в существующем приватном Twenty app минимальный бизнес-контур, достаточный для одного оператора и одного worker: оператор создаёт Project и задачу, явно разрешает её запуск, worker получает устойчивую команду, сообщает подтверждённые факты, Twenty показывает результат и оператор принимает его либо разрешает новую попытку. Twenty остаётся владельцем бизнес-состояния и решений; Codex App Server и worker — исполнителями.

План намеренно выделяет **первый рабочий вертикальный срез** из полного PRD. Текущие REQ/SAI содержат расширенные функции (клиентский доступ, вопросы и approvals, handoff, отмена, полное автоматизированное восстановление и прочее); нельзя считать их все частью первого среза автоматически. Объём MVP уже согласован владельцем продукта; до начала разработки нужно отметить отложенные требования в реестре, не переписывая молча их нормативность.

## Делаем в первом рабочем срезе

- Один Twenty workspace, один Project на разрешённый GitHub repository/baseRef, один оператор и один worker, один активный run, `concurrency=1`.
- Три объекта оркестратора: `AiTask`, `AiRun`, `AiRunJournal`; расширяем существующий Project. Не создавать отдельный объект профиля или собственный журнал вне Twenty.
- Оператор вручную готовит задачу и явно выбирает действие «Передать оркестратору». Автосохранение не запускает исполнение.
- Один заранее настроенный профиль worker на старте (ключ и инструкция конфигурации worker); маршрутизация в Twenty не нужна для первого сценария.
- Один полный успешный путь: `TODO → READY → RUNNING → WAITING/REVIEW → DONE`; worker получает START, выполняет работу вне Twenty, сохраняет RESULT, оператор выполняет ACCEPT.
- Один подтверждённый путь ошибки: `WAITING/ERROR`, явное решение оператора о новой попытке с новым `runKey`; прежняя попытка и её журнал остаются.
- Durable COMMAND/EVENT Journal с уникальными ключами, проверкой повторной доставки и без автоматического повторного запуска при неизвестном результате.
- Нативные views/forms и штатные workflows Twenty; только минимальные поля и действия для сценария. Локальный приватный app, без marketplace.
- Успешный исход включает evidence обязательных проверок и draft PR; приёмка человеком всегда в Twenty.

## Не делаем в первом срезе

- Клиентские аккаунты, row-level client isolation, Kanban для клиентов или отдельный портал.
- Telegram и любые другие каналы ввода/уведомлений.
- Tool approval, вопросы INPUT во время исполнения и продолжение/возобновление Codex turn после ответа человека.
- AI-маршрутизатор, несколько профилей и handoff между специалистами.
- Автоматический retry, автоматическая приёмка, merge, release или deploy.
- Параллельные задачи, несколько worker/host/workspace, distributed locks или обещание exactly-once.
- Langfuse, cost dashboards, расширенные метрики и экспорт аналитики.
- Кастомный frontend, отдельный workflow engine, NestJS worker внутри Twenty app, прямой доступ к БД Twenty.
- Сложные проекты с несколькими репозиториями, матрица полномочий по ролям и production deployment.

Исключения временные, но требуют отдельного этапа и повторной проверки требований до включения. Согласованный первый срез включает draft PR, один вручную настроенный профиль и откладывает клиентский доступ, INPUT/APPROVAL, отмену, полное recovery/reconciliation, Telegram и Langfuse. Минимальная fail-safe реакция на неизвестный исход всё равно обязательна: блокировать новую работу и не повторять Codex execution автоматически; операторское восстановление остаётся ручным и ограниченным.

## Пошаговый план

### Этап 0. Зафиксировать MVP и проверить совместимость

- [x] Утвердить целевой вертикальный сценарий: ручная задача → один worker run → evidence и draft PR → ACCEPT или ручной retry после доказанной ошибки.
- [x] Включить draft PR в первый срез.
- [x] Ограничить первый срез одним вручную настроенным профилем Codex без маршрутизатора и handoff.
- [x] Отложить клиентский доступ, INPUT/APPROVAL, отмену, полное recovery/reconciliation, Telegram и Langfuse; сохранить блокировку при неизвестном исходе и запрет автоматического повторного запуска.
- [x] Сверить закреплённые версии Twenty server, App SDK/CLI, workspace plan и API; записать подтверждённые возможности и ограничения (план workspace и часть API-возможностей остались явными блокерами).
- [x] Проверить, что приложение подключено к правильному локальному workspace и изменения можно безопасно синхронизировать (remote подтверждён, read-only plan без изменений).
- [x] Сопоставить пункты раздела «Не делаем» с REQ/SAI и пометить их как отложенные для MVP в реестре, сохраняя полные требования для будущего расширения.
- [x] Утвердить статусы и минимальные поля согласно этому плану; операторские действия ограничены подачей, приёмкой и явным разрешением новой попытки.

**Готово, когда:** MVP и отложенные требования явно записаны; версия/план Twenty и необходимые API/UI возможности подтверждены или конкретные блокеры перечислены. Не начинать построение Workflows на предположении о неподтверждённой возможности.

**Результат проверки 1 ноября 2026:** локальные контейнеры server/worker используют `twentycrm/twenty:v2.54.0`; standalone CLI — 2.54.3, App SDK — 2.54.3, Node — 26.7.0 (удовлетворяет app engine `^24.5.0 || ^26.5.1`). App package задаёт `engines.twenty >=2.54.0`. CLI remote `autonomus-local` аутентифицирован browser login и указывает на `http://localhost:3000`, workspace `Demo`; сервер отвечает HTTP 200. Read-only `twenty app plan --remote autonomus-local --json` завершился успешно, diagnostics пусты, create/update/delete — 0. Это подтверждает текущую установку и отсутствие ожидающих изменений, но не тестирует API worker-контракт.

**Ограничения compatibility gate:** тариф/план workspace и entitlement-ограничения не удалось подтвердить; API-возможности связей, индексов, Upsert, permissions, workflows и worker ingress не проверены интеграционно. Codex App Server и все 28 SAI остаются Not verified. До построения workflows требуется проверить конкретные возможности на закреплённой версии и плане; неизвестные возможности считать блокерами, а не предполагать.

Отложенные для MVP требования и связанные критерии перечислены в [реестре требований](requirements.ru.md#статус-требований-для-mvp). Их полная нормативная формулировка сохранена для будущих этапов.

### Этап 1. Минимальная модель Project и доступа

**Предварительная инспекция 1 ноября 2026:** до текущего PR в app package не было Project object, а Twenty metadata lookup `project` вернул 0 объектов. Исходная default app-role имела широкие права на workspace records. В рамках текущего этапа в app source добавлен app-owned Project и роль функций приложения ограничена чтением Project; модель ещё не синхронизирована с workspace.

- [x] Осмотреть существующую модель Project и не создавать дубликат бизнес-объекта. Модель в workspace и app отсутствовала; в app source создан app-owned Project.
- [x] Добавить только поля, необходимые единственному worker: canonical `repositoryUrl`, `baseRef`, выключенный по умолчанию `executionEnabled`. Проверочные команды остаются в worker config, чтобы Project не мог задавать произвольные shell-команды.
- [x] Определить минимальные исходные роли: operator читает/обновляет Project; API-key role worker и application function role читают только Project. Права worker на Task/Run/Journal добавить после создания этих объектов.
- [x] На уровне схемы связать задачу с Project и не добавлять в AiTask поля repository/baseRef; чтение связанных значений worker через API ещё требует интеграционной проверки.
- [x] Не добавлять client scope и внешние роли клиента в первом срезе.

**Промежуточное подтверждение исходника 1 ноября 2026:** `twenty app typecheck` и `yarn lint` прошли. Read-only `twenty app plan --remote autonomus-local` выдал 68 create, 2 update, 0 delete/destructive и diagnostics 0. Из обновлений: ожидаемое ограничение существующей application role и новый checksum собранного компонента стартовой страницы; исходник UI не менялся. План не применялся. Поэтому отображение формы Project и фактический API-доступ ролей пока не проверены; завершение этапа ожидает отдельной синхронизации и проверки.

**Подтверждение 2 ноября 2026:** локальный `app-dev` watcher синхронизировал app. Read-only `twenty app plan --remote autonomus-local --json` завершился без ошибок: 0 ожидающих create/update/delete и diagnostics 0. В UI видны AI Tasks и список задач с Title/Status/Priority/Project; API-доступ worker по-прежнему требует интеграционной проверки.

**Готово, когда:** оператор видит и меняет разрешённую конфигурацию Project; задача не может указать произвольный репозиторий; worker может прочитать разрешённые данные через поддерживаемый API.

### Этап 2. Создать AiTask и операторский интерфейс

- [x] Создать `AiTask` с title, description, acceptanceCriteria, Project, owner, priority, status, requestVersion, resultSummary/resultUrl, waitingReason/error и readyAt; системные createdAt/updatedAt предоставляет Twenty. Связь activeRun добавляется вместе с AiRun в этапе 3.
- [x] Создать обязательные связи Project и owner; задать статусы, waitingReason, приоритеты и безопасные значения по умолчанию.
- [x] Создать нативные views «Мои задачи», «Все задачи» с группировкой по статусу и очередь READY; подробный кастомный UI не делать.
- [x] Добавить штатные действия `Передать оркестратору`, `Принять результат`, `Вернуть на доработку / разрешить повтор` через нативные ручные workflow Twenty. Состояние меняется только при вызове соответствующего workflow; отдельные поля-команды не создаются.
- [x] Сделать поле status недоступным для обычного редактирования UI; новые задачи получают TODO и не становятся READY от сохранения остальных полей.
- [x] Не добавлять в AiTask поля repository/baseRef или snapshot; snapshot появится у AiRun и будет реализован в этапах 3–4.

**Промежуточное подтверждение исходника 1 ноября 2026:** app package собран через Twenty CLI 2.54.3; `yarn typecheck` и `yarn lint` прошли. Read-only `twenty app plan --remote autonomus-local` выдал 116 create, 3 update, 0 delete/destructive и diagnostics 0. План не применялся. Relations, поля, роли и view definitions проверены планировщиком; вид в workspace и действия lifecycle не проверены. PR с исходниками ожидает review/merge.

**Подтверждение 2 ноября 2026:** `twenty app typecheck` и `yarn lint` прошли; watcher синхронизировал манифест, а последующий read-only план показал 0 ожидающих действий и diagnostics 0. В интерфейсе доступен список AI Tasks и создание записи. Переходы submit/accept/rework остаются за Workflows этапа 4; UI-поведение фильтров My/READY и доступ оператора к выбору owner требуют отдельной проверки.

**Подтверждение 4 ноября 2026:** в текущем локальном workspace вошли как `Stage 4 Operator` и открыли AI Task. На карточке видны три быстрых действия, закреплённых через штатные `MANUAL` triggers с доступностью `SINGLE_RECORD` и `isPinned`: `Передать оркестратору`, `Принять результат`, `Вернуть на доработку / разрешить повтор`. Это штатный action UI Twenty; отдельная custom Form не требуется, поскольку действия не собирают дополнительный ввод. Сохранение тестовой задачи оставило статус `TODO`; поле status запрещено для прямого редактирования. Логика переходов и проверки авторизованного оператора уже проверены при приемке этапа 4. Текущая проверка подтвердила доступность кнопок в карточке под учетной записью оператора.

**Готово, когда:** оператор проходит создание, явную подачу и просмотр задачи через стандартный UI; случайное сохранение полей не запускает worker.

### Этап 3. Создать AiRun и AiRunJournal

- [x] Создать `AiRun` со связью task, requestVersion, уникальным runKey, status, threadId/turnId, profile key, snapshot, итогом, evidence, PR URL/headCommit и временными полями.
- [x] Создать `AiRunJournal` с уникальным operationKey, runKey, связями task/run, direction/type/state, payload/result и timestamps.
- [x] Добавить уникальные индексы на runKey и operationKey.
- [x] Настроить роль Worker: чтение команд и создание/изменение Journal; без права обновления AiTask и AiRun. В Twenty `canUpdateObjectRecords` разрешает и create, и update, поэтому Worker технически может изменить любую Journal-запись, включая APPLIED.
- [x] Добавить snapshot, предназначенный для задачи/критериев, Project/repository/base commit, profile/policy и protocol/config references; не включать secrets, tool logs и локальные пути.
- [x] Интеграционно проверить create Journal от Worker, дубликат/конфликт operationKey, изменение APPLIED Journal и запрет изменения AiRun.

**Проверка 2 ноября 2026:** приложение синхронизировано в отдельный тестовый workspace Twenty 2.54.0 с временным ключом роли Orchestrator Worker. Проверка подтвердила: Worker создаёт Journal; уникальный operationKey отклоняет повтор и конфликт; прямой API-запрос Worker может изменить APPLIED Journal; Worker не может изменить AiRun. Это ограничение нативных permissions Twenty. Протокол приложения обязан сохранять payload и не переписывать APPLIED при обычной доставке, но ключ Worker является доверенным backend secret, а не изолированной границей безопасности. Записи AiTask/AiRun остаются защищены от обновления Worker.

**Готово, когда:** события можно связать с задачей, run и operationKey; Worker может их записывать; повтор обнаруживается; workflow/worker-контракт не повторяет действие. Ограничение записи APPLIED на уровне Twenty не заявляется.

### Этап 4. Реализовать минимальные Workflows Twenty

- [x] Ручные workflows SUBMIT/ACCEPT/REWORK проверяют, что вызвавший — участник роли Orchestrator Operator, и передают обновление состояния только через приложение.
- [x] Workflow Apply запускается на создании Journal, проверяет `taskId/runId/runKey/operationKey/requestVersion`, применяет `DISPATCH_REQUEST`, `STARTED`, `RESULT`, `ERROR`, `PR_CREATED` идемпотентно.
- [ ] Worker отправляет ровно один `DISPATCH_REQUEST` для READY-задачи и ждёт сохранённый START; затем не запрашивает другую задачу до подтверждённого терминального события текущего run. Один host/worker обеспечивается локальной блокировкой и конфигурацией singleton. Реализация worker относится к этапу 5; сейчас это зафиксированный протокольный контракт.
- [x] Dispatch проверяет READY, Project, обязательные поля и отсутствие другого activeRun; создаёт детерминированный `runKey=taskId:requestVersion`, AiRun и START/PENDING. Journal `run` nullable до создания AiRun.
- [x] Acceptance разрешает DONE только для последнего успешного результата с passing evidence, draft PR и headCommit; REWORK/повтор повышает requestVersion только действием Оператора.
- [x] Защитить от workflow recursion: Apply слушает только создание Journal; исходящие START, решения Оператора, ACK/heartbeat не запускают lifecycle-переходы.
- [x] Не строить отдельный backend workflow engine и не добавлять workflows для отложенных сценариев.

**Готово, когда:** lifecycle-переходы выполняются только штатными workflows, неверные и повторные события не меняют состояние, а ручная проверка сценариев проходит в целевом workspace.

**Решения и состояние реализации 2 ноября 2026:** принят доверенный Operator с записью Task/Run/Journal; право прямой записи этим человеком является известным ограничением permissions. Роль включает системное право `WORKFLOWS`; без него workflow-кнопки были видны, но вызов отклонялся с `Пользователь не имеет прав доступа.` Workflow logic functions используют application role с записью в Task/Run/Journal и сверяют членство инициатора через `currentUser.workspaceMember.roles`, не запрашивая список ролей workspace. Четыре workflow синхронизированы в основном `autonomus-local` и тестовом workspace (`twenty app apply`, по 11 файлов); read-only план не показал расхождений. От Local Admin действие отклонено с ожидаемым сообщением `Only an assigned Orchestrator Operator can run this action.`; состояние задачи не изменилось.

По подтверждению пользователя отправлено приглашение `stage4-operator@lvh.me` в тестовый workspace `localhost:3001`; участник принял его, и ему назначена роль Orchestrator Operator. Ручные действия в браузере выполнены в режиме имитации этого участника. SUBMIT создал READY-задачу версии 1; тестовые события `DISPATCH_REQUEST` и `ERROR` через Twenty API подтвердили создание одного AiRun, исходящего START, применение ERROR и очистку activeRun. REWORK завершился со статусом READY и версией 2. Затем тестовые DISPATCH_REQUEST/STARTED/RESULT создали успешный запуск с passing check, draft PR URL и headCommit; задача перешла в WAITING_REVIEW. Действие ACCEPT участника завершилось успешно: задача DONE, запись ACCEPT — APPLIED. В Journal нет повторных lifecycle-действий от исходящего START, что согласуется с защитой от рекурсии.

События worker в этих сценариях создавались вручную через admin API как тестовые входные события; реальный worker и его последовательное ожидание подтверждения не проверены и остаются этапом 5. Для локальных workflows в Compose включён `LOGIC_FUNCTION_TYPE=LOCAL`, контейнеры server/worker основного стека пересозданы с этим режимом. Typecheck/lint прошли ранее; изменения роли синхронизированы в обоих workspace. Финальный read-only `twenty app plan` в обоих workspace показал 0 ожидающих действий и diagnostics; `git diff --check` прошёл.

**Повторная проверка после чистой инициализации 2 ноября 2026:** пользователь выполнил `docker compose down -v` и `docker compose up -d --wait`. PostgreSQL последовательно выполнил init scripts `00`, `10`, `20`, `30`; `app-dev` зарегистрировал/синхронизировал приложение и подтвердил `Assigned Orchestrator Operator to stage4-operator@lvh.me`. API вернул workspace member и роль с ожидаемым universal identifier; `twenty app plan` показывает 0 действий и diagnostics. После входа во встроенном браузере основной workspace `localhost:3000` показывает четыре активных workflow: SUBMIT, ACCEPT, REWORK, Apply Journal event. Значит, workflow и пользователь/роль восстанавливаются из кода после удаления томов. Проверка UI выполнена на списке Workflows; повторные действия на вновь созданных данных в основном workspace не запускались.

### Этап 5. Согласовать контракт с worker и подключить минимальный цикл

- [x] Зафиксировать точные поля и payload `DISPATCH_REQUEST`/START/STARTED/RESULT/ERROR, operationKey/runKey, версии и ACK по реальной schema приложения; повтор запроса не должен создавать второй run.
- [x] Подтвердить, что worker читает только сохранённые разрешённые команды через поддерживаемый API Twenty; прямой SQL запрещён.
- [x] Проверить запуск одного разрешённого run и запись `STARTED` с threadId/turnId до применения RUNNING.
- [x] Проверить результат: worker сначала сохраняет evidence, summary, draft PR URL/headCommit, затем RESULT; Twenty переводит задачу в WAITING/REVIEW.
- [x] Проверить, что отсутствие ответа, disconnect или PENDING неизвестного исхода блокируют следующую задачу и не порождают новый Codex turn автоматически.
- [x] Проверить контролируемую ошибку и ручное разрешение новой попытки с новым runKey.

**Проверка API чтения, 4 ноября 2026:** `services/worker` читает через Twenty GraphQL только сохранённые `OUTBOUND / START / PENDING` записи Journal и валидирует протокол v1, ключи и snapshot. На изолированном Compose workspace `http://localhost:3001` временный API key с ролью Orchestrator Worker прочитал fixture START по `AiRunJournalFilterInput`; запрос с `INBOUND` fixture исключил. Затем собранный NestJS poller увидел ту же сохранённую команду. Fixture и временный key отозваны/удалены. Прямого SQL-клиента нет; Codex не запускался и новые Journal-записи worker не создавались. Не проверены pagination свыше 100 записей, ACK, рестарт и Codex App Server execution.

**Реализация запуска, 4 ноября 2026:** добавлен App Server клиент с протоколом, сгенерированным из Codex CLI `0.165.0`, проверкой версии и минимальным дочерним environment. Исполнение по умолчанию выключено; при включении проверяются repository URL, base ref, чистота Git workspace и его origin/branch. Перед `turn/start` worker сохраняет `THREAD_CREATED` и threadId в исходной START-записи; после получения turnId создаёт `STARTED`. Turn ограничен writable root workspace и выключенным network access. Сборка TypeScript проходит.

**E2E-проверка STARTED, 4 ноября 2026:** в изолированном workspace `http://localhost:3001` Operator подал fixture-задачу; worker с временным ключом роли Orchestrator Worker прочитал только сохранённую START, создал Codex thread/turn и записал `STARTED` с обоими идентификаторами. Twenty применил событие: Journal стал `APPLIED`, а AiRun и задача перешли в `RUNNING`; Codex turn завершился. Для проверки использовался чистый временный Git workspace с разрешённым repository URL. Временный ключ отозван, временный workspace и fixture-записи удалены. Для вызова Twenty logic function из контейнера worker потребовался тестовый Compose override `SERVER_URL=http://server:3000`: `localhost:3000` внутри worker указывал на сам worker. Основной workspace на `localhost:3000` не затрагивался. E2E-проверка RESULT ещё не выполнена; recovery и повтор после неизвестного исхода также остаются незавершёнными.

**Реализация RESULT, 4 ноября 2026:** worker собирает финальный ответ App Server, запускает `lint`, `typecheck`, `test:unit` app package и `build` worker package, создаёт детерминированную ветку и draft PR, затем сохраняет RESULT в Journal и ждёт его применения. Неизвестный исход push/PR оставляет run заблокированным без автоматического ERROR или повтора. Пользователь выбрал package scripts репозитория; app lint/typecheck/unit и worker build прошли локально. Payload сравнивается без зависимости от порядка JSON-ключей.

**E2E dispatcher и RESULT, 4 ноября 2026:** в `localhost:3001` Operator подал задачу; worker сам создал один `DISPATCH_REQUEST`, дождался workflow-созданной START, запустил Codex и сохранил STARTED. Codex изменил README; четыре package checks прошли, после чего worker сделал commit. Первый `git push` получил GitHub HTTP 500; worker оставил run заблокированным и не отправил RESULT или ERROR. Read-only проверка подтвердила отсутствие remote branch и PR. Для завершения этого неизвестного исхода вручную повторно отправили тот же commit, создали draft [PR #14](https://github.com/anatolyshipitsyn/twenty-autonomus-company/pull/14), который позднее закрыли без слияния, и записали совпадающий RESULT с Worker-role API key. Workflow применил Journal `APPLIED`, сохранил AiRun `SUCCEEDED`, Task `WAITING_REVIEW`, summary, checks, PR URL и headCommit; UI и API подтвердили значения. Повторная доставка того же payload через `TwentyApiClient.recordResult` завершилась идемпотентно с `APPLIED`. Временные API keys отозваны; неиспользуемый Project удалён. Полностью автоматический успешный путь от завершения Codex до отправки RESULT ещё не доказан, поскольку первый запуск потребовал ручной сверки и продолжения после GitHub 500.

**E2E неизвестного исхода и блокировки очереди, 4 ноября 2026:** на изолированном `http://localhost:3001` Operator workflow подал две задачи с requestVersion 1. Worker с ролью Orchestrator Worker создал `DISPATCH_REQUEST` только для первой задачи `4f1838a2-447e-4101-9ef3-2833fde07c44`, запустил fake App Server, сохранил `STARTED` (`thread-unknown-fixture` / `turn-unknown-fixture`), после чего сервер оборвал соединение до `turn/completed`. Twenty применил STARTED; AiRun `895a0c5f-e90b-4f20-9291-765a8fb8a773` и первая задача остались `RUNNING`. Для второй задачи `8eaf5663-4eac-4390-a903-952d9c671c96` Operator workflow подтвердил `READY`, requestVersion 1, `activeRunId=null`. Worker остановили и запустили заново, пока вторая задача оставалась READY; active-run query увидел первый AiRun и не перешёл к новой задаче. API-сверка подтвердила один AiRun и только DISPATCH_REQUEST/STARTED для первой задачи; для второй не было ни run, ни Journal, а fake App Server счётчик turn остался равен 1. Для первого run не появились ERROR или RESULT. Временный API key удалён из списка активных ключей; процессы тестового worker и временный HTTP server остановлены, временный Git workspace и локальный key-файл удалены. Проверен именно disconnect после STARTED; Twenty сохраняет run как RUNNING, а не UNKNOWN. Неподтверждённый ответ `turn/start` и timeout обрабатываются как `UnknownCodexOutcomeError` в коде; отдельный E2E для PENDING и реального Codex App Server не выполнялся.

**E2E контролируемой ошибки и ручного повтора, 4 ноября 2026:** на изолированном `http://localhost:3001` fixture-задача `aace4006-ba5f-4cc9-945b-6ddae0be542b` прошла операторский SUBMIT. Workflow применил `DISPATCH_REQUEST` и создал AiRun `b10b0f62-c9d6-4ae1-a777-3ceae50807f8` версии 1 с `runKey=aace4006-ba5f-4cc9-945b-6ddae0be542b:1`. Входной `ERROR` с `protocolVersion=1` и `requestVersion=1` применён как `APPLIED`: AiRun стал `ERROR`, задача — `ERROR`, `activeRunId` очистился, `waitingReason=WORKER_ERROR`. Пользователь `stage4-operator@lvh.me` с ролью Orchestrator Operator вручную запустил workflow «Вернуть на доработку / разрешить повтор» из карточки задачи; Journal `REWORK` стал `APPLIED`, `requestVersion` вырос до 2, задача вернулась в `READY`, а ошибка и waitingReason очистились. Следующий `DISPATCH_REQUEST` версии 2 создал отдельный AiRun `b483099a-c7c9-4f93-b20e-e2f054a72d38` с `runKey=aace4006-ba5f-4cc9-945b-6ddae0be542b:2`, сохранив первый run терминальным `ERROR`; для второго run созданы `START/PENDING` и активная связь с задачей. Входные fixture Journal создавались локальным Admin API (ключ Worker из `.env` не подходил к тестовому workspace); прямой SQL не использовался. Исполнение Codex было выключено, поэтому проверен lifecycle и создание нового ключа, но не фактический запуск второй попытки worker. После сверки fixture Task, обоих AiRun, Journal и временных Project удалили из тестового workspace; API-проверка подтвердила отсутствие этих записей.

**Полный успешный E2E результата, 4 ноября 2026:** на изолированном `http://localhost:3001` worker продолжил `PENDING` run задачи `186e6bf8-8be8-44f7-90ff-bea7bd48a05a` после восстановления разрешённого repository URL. Он опубликовал draft [PR #16](https://github.com/anatolyshipitsyn/twenty-autonomus-company/pull/16) с headCommit `b179b46d12827b712ebc3efbec97034cfa3c99da`. Наблюдалось промежуточное состояние: `PR_CREATED` — `APPLIED`, AiRun оставался `RUNNING`, в то время как `RESULT` ещё отсутствовал; в AiRun уже совпадали summary, evidence, PR URL и headCommit из checkpoint. Затем `RESULT` также стал `APPLIED`, AiRun — `SUCCEEDED`, а задача — `WAITING_REVIEW`. Evidence содержит успешные app lint, app typecheck, app unit tests и worker build. Draft PR подтверждён как открытый draft с тем же headCommit; временный Worker API key отозван.

**Изолированный workspace:** app sync потребовал внутренний `SERVER_URL=http://localhost:3000`, чтобы signed upload URL был достижим из общей network namespace `server/app-dev`; опубликованный host port остаётся `3001`. В этом workspace `twenty app plan` показал 436 create, 0 update/delete, затем приложение синхронизировалось; diagnostics 0.

**Готово, когда:** end-to-end от явной подачи до принятого результата проходит на локальном окружении, а доказанные ошибки/неопределённые исходы не приводят к незаметному повтору.

### Этап 6. Закрыть MVP-приёмку и оформить следующий объём

- [ ] Пройти применимые SAI для модели, разрешения, уникальных ключей, основного lifecycle, результата, приёмки, worker singleton и неизвестного исхода; записать evidence/Not verified.
- [ ] Проверить доступы operator/worker и негативно подтвердить отсутствие доступа к чужим/неназначенным данным в пределах однопользовательского MVP.
- [ ] Выполнить согласованные lint/typecheck и `twenty app apply` по правилам app skill; затем сверить схему и UI в workspace.
- [ ] Обновить README/SETUP отдельного app-пакета только командами и настройками без секретов.
- [ ] Зафиксировать отложенные функции как следующий backlog: recovery/отмена, INPUT/APPROVAL, handoff, клиентская изоляция, Telegram, многопрофильность, Langfuse и расширенные SAI.
- [ ] До включения любого отложенного пункта повторить compatibility/security gate и определить его критерии приёмки.

**Готово, когда:** каждый применимый критерий имеет наблюдаемое evidence или явно отмечен как непроверенный; app синхронизирован в нужный workspace; следующий этап не расширен без отдельного решения.

## Контрольный сквозной сценарий

1. Оператор создаёт задачу с Project, инструкцией и критериями; сохраняет её как TODO.
2. Явное действие разрешает запуск и переводит задачу в READY ровно один раз.
3. Dispatch создаёт единственный AiRun и START/PENDING с новым стабильным ключом.
4. Worker подтверждает STARTED; workflow применяет RUNNING.
5. Worker завершает работу, сохраняет результат, evidence обязательных проверок и draft PR, затем отправляет RESULT.
6. Workflow переводит задачу в WAITING/REVIEW; оператор просматривает результат и принимает его → DONE.
7. При подтверждённой ошибке оператор видит ERROR и явно решает, нужен ли новый run; при неизвестном исходе очередь блокируется до reconciliation.

## Зафиксированные решения владельца продукта

- Draft PR обязателен в первом вертикальном срезе.
- Используется один вручную настроенный профиль Codex; маршрутизатор и handoff отложены.
- Клиентский доступ, INPUT/APPROVAL, отмена, полное recovery/reconciliation, Telegram и Langfuse отложены.
- Неизвестный исход блокирует очередь и не разрешает автоматический повтор; ручная безопасная процедура сверки/recovery должна быть определена как эксплуатационная инструкция до пилота, даже если автоматизация recovery отложена.
