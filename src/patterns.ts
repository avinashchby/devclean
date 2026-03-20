import type { ArtifactPattern } from './types.js';

const JS_PROJECT_FILES = ['package.json'];
const RUST_PROJECT_FILES = ['Cargo.toml'];
const PYTHON_PROJECT_FILES = ['requirements.txt', 'pyproject.toml', 'setup.py'];
const GO_PROJECT_FILES = ['go.mod'];
const GRADLE_PROJECT_FILES = ['build.gradle', 'build.gradle.kts', 'settings.gradle', 'settings.gradle.kts'];
const MAVEN_PROJECT_FILES = ['pom.xml'];
const CMAKE_PROJECT_FILES = ['CMakeLists.txt', 'Makefile'];
const RUBY_PROJECT_FILES = ['Gemfile'];
const PHP_PROJECT_FILES = ['composer.json'];
const DOTNET_PROJECT_FILES = ['*.csproj', '*.fsproj'];

/** JavaScript/TypeScript artifact patterns. */
function jsPatterns(): ArtifactPattern[] {
  return [
    {
      name: 'node_modules',
      patterns: ['node_modules'],
      projectFiles: JS_PROJECT_FILES,
      language: 'JavaScript/TypeScript',
      description: 'Node.js dependencies',
    },
    {
      name: '.next',
      patterns: ['.next'],
      projectFiles: JS_PROJECT_FILES,
      language: 'JavaScript/TypeScript',
      description: 'Next.js build output',
    },
    {
      name: '.nuxt',
      patterns: ['.nuxt'],
      projectFiles: JS_PROJECT_FILES,
      language: 'JavaScript/TypeScript',
      description: 'Nuxt.js build output',
    },
    {
      name: 'dist',
      patterns: ['dist'],
      projectFiles: JS_PROJECT_FILES,
      language: 'JavaScript/TypeScript',
      description: 'JavaScript/TypeScript build output',
    },
    {
      name: 'build',
      patterns: ['build'],
      projectFiles: JS_PROJECT_FILES,
      language: 'JavaScript/TypeScript',
      description: 'JavaScript/TypeScript build output',
    },
  ];
}

/** More JavaScript/TypeScript artifact patterns. */
function jsPatternsContinued(): ArtifactPattern[] {
  return [
    {
      name: '.output',
      patterns: ['.output'],
      projectFiles: JS_PROJECT_FILES,
      language: 'JavaScript/TypeScript',
      description: 'Nitro/Nuxt output directory',
    },
    {
      name: '.parcel-cache',
      patterns: ['.parcel-cache'],
      projectFiles: JS_PROJECT_FILES,
      language: 'JavaScript/TypeScript',
      description: 'Parcel bundler cache',
    },
    {
      name: '.turbo',
      patterns: ['.turbo'],
      projectFiles: JS_PROJECT_FILES,
      language: 'JavaScript/TypeScript',
      description: 'Turborepo cache',
    },
    {
      name: '.angular/cache',
      patterns: ['.angular/cache'],
      projectFiles: JS_PROJECT_FILES,
      language: 'JavaScript/TypeScript',
      description: 'Angular CLI cache',
    },
    {
      name: '.svelte-kit',
      patterns: ['.svelte-kit'],
      projectFiles: JS_PROJECT_FILES,
      language: 'JavaScript/TypeScript',
      description: 'SvelteKit build output',
    },
  ];
}

/** Rust artifact patterns. */
function rustPatterns(): ArtifactPattern[] {
  return [
    {
      name: 'target',
      patterns: ['target'],
      projectFiles: RUST_PROJECT_FILES,
      language: 'Rust',
      description: 'Rust compilation artifacts',
    },
  ];
}

/** Python artifact patterns. */
function pythonPatterns(): ArtifactPattern[] {
  return [
    {
      name: 'venv',
      patterns: ['venv'],
      projectFiles: PYTHON_PROJECT_FILES,
      language: 'Python',
      description: 'Python virtual environment',
    },
    {
      name: '.venv',
      patterns: ['.venv'],
      projectFiles: PYTHON_PROJECT_FILES,
      language: 'Python',
      description: 'Python virtual environment',
    },
    {
      name: 'env',
      patterns: ['env'],
      projectFiles: PYTHON_PROJECT_FILES,
      language: 'Python',
      description: 'Python virtual environment',
    },
    {
      name: '.env',
      patterns: ['.env'],
      projectFiles: PYTHON_PROJECT_FILES,
      language: 'Python',
      description: 'Python virtual environment (requires pyvenv.cfg or bin/activate to distinguish from dotenv)',
    },
    {
      name: '__pycache__',
      patterns: ['__pycache__'],
      projectFiles: [],
      language: 'Python',
      description: 'Python bytecode cache',
    },
  ];
}

/** More Python artifact patterns. */
function pythonPatternsContinued(): ArtifactPattern[] {
  return [
    {
      name: '.mypy_cache',
      patterns: ['.mypy_cache'],
      projectFiles: PYTHON_PROJECT_FILES,
      language: 'Python',
      description: 'mypy type checker cache',
    },
    {
      name: '.pytest_cache',
      patterns: ['.pytest_cache'],
      projectFiles: PYTHON_PROJECT_FILES,
      language: 'Python',
      description: 'pytest cache',
    },
    {
      name: '.ruff_cache',
      patterns: ['.ruff_cache'],
      projectFiles: PYTHON_PROJECT_FILES,
      language: 'Python',
      description: 'Ruff linter cache',
    },
    {
      name: '*.egg-info',
      patterns: ['*.egg-info'],
      projectFiles: PYTHON_PROJECT_FILES,
      language: 'Python',
      description: 'Python egg metadata',
    },
    {
      name: 'python-dist',
      patterns: ['dist'],
      projectFiles: PYTHON_PROJECT_FILES,
      language: 'Python',
      description: 'Python distribution output',
    },
    {
      name: 'python-build',
      patterns: ['build'],
      projectFiles: PYTHON_PROJECT_FILES,
      language: 'Python',
      description: 'Python build output',
    },
  ];
}

