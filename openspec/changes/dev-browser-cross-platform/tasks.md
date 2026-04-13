## 1. Cross-platform entrypoint redesign

- [x] 1.1 盘点并替换 `SKILL.md`、`server.sh`、`resolve-skill-dir.sh` 中作为正式用户路径的 Bash-only 启动方式
- [x] 1.2 设计并实现统一的 Node/TypeScript 入口，覆盖 standalone 与 extension 两种模式的参数解析与启动分发
- [x] 1.3 定义新入口的 readiness 输出契约，确保 Linux 与原生 Windows 的成功信号一致
- [x] 1.4 决定旧 Bash 入口的去留策略，并将其标记为兼容层或移除

## 2. Runtime compatibility layer

- [x] 2.1 抽离包管理器发现逻辑，移除对 `which` 的依赖并支持 Linux/Windows
- [x] 2.2 重构 Playwright/Chromium 安装检查逻辑，避免依赖 Unix 风格缓存路径作为唯一判断依据
- [x] 2.3 重构端口冲突与旧进程恢复逻辑，替换 `lsof` 与 `kill -9` 为平台安全的所有权检查策略
- [x] 2.4 统一 `import.meta.url` 到文件路径的转换方式，修复 Windows 路径兼容风险
- [x] 2.5 明确 profile、tmp 与其他运行时目录的跨平台位置与创建策略

## 3. Standalone and extension mode integration

- [x] 3.1 将 standalone 启动链路接入新的跨平台入口，并保持现有 HTTP API、wsEndpoint 与 named page 行为不变
- [x] 3.2 将 extension relay 启动链路接入新的跨平台入口，并保持现有 relay operating model 不变
- [x] 3.3 为 standalone 模式补齐 Linux/Windows 的最小可用验证路径：启动、连接、创建命名 page、观察 readiness
- [x] 3.4 为 extension 模式补齐 Linux/Windows 的最小可用验证路径：启动 relay、观察 waiting 状态、完成 extension 连接、观察 connected 状态
- [x] 3.5 梳理 extension mode 与 standalone mode 的已知行为差异，并确认哪些属于文档限制而非实现缺陷

## 4. Documentation and verification

- [x] 4.1 更新 `SKILL.md`，提供 Linux 与原生 Windows 一致的正式使用路径
- [x] 4.2 移除或替换 Windows 用户不可直接执行的 Bash heredoc、subshell、command substitution 等示例
- [x] 4.3 补充支持矩阵与回归检查清单，覆盖 standalone/extension × Linux/Windows
- [x] 4.4 记录非目标环境与边界条件，例如 WSL/Git Bash 不是 Windows 正式支持前提
