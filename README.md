# devclean

**Reclaim hundreds of GB from build artifacts you forgot about.**

A universal CLI tool that scans your projects for build artifacts, caches, and dependency folders — then helps you clean them safely.

## Quick Start

```bash
npx devclean
```

No install required. Scans your current directory and lets you pick what to remove.

## How It Works

1. **Scan** — Recursively walks your project directories looking for known build artifacts
2. **Report** — Shows what was found, grouped by language, sorted by size
3. **Select** — Interactive picker lets you choose exactly what to remove
4. **Clean** — Deletes selected artifacts and reports freed space

## Supported Languages

| Language | Artifacts | Project File Required |
|---|---|---|
| JavaScript/TypeScript | `node_modules`, `.next`, `.nuxt`, `dist`, `build`, `.output`, `.parcel-cache`, `.turbo`, `.angular/cache`, `.svelte-kit` | `package.json` |
| Rust | `target` | `Cargo.toml` |
| Python | `venv`, `.venv`, `__pycache__`, `.mypy_cache`, `.pytest_cache`, `.ruff_cache`, `*.egg-info` | `requirements.txt` / `pyproject.toml` / `setup.py` |
| Go | `vendor` | `go.mod` |
| Java/Kotlin | `.gradle`, `build`, `target`, `.idea` | `build.gradle` / `pom.xml` |
| C/C++ | `build`, `cmake-build-*`, `_build` | `CMakeLists.txt` / `Makefile` |
| Ruby | `vendor/bundle` | `Gemfile` |
| PHP | `vendor` | `composer.json` |
| .NET | `bin`, `obj` | `*.csproj` |
| General | `.cache`, `.tmp`, `coverage`, `.terraform` | *(none)* |

Artifacts are only flagged when the corresponding project file is found in the parent directory (except General artifacts). This prevents false positives.

## CLI Options

```
Usage: devclean [options] [path]

Arguments:
  path                  directory to scan (default: current working directory)

Options:
  --scan                scan and report only, do not clean
  --auto                auto-clean all pre-selected artifacts
  --dry-run             show what would be deleted without deleting
  --days <number>       minimum age in days for auto-selection (default: 30)
  --type <types>        filter by artifact types (comma-separated)
  --min-size <mb>       minimum size in MB to include
  --sort <criterion>    sort by "size" or "age" (default: size)
  --json                output results as JSON
  --protect <paths>     comma-separated paths to never delete
  -V, --version         output the version number
  -h, --help            display help
```

### Examples

```bash
# Scan only, don't delete anything
npx devclean --scan

# Auto-clean artifacts older than 60 days
npx devclean --auto --days 60

# Preview what would be deleted
npx devclean --auto --dry-run

# Only show Rust and Python artifacts
npx devclean --type rust,python

# Scan a specific directory, ignore artifacts under 100 MB
npx devclean ~/Projects --min-size 100

# Output as JSON for scripting
npx devclean --scan --json

# Protect specific paths from deletion
npx devclean --protect ~/Projects/important-app/node_modules
```

## Global Cache Cleaning

Clean global tool caches (npm, yarn, pnpm, pip, cargo, Go) with:

```bash
npx devclean cache
```

Detects caches for: **npm**, **yarn**, **pnpm**, **Go build**, **pip**, and **cargo registry**.

Use `--dry-run` to preview without deleting:

```bash
npx devclean cache --dry-run
```

## Config File

Create `~/.devclean.json` to set persistent preferences:

```json
{
  "protect": [
    "~/Projects/production-app/node_modules",
    "~/Projects/active-service/target"
  ],
  "autoCleanDays": 30,
  "scanPaths": [],
  "ignorePaths": [
    "~/Archive"
  ],
  "customArtifacts": []
}
```

| Key | Type | Description |
|---|---|---|
| `protect` | `string[]` | Paths that will never be deleted |
| `autoCleanDays` | `number` | Default age threshold for `--auto` mode |
| `scanPaths` | `string[]` | Additional directories to scan |
| `ignorePaths` | `string[]` | Directories to skip during scanning |
| `customArtifacts` | `array` | User-defined artifact patterns |

Paths support `~` expansion for the home directory.

## Safety Guarantees

devclean is designed to be safe by default:

- **Smart detection** — Artifacts are only identified when a matching project file (e.g., `package.json`, `Cargo.toml`) exists in the parent directory. No guessing.
- **Protect list** — Mark paths as protected in config or via `--protect` to permanently exclude them from cleaning.
- **`.git` skipping** — Anything inside a `.git` directory is automatically excluded.
- **System path protection** — System directories (`/usr`, `/etc`, `/home`, etc.) and the home directory itself can never be deleted.
- **No source code deletion** — Only known build artifact and cache directories are targeted. Source files are never touched.
- **Interactive by default** — You always confirm before anything is deleted, unless you explicitly opt into `--auto` mode.
- **Dry run support** — Use `--dry-run` to see exactly what would happen without making any changes.

## Requirements

- Node.js >= 18.0.0

## License

[MIT](./LICENSE)
