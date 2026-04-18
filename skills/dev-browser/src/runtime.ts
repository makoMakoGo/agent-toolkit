import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface CommandStatusResult {
  status: number | null;
}

export interface PackageManager {
  name: "bun" | "pnpm" | "npm";
  command: string;
  args: string[];
}

export interface ChromiumInstallCheckOptions {
  platform: NodeJS.Platform;
  env: NodeJS.ProcessEnv;
  exists: (path: string) => boolean;
  readDir: (path: string) => string[];
}

export interface MissingPackageDependenciesOptions {
  skillDir: string;
  dependencies: string[];
  exists: (path: string) => boolean;
}

export function commandExists(
  command: string,
  runCheck: (command: string) => CommandStatusResult
): boolean {
  return runCheck(command).status === 0;
}

export function findAvailablePackageManager(
  hasCommand: (command: string) => boolean
): PackageManager | null {
  const candidates: PackageManager[] = [
    {
      name: "bun",
      command: "bunx",
      args: ["playwright", "install", "chromium"],
    },
    {
      name: "pnpm",
      command: "pnpm",
      args: ["exec", "playwright", "install", "chromium"],
    },
    {
      name: "npm",
      command: "npx",
      args: ["playwright", "install", "chromium"],
    },
  ];

  for (const candidate of candidates) {
    const probe = candidate.name === "npm" ? "npm" : candidate.name;
    if (hasCommand(probe)) {
      return candidate;
    }
  }

  return null;
}

export function getPlaywrightInstallCommand(manager: PackageManager): string {
  return [manager.command, ...manager.args].join(" ");
}

export function getPlaywrightBrowserRoots({
  platform,
  env,
}: {
  platform: NodeJS.Platform;
  env: NodeJS.ProcessEnv;
}): string[] {
  const explicitPath = env.PLAYWRIGHT_BROWSERS_PATH?.trim();
  if (explicitPath) {
    return [explicitPath];
  }

  if (platform === "win32") {
    const userProfile = env.USERPROFILE ?? env.HOME;
    return userProfile ? [join(userProfile, "AppData", "Local", "ms-playwright")] : [];
  }

  const home = env.HOME ?? env.USERPROFILE;
  return home ? [join(home, ".cache", "ms-playwright")] : [];
}

export function isPlaywrightChromiumInstalled({
  platform,
  env,
  exists,
  readDir,
}: ChromiumInstallCheckOptions): boolean {
  for (const root of getPlaywrightBrowserRoots({ platform, env })) {
    if (!exists(root)) {
      continue;
    }

    try {
      const entries = readDir(root);
      if (entries.some((entry) => entry.startsWith("chromium"))) {
        return true;
      }
    } catch {
      // Ignore unreadable directories and continue probing.
    }
  }

  return false;
}

export function getMissingPackageDependencies({
  skillDir,
  dependencies,
  exists,
}: MissingPackageDependenciesOptions): string[] {
  return dependencies.filter(
    (dependency) =>
      !exists(join(skillDir, "node_modules", ...dependency.split("/"), "package.json"))
  );
}

export function resolveRuntimePaths(skillDir: string) {
  const tmpDir = join(skillDir, "tmp");
  const profileDir = join(skillDir, "profiles");

  return {
    skillDir,
    tmpDir,
    profileDir,
    browserDataDir: join(profileDir, "browser-data"),
  };
}

export function resolveImportMetaDir(moduleUrl: string): string {
  return dirname(fileURLToPath(moduleUrl));
}

export function resolveSkillDirFromEntrypoint(moduleUrl: string): string {
  return dirname(resolveImportMetaDir(moduleUrl));
}

export function shouldUseShellForPackageCommands(platform: NodeJS.Platform): boolean {
  return platform === "win32";
}
