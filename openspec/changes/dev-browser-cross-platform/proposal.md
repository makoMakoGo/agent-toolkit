## Why

`skills/dev-browser` 当前的启动与使用路径明显偏向 Bash/Unix 环境，文档、skill 入口和运行时都依赖 `bash`、`which`、`lsof`、`kill`、heredoc 等能力，导致它无法在原生 Windows 环境中稳定工作。现在需要把 Linux 与原生 Windows 作为一等支持平台，降低平台分叉与环境依赖，保证本地浏览器自动化场景可直接使用。

## What Changes

- 将 dev-browser 的启动链路从 Bash/Unix shell 依赖改为由 Node/TypeScript 提供的跨平台入口与平台探测逻辑。
- 为 standalone 与 extension 两种模式定义统一的跨平台启动契约，包括 skill 目录解析、服务启动、依赖检查、浏览器安装检查与就绪信号。
- 去除运行时对 `which`、`lsof`、`kill`、Unix 风格缓存路径和 Bash heredoc 的隐式依赖。
- 为原生 Windows 补齐用户可执行路径与文档约束，确保无需 Git Bash/WSL 即可完成常见 dev-browser 工作流。
- 增加 Linux/Windows 的验证矩阵与回归标准，覆盖本地浏览器自动化的核心路径。

## Capabilities

### New Capabilities
- `dev-browser-cross-platform-support`: 定义 dev-browser 在 Linux 与原生 Windows 上的一致启动、连接和使用行为。

### Modified Capabilities
- None.

## Impact

- Affected code: `skills/dev-browser/SKILL.md`, `skills/dev-browser/server.sh`, `skills/dev-browser/resolve-skill-dir.sh`, `skills/dev-browser/scripts/start-server.ts`, `skills/dev-browser/scripts/start-relay.ts`, `skills/dev-browser/src/index.ts`, `skills/dev-browser/src/client.ts`, `skills/dev-browser/src/snapshot/browser-script.ts`, `skills/dev-browser/package.json`
- Affected systems: 本地 skill 启动流程、Playwright/Chromium 安装检查、端口占用恢复、扩展 relay 启动、用户执行说明
- Dependencies: Node.js, npm/npx, Playwright, 本地 Chromium/Chrome，及平台相关的文件系统/进程管理接口
