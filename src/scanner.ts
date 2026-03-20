import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import fg from 'fast-glob';
import type {
  ArtifactPattern,
  DevcleanConfig,
  FoundArtifact,
  ScanResult,
} from './types.js';

/** Unique pattern directory names used to skip recursion into artifact dirs. */
const ARTIFACT_DIR_NAMES = new Set([
  'node_modules', 'target', '.next', '.nuxt', 'dist', 'build',
  '.output', '.parcel-cache', '.turbo', '.angular', '.svelte-kit',
  'venv', '.venv', 'env', '__pycache__', '.mypy_cache', '.pytest_cache',
  '.ruff_cache', '.gradle', '.idea', '.terraform', 'vendor', 'Pods',
  'bin', 'obj', 'coverage', '.cache', '.tmp', '.dart_tool',
]);

/** Recursively calculate total size of a directory in bytes. */
export async function getDirectorySize(dirPath: string): Promise<number> {
  let total = 0;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const tasks: Promise<number>[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isFile()) {
        tasks.push(
          fs.stat(fullPath).then((s) => s.size).catch(() => 0),
        );
      } else if (entry.isDirectory()) {
        tasks.push(getDirectorySize(fullPath));
      }
    }
    const sizes = await Promise.all(tasks);
    for (const s of sizes) total += s;
  } catch {
    // Permission denied or deleted mid-scan — skip
  }
  return total;
}

/** Resolve ~ to home directory and normalize a path. */
function resolveUserPath(p: string): string {
  if (p.startsWith('~')) {
    return path.normalize(path.join(os.homedir(), p.slice(1)));
  }
  return path.normalize(path.resolve(p));
}

/** Check if a directory is inside a protected path. */
export async function isProtected(
  dirPath: string,
  config: DevcleanConfig,
): Promise<boolean> {
  const normalized = path.normalize(dirPath);
  for (const protectedPath of config.protect) {
    const resolved = resolveUserPath(protectedPath);
    if (normalized === resolved || normalized.startsWith(resolved + path.sep)) {
      return true;
    }
  }
  return false;
}

/** Check if a directory matches any ignore pattern. */
export function matchesIgnorePattern(
  dirPath: string,
  ignorePaths: string[],
): boolean {
  const normalized = path.normalize(dirPath);
  for (const pattern of ignorePaths) {
    const resolved = resolveUserPath(pattern);
    if (normalized === resolved || normalized.startsWith(resolved + path.sep)) {
      return true;
    }
  }
  return false;
}

/** Check if the parent directory contains at least one of the expected project files. */
export async function hasProjectFile(
  artifactDir: string,
  projectFiles: string[],
): Promise<boolean> {
  if (projectFiles.length === 0) return true;
  const parentDir = path.dirname(artifactDir);
  for (const file of projectFiles) {
    try {
      await fs.access(path.join(parentDir, file));
      return true;
    } catch {
      // File doesn't exist — try next
    }
  }
  return false;
}

/** Build glob patterns for all artifact patterns to search. */
function buildGlobPatterns(patterns: ArtifactPattern[]): string[] {
  const seen = new Set<string>();
  const globs: string[] = [];
  for (const pattern of patterns) {
    for (const p of pattern.patterns) {
      const glob = `**/${p}`;
      if (!seen.has(glob)) {
        seen.add(glob);
        globs.push(glob);
      }
    }
  }
  return globs;
}

/** Build fast-glob ignore list to avoid recursing into artifact dirs and .git. */
function buildIgnorePatterns(): string[] {
  return [
    '**/.git/**',
    ...Array.from(ARTIFACT_DIR_NAMES).map((d) => `**/${d}/**/${d}`),
  ];
}

/** Map a found path to its matching ArtifactPattern(s). */
function findMatchingPattern(
  foundPath: string,
  patterns: ArtifactPattern[],
): ArtifactPattern | undefined {
  const dirName = path.basename(foundPath);
  return patterns.find((p) =>
    p.patterns.some((pat) => {
      if (pat.includes('*')) {
        return fg.isDynamicPattern(pat) && new RegExp(
          '^' + pat.replace(/\*/g, '.*') + '$',
        ).test(dirName);
      }
      return dirName === pat || foundPath.endsWith(path.sep + pat);
    }),
  );
}

/** Process a single found directory: validate, measure, build artifact. */
async function processFoundDir(
  dirPath: string,
  pattern: ArtifactPattern,
  config: DevcleanConfig,
): Promise<FoundArtifact | null> {
  const normalized = path.normalize(path.resolve(dirPath));
  if (await isProtected(normalized, config)) return null;
  if (matchesIgnorePattern(normalized, config.ignorePaths)) return null;
  if (!(await hasProjectFile(normalized, pattern.projectFiles))) return null;

  try {
    const [sizeBytes, stat] = await Promise.all([
      getDirectorySize(normalized),
      fs.stat(normalized),
    ]);
    return {
      path: normalized,
      pattern,
      sizeBytes,
      lastModified: stat.mtime,
      selected: false,
    };
  } catch {
    return null;
  }
}

/** Scan a root directory for artifact folders matching known patterns. */
export async function scanDirectory(
  rootPath: string,
  patterns: ArtifactPattern[],
  config: DevcleanConfig,
  onProgress?: (scanned: number, found: number) => void,
): Promise<ScanResult> {
  const startTime = Date.now();
  const resolvedRoot = path.resolve(rootPath);
  const globs = buildGlobPatterns(patterns);
  const ignorePatterns = buildIgnorePatterns();

  const stream = fg.stream(globs, {
    cwd: resolvedRoot,
    onlyDirectories: true,
    absolute: true,
    followSymbolicLinks: false,
    ignore: ignorePatterns,
    dot: true,
    suppressErrors: true,
  });

  const artifacts: FoundArtifact[] = [];
  let scanned = 0;

  for await (const entry of stream) {
    scanned++;
    const dirPath = entry.toString();
    const pattern = findMatchingPattern(dirPath, patterns);
    if (!pattern) continue;

    const artifact = await processFoundDir(dirPath, pattern, config);
    if (artifact) {
      artifacts.push(artifact);
    }
    onProgress?.(scanned, artifacts.length);
  }

  return {
    artifacts,
    totalSize: artifacts.reduce((sum, a) => sum + a.sizeBytes, 0),
    scanDurationMs: Date.now() - startTime,
    directoriesScanned: scanned,
  };
}
