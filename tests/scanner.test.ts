import { describe, it, expect, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  scanDirectory,
  getDirectorySize,
  hasProjectFile,
  matchesIgnorePattern,
} from '../src/scanner.js';
import { ARTIFACT_PATTERNS } from '../src/patterns.js';
import type { DevcleanConfig } from '../src/types.js';

const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'devclean-test-'));

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

/** Create a temp project directory with given structure. */
function createProject(
  name: string,
  projectFile: string,
  artifactDir: string,
): string {
  const projectDir = path.join(TMP_ROOT, name);
  const artifactPath = path.join(projectDir, artifactDir);
  fs.mkdirSync(artifactPath, { recursive: true });
  fs.writeFileSync(path.join(projectDir, projectFile), '{}');
  // Put a small file inside the artifact dir so it has size
  fs.writeFileSync(path.join(artifactPath, 'dummy.txt'), 'hello world');
  return projectDir;
}

afterAll(() => {
  fs.rmSync(TMP_ROOT, { recursive: true, force: true });
});

describe('scanDirectory', () => {
  it('finds node_modules next to package.json', async () => {
    createProject('js-project', 'package.json', 'node_modules');
    const result = await scanDirectory(TMP_ROOT, ARTIFACT_PATTERNS, makeConfig());
    const nm = result.artifacts.find(
      (a) => a.pattern.name === 'node_modules' && a.path.includes('js-project'),
    );
    expect(nm).toBeDefined();
  });

  it('ignores node_modules without package.json', async () => {
    const dir = path.join(TMP_ROOT, 'no-pkg');
    fs.mkdirSync(path.join(dir, 'node_modules'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'node_modules', 'f.txt'), 'x');
    // No package.json created
    const result = await scanDirectory(TMP_ROOT, ARTIFACT_PATTERNS, makeConfig());
    const found = result.artifacts.find(
      (a) => a.pattern.name === 'node_modules' && a.path.includes('no-pkg'),
    );
    expect(found).toBeUndefined();
  });

  it('finds Rust target directory', async () => {
    createProject('rust-project', 'Cargo.toml', 'target');
    const result = await scanDirectory(TMP_ROOT, ARTIFACT_PATTERNS, makeConfig());
    const tgt = result.artifacts.find(
      (a) => a.pattern.name === 'target' && a.path.includes('rust-project'),
    );
    expect(tgt).toBeDefined();
  });

  it('finds Python venv directory', async () => {
    createProject('py-project', 'requirements.txt', 'venv');
    const result = await scanDirectory(TMP_ROOT, ARTIFACT_PATTERNS, makeConfig());
    const venv = result.artifacts.find(
      (a) => a.pattern.name === 'venv' && a.path.includes('py-project'),
    );
    expect(venv).toBeDefined();
  });

  it('respects protect list', async () => {
    const projectDir = createProject('protected-proj', 'package.json', 'node_modules');
    const config = makeConfig({ protect: [projectDir] });
    const result = await scanDirectory(TMP_ROOT, ARTIFACT_PATTERNS, config);
    const found = result.artifacts.find(
      (a) => a.path.includes('protected-proj'),
    );
    expect(found).toBeUndefined();
  });
});

describe('getDirectorySize', () => {
  it('calculates size correctly', async () => {
    const dir = path.join(TMP_ROOT, 'size-test');
    fs.mkdirSync(dir, { recursive: true });
    const content = 'a'.repeat(100);
    fs.writeFileSync(path.join(dir, 'file1.txt'), content);
    fs.writeFileSync(path.join(dir, 'file2.txt'), content);
    const size = await getDirectorySize(dir);
    expect(size).toBe(200);
  });

  it('includes subdirectory files', async () => {
    const dir = path.join(TMP_ROOT, 'size-nested');
    const subdir = path.join(dir, 'sub');
    fs.mkdirSync(subdir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'root.txt'), 'a'.repeat(50));
    fs.writeFileSync(path.join(subdir, 'child.txt'), 'b'.repeat(75));
    const size = await getDirectorySize(dir);
    expect(size).toBe(125);
  });

  it('returns 0 for nonexistent directory', async () => {
    const size = await getDirectorySize('/nonexistent/path/xyz');
    expect(size).toBe(0);
  });
});

describe('hasProjectFile', () => {
  it('returns true when project file exists', async () => {
    const dir = path.join(TMP_ROOT, 'has-proj-file', 'node_modules');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(TMP_ROOT, 'has-proj-file', 'package.json'),
      '{}',
    );
    const result = await hasProjectFile(dir, ['package.json']);
    expect(result).toBe(true);
  });

  it('returns false when project file is missing', async () => {
    const dir = path.join(TMP_ROOT, 'no-proj-file', 'node_modules');
    fs.mkdirSync(dir, { recursive: true });
    const result = await hasProjectFile(dir, ['package.json']);
    expect(result).toBe(false);
  });

  it('returns true when projectFiles is empty', async () => {
    const dir = path.join(TMP_ROOT, 'empty-proj', 'cache');
    fs.mkdirSync(dir, { recursive: true });
    const result = await hasProjectFile(dir, []);
    expect(result).toBe(true);
  });
});

describe('matchesIgnorePattern', () => {
  it('matches exact path', () => {
    expect(matchesIgnorePattern('/foo/bar', ['/foo/bar'])).toBe(true);
  });

  it('matches child path', () => {
    expect(matchesIgnorePattern('/foo/bar/baz', ['/foo/bar'])).toBe(true);
  });

  it('does not match unrelated path', () => {
    expect(matchesIgnorePattern('/other/path', ['/foo/bar'])).toBe(false);
  });

  it('handles empty ignore list', () => {
    expect(matchesIgnorePattern('/any/path', [])).toBe(false);
  });
});
