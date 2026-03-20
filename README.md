# devclean — Developer Disk Cleanup Tool

**Reclaim hundreds of GB from build artifacts you forgot about.** One command scans your entire machine for `node_modules`, Rust `target`, Python `venv`, `.next`, `__pycache__`, `.gradle`, and 30+ other artifact types across every programming language — then lets you pick what to delete.

```bash
npx devclean --scan ~
```

> I ran devclean on my Mac and found **24.9 GB reclaimable** across **4,056 artifact folders** in under 30 seconds.

## The Problem

Build artifacts and dependency folders accumulate silently across every project on your machine. A single `node_modules` is 200MB–1GB. A Rust `target` directory grows to 2–10GB. Python virtual environments, `.next` builds, Gradle caches — they stack up to hundreds of GB across projects nobody has touched in months.

Existing tools solve this partially: [npkill](https://github.com/voidcosmos/npkill) only handles `node_modules`, [kondo](https://github.com/tbillington/kondo) covers 20+ types but misses `.next`, `venv`, and `coverage`, and [Mole](https://github.com/tw93/Mole) is macOS-only. No single tool cleans all artifact types across all languages on all platforms — until now.

## How It Works

```
Phase 1 — SCAN        Recursively finds artifact folders, validates each against project files
Phase 2 — REPORT      Shows a table grouped by type with counts and sizes
Phase 3 — SELECT      Interactive checkboxes — pick what to delete, see size and age per entry
Phase 4 — CLEAN       Deletes selected folders, shows summary of freed space
```

## Supported Languages and Artifact Types

| Language | Artifacts Detected | Project File Required |
|----------|-------------------|----------------------|
| **JavaScript / TypeScript** | `node_modules`, `.next`, `.nuxt`, `dist`, `build`, `.output`, `.parcel-cache`, `.turbo`, `.angular/cache`, `.svelte-kit` | `package.json` |
| **Rust** | `target` | `Cargo.toml` |
| **Python** | `venv`, `.venv`, `__pycache__`, `.mypy_cache`, `.pytest_cache`, `.ruff_cache`, `*.egg-info`, `dist`, `build` | `requirements.txt` / `pyproject.toml` / `setup.py` |
| **Go** | `vendor` | `go.mod` |
| **Java / Kotlin** | `.gradle`, `build`, `target`, `.idea` | `build.gradle` / `pom.xml` |
| **C / C++** | `build`, `cmake-build-*`, `_build` | `CMakeLists.txt` / `Makefile` |
| **Ruby** | `vendor/bundle` | `Gemfile` |
| **PHP** | `vendor` | `composer.json` |
| **.NET** | `bin`, `obj` | `*.csproj` / `*.fsproj` |
| **General** | `.cache`, `.tmp`, `coverage`, `.terraform` | *(none)* |

## Example Output

```
  Total reclaimable: 24.9 GB

┌────────────────────┬────────┬──────────────┐
│ Type               │  Count │   Total Size │
├────────────────────┼────────┼──────────────┤
│ target             │      4 │      18.7 GB │
│ node_modules       │     36 │       4.3 GB │
│ dist               │   1860 │    1021.6 MB │
│ .cache             │      4 │     255.4 MB │
│ .venv              │      3 │     237.8 MB │
│ .next              │      2 │     205.5 MB │
│ __pycache__        │   1487 │     117.5 MB │
│ build              │    640 │     117.0 MB │
│ coverage           │      5 │       1.4 MB │
└────────────────────┴────────┴──────────────┘

? Select artifacts to clean:
  ◉ ~/old-api/node_modules         1.2 GB   8 months ago
  ◉ ~/rust-project/target          4.8 GB   3 months ago
  ◯ ~/active-app/node_modules    245.0 MB   2 days ago

  Freed 24.1 GB across 3,892 folders.
```

## CLI Options

```bash
npx devclean                           # Interactive mode — scan, report, select, clean
npx devclean --scan                    # Scan and report only, don't delete anything
npx devclean --scan ~/Projects         # Scan a specific directory
npx devclean --auto                    # Auto-clean artifacts older than 30 days
npx devclean --auto --days 90          # Auto-clean older than 90 days
npx devclean --dry-run                 # Show what would be deleted without deleting
npx devclean --type node_modules       # Only clean a specific artifact type
npx devclean --type target,venv        # Filter by multiple types
npx devclean --min-size 500            # Only show artifacts larger than 500 MB
npx devclean --sort size               # Sort by size (default)
npx devclean --sort age                # Sort by last modified date
npx devclean --json                    # JSON output for scripting
npx devclean --protect ~/prod-app      # Never touch this directory
npx devclean cache                     # Clean global caches (npm, yarn, pnpm, pip, cargo, Go)
npx devclean cache --dry-run           # Show global cache sizes without cleaning
```

## Installation

```bash
# Run without installing (recommended)
npx devclean

# Or install globally
npm install -g devclean
```

Works on **macOS, Linux, and Windows** — anywhere Node.js 18+ runs.

## Config File

Create `~/.devclean.json` to persist settings:

```json
{
  "protect": ["~/Projects/production-app", "~/work/critical-service"],
  "autoCleanDays": 30,
  "scanPaths": ["~/Projects", "~/work", "~/code"],
  "ignorePaths": ["~/Library", "~/.*"],
  "customArtifacts": [
    { "name": "my-cache", "pattern": ".my-build-cache", "projectFile": "my-config.json" }
  ]
}
```

## Smart Detection — How devclean Avoids False Positives

devclean never blindly deletes a folder named `build` or `dist`. Every artifact is validated:

1. **Project file check** — `node_modules` is only flagged if `package.json` exists in the parent directory. `target` requires `Cargo.toml`. Every artifact type has a corresponding project file.
2. **Virtual environment validation** — `venv`, `.venv`, `env`, and `.env` directories are only flagged if they contain `pyvenv.cfg` or `bin/activate`, preventing deletion of dotenv config or unrelated directories.
3. **Language disambiguation** — A `build` folder next to `build.gradle` is treated as Gradle output. Next to `package.json`, it's JavaScript output. Next to `setup.py`, it's Python output. The first matching language wins.
4. **Safety guards** — System directories (`/`, `/usr`, `/etc`, `$HOME` itself) are blocked. Paths inside `.git` are always skipped. Protected directories from config are respected. Defense-in-depth: safety checks run both during scan AND before every deletion.

## Global Cache Cleaning

```bash
npx devclean cache
```

Detects and cleans:
- **npm** cache (`~/.npm/_cacache`)
- **yarn** cache (`~/Library/Caches/Yarn` or `~/.cache/yarn`)
- **pnpm** store (`~/.local/share/pnpm/store`)
- **pip** cache (`~/Library/Caches/pip` or `~/.cache/pip`)
- **cargo** registry (`~/.cargo/registry`)
- **Go** build cache (`~/.cache/go-build`)

## Comparison with Other Tools

| Feature | **devclean** | [npkill](https://github.com/voidcosmos/npkill) | [kondo](https://github.com/tbillington/kondo) | [Mole](https://github.com/tw93/Mole) (`mo purge`) |
|---------|:-----------:|:------:|:-----:|:----:|
| Languages supported | **10+** | 1 (JS) | 20+ | 15+ |
| `node_modules` | Yes | Yes | Yes | Yes |
| Rust `target` | Yes | No | Yes | Yes |
| Python `venv` / `.venv` | **Yes** | No | No | Yes |
| `.next` (Next.js) | **Yes** | No | No | Yes |
| `__pycache__` | Yes | No | Yes | Yes |
| `.gradle` | Yes | No | Yes | Yes |
| `.terraform` | Yes | No | Yes | No |
| `coverage` | **Yes** | No | No | Yes |
| `.svelte-kit` | **Yes** | No | No | Yes |
| Go `vendor` | **Yes** | No | No | No |
| `.idea` (IntelliJ) | **Yes** | No | No | No |
| Smart project file detection | **Yes** | N/A | Partial | Partial |
| Virtualenv validation | **Yes** | No | No | No |
| Age-based auto-select | **Yes** | No | Time filter | 7-day guard |
| `--dry-run` | Yes | No | No | Yes |
| JSON output | Yes | No | No | No |
| Global cache cleaning | **Yes** | No | No | Yes (system) |
| Cross-platform | **Yes** | Yes | Yes | **macOS only** |
| Config file | **Yes** | No | No | Partial |
| Custom artifact patterns | **Yes** | No | No | No |

## FAQ

### How much disk space can devclean recover?

It depends on how many projects you have and how long they've been sitting. In a real scan of a development machine, devclean found **24.9 GB** reclaimable across 4,056 folders. Rust `target` directories alone accounted for 18.7 GB. Machines with heavy polyglot development commonly have 50–200 GB in stale artifacts.

### Does devclean delete source code?

**No.** devclean only deletes known build artifact and dependency directories. Every artifact is validated against a project file in the parent directory — a folder named `build` won't be touched unless it sits next to a `package.json`, `build.gradle`, `CMakeLists.txt`, or similar. Virtual environment directories (`.venv`, `env`) are further validated by checking for `pyvenv.cfg` or `bin/activate` inside them.

### How is devclean different from npkill?

[npkill](https://github.com/voidcosmos/npkill) only cleans `node_modules` directories. devclean supports 35+ artifact types across 10+ languages including Rust `target`, Python `venv`, Java `.gradle`, C++ `build`, and more — plus global cache cleaning for npm, pip, cargo, Go, and others.

### How is devclean different from kondo?

[kondo](https://github.com/tbillington/kondo) supports 20+ project types but does not clean `.next`, `.svelte-kit`, `coverage`, Python virtual environments (`venv`, `.venv`), or Go `vendor` directories. devclean also adds age-based smart selection, `--dry-run`, JSON output, a config file for protected paths, and virtual environment validation to prevent deleting `.env` dotenv files.

### How is devclean different from Mole?

[Mole](https://github.com/tw93/Mole) is an excellent all-in-one macOS maintenance tool, but it only runs on macOS. devclean is cross-platform (macOS, Linux, Windows) and is focused specifically on build artifact cleanup with smarter disambiguation — it knows whether a `build/` folder belongs to Gradle, JavaScript, Python, or C++ based on the project files present.

### Is it safe to run on my entire home directory?

Yes. devclean skips system directories, `.git` internals, and anything in your protect list. It never auto-deletes — in interactive mode you see and confirm every deletion. Use `--scan` or `--dry-run` first if you want to preview results without risk.

### Can I run devclean in CI or as a cron job?

Yes. Use `--auto --days 30` for non-interactive cleanup of artifacts older than 30 days. Add `--json` for machine-readable output. Combine with `--protect` to safeguard active projects.

### What Node.js version is required?

Node.js 18 or higher.

## Contributing

1. Fork and clone the repo
2. `npm install`
3. `npm run dev -- --scan .` to test locally
4. `npm test` to run the test suite (79 tests)
5. Open a PR

## License

MIT
