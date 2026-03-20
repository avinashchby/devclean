import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import type { DevcleanConfig } from './types.js';

/** Path to the user config file. */
const CONFIG_PATH = path.join(os.homedir(), '.devclean.json');

/** Return sensible default configuration. */
export function getDefaultConfig(): DevcleanConfig {
  return {
    protect: [],
    autoCleanDays: 30,
    scanPaths: [],
    ignorePaths: [],
    customArtifacts: [],
  };
}

/** Resolve ~ to the user's home directory in all path arrays. */
export function resolveConfigPaths(config: DevcleanConfig): DevcleanConfig {
  const homeDir = os.homedir();
  const resolve = (p: string): string =>
    p.startsWith('~') ? path.join(homeDir, p.slice(1)) : p;

  return {
    ...config,
    protect: config.protect.map(resolve),
    scanPaths: config.scanPaths.map(resolve),
    ignorePaths: config.ignorePaths.map(resolve),
  };
}

/** Load config from ~/.devclean.json, returning defaults if missing or invalid. */
export async function loadConfig(): Promise<DevcleanConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DevcleanConfig>;
    const defaults = getDefaultConfig();
    return resolveConfigPaths({ ...defaults, ...parsed });
  } catch {
    return resolveConfigPaths(getDefaultConfig());
  }
}

/** Save config to ~/.devclean.json. */
export async function saveConfig(config: DevcleanConfig): Promise<void> {
  const json = JSON.stringify(config, null, 2);
  await fs.writeFile(CONFIG_PATH, json, 'utf-8');
}
