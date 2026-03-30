import { existsSync, renameSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const OLD_DIR = join(homedir(), ".config", "claudash");
const NEW_DIR = join(homedir(), ".config", "claudive");

export function migrateConfig(): void {
  if (existsSync(OLD_DIR) && !existsSync(NEW_DIR)) {
    try {
      renameSync(OLD_DIR, NEW_DIR);
    } catch {
      // ignore — user can move manually
    }
  }
}
