# ng20-rename

A TypeScript package to refactor Angular applications to use the latest **Angular 20** naming conventions with clean, concise file names that remove redundant suffixes.

[![CI](https://github.com/mlapaglia/ng20-rename/actions/workflows/ci.yml/badge.svg)](https://github.com/mlapaglia/ng20-rename/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@mlapaglia%2Fng20-rename.svg)](https://badge.fury.io/js/@mlapaglia%2Fng20-rename)
[![codecov](https://codecov.io/gh/mlapaglia/ng20-rename/graph/badge.svg?token=U3HLWUK4UU)](https://codecov.io/gh/mlapaglia/ng20-rename)

## Features

✨ **Angular 20 Ready**: Implements the latest Angular 20 naming conventions with clean, concise file names

- 🔄 **Modern File Naming**: Clean file names without redundant suffixes (components, services, directives)
- 🧠 **Smart Domain Detection**: Automatically detects service patterns and suggests domain-specific names (`-api`, `-store`, `-notifications`, etc.)
- 🤖 **Intelligent Conflict Resolution**: Automatically resolves naming conflicts by analyzing file content and applying smart renaming strategies
- 🏷️ **Component Selectors**: Ensures component selectors use kebab-case with app prefix
- 📝 **Class Names**: Validates and fixes class names to use PascalCase with proper suffixes
- 🎯 **Directive Selectors**: Ensures directive selectors use camelCase with app prefix
- 🔍 **Template & Style URLs**: Updates URLs to match Angular 20 file naming (no `.component` suffix)
- ⚠️ **Advanced Conflict Detection**: Identifies naming conflicts and provides manual review guidance when automatic resolution isn't possible
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

## 🤖 Intelligent Conflict Resolution

**NEW**: The tool now automatically resolves most naming conflicts by analyzing file content and applying smart renaming strategies.

### How It Works

When a file needs to be renamed to a name that already exists, the tool:

1. **Analyzes the conflicting file** using TypeScript domain detection
2. **Determines the appropriate domain** based on code patterns
3. **Automatically renames the conflicting file** with a domain-specific suffix
4. **Proceeds with the original rename** now that the conflict is resolved

### Supported Domain Detection for Plain TypeScript Files

| Domain | Detection Patterns | Example Rename |
|--------|-------------------|----------------|
| **Models** | `interface`, `class` with data properties (`id`, `name`, `email`) | `user.ts` → `user-model.ts` |
| **Types** | `type` definitions, union types, generics | `api.ts` → `api-types.ts` |
| **Constants** | `const` exports with UPPER_CASE names, configuration objects | `config.ts` → `config-constants.ts` |
| **Utils** | Utility functions (`format`, `parse`, `calculate`, `transform`) | `helpers.ts` → `helpers-utils.ts` |
| **Validators** | Validation functions (`validate`, `isValid`, `check`, `verify`) | `form.ts` → `form-validator.ts` |
| **Factories** | Factory classes/functions (`create`, `build`, `make`) | `user.ts` → `user-factory.ts` |
| **Enums** | `enum` definitions | `status.ts` → `status-enum.ts` |
| **Interfaces** | `interface` definitions for contracts | `repository.ts` → `repository-interface.ts` |

### Example Automatic Resolution

```typescript
// Scenario: Component wants to rename to user.ts, but user.ts already exists

// Existing file: user.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

// Component file: user.component.ts
@Component({
  selector: 'app-user',
  template: '<div>User component</div>'
})
export class UserComponent {}

// 🤖 Automatic Resolution:
// 1. Analyzes user.ts → Detects model patterns (interface with data properties)
// 2. Renames user.ts → user-model.ts
// 3. Renames user.component.ts → user.ts
// ✅ Conflict resolved automatically!
```

### When Manual Review Is Still Required

The tool falls back to manual review when:

- **Conflicting file has no clear domain** (mixed or unclear patterns)
- **Conflicting file is another Angular file** (service, component, etc.)
- **Proposed domain-specific name already exists** (e.g., `user-model.ts` already exists)
- **File cannot be read** due to permissions or other errors

### Benefits

- 🚀 **Faster refactoring** - Most conflicts resolve automatically
- 🎯 **Better organization** - Files get appropriate domain-specific names
- 🛡️ **Safe operations** - Only renames files with clear, confident domain detection
- 📊 **Full transparency** - All automatic renames are logged with explanations

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
/project/src/app/auth.service.ts -> /project/src/app/auth-api.ts
  Reason: Smart service detection: detected HTTP patterns
/project/src/app/shared.module.ts -> /project/src/app/shared-module.ts
  Reason: Angular 20 hyphenated suffix for modules
/project/src/app/user.ts -> /project/src/app/user-model.ts
  Reason: Resolved naming conflict: detected model patterns (auto-resolved)

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

The tool now features intelligent conflict resolution that automatically resolves most conflicts. When manual intervention is still needed, it provides detailed guidance:

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
/project/src/app/auth.service.ts -> /project/src/app/auth-api.ts
  Reason: Smart service detection: detected HTTP patterns
/project/src/app/shared.module.ts -> /project/src/app/shared-module.ts
  Reason: Angular 20 hyphenated suffix for modules
/project/src/app/user-profile.component.ts -> /project/src/app/user-profile.ts
  Reason: Angular 20 clean naming: remove .component suffix
/project/src/app/user-profile.ts -> /project/src/app/user-profile-model.ts
  Reason: Resolved naming conflict: detected model patterns (auto-resolved)
/project/src/app/payment.ts -> /project/src/app/payment-utils.ts
  Reason: Resolved naming conflict: detected utility patterns (auto-resolved)
/project/src/app/payment.service.ts -> /project/src/app/payment-api.ts
  Reason: Smart service detection: detected HTTP patterns

--- Content Changes ---
/project/src/app/user-profile.ts:
  Line 8: Component selector should use kebab-case with app prefix
    - selector: 'userProfile',
    + selector: 'app-user-profile',

--- Manual Review Required ---
The following files require manual attention due to naming conflicts:

1. src/app/data.service.ts
   Desired rename: src/app/data.service.ts -> src/app/data.ts
   Issue: Cannot rename to data.ts - conflicting file has no clear domain patterns
   Action needed: Manually resolve the conflict or rename the conflicting file

⚠️  Manual intervention required for 1 file with unresolvable naming conflict.
✅ Most conflicts were automatically resolved! Other refactoring completed successfully!
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