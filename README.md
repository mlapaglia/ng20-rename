# ng20-rename

A TypeScript package to refactor Angular applications to use the latest Angular naming conventions based on the [official Angular Style Guide](https://angular.dev/style-guide).

[![CI](https://github.com/mlapaglia/ng20-rename/actions/workflows/ci.yml/badge.svg)](https://github.com/mlapaglia/ng20-rename/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/ng20-rename.svg)](https://badge.fury.io/js/ng20-rename)
[![codecov](https://codecov.io/gh/mlapaglia/ng20-rename/branch/main/graph/badge.svg)](https://codecov.io/gh/mlapaglia/ng20-rename)

## Features

- 🔄 **File Naming**: Converts file names to kebab-case with proper Angular suffixes
- 🏷️ **Component Selectors**: Ensures component selectors use kebab-case with app prefix
- 📝 **Class Names**: Validates and fixes class names to use PascalCase with proper suffixes
- 🎯 **Directive Selectors**: Ensures directive selectors use camelCase with app prefix
- 🔍 **Template & Style URLs**: Updates template and style URLs to match component names
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

## Naming Conventions Applied

### File Naming

✅ **Before**: `UserProfile.component.ts`, `userService.ts`  
✅ **After**: `user-profile.component.ts`, `user.service.ts`

- Converts PascalCase and camelCase to kebab-case
- Ensures proper Angular file suffixes (`.component.ts`, `.service.ts`, etc.)
- Matches file names to TypeScript class names

### Component Conventions

✅ **Before**:
```typescript
@Component({
  selector: 'userProfile',
  templateUrl: './UserProfile.html',
  styleUrls: ['./UserProfile.css']
})
export class userProfile { }
```

✅ **After**:
```typescript
@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent { }
```

### Directive Conventions

✅ **Before**:
```typescript
@Directive({
  selector: '[highlight]'
})
export class highlight { }
```

✅ **After**:
```typescript
@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective { }
```

## Supported Angular File Types

- 🔸 **Components** (`.component.ts`)
- 🔸 **Services** (`.service.ts`)
- 🔸 **Directives** (`.directive.ts`)
- 🔸 **Pipes** (`.pipe.ts`)
- 🔸 **Modules** (`.module.ts`)
- 🔸 **Guards** (`.guard.ts`)
- 🔸 **Interceptors** (`.interceptor.ts`)
- 🔸 **Resolvers** (`.resolver.ts`)
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
Files renamed: 3
Content changes: 7
Errors: 0

--- File Renames ---
/project/src/app/UserProfile.component.ts -> /project/src/app/user-profile.component.ts
  Reason: File name should use kebab-case: UserProfile.component.ts -> user-profile.component.ts

--- Content Changes ---
/project/src/app/user-profile.component.ts:
  Line 3: Component selector should use kebab-case with app prefix: userProfile -> app-user-profile
    - selector: 'userProfile',
    + selector: 'app-user-profile',

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

- Initial release
- File naming convention enforcement
- Component selector and class name refactoring
- Directive selector and class name refactoring
- Template and style URL fixing
- Comprehensive CLI with dry-run mode
- Full test coverage
