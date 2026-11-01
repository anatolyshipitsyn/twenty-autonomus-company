# Working in this repository

This repository specifies an AI orchestrator: Twenty Workflows own business state; the selected execution architecture is a NestJS worker controlling Codex App Server over its version-pinned JSON-RPC protocol. The worker is a target design and is not implemented in this checkout yet. The official Twenty Agent Skills are installed under `.agents/skills/`. Check the current tree before choosing commands: this checkout may not contain the private Twenty App package, and no NestJS worker toolchain is defined yet.

## Twenty Agent Skills and local server

Use the installed skill that matches the request; read its `SKILL.md` and only the references it points to that are relevant to the task:

- `.agents/skills/create-app/SKILL.md` — scaffold a new Twenty app.
- `.agents/skills/develop-app/SKILL.md` — change an existing app's data model, logic, workflows, layouts, or UI.
- `.agents/skills/manage-app/SKILL.md` — sync, build, deploy, inspect logs, or troubleshoot an app.
- `.agents/skills/publish-app/SKILL.md` — prepare public app-store assets and metadata.
- `.agents/skills/use-twenty-mcp/SKILL.md` — inspect workspace records or metadata through MCP.

The developer's local Twenty server is currently reachable at `http://localhost:3000`; its MCP endpoint is `http://localhost:3000/mcp`, configured in the developer's user-local Codex MCP settings as `twenty-local`. This endpoint and OAuth credentials are machine-local configuration: do not copy credentials into this repository or assume another developer has the same endpoint. When the local server address changes, follow `.agents/skills/use-twenty-mcp/references/use-twenty-mcp/setup.md` and verify the configured MCP URL before querying workspace data. If MCP tools are missing after configuration, reload the Codex session.

Twenty apps are standalone packages that extend a running Twenty instance; they are not the orchestrator or server itself. Before running app commands, locate the app package and use its own `.nvmrc`, `package.json`, and setup instructions. Do not assume `apps/twenty-app/` exists in this checkout.
