import { checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { formatSize, formatAge } from '../analyzer.js';
import type { FoundArtifact } from '../types.js';

/** Shorten an absolute path by replacing the home directory with ~. */
function shortenPath(fullPath: string): string {
  const home = process.env['HOME'] ?? process.env['USERPROFILE'] ?? '';
  return home && fullPath.startsWith(home)
    ? `~${fullPath.slice(home.length)}`
    : fullPath;
}

/** Present an interactive checkbox for selecting artifacts to clean. */
export async function selectArtifacts(
  artifacts: FoundArtifact[],
): Promise<FoundArtifact[]> {
  const choices = artifacts.map((a, i) => ({
    name: `${shortenPath(a.path)}  ${chalk.yellow(formatSize(a.sizeBytes))}  ${chalk.dim(formatAge(a.lastModified))}`,
    value: i,
    checked: a.selected,
  }));

  const selected = await checkbox({
    message: 'Select artifacts to clean:',
    choices,
  });

  return selected.map((i) => artifacts[i]);
}

/** Ask the user to confirm deletion, showing total count and size. */
export async function confirmDeletion(
  artifacts: FoundArtifact[],
): Promise<boolean> {
  const totalSize = artifacts.reduce((sum, a) => sum + a.sizeBytes, 0);
  const msg = `Delete ${artifacts.length} folders (${formatSize(totalSize)})?`;

  return confirm({ message: msg, default: false });
}
