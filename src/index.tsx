#!/usr/bin/env node
import { createElement } from "react";
import { render } from "ink";
import updateNotifier from "update-notifier";
import App from "./app.js";

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

render(
  createElement(App, {
    version: pkg.version,
    updateInfo,
  }),
);
