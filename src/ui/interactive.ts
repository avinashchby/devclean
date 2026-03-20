import { checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import type { FoundArtifact } from '../types.js';

/** Format bytes into human-readable string. */
function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return unitIndex === 0
    ? `${size} ${units[unitIndex]}`
    : `${size.toFixed(2)} ${units[unitIndex]}`;
}

/** Shorten an absolute path by replacing the home directory with ~. */
function shortenPath(fullPath: string): string {
  const home = process.env['HOME'] ?? process.env['USERPROFILE'] ?? '';
  return home && fullPath.startsWith(home)
    ? `~${fullPath.slice(home.length)}`
    : fullPath;
}

/** Calculate human-readable age from a date (e.g., "3 days ago"). */
function formatAge(date: Date): string {
  const ms = Date.now() - date.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 1) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
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
