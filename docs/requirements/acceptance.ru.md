# Приёмка пилота

Версия: 1.6 · Дата: 1 ноября 2026 · Статус: Не проверено для NestJS/Codex App Server runtime.

[English version](acceptance.md) · [Все требования](../requirements.ru.md) · [PRD](../PRD.ru.md)

## 1. Приёмочная матрица

Все 28 ID SAI и статусы сохранены из перенесённой базы; ожидаемые результаты, зависящие от runtime, адаптированы для Codex App Server в этом проекте. Во всех строках состояние **Не проверено**. Проверки выполняются на тестовом repository/workspace с закреплёнными версиями; runtime evidence обязательно.

| ID | Проверка | Ожидаемый результат |
| --- | --- | --- |
| SAI-01 | Полный путь Project → READY → специалист → PR → приёмка | Один run; agent, прогресс, проверки, PR и отчёт сохранены; DONE только после решения оператора |
| SAI-02 | Повторные poll и повторное разрешение одной команды | Один runKey, одно выполнение; поведение сохраняется после рестарта |
| SAI-03 | Ответ на вопрос и отклонение approval | Тот же run; правильный вопрос получает ответ; отказ не выдаётся за разрешение |
| SAI-04 | Ошибка Codex App Server execution или acceptance check | Run FAILED, задача WAITING/ERROR; самоповтора нет |
| SAI-05 | Доработка после успешного run | Новый requestVersion и run; прежний SUCCEEDED остаётся в истории |
| SAI-06 | Отмена активного выполнения | Статус CANCELLED только после остановки; повторная отмена безопасна |
| SAI-07 | Разрыв local Twenty API/network, включая рестарт worker | Новый turn не стартует; исход сверяется по Twenty Journal, Codex thread/turn history и workspace artifacts либо WAITING/RECOVERY |
| SAI-08 | Рестарт worker и потеря JSON-RPC acknowledgement | Прочитать сохранённую thread/turn history и artifacts; подтвердить прежнее выполнение либо WAITING/RECOVERY; второй turn не запускать |
| SAI-09 | Истечение 60 минут, включая рестарт и ожидание человека | Бюджет сохранён; ожидание исключено; остановка и итог зафиксированы |
| SAI-10 | Второй экземпляр worker; журнал Twenty недоступен или повреждён | Запуск блокируется; новые команды Codex App Server не отправляются; конкурентного выполнения нет |
| SAI-11 | Устаревшие answer/cancel/events и неверная версия | Действия не затрагивают другой run; терминальный итог не перезаписывается |
| SAI-12 | API permissions, изоляция клиентов, Telegram identity/bot secret, Codex process isolation и sandbox workspace | Клиент A не читает/search данные клиента B; клиент не меняет lifecycle и не разрешает developer action; secrets вне workspace агента; запрещённые repositories/actions отклоняются |
| SAI-13 | Workspace API, client access, Telegram authorization и pinned Codex App Server protocol | Проверены schema/permissions, runKey/operationKey, PENDING recovery, JSON-RPC invocation, thread/turn events, approval response, cancellation, history reconciliation и ответы клиента |
| SAI-14 | Повторные/конкурентные workflow triggers и EVENT/APPLIED | Один START/runKey; обработка события идемпотентна; циклов нет |
| SAI-15 | Полномочия workflow и worker | Worker может создавать/изменять Journal (включая APPLIED из-за общего права create/update в Twenty), но не может обновлять Task/Run; бизнес-переходы выполняют workflows, обычный обработчик сохраняет APPLIED по логике приложения |
| SAI-16 | Маршрутизатор и профиль специалиста | agentKey выбирается из разрешённых; instruction/вопрос валидируются; STARTED назначает специалиста; lifecycle меняет workflow, приёмка ручная |
| SAI-17 | Form/Telegram: клиентский INPUT, ответ/approval разработчика и устаревший вопрос | Клиент отвечает только на адресованный INPUT; привязанный разработчик разрешает/отклоняет адресованный APPROVAL; каналы дедуплицируют вопрос, побеждает первый валидный ответ; чужие, отозванные и устаревшие ответы отклоняются |
| SAI-18 | Unique indexes и Upsert | Дубли ключей отклоняются; повтор не перезаписывает итог; четыре workflows работают без Jobs/KV и отдельной очереди оркестратора |
| SAI-19 | Native Kanban клиента, UI оператора, история и версии | Сотрудник входит и видит только разрешённые Kanban/task данные своего клиента; на адресованный вопрос можно ответить в Twenty или проверенном Telegram; rollback не повторяет старые команды |
| SAI-20 | Лимиты Twenty и выбранные версии | Фактически доступны квоты, права и нужные JSON-RPC methods; quota failure не создаёт новый turn; polling/heartbeat не вызывает workflow storm |
| SAI-21 | Отчёт, backup/restore и приватное приложение | Краткий отчёт и разрешённая ссылка доступны оператору; test restore сохраняет журнал; обновление app не уничтожает историю и секреты; file upload не требуется |
| SAI-22 | Langfuse: trace, версия и ручная оценка | Run связан с trace, версии шаблонов различаются; тесты и ACCEPT/REWORK доставляются без дублей; отказ Langfuse не блокирует START, ответ, RESULT или приёмку; после восстановления экспорт повторяется из Twenty |
| SAI-23 | Полнота аналитики и секреты | Неизвестные tokens/cost остаются пустыми; credentials не экспортируются; first-pass считается по задачам с решением, попытки не смешиваются и незавершённые задачи видны отдельно |
| SAI-24 | Project и GitHub repository | Project обязателен; отсутствующий/недоступный repository блокирует START; смена repository проекта не меняет snapshot активного run |
| SAI-25 | Выбор специалиста и подтверждение запуска | Маршрутизатор выбирает разрешённый профиль; worker сохраняет Codex thread/turn и публикует STARTED до RUNNING; ошибка выбора не запускает turn |
| SAI-26 | Передача и восстановление handoff | A → B в той же task/run/worktree; прежнее исполнение специалиста доказанно завершено; assignmentVersion/контекст сохранены; дубли, stale answer/result и рестарт не запускают второго исполнителя |
| SAI-27 | Создание PR и сбой GitHub | После проверок один PR в правильных repository/base/head; при неопределённом ответе ищется прежний PR; повтор публикации не повторяет Codex App Server execution; ссылка/отчёт сохранены, описание не затёрто |
| SAI-28 | Сквозной путь оператора и клиента | Создание Project, вход клиента и его Kanban, маршрутизация, прогресс, адресованный ответ клиента в любом канале, continuation, handoff и PR проверены end-to-end; проверены повторы/stale/отзыв identity; история специалистов в Journal/Langfuse |

