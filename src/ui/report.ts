import chalk from 'chalk';
import type { FoundArtifact, CleanResult } from '../types.js';

/** Format bytes into human-readable string (e.g., "1.23 GB"). */
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

/** Print a bordered table with artifact type counts and sizes. */
export function printReport(
  artifacts: FoundArtifact[],
  groupedData: Map<string, { count: number; totalSize: number }>,
): void {
  const totalBytes = artifacts.reduce((sum, a) => sum + a.sizeBytes, 0);

  console.log(
    chalk.bold.green(`\n  Total reclaimable: ${formatSize(totalBytes)}\n`),
  );

  const typeCol = 20;
  const countCol = 8;
  const sizeCol = 14;

  const top = `┌${'─'.repeat(typeCol)}┬${'─'.repeat(countCol)}┬${'─'.repeat(sizeCol)}┐`;
  const mid = `├${'─'.repeat(typeCol)}┼${'─'.repeat(countCol)}┼${'─'.repeat(sizeCol)}┤`;
  const bot = `└${'─'.repeat(typeCol)}┴${'─'.repeat(countCol)}┴${'─'.repeat(sizeCol)}┘`;

  const pad = (s: string, w: number) => s.padEnd(w);
  const padR = (s: string, w: number) => s.padStart(w);

  console.log(top);
  console.log(
    `│${chalk.bold.cyan(pad(' Type', typeCol))}│${chalk.bold.cyan(padR('Count ', countCol))}│${chalk.bold.cyan(padR('Total Size ', sizeCol))}│`,
  );
  console.log(mid);

  for (const [type, data] of groupedData) {
    const name = pad(` ${type}`, typeCol);
    const count = padR(`${data.count} `, countCol);
    const size = padR(`${formatSize(data.totalSize)} `, sizeCol);
    console.log(`│${name}│${count}│${chalk.yellow(size)}│`);
  }

  console.log(bot);
}

/** Print a summary after cleaning artifacts. */
export function printCleanSummary(result: CleanResult): void {
  const freed = formatSize(result.freedBytes);
  const count = result.deletedPaths.length;

  console.log(
    chalk.bold.green(`\n  Freed ${freed} across ${count} folders.\n`),
  );

  if (result.errors.length > 0) {
    console.log(chalk.red(`  ${result.errors.length} error(s):`));
    for (const err of result.errors) {
      console.log(chalk.red(`    - ${err.path}: ${err.error}`));
    }
    console.log();
  }
}

/** Output scan results as JSON for --json flag. */
export function printJsonReport(artifacts: FoundArtifact[]): void {
  const output = artifacts.map((a) => ({
    path: a.path,
    type: a.pattern.name,
    language: a.pattern.language,
    sizeBytes: a.sizeBytes,
    lastModified: a.lastModified.toISOString(),
    selected: a.selected,
  }));
  console.log(JSON.stringify(output, null, 2));
}
