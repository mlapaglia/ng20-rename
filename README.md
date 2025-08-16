# ng20-rename

A TypeScript package to refactor Angular applications to use the latest **Angular 20** naming conventions with clean, concise file names that remove redundant suffixes.

[![CI](https://github.com/mlapaglia/ng20-rename/actions/workflows/ci.yml/badge.svg)](https://github.com/mlapaglia/ng20-rename/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/ng20-rename.svg)](https://badge.fury.io/js/ng20-rename)
[![codecov](https://codecov.io/gh/mlapaglia/ng20-rename/branch/main/graph/badge.svg)](https://codecov.io/gh/mlapaglia/ng20-rename)

## Features

✨ **Angular 20 Ready**: Implements the latest Angular 20 naming conventions with clean, concise file names

- 🔄 **Modern File Naming**: Clean file names without redundant suffixes (components, services, directives)
- 🧠 **Smart Domain Detection**: Automatically detects service patterns and suggests domain-specific names (`-api`, `-store`, `-notifications`, etc.)
- 🏷️ **Component Selectors**: Ensures component selectors use kebab-case with app prefix
- 📝 **Class Names**: Validates and fixes class names to use PascalCase with proper suffixes
- 🎯 **Directive Selectors**: Ensures directive selectors use camelCase with app prefix
- 🔍 **Template & Style URLs**: Updates URLs to match Angular 20 file naming (no `.component` suffix)
- ⚠️ **Conflict Detection**: Identifies naming conflicts and provides manual review guidance
- 🧪 **Dry Run Mode**: Preview changes before applying them
- 📊 **Detailed Reporting**: Shows exactly what will be changed and why

## Installation

### Global Installation (Recommended)

```bash
npm install -g @mlapaglia/ng20-rename
```

### Local Installation

```bash
npm install --save-dev @mlapaglia/ng20-rename
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
  verbose: true,
  smartServices: true // Enable smart domain detection (default)
});

const result = await refactorer.refactor();

console.log(`Files processed: ${result.processedFiles.length}`);
console.log(`Files renamed: ${result.renamedFiles.length}`);
console.log(`Content changes: ${result.contentChanges.length}`);
console.log(`Manual review required: ${result.manualReviewRequired.length}`);
console.log(`Errors: ${result.errors.length}`);

// Handle manual review items
if (result.manualReviewRequired.length > 0) {
  console.log('\n⚠️ Manual Review Required:');
  result.manualReviewRequired.forEach((item, index) => {
    console.log(`${index + 1}. ${item.filePath}`);
    console.log(`   Desired: ${item.filePath} -> ${item.desiredNewPath}`);
    console.log(`   Issue: ${item.reason}`);
    console.log(`   Type: ${item.conflictType}`);
  });
}

// Handle errors
if (result.errors.length > 0) {
  console.log('\n❌ Errors:');
  result.errors.forEach(error => {
    console.error(`${error.filePath}: ${error.message}`);
  });
}
```

## Command Line Options

| Option                        | Description                              | Default                                             |
| ----------------------------- | ---------------------------------------- | --------------------------------------------------- |
| `<directory>`                 | Directory to scan for Angular files      | Required                                            |
| `-d, --dry-run`               | Perform a dry run without making changes | `false`                                             |
| `-v, --verbose`               | Show verbose output                      | `false`                                             |
| `-i, --include <patterns...>` | File patterns to include                 | `["**/*.ts", "**/*.html", "**/*.css", "**/*.scss"]` |
| `-e, --exclude <patterns...>` | File patterns to exclude                 | `["node_modules/**", "dist/**", "**/*.spec.ts"]`    |
| `--disable-smart-services`    | Disable smart domain detection for services | `false` (smart services enabled by default)        |

## Angular 20 Naming Conventions Applied

### 🎯 New File Naming Rules

Angular 20 introduces **clean and concise** file names by removing redundant suffixes:

✅ **Components, Services & Directives**: No suffixes needed  
✅ **Other Types**: Hyphenated suffixes for clarity

| File Type        | Before (Old Angular)        | After (Angular 20)           |
| ---------------- | --------------------------- | ---------------------------- |
| **Components**   | `user-profile.component.ts` | `user-profile.ts`            |
| **Services**     | `auth.service.ts`           | `auth.ts` or `auth-store.ts` |
| **Directives**   | `highlight.directive.ts`    | `highlight.ts`               |
| **Pipes**        | `currency.pipe.ts`          | `currency-pipe.ts`           |
| **Modules**      | `shared.module.ts`          | `shared-module.ts`           |
| **Guards**       | `auth.guard.ts`             | `auth-guard.ts`              |
| **Interceptors** | `auth.interceptor.ts`       | `auth-interceptor.ts`        |
| **Resolvers**    | `data.resolver.ts`          | `data-resolver.ts`           |

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
export class userProfile {}
```

✅ **After** (Angular 20):

```typescript
// File: user-profile.ts (no .component suffix!)
@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.html', // No .component in URL
  styleUrls: ['./user-profile.css'] // No .component in URL
})
export class UserProfileComponent {}
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
export class AuthService {}
```

✅ **After** (Angular 20):

```typescript
// File: auth.ts (no .service suffix!)
// OR: auth-store.ts, auth-api.ts (domain-specific names)
@Injectable({
  providedIn: 'root'
})
export class AuthService {}
```

### 🧠 Smart Domain Detection for Services

**NEW**: The tool automatically analyzes service code to suggest domain-specific naming based on usage patterns:

| Domain Pattern | Example Names | Detection Criteria |
|----------------|---------------|-------------------|
| **API Services** | `user-api.ts`, `data-api.ts` | HttpClient usage, REST methods (get, post, put, delete) |
| **State Stores** | `user-store.ts`, `cart-store.ts` | State management, signals, BehaviorSubject, NgRx patterns |
| **Notifications** | `toast-notifications.ts`, `alert-notifications.ts` | MatSnackBar, ToastrService, notification methods |
| **External Clients** | `stripe-client.ts`, `firebase-client.ts` | Third-party integrations, SDK wrappers |
| **Cache Services** | `data-cache.ts`, `user-cache.ts` | Caching patterns, localStorage, memory storage |
| **Validators** | `form-validator.ts`, `input-validator.ts` | Validation logic, Angular Forms patterns |

**Example Smart Detection:**

```typescript
// File: notification.service.ts
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);
  
  show(message: string) {
    this.snackBar.open(message);
  }
}

