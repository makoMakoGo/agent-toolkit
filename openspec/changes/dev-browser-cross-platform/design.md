## Context

`dev-browser` 目前包含 standalone 与 extension 两种运行模式，但它们的入口与使用说明都建立在 Bash/Unix 假设上。文档要求用户先通过 `skills/dev-browser/resolve-skill-dir.sh` 解析 `SKILL_DIR`，再用 Bash 语法启动 `server.sh` 或执行 `(cd "$SKILL_DIR" && npm i && npm run start-extension) &`；脚本执行同样依赖 heredoc 与 subshell。与此同时，standalone 启动脚本 `skills/dev-browser/scripts/start-server.ts` 仍内嵌 Unix 命令探测与恢复逻辑：使用 `which` 发现包管理器、使用 `lsof`/`kill -9` 清理 9223 端口、手工检查 `~/.cache/ms-playwright` 判断 Chromium 是否已安装。`skills/dev-browser/src/snapshot/browser-script.ts` 还使用 `new URL(import.meta.url).pathname` 构造路径，这一模式在 Windows 上存在路径兼容风险。

用户已明确要求支持 **Linux 与原生 Windows**，且 **standalone 与 extension 两种模式都要正式支持**。因此这次设计不能仅修补文档，而要把“平台无关入口 + 运行时平台抽象 + 明确支持契约”作为主线，避免继续将 Bash 作为事实标准环境。

## Goals / Non-Goals

**Goals:**
- 为 standalone 与 extension 模式建立统一、跨平台的 Node/TypeScript 启动入口，Linux 与原生 Windows 使用同一套主路径。
- 将 skill 目录解析、服务启动、浏览器安装检查、端口冲突检测、进程恢复等逻辑从 shell 命令迁移到平台无关实现。
- 让用户在原生 Windows 下无需 Git Bash/WSL 即可完成 dev-browser 的常见工作流，包括启动服务、连接浏览器、执行最小脚本与等待 readiness 信号。
- 保持现有核心产品模型不变：命名 page、持久化 profile、HTTP/WS 控制接口、extension relay 工作方式继续存在。
- 为 Linux/Windows 建立可验证的回归标准，覆盖 standalone 与 extension 的关键路径。

**Non-Goals:**
- 不重写 dev-browser 的 Playwright 控制模型或命名 page API。
- 不在本次变更中引入新的浏览器自动化能力或修改现有 HTTP API 语义。
- 不将 WSL/Git Bash 作为 Windows 支持前提。
- 不要求一次性解决 extension mode 所有功能一致性问题；本次只要求其启动、连接与基本使用路径跨平台可用，并显式记录已知差异。

## Decisions

### 1. 以 Node/TypeScript CLI 取代 Bash 作为一等入口
**Decision:** 新增统一的跨平台入口层，由 Node/TypeScript 负责启动 standalone/extension、解析 skill 根目录、处理参数与输出 readiness；`server.sh` 与 `resolve-skill-dir.sh` 不再作为标准用户入口。

**Rationale:** 当前用户路径被 Bash 语法锁死，问题不在单个脚本，而在整个 skill 的“入口契约”建立在 Unix shell 之上。只修某一个 shell 文件，无法让 `SKILL.md`、内联脚本示例和不同运行模式都在原生 Windows 下自然工作。把入口提升到 Node 层后，可以统一调用方式、参数解析、错误输出与平台分支。

**Alternatives considered:**
- 保留 Bash，额外补 PowerShell 脚本：会形成双维护入口，文档和行为容易漂移。
- 要求 Windows 用户通过 Git Bash/WSL：不符合用户已确认的原生 Windows 目标。

### 2. 将平台相关能力收敛到单独 runtime compatibility layer
**Decision:** 把包管理器发现、Playwright 浏览器安装检查、端口占用检测、旧进程恢复、路径与缓存目录解析集中到独立的跨平台 runtime abstraction，而不是散落在 `start-server.ts`、shell 脚本和文档中。

**Rationale:** 当前跨平台问题来自多处零散假设：`which`、`lsof`、`kill`、`~/.cache/ms-playwright`、`pathname` 等。集中抽象后，Linux/Windows 差异可在一个边界内被处理和测试，避免未来再次把平台判断写回业务启动脚本。

**Alternatives considered:**
- 在现有脚本中逐行加 `process.platform` 分支：短期可用，但会把启动逻辑继续耦合到平台细节，后续维护成本高。
- 完全依赖外部 shell 或第三方工具探测环境：仍无法满足原生 Windows 一致性。

