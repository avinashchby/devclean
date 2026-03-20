import * as path from 'node:path';
import * as os from 'node:os';
import type { FoundArtifact, DevcleanConfig } from './types.js';

/** System directories that must never be deleted. */
const SYSTEM_DIRS: ReadonlySet<string> = new Set([
  '/',
  '/usr',
  '/etc',
  '/var',
  '/home',
  '/Users',
  '/bin',
  '/sbin',
  '/lib',
  '/tmp',
  '/opt',
  '/System',
  '/Applications',
]);

/** Check whether a path is safe to delete (not a system or home root). */
export function isPathSafe(artifactPath: string): boolean {
  const resolved = path.resolve(artifactPath);
  const homeDir = os.homedir();

  if (SYSTEM_DIRS.has(resolved)) {
    return false;
  }

  // Prevent deleting the home directory itself
  if (resolved === homeDir) {
    return false;
  }

  return true;
}

/** Check whether any path component is .git (avoid deleting git internals). */
export function isInsideGit(artifactPath: string): boolean {
  const resolved = path.resolve(artifactPath);
  const parts = resolved.split(path.sep);
  return parts.includes('.git');
}

/** Check whether the artifact path is inside any protected directory. */
export function isProtectedPath(
  artifactPath: string,
  protectList: string[],
): boolean {
  const resolved = path.resolve(artifactPath);
  return protectList.some((protectedDir) => {
    const resolvedProtected = path.resolve(protectedDir);
    return (
      resolved === resolvedProtected ||
      resolved.startsWith(resolvedProtected + path.sep)
    );
  });
}

/** Combine all safety checks into a single validation. */
export function validateArtifact(
  artifact: FoundArtifact,
  config: DevcleanConfig,
): { safe: boolean; reason?: string } {
  if (!isPathSafe(artifact.path)) {
    return { safe: false, reason: 'Path is a system or home root directory' };
  }

  if (isInsideGit(artifact.path)) {
    return { safe: false, reason: 'Path is inside a .git directory' };
  }

  if (isProtectedPath(artifact.path, config.protect)) {
    return { safe: false, reason: 'Path is inside a protected directory' };
  }

  return { safe: true };
}
