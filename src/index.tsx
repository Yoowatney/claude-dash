#!/usr/bin/env node
import { createElement } from "react";
import { render } from "ink";
import updateNotifier from "update-notifier";
import App from "./app.js";
import ErrorBoundary from "./components/ErrorBoundary.js";

const ISSUES_URL = "https://github.com/Yoowatney/claudive/issues/new";

function showCrashMessage(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  const title = encodeURIComponent(`Bug: ${msg.slice(0, 80)}`);

  // Unmount Ink first so it doesn't clear our output
  if (inkInstance) {
    inkInstance.unmount();
    inkInstance.cleanup();
  }

  process.stderr.write("\n");
  process.stderr.write("  \x1b[31m\x1b[1mclaudive crashed\x1b[0m\n");
  process.stderr.write("\n");
  process.stderr.write(`  ${msg}\n`);
  process.stderr.write("\n");
  process.stderr.write("  \x1b[33mPlease report this issue:\x1b[0m\n");
  process.stderr.write(`  \x1b[36m${ISSUES_URL}?title=${title}\x1b[0m\n`);
  process.stderr.write("\n");

  if (err instanceof Error && err.stack) {
    const stackLines = err.stack.split("\n").slice(1, 5);
    process.stderr.write("  \x1b[2m" + stackLines.join("\n  ") + "\x1b[0m\n");
    process.stderr.write("\n");
  }
}

let inkInstance: ReturnType<typeof render> | null = null;

process.on("uncaughtException", (err) => {
  showCrashMessage(err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  showCrashMessage(reason);
  process.exit(1);
});

// Read package version
let pkg = { name: "@yoyoyoyoo/claude-dash", version: "0.0.0" };
try {
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  pkg = require("../package.json") as typeof pkg;
} catch {
  // ignore
}

// Check for updates
const notifier = updateNotifier({ pkg, updateCheckInterval: 0 });
if (!notifier.update) {
  await notifier.fetchInfo();
}

const updateInfo =
  notifier.update && notifier.update.latest !== pkg.version
    ? { current: pkg.version, latest: notifier.update.latest }
    : null;

// Migrate from old config directory (~/.config/claudash → ~/.config/claudive)
import { migrateConfig } from "./lib/migrate.js";
migrateConfig();

const isDemo = process.argv.includes("--demo");

inkInstance = render(
  createElement(
    ErrorBoundary,
    null,
    createElement(App, {
      version: pkg.version,
      updateInfo,
      demo: isDemo,
    }),
  ),
);
