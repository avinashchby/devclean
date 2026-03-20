import * as fs from 'node:fs/promises';
import type { FoundArtifact, CleanResult } from './types.js';
import { isPathSafe, isInsideGit } from './safety.js';

/** Build a dry-run result without deleting anything. */
function buildDryRunResult(artifacts: FoundArtifact[]): CleanResult {
  return {
    deletedPaths: artifacts.map((a) => a.path),
    freedBytes: artifacts.reduce((sum, a) => sum + a.sizeBytes, 0),
    errors: [],
  };
}

/** Defense-in-depth: validate path before deletion. */
function preDeleteCheck(artifactPath: string): string | null {
  if (!isPathSafe(artifactPath)) {
    return 'Safety check failed: system or home root directory';
  }
  if (isInsideGit(artifactPath)) {
    return 'Safety check failed: path is inside .git';
  }
  return null;
}

/** Attempt to delete a single artifact directory. */
async function deleteArtifact(
  artifact: FoundArtifact,
): Promise<{ freed: number; error?: string }> {
  const checkError = preDeleteCheck(artifact.path);
  if (checkError) {
    return { freed: 0, error: checkError };
  }
  try {
    await fs.rm(artifact.path, { recursive: true, force: true });
    return { freed: artifact.sizeBytes };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { freed: 0, error: message };
  }
}

/** Safely delete discovered artifacts with progress reporting. */
export async function cleanArtifacts(
  artifacts: FoundArtifact[],
  options: { dryRun: boolean },
  onProgress?: (deleted: number, total: number) => void,
): Promise<CleanResult> {
  if (options.dryRun) {
    return buildDryRunResult(artifacts);
  }

  const result: CleanResult = { deletedPaths: [], freedBytes: 0, errors: [] };
  const total = artifacts.length;

  for (let i = 0; i < total; i++) {
    const artifact = artifacts[i];
    const outcome = await deleteArtifact(artifact);

    if (outcome.error) {
      result.errors.push({ path: artifact.path, error: outcome.error });
    } else {
      result.deletedPaths.push(artifact.path);
      result.freedBytes += outcome.freed;
    }

    onProgress?.(i + 1, total);
  }

  return result;
}
