import { formatReadinessLines, type EntrypointArgs } from "./entrypoint.js";
import type { PackageManager } from "./runtime.js";

export interface RuntimePaths {
  skillDir: string;
  tmpDir: string;
  profileDir: string;
  browserDataDir: string;
}

interface StandaloneServer {
  port: number;
  wsEndpoint: string;
  stop: () => Promise<void>;
}

interface ExtensionServer {
  port: number;
  wsEndpoint: string;
  stop: () => Promise<void>;
}

export interface RunEntrypointDeps {
  runtimePaths: RuntimePaths;
  mkdir: (path: string, options: { recursive: true }) => void;
  serveStandalone: (options: {
    port: number;
    host: string;
    headless: boolean;
    cdpPort: number;
    profileDir: string;
  }) => Promise<StandaloneServer>;
  serveExtension: (options: { port: number; host: string }) => Promise<ExtensionServer>;
  registerShutdown: (stop: () => Promise<void>) => void;
  keepAlive: () => Promise<void>;
  log: (line: string) => void;
  ensureBrowser?: () => Promise<void>;
  preflightStandalone?: () => Promise<boolean>;
}

export interface EnsurePlaywrightChromiumDeps {
  isInstalled: () => boolean;
  findPackageManager: () => PackageManager | null;
  runCommand: (command: string, args: string[]) => Promise<void>;
  log: (line: string) => void;
}

export interface PreflightStandaloneStartupDeps {
  checkServer: (host: string, port: number) => Promise<{ ok: boolean; info?: { wsEndpoint?: string } }>;
  isPortInUse: (port: number) => Promise<boolean>;
  browserDataDir?: string;
  recoverStaleBrowser?: (options: { cdpPort: number; browserDataDir: string }) => Promise<boolean>;
  log: (line: string) => void;
}

export async function preflightStandaloneStartup(
  args: EntrypointArgs,
  deps: PreflightStandaloneStartupDeps
): Promise<boolean> {
  const serverCheck = await deps.checkServer(args.host, args.port);
  if (serverCheck.ok) {
    deps.log(`Server already running on port ${args.port}`);
    return false;
  }

  if (await deps.isPortInUse(args.cdpPort)) {
    const recovered =
      deps.browserDataDir && deps.recoverStaleBrowser
        ? await deps.recoverStaleBrowser({
            cdpPort: args.cdpPort,
            browserDataDir: deps.browserDataDir,
          })
        : false;

    if (!recovered && (await deps.isPortInUse(args.cdpPort))) {
      throw new Error(`CDP port ${args.cdpPort} is already in use by another process`);
    }
  }

  return true;
}

export async function ensurePlaywrightChromium(deps: EnsurePlaywrightChromiumDeps) {
  if (deps.isInstalled()) {
    deps.log("Playwright Chromium already installed.");
    return;
  }

  deps.log("Playwright Chromium not found. Installing (this may take a minute)...");
  const manager = deps.findPackageManager();
  if (!manager) {
    throw new Error("No package manager found (tried bun, pnpm, npm)");
  }

  deps.log(`Using ${manager.name} to install Playwright...`);
  await deps.runCommand(manager.command, manager.args);
  deps.log("Chromium installed successfully.");
}

export async function runEntrypoint(args: EntrypointArgs, deps: RunEntrypointDeps) {
  deps.mkdir(deps.runtimePaths.tmpDir, { recursive: true });

  if (args.mode === "extension") {
    const server = await deps.serveExtension({
      port: args.port,
      host: args.host,
    });

    for (const line of formatReadinessLines({
      mode: "extension",
      host: args.host,
      port: args.port,
      wsEndpoint: server.wsEndpoint,
    })) {
      deps.log(line);
    }

    deps.registerShutdown(() => server.stop());
    await deps.keepAlive();
    return;
  }

  deps.mkdir(deps.runtimePaths.profileDir, { recursive: true });

  const shouldStart = await deps.preflightStandalone?.();
  if (shouldStart === false) {
    return;
  }

  await deps.ensureBrowser?.();

  const server = await deps.serveStandalone({
    port: args.port,
    host: args.host,
    headless: args.headless,
    cdpPort: args.cdpPort,
    profileDir: deps.runtimePaths.profileDir,
  });

  for (const line of formatReadinessLines({
    mode: "standalone",
    host: args.host,
    port: args.port,
    wsEndpoint: server.wsEndpoint,
    tmpDir: deps.runtimePaths.tmpDir,
    profileDir: deps.runtimePaths.profileDir,
  })) {
    deps.log(line);
  }

  deps.registerShutdown(() => server.stop());
  await deps.keepAlive();
}