Для каждого SAI сохранять:

- версию окружения/config
- предусловия и шаги
- ожидаемый и фактический результат
- task/runKey/operationKey/assignmentVersion
- обезличенные API/Journal/RPC evidence
- результаты checks
- PR URL при применимости

Для cancellation/recovery приложить доказательство остановки или существующего прежнего turn и отсутствия дубликата; одного heartbeat/PID недостаточно. Для analytics — IDs/решения, полноту и сценарий отказа. Для backup — test restore.

Состояния проверки:

- **Выполнено** — ожидаемый результат доказан
- **Частично выполнено** — доказана лишь часть
- **Не проверено** — нет достаточного прогона
- **Не выполнено** — подтверждённое расхождение с defect/evidence

Статическая проверка документации не закрывает SAI. Пилот принимается после выполнения всех 28 критериев; изменение критерия/объёма оформляется явно в обеих языковых версиях.

## 2. Регрессионные сценарии P2

Сценарии уточняют существующие критерии и не добавляют новые идентификаторы SAI. Они остаются Не проверено до evidence из интеграционного прогона.

Повтор публикации по SAI-27:

- Смоделировать подтверждённую ошибку публикации GitHub, сохранённую как APPLIED/ERROR. Разрешить повтор: один новый operationKey, прежние publicationKey/runKey/requestVersion/repository/base/head и retryOfOperationKey со ссылкой на старую команду. Сохранить старое подтверждение и подготовленные изменения; Codex App Server execution не запускать.
- Подать одно действие повтора дважды и повторно доставить его команду. Получить одну новую попытку команды; после APPLIED доставка возвращает сохранённый исход без повторного исполнения.
- Потерять ответ GitHub после создания PR. Сверить исходную операцию PENDING и доставить URL существующего PR без нового PR или попытки. Если поиск не доказывает исход, сохранить неопределённость и не запускать повтор.
- Перед публикацией разрешённой новой попытки проверить поиск существующего PR; подтвердить один PR и сохранённые PR_CREATED/RESULT.

Retention по SAI-21, SAI-22 и SAI-23:

