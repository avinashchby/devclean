/** Core pattern definition for identifying build artifacts and dependency directories. */
export interface ArtifactPattern {
  name: string;           // e.g., "node_modules"
  patterns: string[];     // glob patterns to match
  projectFiles: string[]; // parent project files that must exist for smart detection
  language: string;       // e.g., "JavaScript/TypeScript"
  description: string;    // e.g., "Node.js dependencies"
}

/** A discovered artifact on disk with metadata. */
export interface FoundArtifact {
  path: string;
  pattern: ArtifactPattern;
  sizeBytes: number;
  lastModified: Date;
  selected: boolean;      // for interactive selection
}

/** Summary of a completed scan operation. */
export interface ScanResult {
  artifacts: FoundArtifact[];
  totalSize: number;
  scanDurationMs: number;
  directoriesScanned: number;
}

/** User configuration for devclean behavior. */
export interface DevcleanConfig {
  protect: string[];
  autoCleanDays: number;
  scanPaths: string[];
  ignorePaths: string[];
  customArtifacts: CustomArtifact[];
}

/** User-defined artifact pattern. */
export interface CustomArtifact {
  name: string;
  pattern: string;
  projectFile: string;
}

/** Result of a clean (delete) operation. */
export interface CleanResult {
  deletedPaths: string[];
  freedBytes: number;
  errors: Array<{ path: string; error: string }>;
}

/** A global tool cache that can be cleaned via a command. */
export interface GlobalCache {
  name: string;
  path: string;
  command?: string;  // command to clean (e.g., "npm cache clean --force")
  sizeBytes: number;
}

export type SortBy = 'size' | 'age';
export type OutputFormat = 'table' | 'json';
