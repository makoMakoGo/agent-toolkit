import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_HOST,
  formatHttpUrl,
  formatReadinessLines,
  parseEntrypointArgs,
  resolveHostForProbe,
} from "./entrypoint.js";
import { preflightStandaloneStartup } from "./startup.js";

describe("entrypoint host handling", () => {
  it("defaults standalone host to localhost", () => {
    const args = parseEntrypointArgs([], {});

    expect(args.host).toBe(DEFAULT_HOST);
    expect(args.host).toBe("localhost");
  });

  it("formats IPv6 hosts in readiness output", () => {
    expect(formatHttpUrl("::1", 9222)).toBe("http://[::1]:9222");

    expect(
      formatReadinessLines({
        mode: "standalone",
        host: "::1",
        port: 9222,
        wsEndpoint: "ws://127.0.0.1:9223/devtools/browser/test",
        tmpDir: "/tmp/dev-browser",
        profileDir: "/tmp/dev-browser/profile",
      })
    ).toContain("  HTTP: http://[::1]:9222");
  });

  it("normalizes wildcard hosts to a reachable probe target", () => {
    expect(resolveHostForProbe("0.0.0.0")).toBe("127.0.0.1");
    expect(resolveHostForProbe("::")).toBe("::1");
    expect(resolveHostForProbe("[::1]")).toBe("::1");
    expect(resolveHostForProbe("localhost")).toBe("localhost");
  });
});

describe("preflightStandaloneStartup", () => {
  it("checks the configured host before starting", async () => {
    const checkServer = vi.fn().mockResolvedValue({ ok: false });
    const isPortInUse = vi.fn().mockResolvedValue(false);
    const log = vi.fn();

    await expect(
      preflightStandaloneStartup(
        {
          mode: "standalone",
          host: "::1",
          port: 9222,
          cdpPort: 9223,
          headless: false,
        },
        {
          checkServer,
          isPortInUse,
          log,
        }
      )
    ).resolves.toBe(true);

    expect(checkServer).toHaveBeenCalledWith("::1", 9222);
  });

  it("short-circuits when the configured host already has a server", async () => {
    const checkServer = vi.fn().mockResolvedValue({ ok: true, info: { wsEndpoint: "ws://test" } });
    const isPortInUse = vi.fn();
    const log = vi.fn();

    await expect(
      preflightStandaloneStartup(
        {
          mode: "standalone",
          host: "localhost",
          port: 9222,
          cdpPort: 9223,
          headless: false,
        },
        {
          checkServer,
          isPortInUse,
          log,
        }
      )
    ).resolves.toBe(false);

    expect(checkServer).toHaveBeenCalledWith("localhost", 9222);
    expect(isPortInUse).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("Server already running on port 9222");
  });
});