- Превысить настроенный срок технического retention при run SUCCEEDED и задаче WAITING/REVIEW. Выполнить очистку; проверить доступность run, PR, checks, snapshot/version references и необходимого Journal evidence для запросов. Выполнить ACCEPT и REWORK на отдельных fixtures.
- Оставить Langfuse недоступным дольше этого срока, включая решение ACCEPT/REWORK, ожидающее экспорта. Выполнить очистку и перезапустить экспортер; проверить доставку из сохранённых facts/checkpoints с исходными trace/observation/score IDs без дублей.
- Сохранить задачу с несколькими попытками, включая FAILED/CANCELLED старше срока технического retention. После очистки проверить историю назначений/версий и доступные cost/time facts всех попыток для first-pass и атрибуции стоимости.
- Выполнить backup/restore после очистки; проверить сохранность защищённого минимума аудита, checkpoints ожидающего экспорта и идемпотентных исходов публикации.

## Gate доказательств Codex App Server

Все критерии остаются **Не проверено**, пока локальная интеграция на закреплённой версии не докажет соответствие одного Twenty `runKey` сохранённому Codex `threadId`, связь разрешённых назначений с turns, использование поддержанных JSON-RPC methods/events, привязку approval к рассмотренному действию и reconciliation отмены/рестарта без автоматического запуска дубликата. Негативные проверки должны доказать, что агент не читает secrets и репозитории вне разрешённого workspace. Клиентские тесты подтверждают индивидуальную аутентификацию, видимость только своего клиента, адресованные INPUT-ответы и запрет cross-client/lifecycle действий. Это уточняет доказательства существующих SAI и не создаёт новые ID.

## 3. Реестр evidence по применимым SAI (4 ноября 2026)

Здесь зафиксированы evidence репозитория для модели, разрешений, ключей, lifecycle, результата, приёмки, singleton worker и неизвестного исхода. `Частично подтверждено` означает, что ограниченное evidence доказывает лишь часть ожидаемого результата; полный SAI остаётся открытым. Все перечисленные критерии остаются **Не проверено** для приёмки пилота, пока каждый обязательный интеграционный сценарий не доказан на выбранном workspace Twenty и закреплённом runtime Codex.

