import { describe, it, expect } from 'vitest';
import * as os from 'node:os';
import {
  isPathSafe,
  isInsideGit,
  isProtectedPath,
  validateArtifact,
} from '../src/safety.js';
import type { FoundArtifact, ArtifactPattern, DevcleanConfig } from '../src/types.js';

function makePattern(): ArtifactPattern {
  return {
    name: 'test',
    patterns: ['test'],
    projectFiles: [],
    language: 'Test',
    description: 'test',
  };
}

function makeArtifact(artifactPath: string): FoundArtifact {
  return {
    path: artifactPath,
    pattern: makePattern(),
    sizeBytes: 1000,
    lastModified: new Date(),
    selected: false,
  };
}

function makeConfig(overrides: Partial<DevcleanConfig> = {}): DevcleanConfig {
  return {
    protect: [],
    autoCleanDays: 30,
    scanPaths: [],
    ignorePaths: [],
    customArtifacts: [],
    ...overrides,
  };
}

describe('isPathSafe', () => {
  it('rejects root directory', () => {
    expect(isPathSafe('/')).toBe(false);
  });

  it('rejects /usr', () => {
    expect(isPathSafe('/usr')).toBe(false);
  });

  it('rejects /etc', () => {
    expect(isPathSafe('/etc')).toBe(false);
  });

  it('rejects home directory itself', () => {
    expect(isPathSafe(os.homedir())).toBe(false);
  });

  it('allows normal project paths', () => {
    expect(isPathSafe('/home/user/projects/myapp/node_modules')).toBe(true);
    expect(isPathSafe('/Users/dev/code/target')).toBe(true);
  });

  it('allows subdirectories of home', () => {
    expect(isPathSafe(`${os.homedir()}/projects/node_modules`)).toBe(true);
  });
});

describe('isInsideGit', () => {
  it('detects .git in path', () => {
    expect(isInsideGit('/home/user/project/.git/objects')).toBe(true);
    expect(isInsideGit('/repo/.git/hooks')).toBe(true);
  });

  it('allows paths without .git', () => {
    expect(isInsideGit('/home/user/project/node_modules')).toBe(false);
    expect(isInsideGit('/home/user/.github/workflows')).toBe(false);
  });
});

describe('isProtectedPath', () => {
  it('detects exact protected path', () => {
    expect(isProtectedPath('/important/project', ['/important/project'])).toBe(true);
  });

  it('detects child of protected path', () => {
    expect(
      isProtectedPath('/important/project/node_modules', ['/important/project']),
    ).toBe(true);
  });

  it('allows unprotected paths', () => {
    expect(
      isProtectedPath('/other/project/node_modules', ['/important/project']),
    ).toBe(false);
  });

  it('handles empty protect list', () => {
    expect(isProtectedPath('/any/path', [])).toBe(false);
  });
});

describe('validateArtifact', () => {
  it('returns safe for normal artifact', () => {
    const artifact = makeArtifact('/home/user/project/node_modules');
    const result = validateArtifact(artifact, makeConfig());
    expect(result.safe).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('rejects system directory artifact', () => {
    const artifact = makeArtifact('/');
    const result = validateArtifact(artifact, makeConfig());
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('system');
  });

  it('rejects .git artifact', () => {
    const artifact = makeArtifact('/project/.git/objects');
    const result = validateArtifact(artifact, makeConfig());
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('.git');
  });

  it('rejects protected path artifact', () => {
    const protectedDir = '/important/project';
    const artifact = makeArtifact(`${protectedDir}/node_modules`);
    const config = makeConfig({ protect: [protectedDir] });
    const result = validateArtifact(artifact, config);
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('protected');
  });
});
