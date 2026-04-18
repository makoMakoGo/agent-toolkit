---
name: dev-browser
description: Browser automation with persistent page state. Use when users ask to navigate websites, fill forms, take screenshots, extract web data, test web apps, or automate browser workflows. Trigger phrases include "go to [url]", "click on", "fill out the form", "take a screenshot", "scrape", "automate", "test the website", "log into", or any browser interaction request.
---

# Dev Browser Skill

Browser automation that maintains page state across script executions. Write small, focused scripts to accomplish tasks incrementally. Once you've proven out part of a workflow and there is repeated work to be done, you can write a script to do the repeated work in a single execution.

## Choosing Your Approach

- **Local/source-available sites**: Read the source code first to write selectors directly
- **Unknown page layouts**: Use `getAISnapshot()` to discover elements and `selectSnapshotRef()` to interact with them
- **Visual feedback**: Take screenshots to see what the user sees

## Setup

Two supported startup modes are available on **Linux** and **native Windows**. Run the following commands from the installed `dev-browser` skill directory. Bash, Git Bash, and WSL are not required.

### Standalone Mode (Default)

Launches a new Chromium browser for fresh automation sessions.

```text
npx tsx scripts/start.ts standalone
```

Add `--headless` if needed:

```text
npx tsx scripts/start.ts standalone --headless
```

Wait for the stable readiness line `Ready` before running scripts.

### Extension Mode

Connects to the user's existing Chrome browser. Use this when:

- The user is already logged into sites and wants you to do things behind an authed experience that isn't local dev.
- The user asks you to use the extension.

Start the relay server with:

```text
npx tsx scripts/start.ts extension
```

Wait for `Waiting for extension to connect...`. Once the browser extension attaches, the relay logs `Extension connected`.

If the extension hasn't connected yet, tell the user to launch and activate it. Download link: https://github.com/SawyerHood/dev-browser/releases

## Support Matrix

| Mode | Linux | Native Windows | Readiness signal | Notes |
|------|-------|----------------|------------------|-------|
| standalone mode | Supported | Supported | `Ready` | Launches a managed Chromium profile under `profiles/` |
| extension mode | Supported | Supported | `Waiting for extension to connect...` then `Extension connected` | Requires the external browser extension to attach |

## Verification Checklist

- Start `standalone mode` with `npx tsx scripts/start.ts standalone`
- Observe the readiness line `Ready`
- Connect with `connect()` and create a named page
- Start `extension mode` with `npx tsx scripts/start.ts extension`
- Observe `Waiting for extension to connect...`
- Attach the browser extension and confirm `Extension connected`

## Known Differences

- `standalone mode` launches and owns its own Chromium profile under this skill directory.
- `extension mode` depends on the external browser extension and the user's existing Chrome session.
- In `extension mode`, relay readiness means the server is waiting for the extension; it does not imply browser control is available until `Extension connected` appears.
- `standalone mode` is the default path for deterministic local automation; `extension mode` is for working inside an already-authenticated browser.

## Non-goal Environments

- `WSL` and `Git Bash` are not part of the supported Windows path for this skill.
- Native Windows support means PowerShell / Command Prompt can use the documented entrypoints directly.
- If a user runs inside WSL or Git Bash, treat that as a separate environment rather than the official Windows support contract.

## Writing Scripts

Use small TypeScript files under `tmp/` instead of shell heredocs. Run them from the same `dev-browser` skill directory so the `@/` import alias resolves correctly.

Example script (`tmp/example.ts`):

```typescript
import { connect, waitForPageLoad } from "@/client.js";

const client = await connect();
const page = await client.page("example", { viewport: { width: 1920, height: 1080 } });

await page.goto("https://example.com");
await waitForPageLoad(page);

console.log({ title: await page.title(), url: page.url() });
await client.disconnect();
```

Run it with:

```text
npx tsx tmp/example.ts
```

**Write to `tmp/` files only when** the script needs reuse, is complex, or user explicitly requests it.