| SAI | Проверенные evidence репозитория | Результат evidence / что проверить |
| --- | --- | --- |
| SAI-01, SAI-04–06, SAI-14–16 | E2E заметки этапов 4 и 5 в `docs/twenty-app-development-plan.ru.md`; `src/utils/apply-worker-run-event.util.spec.ts` (4 unit-теста в 2 файлах пройдены); `services/worker/src/execution-coordinator.ts` | **Частично подтверждено.** В этапе 4 зафиксированы SUBMIT оператора → READY, fixture ERROR → REWORK/версия 2, fixture RESULT → WAITING_REVIEW и ACCEPT оператора → DONE/APPLIED. В этапе 5 зафиксированы worker STARTED и успешный RESULT, но не приёмка именно этого результата worker. Для controlled retry использовались внедрённые API-события, а не ошибка исполнения. Отмена и конкурентные triggers не проверялись. Полный путь одного run, происхождение ошибки, отмена и конкурентность остаются **Не проверено**. Используется один профиль; routing/handoff отложены. |
| SAI-10 | E2E «неизвестный исход и блокировка очереди» этапа 5 в `docs/twenty-app-development-plan.ru.md`; in-process guard `active` в `execution-coordinator.ts`; проверка active-run в `src/utils/apply-dispatch-request.util.ts` | **Частично подтверждено.** Fake App Server оборвал соединение после STARTED; после рестарта worker оставил первый run активным и не отправил dispatch/turn для второй READY-задачи (счётчик turn остался 1). Это подтверждает блокировку очереди в этом fixture, но не исключение одновременно работающего второго процесса worker и не поведение при недоступном/повреждённом Journal; эти случаи **Не проверено**. |
| SAI-12, SAI-15 | E2E permissions этапов 3/4 и E2E scope Worker этапа 6 в `docs/twenty-app-development-plan.ru.md`; роли `apps/twenty-app/src/roles/orchestrator-worker.role.ts`, `orchestrator-operator.role.ts`; workspace allowlist/clean-tree в `services/worker/src/execution-coordinator.ts` | **Частично подтверждено.** На изолированном локальном workspace API key Worker прочитал назначенную владельцу задачу и Project с включённым execution, не прочитал задачу без owner, Project с выключенным execution и terminal AiRun; обновление AiTask было отклонено. Этап 4 также подтверждает отказ действия с Task для пользователя без Operator; роль Operator имеет права обновления Task/Project/Run. Journal остаётся доступен Worker на чтение/обновление в workspace (включая APPLIED), поскольку Twenty здесь не предоставляет create-only permission. `owner IS_NOT_EMPTY` скрывает неназначенные задачи, но не ограничивает доступ конкретным именованным оператором. Изоляция нескольких сотрудников/клиентов, других workspace, secrets/process и негативные проверки запрещённых repository/actions остаются **Не проверено**. |
| SAI-18 | E2E ключей/permissions этапа 3; заметки о повторной доставке этапов 4/5 в `docs/twenty-app-development-plan.ru.md`; `apps/twenty-app/src/objects/ai-run.ts`, `ai-run-journal.ts` и dispatch/event utilities | **Частично подтверждено.** Twenty 2.54.0 отклонил повторный/конфликтующий `operationKey`; на этапе 5 повторная доставка того же RESULT payload вернула APPLIED идемпотентно. Для этих случаев есть runtime evidence уникальности и redelivery. Гонки конкурентного Upsert/dispatch, взаимодействие всех workflows и более широкое сохранение payload при redelivery **Не проверены**. |
| SAI-13, SAI-24–25 | Проверки schema/permissions этапа 3 и E2E dispatch/STARTED/RESULT этапа 5 в `docs/twenty-app-development-plan.ru.md`; `apply-dispatch-request.util.ts`, `execution-coordinator.ts`, `twenty-api-client.ts` | **Частично подтверждено.** Проверены установленная schema приложения, обязательный Project/repository snapshot, allowlist validation и выбор worker одного настроенного профиля с подтверждённым стартом thread/turn. Изменение Project во время активного run, выбор из нескольких разрешённых профилей, совместимость pinned protocol за пределами записанного fixture, клиентские/Telegram функции SAI-13 остаются **Не проверено** или отложены. |
| SAI-01, SAI-04–05, SAI-21, SAI-27 | E2E lifecycle этапа 4 и «Полный успешный E2E результата» этапа 5 в `docs/twenty-app-development-plan.ru.md`; `services/worker/src/result-publisher.ts`; `apps/twenty-app/src/utils/apply-worker-run-event.util.ts`, `review-task.util.ts` | **Частично подтверждено.** Fixture этапа 4 достиг DONE после ручного ACCEPT. Worker E2E этапа 5 зафиксировал успешные app lint/typecheck/unit и worker build, создание и проверку draft PR #16 на момент теста, совпадающие PR_CREATED/RESULT evidence, APPLIED RESULT, SUCCEEDED run и WAITING_REVIEW. Сейчас PR #16 закрыт. Приёмка именно этого worker результата, retention, backup/restore и recovery неоднозначного PR не доказаны. |
| SAI-07–08, SAI-10, SAI-27 | E2E неизвестного исхода, RESULT и публикации этапа 5 в `docs/twenty-app-development-plan.ru.md`; `services/worker/README.md`; `codex-app-server-client.ts`, `execution-coordinator.ts`, `result-publisher.ts` | **Частично подтверждено; recovery остаётся Не проверено.** Fixture с fake server подтвердил, что после disconnect/restart не появился второй turn или dispatch. Первый реальный GitHub push вернул HTTP 500; read-only поиск не нашёл branch/PR, затем тот же commit опубликовали вручную и записали RESULT. Durable recovery после потери `turn/start` acknowledgement, сверка существующего/неопределённого turn или PR, рестарт реального Codex и разрешённый retry только публикации остаются **Не проверено**. README подтверждает, что автоматический restart reconciliation пока не реализован. |

Проверенные execution evidence: `yarn test:unit` прошёл (2 файла, 4 теста), `yarn build` в `services/worker/` прошёл 4 ноября 2026; интеграционный E2E доступа Worker этапа 6 прошёл (1 тест), временный API key отозван. CLI для плана app — 2.54.3; версия сервера workspace для Stage 6 отдельно не зафиксирована. План фиксирует остальные прогоны в изолированных workspace, сценарий неизвестного исхода с fake App Server и E2E worker/Codex/GitHub. Эти результаты доказывают только описанные fixtures и не подтверждают непроверенные случаи или полностью закрытый SAI.