// 🧠 Smart detection → Renames to: notification-notifications.ts
// Reason: Detected MatSnackBar usage and notification patterns
```

**Control Smart Detection:**

```bash
# Enable smart services (default)
ng20-rename ./src/app

# Disable smart services (use generic naming)
ng20-rename ./src/app --disable-smart-services
```

### Directive Conventions (Angular 20)

✅ **Before** (Old Angular):

```typescript
// File: highlight.directive.ts
@Directive({
  selector: '[highlight]'
})
export class highlight {}
```

✅ **After** (Angular 20):

```typescript
// File: highlight.ts (no .directive suffix!)
@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective {}
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

### Successful Refactoring

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
Manual review required: 0
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

### Handling Naming Conflicts

When the tool encounters files that would conflict during renaming, it provides detailed warnings and requires manual intervention:

```bash
$ ng20-rename ./src/app --verbose

Starting Angular refactoring in: /project/src/app
Dry run: No
Include patterns: **/*.ts, **/*.html, **/*.css, **/*.scss
Exclude patterns: node_modules/**, dist/**, **/*.spec.ts
---

=== Refactoring Results ===
Files processed: 12
Files renamed: 5
Content changes: 8
Manual review required: 2
Errors: 0

--- File Renames ---
/project/src/app/auth.service.ts -> /project/src/app/auth.ts
  Reason: Angular 20 clean naming: remove .service suffix
/project/src/app/shared.module.ts -> /project/src/app/shared-module.ts
  Reason: Angular 20 hyphenated suffix for modules

--- Content Changes ---
/project/src/app/auth.ts:
  Line 8: Component selector should use kebab-case with app prefix
    - selector: 'authForm',
    + selector: 'app-auth-form',

--- Manual Review Required ---
The following files require manual attention due to naming conflicts:

1. src/app/user-profile.component.ts
   Desired rename: src/app/user-profile.component.ts -> src/app/user-profile.ts
   Issue: Cannot rename to user-profile.ts - target file already exists
   Action needed: Resolve the naming conflict manually

2. src/app/payment.service.ts
   Desired rename: src/app/payment.service.ts -> src/app/payment.ts
   Issue: Cannot rename to payment.ts - target file already exists
   Action needed: Resolve the naming conflict manually

⚠️  Manual intervention required for 2 files with naming conflicts.
✅ Other refactoring completed successfully!
```

### Dry Run Mode

Preview changes without applying them to safely assess the impact:

```bash
$ ng20-rename ./src/app --dry-run --verbose

Starting Angular refactoring in: /project/src/app
Dry run: Yes
Include patterns: **/*.ts, **/*.html, **/*.css, **/*.scss
Exclude patterns: node_modules/**, dist/**, **/*.spec.ts
---

=== Refactoring Results (Preview) ===
Files processed: 15
Files renamed: 8
Content changes: 12
Manual review required: 1
Errors: 0

--- File Renames (Preview) ---
/project/src/app/user-profile.component.ts -> /project/src/app/user-profile.ts
  Reason: Angular 20 clean naming: remove .component suffix
/project/src/app/auth.service.ts -> /project/src/app/auth.ts
  Reason: Angular 20 clean naming: remove .service suffix

--- Manual Review Required ---
1. src/app/data.service.ts
   Desired rename: src/app/data.service.ts -> src/app/data.ts
   Issue: Cannot rename to data.ts - target file already exists
   Action needed: Resolve the naming conflict manually

⚠️  This was a dry run. No files were actually modified.
Run without --dry-run to apply changes.
```

