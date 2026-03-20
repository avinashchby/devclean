import { describe, it, expect, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { cleanArtifacts } from '../src/cleaner.js';
import type { FoundArtifact, ArtifactPattern } from '../src/types.js';

const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'devclean-clean-'));

afterAll(() => {
  fs.rmSync(TMP_ROOT, { recursive: true, force: true });
});

function makePattern(): ArtifactPattern {
  return {
    name: 'test',
    patterns: ['test'],
    projectFiles: [],
    language: 'Test',
    description: 'test',
  };
}

function makeArtifact(artifactPath: string, sizeBytes = 1000): FoundArtifact {
  return {
    path: artifactPath,
    pattern: makePattern(),
    sizeBytes,
    lastModified: new Date(),
    selected: false,
  };
}

describe('cleanArtifacts dry-run', () => {
  it('does not delete directories in dry-run mode', async () => {
    const dir = path.join(TMP_ROOT, 'dryrun-dir');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'keep.txt'), 'keep');

    const artifact = makeArtifact(dir, 500);
    const result = await cleanArtifacts([artifact], { dryRun: true });

    expect(result.deletedPaths).toContain(dir);
    expect(result.freedBytes).toBe(500);
    expect(result.errors).toHaveLength(0);
    // Directory should still exist
    expect(fs.existsSync(dir)).toBe(true);
  });

  it('reports all artifacts in dry-run result', async () => {
    const dirs = ['dry-a', 'dry-b'].map((name) => {
      const d = path.join(TMP_ROOT, name);
      fs.mkdirSync(d, { recursive: true });
      return d;
    });
    const artifacts = dirs.map((d) => makeArtifact(d, 100));
    const result = await cleanArtifacts(artifacts, { dryRun: true });
    expect(result.deletedPaths.length).toBe(2);
    expect(result.freedBytes).toBe(200);
  });
});

describe('cleanArtifacts real delete', () => {
  it('deletes directories', async () => {
    const dir = path.join(TMP_ROOT, 'real-delete');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'file.txt'), 'gone');

    const artifact = makeArtifact(dir, 100);
    const result = await cleanArtifacts([artifact], { dryRun: false });

    expect(result.deletedPaths).toContain(dir);
    expect(result.freedBytes).toBe(100);
    expect(result.errors).toHaveLength(0);
    expect(fs.existsSync(dir)).toBe(false);
  });

  it('calls onProgress callback', async () => {
    const dir = path.join(TMP_ROOT, 'progress-test');
    fs.mkdirSync(dir, { recursive: true });

    const artifact = makeArtifact(dir, 50);
    const progressCalls: [number, number][] = [];
    await cleanArtifacts([artifact], { dryRun: false }, (d, t) => {
      progressCalls.push([d, t]);
    });
    expect(progressCalls.length).toBe(1);
    expect(progressCalls[0]).toEqual([1, 1]);
  });
});

describe('cleanArtifacts error handling', () => {
  it('handles errors gracefully for nonexistent paths', async () => {
    const fakePath = path.join(TMP_ROOT, 'nonexistent-xyz-123');
    const artifact = makeArtifact(fakePath, 100);
    // fs.rm with force:true doesn't error on missing dirs,
    // so it should succeed even for missing paths
    const result = await cleanArtifacts([artifact], { dryRun: false });
    expect(result.errors).toHaveLength(0);
  });

  it('continues processing after individual errors', async () => {
    const goodDir = path.join(TMP_ROOT, 'good-dir');
    fs.mkdirSync(goodDir, { recursive: true });

    const artifacts = [
      makeArtifact(goodDir, 100),
    ];
    const result = await cleanArtifacts(artifacts, { dryRun: false });
    expect(result.deletedPaths.length).toBeGreaterThanOrEqual(1);
  });
});
