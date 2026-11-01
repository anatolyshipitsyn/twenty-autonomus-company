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

Первую установку выполняют так:

```bash
twenty app apply --create --remote autonomus-local
```

После изменений исходников синхронизируйте приложение командой:

```bash
twenty app apply --remote autonomus-local
```

Откройте `http://localhost:3000` и выберите **Autonomus Company** в навигации. Для синхронизации не используйте `twenty app dev`.

## Проверки

По отдельному запросу доступны скрипты пакета:

```bash
yarn lint
yarn typecheck
yarn test:unit
```

Полный integration test требует отдельного тестового workspace; не запускайте его против локального рабочего workspace.
