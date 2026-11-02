# Локальная разработка

## Требования

- Локальный Twenty из этого репозитория запущен по адресу `http://localhost:3000`. См. [локальное окружение](../../docs/local-environment.md).
- Node.js версии из `.nvmrc` (`24.5.0` или совместимая версия Node 24) и Yarn 4.18.1.
- Standalone CLI Twenty 2.54.3 или совместимая версия `>=2.54.0`.

## Установка и подключение

Для запуска watcher через Compose хостовая установка CLI и CLI-аутентификация не нужны. Для запуска CLI-команд непосредственно на хосте:

```bash
nvm install
nvm use
corepack yarn install
npm install -g twenty
twenty auth login --url http://localhost:3000 --name autonomus-local
```

If `twenty` is not found after installation, make sure the active Node version's global npm `bin` directory is in `PATH`; switching to the app's `.nvmrc` with `nvm use` normally does this.

Эти команды сохраняют remote `autonomus-local` в пользовательской конфигурации CLI и нужны только для ручных команд Twenty на хосте.

## Синхронизация с локальным workspace

Корневой Compose поднимет Twenty и контейнер `app-dev`, который установит зависимости, войдёт как локальный администратор и запустит watcher:

```bash
docker compose up -d --wait
docker compose logs -f app-dev
```

Контейнер монтирует исходники `apps/twenty-app`, поэтому изменения файлов синхронизируются с Twenty без пересборки образа сервера. Для входа он использует `DEFAULT_ADMIN_EMAIL` и `DEFAULT_ADMIN_PASSWORD` из корневого `.env` (либо значения по умолчанию из Compose). На пустом томе базы те же значения устанавливает init-скрипт. Поэтому после `docker compose down -v` новый workspace и watcher снова поднимутся без сохранённой OAuth-сессии. Контейнер автоматически перезапускает watcher перед истечением access token и получает новый.

Watcher запускается с `--no-prune`, чтобы удаление определения из исходников само по себе не удаляло его из workspace. Не запускайте параллельно отдельный `twenty app apply`. Откройте `http://localhost:3000` и выберите **Autonomus Company** в навигации.

`app-dev` получает свежий токен при каждом старте. Если вход не проходит, проверьте, что email и пароль в `.env` совпадают с учётной записью локального администратора. После смены пароля в уже созданном workspace измените `DEFAULT_ADMIN_PASSWORD` в `.env` на тот же пароль и пересоздайте `app-dev`.

Для интеграционных запросов от имени worker создайте отдельный API key в **Settings → Developers → API** и назначьте ему роль **Orchestrator Worker** через **Settings → Members → Roles → Orchestrator Worker → Assignment → Assign to API key**. Положите ключ в корневой, игнорируемый Git файлом `.env`:

```dotenv
TWENTY_API_KEY=<worker-api-key>
```

Compose передаёт эту переменную в `app-dev`; CLI remote `autonomus-local` продолжает использовать отдельный токен администратора для синхронизации app. Пересоздайте только `app-dev`, чтобы обновить его окружение:

```bash
docker compose up -d --no-deps app-dev
```

Значение `TWENTY_API_KEY` не добавляйте в app manifest, исходники или Git. Роль Worker может создавать и изменять записи AiRunJournal, включая APPLIED; это ограничение объектных прав Twenty. Она не может обновлять AiTask и AiRun. Поэтому ключ храните только как доверенный backend secret: обработчик должен сверять operationKey и не менять уже применённый результат, хотя Twenty не блокирует прямое изменение Journal через API. Для интеграционного теста используйте изолированный тестовый workspace и передавайте URL сервера через `TWENTY_API_URL`.

## Проверки

По отдельному запросу доступны скрипты пакета:

```bash
yarn lint
yarn typecheck
yarn test:unit
```

Полный integration test требует отдельного тестового workspace; не запускайте его против локального рабочего workspace.
