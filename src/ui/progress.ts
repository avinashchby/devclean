import cliProgress from 'cli-progress';
import chalk from 'chalk';

/** Scanning progress indicator (indeterminate — total is unknown). */
export function createScanProgress(): {
  update: (scanned: number, found: number) => void;
  stop: () => void;
} {
  const bar = new cliProgress.SingleBar(
    {
      format: `  ${chalk.cyan('Scanning...')} [{bar}] {scanned} scanned | Found ${chalk.yellow('{found}')} artifact folders`,
      hideCursor: true,
      clearOnComplete: true,
    },
    cliProgress.Presets.shades_classic,
  );

  bar.start(100, 0, { scanned: 0, found: 0 });

  return {
    update(scanned: number, found: number) {
      // Cycle the bar value to simulate indeterminate progress
      const position = scanned % 100;
      bar.update(position, { scanned, found });
    },
    stop() {
      bar.stop();
    },
  };
}

/** Determinate progress bar for the cleaning phase. */
export function createCleanProgress(total: number): {
  update: (current: number) => void;
  stop: () => void;
} {
  const bar = new cliProgress.SingleBar(
    {
      format: `  ${chalk.cyan('Cleaning')} [{bar}] ${chalk.yellow('{value}/{total}')} folders`,
      hideCursor: true,
      clearOnComplete: true,
    },
    cliProgress.Presets.shades_classic,
  );

  bar.start(total, 0);

  return {
    update(current: number) {
      bar.update(current);
    },
    stop() {
      bar.stop();
    },
  };
}