### Key Principles

1. **Small scripts**: Each script does ONE thing (navigate, click, fill, check)
2. **Evaluate state**: Log/return state at the end to decide next steps
3. **Descriptive page names**: Use `"checkout"`, `"login"`, not `"main"`
4. **Disconnect to exit**: `await client.disconnect()` - pages persist on server
5. **Plain JS in evaluate**: `page.evaluate()` runs in browser - no TypeScript syntax

## Workflow Loop

Follow this pattern for complex tasks:

1. **Write a script** to perform one action
2. **Run it** and observe the output
3. **Evaluate** - did it work? What's the current state?
4. **Decide** - is the task complete or do we need another script?
5. **Repeat** until task is done

### No TypeScript in Browser Context

Code passed to `page.evaluate()` runs in the browser, which doesn't understand TypeScript:

```typescript
// ✅ Correct: plain JavaScript
const text = await page.evaluate(() => {
  return document.body.innerText;
});

// ❌ Wrong: TypeScript syntax will fail at runtime
const text = await page.evaluate(() => {
  const el: HTMLElement = document.body; // Type annotation breaks in browser!
  return el.innerText;
});
```

## Scraping Data

For scraping large datasets, intercept and replay network requests rather than scrolling the DOM. See [references/scraping.md](references/scraping.md) for the complete guide covering request capture, schema discovery, and paginated API replay.

## Client API

```typescript
const client = await connect();

// Get or create named page (viewport only applies to new pages)
const page = await client.page("name");
const pageWithSize = await client.page("name", { viewport: { width: 1920, height: 1080 } });

const pages = await client.list(); // List all page names
await client.close("name"); // Close a page
await client.disconnect(); // Disconnect (pages persist)

// ARIA Snapshot methods
const snapshot = await client.getAISnapshot("name"); // Get accessibility tree
const element = await client.selectSnapshotRef("name", "e5"); // Get element by ref
```

The `page` object is a standard Playwright Page.

## Waiting

```typescript
import { waitForPageLoad } from "@/client.js";

await waitForPageLoad(page); // After navigation
await page.waitForSelector(".results"); // For specific elements
await page.waitForURL("**/success"); // For specific URL
```

## Inspecting Page State

### Screenshots

```typescript
await page.screenshot({ path: "tmp/screenshot.png" });
await page.screenshot({ path: "tmp/full.png", fullPage: true });
```

### ARIA Snapshot (Element Discovery)

Use `getAISnapshot()` to discover page elements. Returns YAML-formatted accessibility tree:

```yaml
- banner:
  - link "Hacker News" [ref=e1]
  - navigation:
    - link "new" [ref=e2]
- main:
  - list:
    - listitem:
      - link "Article Title" [ref=e8]
      - link "328 comments" [ref=e9]
- contentinfo:
  - textbox [ref=e10]
    - /placeholder: "Search"
```

**Interpreting refs:**

- `[ref=eN]` - Element reference for interaction (visible, clickable elements only)
- `[checked]`, `[disabled]`, `[expanded]` - Element states
- `[level=N]` - Heading level
- `/url:`, `/placeholder:` - Element properties

**Interacting with refs:**

```typescript
const snapshot = await client.getAISnapshot("hackernews");
console.log(snapshot); // Find the ref you need

const element = await client.selectSnapshotRef("hackernews", "e2");
await element.click();
```

## Error Recovery

Page state persists after failures. To inspect the current state, save a short script such as `tmp/debug.ts` and run it from the `dev-browser` skill directory:

```typescript
import { connect } from "@/client.js";

const client = await connect();
const page = await client.page("hackernews");

await page.screenshot({ path: "tmp/debug.png" });
console.log({
  url: page.url(),
  title: await page.title(),
  bodyText: await page.textContent("body").then((t) => t?.slice(0, 200)),
});

await client.disconnect();
```

Run it with:

```text
npx tsx tmp/debug.ts
```
