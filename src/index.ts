#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { loadConfig } from './config.js';
import { scanDirectory } from './scanner.js';
import { analyzeResults, groupByType, formatSize } from './analyzer.js';
import { cleanArtifacts } from './cleaner.js';
import { detectGlobalCaches, cleanGlobalCache } from './cache.js';
import { ARTIFACT_PATTERNS } from './patterns.js';
import { validateArtifact } from './safety.js';
import { createScanProgress, createCleanProgress } from './ui/progress.js';
import { printReport, printCleanSummary, printJsonReport } from './ui/report.js';
import { selectArtifacts, confirmDeletion } from './ui/interactive.js';
import type { FoundArtifact, DevcleanConfig, CleanResult } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')) as { version: string };

/** Parse comma-separated string into trimmed array. */
function parseList(value: string): string[] {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

/** Resolve the scan path from CLI argument. */
function resolveScanPath(arg?: string): string {
  if (arg) return resolve(arg);
  return process.cwd();
}

/** Merge CLI protect paths into config. */
function mergeProtect(config: DevcleanConfig, cliProtect?: string): DevcleanConfig {
  if (!cliProtect) return config;
  return { ...config, protect: [...config.protect, ...parseList(cliProtect)] };
}

/** Run scan phase with a progress bar. */
async function runScan(scanPath: string, config: DevcleanConfig): Promise<FoundArtifact[]> {
  const progress = createScanProgress();
  const result = await scanDirectory(scanPath, ARTIFACT_PATTERNS, config, (scanned, found) => {
    progress.update(scanned, found);
  });
  progress.stop();
  console.log(chalk.dim(`  Scanned ${result.directoriesScanned} dirs in ${(result.scanDurationMs / 1000).toFixed(1)}s`));
  console.log(chalk.dim(`  Found ${result.artifacts.length} artifact folders\n`));
  return result.artifacts;
}

/** Filter out unsafe artifacts. */
function filterSafe(artifacts: FoundArtifact[], config: DevcleanConfig): FoundArtifact[] {
  return artifacts.filter((a) => validateArtifact(a, config).safe);
}

/** Handle --json output mode. */
function handleJsonOutput(artifacts: FoundArtifact[]): void {
  printJsonReport(artifacts);
}

/** Handle --scan (report only) mode. */
function handleScanOnly(artifacts: FoundArtifact[]): void {
  const grouped = groupByType(artifacts);
  printReport(artifacts, grouped);
}

/** Handle --auto mode: clean everything older than --days. */
async function handleAutoClean(artifacts: FoundArtifact[], dryRun: boolean): Promise<CleanResult> {
  const toClean = artifacts.filter((a) => a.selected);
  if (toClean.length === 0) {
    console.log(chalk.yellow('No artifacts old enough for auto-clean.'));
    return { deletedPaths: [], freedBytes: 0, errors: [] };
  }
  const totalSize = toClean.reduce((s, a) => s + a.sizeBytes, 0);
  console.log(`Auto-cleaning ${toClean.length} artifacts (${formatSize(totalSize)})...`);
  const progress = createCleanProgress(toClean.length);
  const result = await cleanArtifacts(toClean, { dryRun }, (d, t) => progress.update(d));
  progress.stop();
  return result;
}

/** Handle interactive mode. */
async function handleInteractive(artifacts: FoundArtifact[], dryRun: boolean): Promise<CleanResult> {
  const grouped = groupByType(artifacts);
  printReport(artifacts, grouped);

  if (artifacts.length === 0) {
    console.log(chalk.green('No artifacts found. Your workspace is clean!'));
    return { deletedPaths: [], freedBytes: 0, errors: [] };
  }

  const selected = await selectArtifacts(artifacts);
  if (selected.length === 0) {
    console.log(chalk.yellow('Nothing selected. Exiting.'));
    return { deletedPaths: [], freedBytes: 0, errors: [] };
  }

  const confirmed = await confirmDeletion(selected);
  if (!confirmed) {
    console.log(chalk.yellow('Aborted.'));
    return { deletedPaths: [], freedBytes: 0, errors: [] };
  }

  const progress = createCleanProgress(selected.length);
  const result = await cleanArtifacts(selected, { dryRun }, (d) => progress.update(d));
  progress.stop();
  return result;
}

/** Main default command action. */
async function defaultAction(scanPathArg: string | undefined, opts: Record<string, unknown>): Promise<void> {
  let config = await loadConfig();
  config = mergeProtect(config, opts['protect'] as string | undefined);
  const scanPath = resolveScanPath(scanPathArg);
  const dryRun = Boolean(opts['dryRun']);
  const days = Number(opts['days'] ?? 30);

  const raw = await runScan(scanPath, config);
  const safe = filterSafe(raw, config);

  const minSizeBytes = opts['minSize'] ? Number(opts['minSize']) * 1024 * 1024 : undefined;
  const types = opts['type'] ? parseList(opts['type'] as string) : undefined;
  const sortBy = (opts['sort'] as 'size' | 'age') ?? 'size';

  const analyzed = analyzeResults(safe, { sortBy, minSizeBytes, types, autoSelectDays: days });

  if (opts['json']) { handleJsonOutput(analyzed); return; }
  if (opts['scan']) { handleScanOnly(analyzed); return; }

  let result: CleanResult;
  if (opts['auto']) {
    result = await handleAutoClean(analyzed, dryRun);
  } else {
    result = await handleInteractive(analyzed, dryRun);
  }
  printCleanSummary(result);
}

/** Cache subcommand action. */
async function cacheAction(opts: Record<string, unknown>): Promise<void> {
  const dryRun = Boolean(opts['dryRun']);
  console.log(chalk.cyan('  Detecting global caches...\n'));
  const caches = await detectGlobalCaches();

  if (caches.length === 0) {
    console.log(chalk.green('No global caches found.'));
    return;
  }

  for (const cache of caches) {
    console.log(`  ${chalk.bold(cache.name)}: ${chalk.yellow(formatSize(cache.sizeBytes))} at ${chalk.dim(cache.path)}`);
  }
  console.log();

  const totalSize = caches.reduce((s, c) => s + c.sizeBytes, 0);
  console.log(chalk.bold(`  Total: ${formatSize(totalSize)}\n`));

  if (dryRun) {
    console.log(chalk.dim('  Dry run — no changes made.'));
    return;
  }

  const { confirm } = await import('@inquirer/prompts');
  const ok = await confirm({ message: `Clean all ${caches.length} caches?`, default: false });
  if (!ok) { console.log(chalk.yellow('Aborted.')); return; }

  let freed = 0;
  const errors: string[] = [];
  for (const cache of caches) {
    const r = await cleanGlobalCache(cache, false);
    freed += r.freedBytes;
    if (r.error) errors.push(`${cache.name}: ${r.error}`);
  }
  console.log(chalk.bold.green(`\n  Freed ${formatSize(freed)} from global caches.`));
  for (const e of errors) console.log(chalk.red(`  Error: ${e}`));
}

/** Build the CLI program. */
function buildProgram(): Command {
  const program = new Command();

  program
    .name('devclean')
    .description('Universal build artifact cleaner — reclaim disk space')
    .version(pkg.version)
    .argument('[path]', 'directory to scan (default: cwd)')
    .option('--scan', 'scan and report only, do not clean')
    .option('--auto', 'auto-clean all pre-selected artifacts')
    .option('--dry-run', 'show what would be deleted without deleting')
    .option('--days <number>', 'minimum age in days for auto-selection', '30')
    .option('--type <types>', 'filter by artifact types (comma-separated)')
    .option('--min-size <mb>', 'minimum size in MB to include')
    .option('--sort <criterion>', 'sort by size or age', 'size')
    .option('--json', 'output results as JSON')
    .option('--protect <paths>', 'comma-separated paths to never delete')
    .action(defaultAction);

  program
    .command('cache')
    .description('Detect and clean global tool caches')
    .option('--dry-run', 'show what would be deleted without deleting')
    .action(cacheAction);

  return program;
}

/** Entry point. */
async function main(): Promise<void> {
  const program = buildProgram();
  await program.parseAsync(process.argv);
}

main().catch((err: Error) => {
  console.error(chalk.red(`Error: ${err.message}`));
  process.exit(1);
});
