# Локальная среда Twenty

Стандартный Compose запускает закреплённый upstream-образ Twenty, PostgreSQL, Redis и worker Twenty. Новый том PostgreSQL инициализируется из локального снимка базы, в который входят workspace, учётная запись администратора и тестовый участник Orchestrator Operator.

Этот Compose запускает только серверный worker самого Twenty. NestJS orchestrator worker реализован отдельно в `services/worker` и не включён в Compose. Его Codex execution выключен по умолчанию (`CODEX_ENABLED=true` включает его отдельно); перед запуском требуются разрешённый чистый Git workspace и три значения allowlist. Worker собирает summary, запускает package checks, публикует draft PR и отправляет RESULT; восстановление после неопределённого исхода App Server/GitHub пока не реализовано.

## Запуск

1. Проверьте локальные параметры подключения и секреты в приватном файле `.env`.
2. Запустите стек и дождитесь healthcheck сервера:

   ```sh
   docker compose up -d --wait
   ```

3. Откройте `http://localhost:3000` и войдите с учётными данными администратора, указанными ниже. Существующие тома базы сохраняют текущие учётные записи.

## Поведение и ограничения

- `IS_MULTIWORKSPACE_ENABLED` по умолчанию равно `false`; регистрация ограничена поведением локальной конфигурации workspace.
- Upstream-образ закреплён через `TAG` (по умолчанию `v2.54.0`). Перед сменой версии проверьте совместимость.
- Healthcheck Compose проверяет endpoint сервера. Он не проверяет создание учётной записи или настройку workspace.
- В чистом томе также создаётся `stage4-operator@lvh.me`. После синхронизации приложения сервис `app-dev` назначает участнику роль Orchestrator Operator через metadata API Twenty. Для другого email или пароля задайте `ORCHESTRATOR_OPERATOR_EMAIL` и `ORCHESTRATOR_OPERATOR_PASSWORD` в `.env`. Пароль по умолчанию предназначен только для локальной разработки.
- Храните `.env` приватно: в нём могут быть API credentials и локальные секреты.

При первой инициализации пустого тома PostgreSQL официальный entrypoint Postgres по имени выполняет `entrypoint-initdb/00-extensions.sql`, `entrypoint-initdb/10-default.sql`, `entrypoint-initdb/20-default-admin.sh` и `entrypoint-initdb/30-orchestrator-operator.sh`. SQL-dump — снимок локальной базы `default`. Скрипты инициализации не запускаются повторно при подключении существующего тома `db-data`; повторная инициализация требует осознанной замены тома.

Скрипт `20-default-admin.sh` после импорта задаёт email и bcrypt-хеш пароля из `DEFAULT_ADMIN_EMAIL` и `DEFAULT_ADMIN_PASSWORD`, а также синхронизирует email в записи участника workspace. Скрипт `30-orchestrator-operator.sh` создаёт отдельного пользователя, членство в workspace и начальную роль Member из `ORCHESTRATOR_OPERATOR_EMAIL` и `ORCHESTRATOR_OPERATOR_PASSWORD`. После синхронизации app watcher назначает этому участнику роль из [`orchestrator-operator.role.ts`](../apps/twenty-app/src/roles/orchestrator-operator.role.ts) по стабильному universal identifier. Значения Compose по умолчанию: `admin@lvh.me` / `LocalTwentyAdmin2026` и `stage4-operator@lvh.me` / `LocalStage4Operator2026`. Пароли можно переопределить в `.env` до инициализации пустого тома. Эти значения предназначены только для разработки. Скрипты initdb работают только при пустом томе: изменение `.env` или обычный перезапуск не создаёт отсутствующих пользователей и не меняет пароли существующих записей. `docker compose down -v` удаляет все локальные данные Twenty — используйте его только если полный сброс действительно нужен.
