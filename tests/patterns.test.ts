import { describe, it, expect } from 'vitest';
import {
  ARTIFACT_PATTERNS,
  getPatternByName,
  getAllPatternNames,
} from '../src/patterns.js';

describe('ARTIFACT_PATTERNS', () => {
  it('has expected count of patterns', () => {
    // 10 JS + 1 Rust + 11 Python + 1 Go + 4 Java + 3 C++ + 1 Ruby + 1 PHP + 2 .NET + 4 General = 38
    expect(ARTIFACT_PATTERNS.length).toBe(38);
  });

  it('each pattern has required fields', () => {
    for (const p of ARTIFACT_PATTERNS) {
      expect(p.name).toBeTruthy();
      expect(p.patterns.length).toBeGreaterThan(0);
      expect(p.language).toBeTruthy();
      expect(p.description).toBeTruthy();
    }
  });
});

describe('getPatternByName', () => {
  it('returns correct pattern for node_modules', () => {
    const pattern = getPatternByName('node_modules');
    expect(pattern).toBeDefined();
    expect(pattern!.name).toBe('node_modules');
    expect(pattern!.language).toBe('JavaScript/TypeScript');
    expect(pattern!.patterns).toContain('node_modules');
  });

  it('returns correct pattern for target (Rust)', () => {
    const pattern = getPatternByName('target');
    expect(pattern).toBeDefined();
    expect(pattern!.language).toBe('Rust');
  });

  it('returns undefined for unknown names', () => {
    expect(getPatternByName('nonexistent')).toBeUndefined();
    expect(getPatternByName('')).toBeUndefined();
    expect(getPatternByName('NODE_MODULES')).toBeUndefined();
  });
});

describe('getAllPatternNames', () => {
  it('returns all pattern names', () => {
    const names = getAllPatternNames();
    expect(names.length).toBe(ARTIFACT_PATTERNS.length);
    expect(names).toContain('node_modules');
    expect(names).toContain('target');
    expect(names).toContain('venv');
    expect(names).toContain('vendor');
  });

  it('returns unique names', () => {
    const names = getAllPatternNames();
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

describe('language coverage', () => {
  const languages = [
    'JavaScript/TypeScript',
    'Rust',
    'Python',
    'Go',
    'Java/Kotlin',
    'C/C++',
    'Ruby',
    'PHP',
    '.NET',
    'General',
  ];

  it.each(languages)('%s has at least one pattern', (lang) => {
    const patterns = ARTIFACT_PATTERNS.filter((p) => p.language === lang);
    expect(patterns.length).toBeGreaterThanOrEqual(1);
  });
});

describe('node_modules pattern', () => {
  it('requires package.json as project file', () => {
    const pattern = getPatternByName('node_modules');
    expect(pattern).toBeDefined();
    expect(pattern!.projectFiles).toContain('package.json');
  });
});
