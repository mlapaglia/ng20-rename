# ng20-rename

A TypeScript package to refactor Angular applications to use the latest **Angular 20** naming conventions with clean, concise file names that remove redundant suffixes.

[![CI](https://github.com/mlapaglia/ng20-rename/actions/workflows/ci.yml/badge.svg)](https://github.com/mlapaglia/ng20-rename/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/ng20-rename.svg)](https://badge.fury.io/js/ng20-rename)
[![codecov](https://codecov.io/gh/mlapaglia/ng20-rename/branch/main/graph/badge.svg)](https://codecov.io/gh/mlapaglia/ng20-rename)

## Features

✨ **Angular 20 Ready**: Implements the latest Angular 20 naming conventions with clean, concise file names

- 🔄 **Modern File Naming**: Clean file names without redundant suffixes (components, services, directives)
- 🏷️ **Component Selectors**: Ensures component selectors use kebab-case with app prefix
- 📝 **Class Names**: Validates and fixes class names to use PascalCase with proper suffixes
- 🎯 **Directive Selectors**: Ensures directive selectors use camelCase with app prefix
- 🔍 **Template & Style URLs**: Updates URLs to match Angular 20 file naming (no `.component` suffix)
- 🧪 **Dry Run Mode**: Preview changes before applying them
- 📊 **Detailed Reporting**: Shows exactly what will be changed and why

## Installation

### Global Installation (Recommended)

```bash
npm install -g ng20-rename
```

### Local Installation

```bash
npm install --save-dev ng20-rename
```

## Usage

### Command Line Interface

```bash
# Basic usage - scan current directory
ng20-rename .

# Scan specific directory
ng20-rename ./src/app

# Dry run to preview changes without applying them
ng20-rename ./src/app --dry-run

# Verbose output to see detailed information
ng20-rename ./src/app --verbose

# Custom file patterns
ng20-rename ./src --include "**/*.ts" "**/*.html" --exclude "node_modules/**" "dist/**"
```

### Programmatic Usage

```typescript
import { AngularRefactorer } from 'ng20-rename';

const refactorer = new AngularRefactorer({
  rootDir: './src/app',
  dryRun: false,
  verbose: true
});

const result = await refactorer.refactor();

console.log(`Files processed: ${result.processedFiles.length}`);
console.log(`Files renamed: ${result.renamedFiles.length}`);
console.log(`Content changes: ${result.contentChanges.length}`);
```

## Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `<directory>` | Directory to scan for Angular files | Required |
| `-d, --dry-run` | Perform a dry run without making changes | `false` |
| `-v, --verbose` | Show verbose output | `false` |
| `-i, --include <patterns...>` | File patterns to include | `["**/*.ts", "**/*.html", "**/*.css", "**/*.scss"]` |
| `-e, --exclude <patterns...>` | File patterns to exclude | `["node_modules/**", "dist/**", "**/*.spec.ts"]` |

## Angular 20 Naming Conventions Applied

### 🎯 New File Naming Rules

Angular 20 introduces **clean and concise** file names by removing redundant suffixes:

✅ **Components, Services & Directives**: No suffixes needed  
✅ **Other Types**: Hyphenated suffixes for clarity

| File Type | Before (Old Angular) | After (Angular 20) |
|-----------|---------------------|-------------------|
| **Components** | `user-profile.component.ts` | `user-profile.ts` |
| **Services** | `auth.service.ts` | `auth.ts` or `auth-store.ts` |
| **Directives** | `highlight.directive.ts` | `highlight.ts` |
| **Pipes** | `currency.pipe.ts` | `currency-pipe.ts` |
| **Modules** | `shared.module.ts` | `shared-module.ts` |
| **Guards** | `auth.guard.ts` | `auth-guard.ts` |
| **Interceptors** | `auth.interceptor.ts` | `auth-interceptor.ts` |
| **Resolvers** | `data.resolver.ts` | `data-resolver.ts` |

### Key Benefits:
- 📦 **Cleaner file structure** with less redundancy
- 🚀 **Faster navigation** in IDEs and file explorers  
- 🎯 **Modern Angular practices** following latest conventions

### Component Conventions (Angular 20)

✅ **Before** (Old Angular):
```typescript
// File: user-profile.component.ts
@Component({
  selector: 'userProfile',
  templateUrl: './UserProfile.component.html',
  styleUrls: ['./UserProfile.component.css']
})
export class userProfile { }
```

✅ **After** (Angular 20):
```typescript  
// File: user-profile.ts (no .component suffix!)
@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.html',      // No .component in URL
  styleUrls: ['./user-profile.css']       // No .component in URL
})
export class UserProfileComponent { }
```

**Key Changes:**
- 📁 **File name**: `user-profile.component.ts` → `user-profile.ts`
- 🔗 **Template URL**: `./user-profile.component.html` → `./user-profile.html`
- 🎨 **Style URL**: `./user-profile.component.css` → `./user-profile.css`

### Service Conventions (Angular 20)

✅ **Before** (Old Angular):
```typescript
// File: auth.service.ts
@Injectable({
  providedIn: 'root'
})
export class AuthService { }
```

✅ **After** (Angular 20):
```typescript
// File: auth.ts (no .service suffix!)
// OR: auth-store.ts, auth-api.ts (domain-specific names)
@Injectable({
  providedIn: 'root'  
})
export class AuthService { }
```

### Directive Conventions (Angular 20)

✅ **Before** (Old Angular):
```typescript
// File: highlight.directive.ts
@Directive({
  selector: '[highlight]'
})
export class highlight { }
```

✅ **After** (Angular 20):
```typescript
// File: highlight.ts (no .directive suffix!)
@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective { }
```

## Supported Angular File Types

### 🎯 Angular 20 Clean Naming:
- 🔸 **Components** (`.ts` - no suffix!)
- 🔸 **Services** (`.ts` - no suffix!)  
- 🔸 **Directives** (`.ts` - no suffix!)

### 🔗 Hyphenated Suffixes:
- 🔸 **Pipes** (`-pipe.ts`)
- 🔸 **Modules** (`-module.ts`)
- 🔸 **Guards** (`-guard.ts`)
- 🔸 **Interceptors** (`-interceptor.ts`)
- 🔸 **Resolvers** (`-resolver.ts`)

### 📄 Assets:
- 🔸 **Templates** (`.html`)
- 🔸 **Stylesheets** (`.css`, `.scss`, `.sass`)

## Example Output

```bash
$ ng20-rename ./src/app --verbose

Starting Angular refactoring in: /project/src/app
Dry run: No
Include patterns: **/*.ts, **/*.html, **/*.css, **/*.scss
Exclude patterns: node_modules/**, dist/**, **/*.spec.ts
---

=== Refactoring Results ===
Files processed: 15
Files renamed: 8
Content changes: 12
Errors: 0

--- File Renames ---
/project/src/app/user-profile.component.ts -> /project/src/app/user-profile.ts
  Reason: Angular 20 clean naming: remove .component suffix
/project/src/app/auth.service.ts -> /project/src/app/auth.ts  
  Reason: Angular 20 clean naming: remove .service suffix
/project/src/app/shared.module.ts -> /project/src/app/shared-module.ts
  Reason: Angular 20 hyphenated suffix for modules

--- Content Changes ---
/project/src/app/user-profile.ts:
  Line 3: Component selector should use kebab-case with app prefix
    - selector: 'userProfile',
    + selector: 'app-user-profile',
  Line 4: Template URL should match Angular 20 naming
    - templateUrl: './user-profile.component.html',
    + templateUrl: './user-profile.html',
  Line 5: Style URL should match Angular 20 naming  
    - styleUrls: ['./user-profile.component.css'],
    + styleUrls: ['./user-profile.css'],

✅ Refactoring completed successfully!
```

## API Reference

### `AngularRefactorer`

Main class for performing Angular refactoring operations.

#### Constructor Options

```typescript
interface RefactorOptions {
  rootDir: string;           // Directory to scan
  include?: string[];        // File patterns to include
  exclude?: string[];        // File patterns to exclude
  dryRun?: boolean;          // Preview mode
  verbose?: boolean;         // Detailed output
}
```

#### Methods

- `refactor(): Promise<RefactorResult>` - Performs the refactoring operation

### `RefactorResult`

```typescript
interface RefactorResult {
  processedFiles: string[];      // Files that were processed
  renamedFiles: RenamedFile[];   // Files that were renamed
  contentChanges: ContentChange[]; // Content modifications
  errors: RefactorError[];       // Any errors encountered
}
```

## Development

### Setup

```bash
git clone https://github.com/mlapaglia/ng20-rename.git
cd ng20-rename
npm install
```

### Scripts

```bash
npm run build          # Build the package
npm run dev           # Build in watch mode
npm run test          # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint errors
npm run format        # Format code with Prettier
```

### Testing

The package includes comprehensive tests for all refactoring rules:

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass (`npm test`)
6. Run linting (`npm run lint`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

## Publishing

The package is automatically published to npm when a new release is created on GitHub. The GitHub Actions workflow handles building, testing, and publishing.

### Manual Release Process

1. Update the version in `package.json`
2. Create and push a git tag:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
3. Create a GitHub release from the tag
4. The GitHub Actions workflow will automatically publish to npm

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Based on the [Angular Style Guide](https://angular.dev/style-guide)
- Inspired by the Angular community's commitment to consistent code standards
- Built with TypeScript and modern Node.js tooling

## Changelog

### v1.0.0

- 🚀 **Angular 20 Support**: Clean, concise file naming conventions
- 📁 **Modern File Naming**: Remove redundant suffixes from components, services, directives
- 🔗 **Smart URL Updates**: Template and style URLs match new Angular 20 naming
- 🎯 **Hyphenated Suffixes**: Pipes, modules, guards use hyphenated suffixes (`-pipe.ts`, `-module.ts`)
- 🏷️ **Component & Directive Refactoring**: Proper selectors and class names
- 🧪 **Comprehensive CLI**: Full dry-run mode with detailed reporting
- ✅ **Full Test Coverage**: Extensive test suite with integration tests
- 🔄 **Automated Publishing**: GitHub Actions workflow for npm releases
