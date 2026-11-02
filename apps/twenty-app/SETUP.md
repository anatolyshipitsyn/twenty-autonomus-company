# Локальная разработка

## Требования

- Локальный Twenty из этого репозитория запущен по адресу `http://localhost:3000`. См. [локальное окружение](../../docs/local-environment.md).
- Node.js версии из `.nvmrc` (`24.5.0` или совместимая версия Node 24) и Yarn 4.18.1.
- Standalone CLI Twenty 2.54.3 или совместимая версия `>=2.54.0`.

## Установка и подключение

Из каталога приложения:

```bash
nvm install
nvm use
corepack yarn install
npm install -g twenty
twenty auth login --url http://localhost:3000 --name autonomus-local
```

If `twenty` is not found after installation, make sure the active Node version's global npm `bin` directory is in `PATH`; switching to the app's `.nvmrc` with `nvm use` normally does this.

Вход сохраняет remote `autonomus-local` в пользовательской конфигурации CLI. Команды ниже указывают remote явно, чтобы не зависеть от выбранного по умолчанию.

## Синхронизация с локальным workspace

Для первого запуска убедитесь, что локальный Twenty запущен, а remote `autonomus-local` создан и аутентифицирован (см. раздел «Установка и подключение»). Корневой Compose поднимет Twenty и контейнер `app-dev`, который зарегистрирует приложение при необходимости, установит зависимости и запустит watcher:

```bash
docker compose up -d --wait
docker compose logs -f app-dev
```

Контейнер монтирует исходники `apps/twenty-app`, поэтому изменения файлов синхронизируются с Twenty без пересборки образа сервера. Для подключения он читает `~/.twenty/config.json` только для чтения, оставляет в рабочем Docker volume remote `autonomus-local` и использует адрес `http://server:3000`. Убедитесь, что этот remote создан и аутентифицирован на хосте. Чтобы использовать другой путь к конфигу CLI, задайте `TWENTY_CLI_CONFIG_FILE` в корневом `.env`.

Watcher запускается с `--no-prune`, чтобы удаление определения из исходников само по себе не удаляло его из workspace. Не запускайте параллельно отдельный `twenty app apply`. Откройте `http://localhost:3000` и выберите **Autonomus Company** в навигации.

### Повторная авторизация CLI

Если watcher пишет `Your session on autonomus-local expired and could not be refreshed`, обновите авторизацию CLI на хосте и пересоздайте только его конфиг-том:

```bash
twenty auth login --remote autonomus-local
docker compose stop app-dev
docker compose rm -f app-dev
docker volume ls --filter name=app-dev-cli-config
docker volume rm twenty-autonomus-company_app-dev-cli-config
docker compose up -d app-dev
```

Если задано другое `COMPOSE_PROJECT_NAME`, передайте в `docker volume rm` имя, которое вернул `docker volume ls`. Не используйте `docker compose down -v`: эта команда удалит также тома базы данных и файлов Twenty.

## Проверки

По отдельному запросу доступны скрипты пакета:

```bash
yarn lint
yarn typecheck
yarn test:unit
```

Полный integration test требует отдельного тестового workspace; не запускайте его против локального рабочего workspace.