### 3. 统一定义“支持矩阵”和 readiness contract
**Decision:** 将“服务可启动”“客户端可连接”“脚本可执行”“extension 可连上 relay”“用户可观察到稳定 readiness 信号”定义为跨平台支持契约，分别覆盖 standalone 与 extension 两条主路径。

**Rationale:** 当前文档只依赖日志文本如 `Ready`、`Waiting for extension to connect...`，但没有正式的跨平台完成标准。重构方案需要先定义哪些行为必须一致，后续实现与测试才能有稳定验收边界。

**Alternatives considered:**
- 仅以“能跑起来”为目标：无法判断 Linux/Windows 行为是否真的一致，也无法指导后续测试。

### 4. 保留现有服务接口与 page 模型，优先替换外层启动与环境探测
**Decision:** HTTP API、wsEndpoint、named page registry、relay message contract 维持不变；先重构启动与平台依赖，再处理内部实现细节如 profile 路径策略、扩展差异性说明。

**Rationale:** 用户要的是跨平台可用，不是协议重设计。现有 `src/index.ts`/`src/relay.ts` 已经承载主要业务行为，真正阻断 Windows 的主要是外围启动与环境假设。先稳定外层契约，风险最小。

**Alternatives considered:**
- 顺便重构 client/server API：收益小、风险大，会扩大本次变更范围。

### 5. 把 extension mode 视为与 standalone 同等级的正式支持对象，但单独记录其平台边界
**Decision:** extension mode 进入正式支持范围，但在 spec 中单独定义其要求：relay 可在 Linux/Windows 启动，浏览器扩展可完成连接，已知功能差异需文档化，且不把“与 standalone 100% 功能等价”作为本次目标。

**Rationale:** 用户已明确要求两种模式都支持；但当前 extension 依赖外部扩展与本地 loopback 网络，风险与运行条件不同于 standalone。把它纳入正式支持，同时承认其边界，有助于避免范围失控。

**Alternatives considered:**
- 先只做 standalone：不符合用户确认范围。
- 追求 extension 与 standalone 完全一致：会把本次重构推向更大的协议/功能对齐工程。

## Risks / Trade-offs

- **[入口切换风险]** → 现有文档和调用习惯默认 Bash。缓解方式：保留兼容层或在文档中明确迁移路径，并让新入口输出与旧模式一致的 readiness 语义。
- **[平台抽象复杂度上升]** → Node 层会承担更多环境探测逻辑。缓解方式：将平台差异集中在单独模块，避免扩散到业务逻辑。
- **[extension mode 外部依赖风险]** → 扩展本体不在当前仓库中，某些跨平台问题可能来自外部扩展实现。缓解方式：spec 中明确本仓库可控边界，并把扩展连接契约与验证前提写清楚。
- **[端口恢复策略误伤本地进程]** → 现有 `kill -9` 方式有误杀风险；替换后需要更保守的所有权判定。缓解方式：只处理由 dev-browser 自身记录/启动的进程，不能确认归属时改为报错和提示。
- **[文档与实际能力漂移]** → 如果只改运行时不改 `SKILL.md`，Windows 仍不可用。缓解方式：把文档作为同级交付物，确保示例与正式支持矩阵一致。
- **[extension 网络模型差异]** → Windows 原生、Linux、以及潜在 WSL 环境对 loopback 的行为不同。缓解方式：正式支持矩阵只承诺 Linux 原生与 Windows 原生；WSL 作为非目标环境单独说明，不混入通过标准。

## Migration Plan

1. 先定义跨平台支持契约与验证矩阵，作为 spec 基础。
2. 引入新的跨平台入口与 runtime compatibility layer，同时保留旧入口仅作兼容或过渡。
3. 将 `SKILL.md` 的启动和脚本执行说明切换到新入口，移除对 Bash 语法的主路径依赖。
4. 用 Linux/Windows 分别验证 standalone 与 extension 的最小可用路径。
5. 在验证完成后再决定是否删除旧 Bash 入口；若保留，则明确标注为兼容层而非推荐路径。
6. 回滚策略：若新入口在某平台失败，可临时退回旧 Linux Bash 启动链路，但 Windows 支持将视为未达成，不算完成交付。

## Open Questions

- 外部 browser extension 的源码与发布流程是否在别处维护？如果是，当前仓库只能定义 relay 侧契约，无法独立保证 extension 全部兼容问题。
- standalone 新入口是否也应开放 HOST/PORT/CDP_PORT 配置，与 relay 保持一致，还是先维持默认端口并仅抽象平台差异？
- 旧的 `server.sh` / `resolve-skill-dir.sh` 最终是删除、保留为兼容包装，还是仅在 Linux 下保留？
- Windows 下脚本执行示例是否要完全避免 heredoc，改为统一使用临时脚本文件或固定 CLI 子命令？
