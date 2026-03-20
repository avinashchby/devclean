import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { GlobalCache } from './types.js';

const execAsync = promisify(exec);

/** Known global cache locations keyed by tool name. */
interface CacheDef {
  name: string;
  paths: string[];
  command?: string;
}

/** Return platform-appropriate cache definitions. */
function getCacheDefs(): CacheDef[] {
  const home = os.homedir();
  const isMac = process.platform === 'darwin';

  return [
    {
      name: 'npm',
      paths: [path.join(home, '.npm', '_cacache')],
      command: 'npm cache clean --force',
    },
    {
      name: 'yarn',
      paths: isMac
        ? [path.join(home, 'Library', 'Caches', 'Yarn')]
        : [path.join(home, '.cache', 'yarn')],
      command: 'yarn cache clean',
    },
    {
      name: 'pnpm',
      paths: [path.join(home, '.local', 'share', 'pnpm', 'store')],
      command: 'pnpm store prune',
    },
    {
      name: 'Go build',
      paths: [path.join(home, '.cache', 'go-build')],
      command: 'go clean -cache',
    },
    {
      name: 'pip',
      paths: isMac
        ? [path.join(home, 'Library', 'Caches', 'pip')]
        : [path.join(home, '.cache', 'pip')],
      command: 'pip cache purge',
    },
    {
      name: 'cargo registry',
      paths: [path.join(home, '.cargo', 'registry')],
    },
  ];
}

/** Calculate total size of a directory recursively. */
async function getDirSize(dirPath: string): Promise<number> {
  let total = 0;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += await getDirSize(fullPath);
      } else {
        const stat = await fs.stat(fullPath);
        total += stat.size;
      }
    }
  } catch {
    // Directory unreadable or missing — return 0
  }
  return total;
}

/** Find the first existing path from a list of candidates. */
async function findExistingPath(
  candidates: string[],
): Promise<string | null> {
  for (const p of candidates) {
    try {
      await fs.access(p);
      return p;
    } catch {
      // path does not exist
    }
  }
  return null;
}

/** Detect all known global tool caches present on this system. */
export async function detectGlobalCaches(): Promise<GlobalCache[]> {
  const defs = getCacheDefs();
  const caches: GlobalCache[] = [];

  for (const def of defs) {
    const existing = await findExistingPath(def.paths);
    if (existing) {
      const sizeBytes = await getDirSize(existing);
      caches.push({
        name: def.name,
        path: existing,
        command: def.command,
        sizeBytes,
      });
    }
  }

  return caches;
}

/** Clean a global cache using its command or direct removal. */
export async function cleanGlobalCache(
  cache: GlobalCache,
  dryRun: boolean,
): Promise<{ freedBytes: number; error?: string }> {
  if (dryRun) {
    return { freedBytes: cache.sizeBytes };
  }

  try {
    if (cache.command) {
      await execAsync(cache.command);
    } else {
      await fs.rm(cache.path, { recursive: true, force: true });
    }
    return { freedBytes: cache.sizeBytes };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { freedBytes: 0, error: message };
  }
}
