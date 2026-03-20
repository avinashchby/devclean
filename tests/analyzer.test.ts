import { describe, it, expect } from 'vitest';
import {
  analyzeResults,
  formatSize,
  formatAge,
  groupByType,
} from '../src/analyzer.js';
import type { FoundArtifact, ArtifactPattern } from '../src/types.js';

/** Helper to create a test pattern. */
function makePattern(name: string): ArtifactPattern {
  return {
    name,
    patterns: [name],
    projectFiles: [],
    language: 'Test',
    description: `${name} desc`,
  };
}

/** Helper to create a test artifact. */
function makeArtifact(
  overrides: Partial<FoundArtifact> & { name?: string },
): FoundArtifact {
  const patternName = overrides.name ?? 'test';
  return {
    path: `/fake/${patternName}`,
    pattern: overrides.pattern ?? makePattern(patternName),
    sizeBytes: overrides.sizeBytes ?? 1000,
    lastModified: overrides.lastModified ?? new Date(),
    selected: overrides.selected ?? false,
  };
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

describe('analyzeResults sorting', () => {
  it('sorts by size descending', () => {
    const artifacts = [
      makeArtifact({ sizeBytes: 100 }),
      makeArtifact({ sizeBytes: 500 }),
      makeArtifact({ sizeBytes: 200 }),
    ];
    const result = analyzeResults(artifacts, { sortBy: 'size' });
    expect(result[0].sizeBytes).toBe(500);
    expect(result[1].sizeBytes).toBe(200);
    expect(result[2].sizeBytes).toBe(100);
  });

  it('sorts by age oldest first', () => {
    const old = daysAgo(90);
    const recent = daysAgo(1);
    const mid = daysAgo(30);
    const artifacts = [
      makeArtifact({ lastModified: recent }),
      makeArtifact({ lastModified: old }),
      makeArtifact({ lastModified: mid }),
    ];
    const result = analyzeResults(artifacts, { sortBy: 'age' });
    expect(result[0].lastModified).toEqual(old);
    expect(result[1].lastModified).toEqual(mid);
    expect(result[2].lastModified).toEqual(recent);
  });
});

describe('analyzeResults filtering', () => {
  it('filters by minimum size', () => {
    const artifacts = [
      makeArtifact({ sizeBytes: 50 }),
      makeArtifact({ sizeBytes: 500 }),
      makeArtifact({ sizeBytes: 1500 }),
    ];
    const result = analyzeResults(artifacts, {
      sortBy: 'size',
      minSizeBytes: 100,
    });
    expect(result.length).toBe(2);
    expect(result.every((a) => a.sizeBytes >= 100)).toBe(true);
  });

  it('filters by type', () => {
    const nm = makePattern('node_modules');
    const tgt = makePattern('target');
    const artifacts = [
      makeArtifact({ pattern: nm }),
      makeArtifact({ pattern: tgt }),
      makeArtifact({ pattern: nm }),
    ];
    const result = analyzeResults(artifacts, {
      sortBy: 'size',
      types: ['node_modules'],
    });
    expect(result.length).toBe(2);
    expect(result.every((a) => a.pattern.name === 'node_modules')).toBe(true);
  });
});

describe('applyAutoSelect via analyzeResults', () => {
  it('selects old artifacts, skips recent ones', () => {
    const artifacts = [
      makeArtifact({ lastModified: daysAgo(60) }),
      makeArtifact({ lastModified: daysAgo(2) }),
      makeArtifact({ lastModified: daysAgo(31) }),
    ];
    const result = analyzeResults(artifacts, {
      sortBy: 'size',
      autoSelectDays: 30,
    });
    const selected = result.filter((a) => a.selected);
    const unselected = result.filter((a) => !a.selected);
    expect(selected.length).toBe(2);
    expect(unselected.length).toBe(1);
  });

  it('respects MIN_SAFE_AGE_DAYS of 7', () => {
    const artifacts = [
      makeArtifact({ lastModified: daysAgo(5) }),
    ];
    // autoSelectDays=3 but MIN_SAFE_AGE_DAYS=7, so 5-day-old should NOT be selected
    const result = analyzeResults(artifacts, {
      sortBy: 'size',
      autoSelectDays: 3,
    });
    expect(result[0].selected).toBe(false);
  });
});

describe('formatSize', () => {
  it('formats bytes', () => {
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(0)).toBe('0 B');
  });

  it('formats KB', () => {
    expect(formatSize(1024)).toBe('1.0 KB');
    expect(formatSize(2048)).toBe('2.0 KB');
  });

  it('formats MB', () => {
    expect(formatSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatSize(5.5 * 1024 * 1024)).toBe('5.5 MB');
  });

  it('formats GB', () => {
    expect(formatSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    expect(formatSize(2.3 * 1024 * 1024 * 1024)).toBe('2.3 GB');
  });
});

describe('formatAge', () => {
  it('formats today', () => {
    expect(formatAge(new Date())).toBe('today');
  });

  it('formats days', () => {
    expect(formatAge(daysAgo(1.5))).toBe('1 day ago');
    expect(formatAge(daysAgo(15))).toBe('15 days ago');
  });

  it('formats months', () => {
    expect(formatAge(daysAgo(45))).toBe('1 month ago');
    expect(formatAge(daysAgo(90))).toBe('3 months ago');
  });

  it('formats years', () => {
    expect(formatAge(daysAgo(400))).toBe('1 year ago');
    expect(formatAge(daysAgo(800))).toBe('2 years ago');
  });
});

describe('groupByType', () => {
  it('groups correctly', () => {
    const nm = makePattern('node_modules');
    const tgt = makePattern('target');
    const artifacts = [
      makeArtifact({ pattern: nm, sizeBytes: 100 }),
      makeArtifact({ pattern: nm, sizeBytes: 200 }),
      makeArtifact({ pattern: tgt, sizeBytes: 500 }),
    ];
    const groups = groupByType(artifacts);
    expect(groups.size).toBe(2);
    expect(groups.get('node_modules')).toEqual({ count: 2, totalSize: 300 });
    expect(groups.get('target')).toEqual({ count: 1, totalSize: 500 });
  });

  it('returns empty map for empty input', () => {
    const groups = groupByType([]);
    expect(groups.size).toBe(0);
  });
});
