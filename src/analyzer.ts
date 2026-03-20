import type { FoundArtifact, SortBy } from './types.js';

/** Options for analyzing and filtering scan results. */
export interface AnalyzeOptions {
  sortBy: SortBy;
  minSizeBytes?: number;
  types?: string[];
  autoSelectDays?: number;
}

/** Minimum age (in days) before an artifact can be auto-selected. */
const MIN_SAFE_AGE_DAYS = 7;

/** Filter artifacts by minimum size threshold. */
function filterBySize(
  artifacts: FoundArtifact[],
  minBytes: number | undefined,
): FoundArtifact[] {
  if (minBytes === undefined || minBytes <= 0) return artifacts;
  return artifacts.filter((a) => a.sizeBytes >= minBytes);
}

/** Filter artifacts by type (pattern name). */
function filterByType(
  artifacts: FoundArtifact[],
  types: string[] | undefined,
): FoundArtifact[] {
  if (!types || types.length === 0) return artifacts;
  const typeSet = new Set(types);
  return artifacts.filter((a) => typeSet.has(a.pattern.name));
}

/** Sort artifacts by size (descending) or age (oldest first). */
function sortArtifacts(
  artifacts: FoundArtifact[],
  sortBy: SortBy,
): FoundArtifact[] {
  const sorted = [...artifacts];
  if (sortBy === 'size') {
    sorted.sort((a, b) => b.sizeBytes - a.sizeBytes);
  } else {
    sorted.sort(
      (a, b) => a.lastModified.getTime() - b.lastModified.getTime(),
    );
  }
  return sorted;
}

/** Calculate the age of a date in days from now. */
function ageDays(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

/** Apply smart auto-selection based on artifact age. */
function applyAutoSelect(
  artifacts: FoundArtifact[],
  autoSelectDays: number | undefined,
): FoundArtifact[] {
  if (autoSelectDays === undefined) return artifacts;
  return artifacts.map((a) => {
    const days = ageDays(a.lastModified);
    const selected = days >= autoSelectDays && days >= MIN_SAFE_AGE_DAYS;
    return { ...a, selected };
  });
}

/** Analyze, filter, sort, and auto-select artifacts. */
export function analyzeResults(
  artifacts: FoundArtifact[],
  options: AnalyzeOptions,
): FoundArtifact[] {
  let result = filterBySize(artifacts, options.minSizeBytes);
  result = filterByType(result, options.types);
  result = sortArtifacts(result, options.sortBy);
  result = applyAutoSelect(result, options.autoSelectDays);
  return result;
}

/** Group artifacts by pattern name with counts and total sizes. */
export function groupByType(
  artifacts: FoundArtifact[],
): Map<string, { count: number; totalSize: number }> {
  const groups = new Map<string, { count: number; totalSize: number }>();
  for (const artifact of artifacts) {
    const key = artifact.pattern.name;
    const existing = groups.get(key);
    if (existing) {
      existing.count++;
      existing.totalSize += artifact.sizeBytes;
    } else {
      groups.set(key, { count: 1, totalSize: artifact.sizeBytes });
    }
  }
  return groups;
}

/** Format a byte count as a human-readable string (KB/MB/GB). */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

/** Format a date as a relative human-readable age string. */
export function formatAge(date: Date): string {
  const days = ageDays(date);
  if (days < 1) return 'today';
  if (days < 2) return '1 day ago';
  if (days < 30) return `${Math.floor(days)} days ago`;
  const months = days / 30;
  if (months < 2) return '1 month ago';
  if (months < 12) return `${Math.floor(months)} months ago`;
  const years = days / 365;
  if (years < 2) return '1 year ago';
  return `${Math.floor(years)} years ago`;
}
