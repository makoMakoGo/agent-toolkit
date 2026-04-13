## ADDED Requirements

### Requirement: Cross-platform startup entrypoints
The system MUST provide documented and supported startup entrypoints for both standalone mode and extension mode that work on Linux and native Windows without requiring Bash, Git Bash, or WSL.

#### Scenario: Start standalone mode on Linux
- **WHEN** a user starts dev-browser standalone mode on Linux through the supported entrypoint
- **THEN** the server starts successfully without requiring Bash-specific syntax or shell utilities

#### Scenario: Start standalone mode on native Windows
- **WHEN** a user starts dev-browser standalone mode on native Windows through the supported entrypoint
- **THEN** the server starts successfully without requiring Bash, Git Bash, or WSL

#### Scenario: Start extension mode on Linux
- **WHEN** a user starts dev-browser extension mode on Linux through the supported entrypoint
- **THEN** the relay server starts successfully without requiring Bash-specific syntax or shell utilities

#### Scenario: Start extension mode on native Windows
- **WHEN** a user starts dev-browser extension mode on native Windows through the supported entrypoint
- **THEN** the relay server starts successfully without requiring Bash, Git Bash, or WSL

### Requirement: Platform-neutral runtime environment checks
The system MUST perform package manager discovery, browser-install checks, path resolution, and process/port recovery using platform-neutral logic or explicit per-platform handling, and MUST NOT depend on Unix-only commands as part of the supported startup path.

#### Scenario: Package manager detection on Windows
- **WHEN** the supported startup path checks whether it can install or invoke Playwright tooling on native Windows
- **THEN** it does not depend on `which` or other Unix-only shell commands

#### Scenario: Port recovery on Linux and Windows
- **WHEN** the supported startup path detects a stale or conflicting dev-browser process
- **THEN** it uses a platform-safe ownership check and recovery strategy rather than blindly invoking `lsof` and `kill -9`

#### Scenario: Path conversion from module URLs
- **WHEN** runtime code converts `import.meta.url` or similar module references into filesystem paths
- **THEN** the resulting paths are valid on both Linux and native Windows

### Requirement: Cross-platform standalone workflow readiness
The system MUST preserve a consistent readiness contract for standalone mode across Linux and native Windows so that users can observe when the browser automation server is ready for script execution.

#### Scenario: Standalone server announces readiness on Linux
- **WHEN** standalone mode finishes startup on Linux
- **THEN** the user can observe a stable readiness signal before running browser scripts

#### Scenario: Standalone server announces readiness on native Windows
- **WHEN** standalone mode finishes startup on native Windows
- **THEN** the user can observe the same readiness signal before running browser scripts

#### Scenario: Standalone workflow supports named pages across platforms
- **WHEN** a user connects to a started standalone server on Linux or native Windows and requests a named page
- **THEN** the server returns connection information that allows the client to create or reconnect to that named page

### Requirement: Cross-platform extension workflow readiness
The system MUST preserve a consistent readiness contract for extension mode across Linux and native Windows so that users can observe when the relay is ready and when the browser extension has connected.

#### Scenario: Relay announces wait state across platforms
- **WHEN** extension mode starts on Linux or native Windows
- **THEN** the user can observe that the relay server is ready and waiting for the browser extension to connect

#### Scenario: Relay announces connected state across platforms
- **WHEN** the supported browser extension connects to the relay on Linux or native Windows
- **THEN** the user can observe a stable connected signal before running browser automation

#### Scenario: Extension mode remains a distinct capability
- **WHEN** extension mode is used on Linux or native Windows
- **THEN** the system preserves its existing relay-based operating model instead of silently falling back to standalone mode

### Requirement: Cross-platform user guidance
The system MUST provide user-facing instructions that match the supported Linux and native Windows workflows for starting the skill and running the basic browser automation path.

#### Scenario: Windows documentation avoids Bash-only syntax
- **WHEN** a native Windows user follows the documented dev-browser startup and usage path
- **THEN** the instructions do not require Bash-specific syntax such as shell command substitution, subshell grouping, background `&`, or heredoc-only execution forms

#### Scenario: Linux documentation matches supported path
- **WHEN** a Linux user follows the documented dev-browser startup and usage path
- **THEN** the instructions reflect the same supported entrypoints and readiness contract as the implementation

#### Scenario: Extension limitations are documented
- **WHEN** extension mode retains behavior differences from standalone mode
- **THEN** those differences are documented as explicit limitations rather than hidden assumptions