## Handling Naming Conflicts

### Common Conflict Scenarios

The tool detects and prevents potentially destructive file operations by identifying naming conflicts before they occur:

#### 1. **Existing Target Files**

When a file needs to be renamed to a name that already exists:

```bash
# Scenario: Both files exist
src/app/user-profile.component.ts  # Needs to become user-profile.ts
src/app/user-profile.ts            # Already exists!

# Tool Response:
--- Manual Review Required ---
1. src/app/user-profile.component.ts
   Desired rename: user-profile.component.ts -> user-profile.ts
   Issue: Cannot rename to user-profile.ts - target file already exists
   Action needed: Resolve the naming conflict manually
```

#### 2. **Associated File Conflicts**

Components with multiple associated files (HTML, CSS, spec) may have partial conflicts:

```bash
# Scenario: Component files with mixed naming
src/app/login.component.ts         # Needs renaming
src/app/login.component.html       # Needs renaming
src/app/login.css                  # Already exists - conflict!
src/app/login.component.css        # Needs renaming to login.css

# Tool Response: Renames what it can, flags conflicts
```

### Resolving Conflicts

#### **Option 1: Manual Resolution**

1. Review the conflicting files
2. Decide which file to keep or merge content
3. Manually rename or remove files
4. Re-run the tool

#### **Option 2: Backup and Resolve**

```bash
# Create backup of conflicting target file
mv src/app/user-profile.ts src/app/user-profile.backup.ts

# Re-run the refactoring tool
ng20-rename ./src/app

# Review and merge content if needed
# Remove backup when satisfied
```

#### **Option 3: Selective Processing**

Use exclude patterns to skip problematic directories:

```bash
# Skip specific files or directories with conflicts
ng20-rename ./src/app --exclude "src/app/conflicted/**" "src/app/user-profile.ts"
```

### Best Practices for Conflict Prevention

1. **Run in Dry Mode First**: Always use `--dry-run` to preview changes
2. **Process Incrementally**: Refactor small sections at a time
3. **Backup Important Files**: Create backups before running on critical codebases
4. **Review Conflicts Carefully**: Examine conflicting files to understand their purpose
5. **Use Version Control**: Commit changes before running the tool

## API Reference

### `AngularRefactorer`

Main class for performing Angular refactoring operations.

#### Constructor Options

```typescript
interface RefactorOptions {
  rootDir: string; // Directory to scan
  include?: string[]; // File patterns to include
  exclude?: string[]; // File patterns to exclude
  dryRun?: boolean; // Preview mode
  verbose?: boolean; // Detailed output
  smartServices?: boolean; // Enable smart domain detection for services (default: true)
}
```

#### Methods

- `refactor(): Promise<RefactorResult>` - Performs the refactoring operation

### `RefactorResult`

```typescript
interface RefactorResult {
  processedFiles: string[]; // Files that were processed
  renamedFiles: RenamedFile[]; // Files that were renamed
  contentChanges: ContentChange[]; // Content modifications
  manualReviewRequired: ManualReviewItem[]; // Files requiring manual intervention
  errors: RefactorError[]; // Any errors encountered
}

interface ManualReviewItem {
  filePath: string; // File that needs manual review
  desiredNewPath: string; // Desired new file name that conflicts
  reason: string; // Reason for manual review
  conflictType: 'naming_conflict' | 'other'; // Type of conflict
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
- 🧠 **Smart Domain Detection**: Automatically detects service patterns and suggests domain-specific names
- ⚠️ **Conflict Detection**: Identifies naming conflicts and provides manual review guidance
- 🔗 **Smart URL Updates**: Template and style URLs match new Angular 20 naming
- 📎 **Associated File Renaming**: Automatically renames HTML, CSS, and spec files with components
- 🎯 **Hyphenated Suffixes**: Pipes, modules, guards use hyphenated suffixes (`-pipe.ts`, `-module.ts`)
- 🏷️ **Component & Directive Refactoring**: Proper selectors and class names
- 🧪 **Comprehensive CLI**: Full dry-run mode with detailed reporting and relative path output
- ✅ **Full Test Coverage**: Extensive test suite with integration tests
- 🔄 **Automated Publishing**: GitHub Actions workflow for npm releases