/** Go artifact patterns. */
function goPatterns(): ArtifactPattern[] {
  return [
    {
      name: 'vendor',
      patterns: ['vendor'],
      projectFiles: GO_PROJECT_FILES,
      language: 'Go',
      description: 'Go vendored dependencies',
    },
  ];
}

/** Java/Kotlin artifact patterns. */
function javaPatterns(): ArtifactPattern[] {
  return [
    {
      name: '.gradle',
      patterns: ['.gradle'],
      projectFiles: GRADLE_PROJECT_FILES,
      language: 'Java/Kotlin',
      description: 'Gradle cache and config',
    },
    {
      name: 'gradle-build',
      patterns: ['build'],
      projectFiles: GRADLE_PROJECT_FILES,
      language: 'Java/Kotlin',
      description: 'Gradle build output',
    },
    {
      name: 'maven-target',
      patterns: ['target'],
      projectFiles: MAVEN_PROJECT_FILES,
      language: 'Java/Kotlin',
      description: 'Maven build output',
    },
    {
      name: '.idea',
      patterns: ['.idea'],
      projectFiles: [...GRADLE_PROJECT_FILES, ...MAVEN_PROJECT_FILES],
      language: 'Java/Kotlin',
      description: 'IntelliJ IDEA project files',
    },
  ];
}

/** C/C++ artifact patterns. */
function cppPatterns(): ArtifactPattern[] {
  return [
    {
      name: 'cmake-build',
      patterns: ['build'],
      projectFiles: CMAKE_PROJECT_FILES,
      language: 'C/C++',
      description: 'C/C++ build output',
    },
    {
      name: 'cmake-build-variants',
      patterns: ['cmake-build-*'],
      projectFiles: CMAKE_PROJECT_FILES,
      language: 'C/C++',
      description: 'CMake build variant directories',
    },
    {
      name: '_build',
      patterns: ['_build'],
      projectFiles: CMAKE_PROJECT_FILES,
      language: 'C/C++',
      description: 'C/C++ build output (alternate)',
    },
  ];
}

/** Ruby artifact patterns. */
function rubyPatterns(): ArtifactPattern[] {
  return [
    {
      name: 'vendor/bundle',
      patterns: ['vendor/bundle'],
      projectFiles: RUBY_PROJECT_FILES,
      language: 'Ruby',
      description: 'Bundler installed gems',
    },
  ];
}

/** PHP artifact patterns. */
function phpPatterns(): ArtifactPattern[] {
  return [
    {
      name: 'php-vendor',
      patterns: ['vendor'],
      projectFiles: PHP_PROJECT_FILES,
      language: 'PHP',
      description: 'Composer dependencies',
    },
  ];
}

/** .NET artifact patterns. */
function dotnetPatterns(): ArtifactPattern[] {
  return [
    {
      name: 'bin',
      patterns: ['bin'],
      projectFiles: DOTNET_PROJECT_FILES,
      language: '.NET',
      description: '.NET build output',
    },
    {
      name: 'obj',
      patterns: ['obj'],
      projectFiles: DOTNET_PROJECT_FILES,
      language: '.NET',
      description: '.NET intermediate build output',
    },
  ];
}

/** General/language-agnostic artifact patterns. */
function generalPatterns(): ArtifactPattern[] {
  return [
    {
      name: '.cache',
      patterns: ['.cache'],
      projectFiles: [],
      language: 'General',
      description: 'Generic cache directory',
    },
    {
      name: '.tmp',
      patterns: ['.tmp'],
      projectFiles: [],
      language: 'General',
      description: 'Temporary files directory',
    },
    {
      name: 'coverage',
      patterns: ['coverage'],
      projectFiles: [],
      language: 'General',
      description: 'Test coverage reports',
    },
    {
      name: '.terraform',
      patterns: ['.terraform'],
      projectFiles: [],
      language: 'General',
      description: 'Terraform provider plugins and modules',
    },
  ];
}

/** All known artifact patterns across all supported languages. */
export const ARTIFACT_PATTERNS: ArtifactPattern[] = [
  ...jsPatterns(),
  ...jsPatternsContinued(),
  ...rustPatterns(),
  ...pythonPatterns(),
  ...pythonPatternsContinued(),
  ...goPatterns(),
  ...javaPatterns(),
  ...cppPatterns(),
  ...rubyPatterns(),
  ...phpPatterns(),
  ...dotnetPatterns(),
  ...generalPatterns(),
];

/** Look up a pattern by its unique name. Returns undefined if not found. */
export function getPatternByName(name: string): ArtifactPattern | undefined {
  return ARTIFACT_PATTERNS.find((p) => p.name === name);
}

/** Return all registered pattern names. */
export function getAllPatternNames(): string[] {
  return ARTIFACT_PATTERNS.map((p) => p.name);
}
