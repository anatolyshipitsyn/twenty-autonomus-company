# Локальная разработка

## Требования

- Локальный Twenty из корня репозитория доступен на `http://localhost:3000`; инструкция — [локальное окружение](../../docs/local-environment.md).
- Node.js версии из `.nvmrc` и Yarn 4.18.1.
- Twenty CLI 2.54.3 для закреплённого локального сценария; package требует `>=2.54.0`.

## Установка и CLI remote

Из этого каталога приложения:

```bash
nvm install
nvm use
corepack yarn install
npm install -g twenty@2.54.3
twenty auth login --url http://localhost:3000 --name autonomus-local
```

CLI хранит remote и авторизацию в пользовательской конфигурации. Не помещайте API keys или пароли в manifest, исходники или команды, сохраняемые в Git. Значения для локального окружения держите в корневом игнорируемом `.env`.

## Compose watcher

Из корня репозитория поднимите локальный стек:

```bash
docker compose up -d --wait
docker compose logs -f app-dev
```

`app-dev` монтирует `apps/twenty-app`, входит как локальный администратор и синхронизирует изменения в `http://localhost:3000`. Для входа используются `DEFAULT_ADMIN_EMAIL` и `DEFAULT_ADMIN_PASSWORD` из корневого `.env` (или локальные defaults Compose). На пустом томе базы init-скрипт создаёт администратора с теми же настройками. Существующий том сохраняет текущую учётную запись; изменение `.env` само по себе не меняет пароль в базе. Контейнер обновляет access token и перезапускает watcher до его истечения.

Watcher запускается с `--create --no-prune`: первая синхронизация регистрирует приложение, а отсутствующие в исходниках определения автоматически не удаляются. Откройте `http://localhost:3000` и выберите **Autonomus Company** в навигации. Не запускайте `twenty app apply` параллельно с watcher.

## Bounded sync

Для предсказуемой одноразовой синхронизации используйте Twenty CLI из каталога приложения. Сначала остановите watcher:

```bash
docker compose stop app-dev
cd apps/twenty-app
twenty app plan --remote autonomus-local --json
twenty app apply --remote autonomus-local --json
cd ../..
docker compose start app-dev
```

Plan показывает ожидаемые metadata changes; apply выполняет build и sync. Для локальной разработки используйте remote `autonomus-local`, а перед любым другим target проверьте его URL и workspace. Не применяйте этот сценарий к production без отдельного решения и проверки target.

## Worker API key

Для локального Worker API доступа создайте отдельный API key и назначьте роль **Orchestrator Worker** в Twenty: **Settings → Members → Roles → Orchestrator Worker → Assignment → Assign to API key**. Передайте ключ через `TWENTY_API_KEY` в корневом `.env`; Compose передаст его в `app-dev` для интеграционных запросов. Чтобы обновить окружение контейнера после изменения `.env`:

```bash
docker compose up -d --no-deps app-dev
```

Worker может читать назначенные задачи, Projects с включённым `executionEnabled` и активные AiRuns. Он не может обновлять AiTask или AiRun. Из-за модели прав Twenty тот же `canUpdate` доступ к Journal разрешает Worker обновлять существующие записи, включая APPLIED; храните ключ только как доверенный backend secret. Обработчик должен сверять `operationKey` и сохранять уже применённый payload/outcome. Row-level правила скрывают неназначенные задачи и Projects с выключенным execution, но не обеспечивают per-member или multi-client isolation.

Для полной интеграционной проверки используйте изолированный Twenty workspace. Передайте `TWENTY_API_URL`, `TWENTY_API_KEY`, `TWENTY_ADMIN_EMAIL`, `TWENTY_ADMIN_PASSWORD` и `TWENTY_AUTH_ORIGIN` через локальное окружение; не записывайте реальные значения в файлы, попадающие в Git.

## Локальные проверки

Из каталога приложения:

```bash
yarn lint
yarn typecheck
yarn test:unit
```

Полный integration suite требует установленного изолированного test workspace и credentials только в локальном окружении. Не запускайте его против рабочего dev workspace.
