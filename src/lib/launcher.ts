import { execSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

type LaunchMode = "inline" | "tmux" | "iterm2-tab" | "terminal-app" | "print";

interface Config {
  launchMode: LaunchMode;
}

const CONFIG_PATH = join(homedir(), ".config", "claudash", "config.json");

function loadConfig(): Config {
  try {
    if (existsSync(CONFIG_PATH)) {
      return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch {
    // ignore
  }

  const mode = detectMode();
  saveConfig({ launchMode: mode });
  return { launchMode: mode };
}

function detectMode(): LaunchMode {
  // Default: run in the same terminal
  return "inline";
}

function saveConfig(config: Config): void {
  const dir = join(homedir(), ".config", "claudash");
  try {
    execSync(`mkdir -p "${dir}"`);
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch {
    // ignore
  }
}

function launchTmux(sessionId: string, projectPath: string): void {
  const shortId = sessionId.slice(0, 8);
  try {
    execSync(
      `tmux new-window -n "claude:${shortId}" -c "${projectPath}" 'claude --resume "${sessionId}"'`,
    );
  } catch {
    console.log(`\nFailed to open tmux window. Run manually:`);
    console.log(`  cd "${projectPath}" && claude --resume "${sessionId}"\n`);
  }
}

function launchIterm2Tab(sessionId: string, projectPath: string): void {
  const script = `
    tell application "iTerm"
      activate
      tell current window
        create tab with default profile
        tell current session
          write text "cd \\"${projectPath}\\" && claude --resume \\"${sessionId}\\""
        end tell
      end tell
    end tell
  `;
  try {
    execSync(`osascript -e '${script}'`);
  } catch {
    console.log(`\nRun manually:`);
    console.log(`  cd "${projectPath}" && claude --resume "${sessionId}"\n`);
  }
}

function launchTerminalApp(sessionId: string, projectPath: string): void {
  const script = `
    tell application "Terminal"
      activate
      do script "cd \\"${projectPath}\\" && claude --resume \\"${sessionId}\\""
    end tell
  `;
  try {
    execSync(`osascript -e '${script}'`);
  } catch {
    console.log(`\nRun manually:`);
    console.log(`  cd "${projectPath}" && claude --resume "${sessionId}"\n`);
  }
}

function launchInline(sessionId: string, projectPath: string): void {
  process.chdir(projectPath);
  spawnSync("claude", ["--resume", sessionId], { stdio: "inherit" });
}

export function resumeSession(sessionId: string, projectPath: string): void {
  const config = loadConfig();

  switch (config.launchMode) {
    case "inline":
      launchInline(sessionId, projectPath);
      break;
    case "tmux":
      launchTmux(sessionId, projectPath);
      break;
    case "iterm2-tab":
      launchIterm2Tab(sessionId, projectPath);
      break;
    case "terminal-app":
      launchTerminalApp(sessionId, projectPath);
      break;
    case "print":
    default:
      console.log(
        `\n  cd "${projectPath}" && claude --resume "${sessionId}"\n`,
      );
      break;
  }
}

export { type LaunchMode, type Config, CONFIG_PATH, loadConfig, saveConfig };
