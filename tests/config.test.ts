import { describe, it, expect } from 'vitest';
import * as os from 'node:os';
import {
  getDefaultConfig,
  resolveConfigPaths,
  loadConfig,
} from '../src/config.js';

describe('getDefaultConfig', () => {
  it('returns expected defaults', () => {
    const config = getDefaultConfig();
    expect(config.protect).toEqual([]);
    expect(config.autoCleanDays).toBe(30);
    expect(config.scanPaths).toEqual([]);
    expect(config.ignorePaths).toEqual([]);
    expect(config.customArtifacts).toEqual([]);
  });

  it('returns a fresh object each call', () => {
    const a = getDefaultConfig();
    const b = getDefaultConfig();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});

describe('resolveConfigPaths', () => {
  it('resolves ~ to homedir in protect paths', () => {
    const config = getDefaultConfig();
    config.protect = ['~/important'];
    const resolved = resolveConfigPaths(config);
    expect(resolved.protect[0]).toBe(
      `${os.homedir()}/important`,
    );
    expect(resolved.protect[0]).not.toContain('~');
  });

  it('resolves ~ in scanPaths', () => {
    const config = getDefaultConfig();
    config.scanPaths = ['~/projects'];
    const resolved = resolveConfigPaths(config);
    expect(resolved.scanPaths[0]).toContain(os.homedir());
  });

  it('resolves ~ in ignorePaths', () => {
    const config = getDefaultConfig();
    config.ignorePaths = ['~/skip'];
    const resolved = resolveConfigPaths(config);
    expect(resolved.ignorePaths[0]).toContain(os.homedir());
  });

  it('leaves absolute paths unchanged', () => {
    const config = getDefaultConfig();
    config.protect = ['/absolute/path'];
    const resolved = resolveConfigPaths(config);
    expect(resolved.protect[0]).toBe('/absolute/path');
  });

  it('preserves non-path config fields', () => {
    const config = getDefaultConfig();
    config.autoCleanDays = 60;
    config.customArtifacts = [{ name: 'x', pattern: 'x', projectFile: 'y' }];
    const resolved = resolveConfigPaths(config);
    expect(resolved.autoCleanDays).toBe(60);
    expect(resolved.customArtifacts).toEqual(config.customArtifacts);
  });
});

describe('loadConfig', () => {
  it('returns defaults when config file does not exist', async () => {
    // loadConfig catches missing file and returns defaults
    const config = await loadConfig();
    expect(config.autoCleanDays).toBe(30);
    expect(config.protect).toEqual([]);
    expect(config.scanPaths).toEqual([]);
    expect(config.ignorePaths).toEqual([]);
  });
});
