# Proposed Test Structure Reorganization

## Current Issues
- Mixed testing approaches (virtual FS vs real FS)
- Duplicate test scenarios (snackbar tests)
- Scattered organization without clear patterns
- Legacy tests using slow file system operations

## Proposed Structure

```
src/__tests__/
├── testing/                           # Test infrastructure
│   ├── virtual-file-system.ts         # ✅ Virtual FS implementation
│   ├── test-utilities.ts              # ✅ Import & rename utilities
│   ├── test-helpers.ts                # 🆕 Additional helper utilities
│   ├── fixtures/                      # 🆕 Organized test fixtures
│   │   ├── angular-projects.ts        # Pre-built project scenarios
│   │   ├── component-examples.ts      # Component test cases
│   │   └── service-examples.ts        # Service test cases
│   └── README.md                      # ✅ Documentation
│
├── unit/                              # Pure unit tests (fast, isolated)
│   ├── core/                          # Core functionality tests
│   │   ├── import-parser.test.ts      # ✅ Import parsing (renamed)
│   │   ├── file-renamer.test.ts       # ✅ File renaming (renamed)
│   │   ├── conflict-resolver.test.ts  # 🔄 Migrate existing
│   │   └── path-normalizer.test.ts    # 🔄 Migrate existing
│   ├── rules/                         # Rule-specific tests
│   │   ├── component-rule.test.ts     # 🔄 Migrate existing
│   │   ├── service-rule.test.ts       # 🔄 Migrate existing
│   │   └── file-naming-rule.test.ts   # 🔄 Migrate existing
│   ├── infrastructure/                # Infrastructure tests
│   │   ├── logger.test.ts            # 🔄 Keep existing
│   │   ├── error-handler.test.ts     # 🔄 Keep existing
│   │   └── config.test.ts            # 🔄 Keep existing
│   └── cli/                          # CLI-specific tests
│       ├── formatter.test.ts         # 🔄 Migrate existing
│       └── index.test.ts             # 🔄 Keep existing
│
├── integration/                       # End-to-end scenarios
│   ├── refactoring-workflows.test.ts  # ✅ Main scenarios
│   ├── real-world-projects.test.ts    # 🆕 Complex project tests
│   ├── edge-cases.test.ts             # 🔄 Migrate edge cases
│   └── performance.test.ts            # 🆕 Performance benchmarks
│
├── legacy/                            # 🆕 Temporary migration folder
│   ├── snackbar-renaming.test.ts      # 🔄 Mark for migration
│   ├── snackbar-fixtures.test.ts      # 🔄 Mark for migration
│   ├── backslash-issue.test.ts        # 🔄 Mark for migration
│   └── path-normalization.test.ts     # 🔄 Mark for migration
│
└── e2e/                              # 🆕 End-to-end with real files (minimal)
    ├── cli-integration.test.ts        # Real CLI testing
    └── file-system-integration.test.ts # Real FS edge cases only
```

## Migration Strategy

### Phase 1: Immediate (Low Risk)
- ✅ Keep existing new architecture
- 🆕 Create additional helper utilities
- 🆕 Add performance benchmarks
- 🔄 Move legacy tests to `/legacy` folder

### Phase 2: Gradual Migration (Medium Risk)  
- 🔄 Migrate high-value legacy tests to virtual FS
- 🔄 Consolidate duplicate test scenarios
- 🔄 Reorganize by functionality rather than file type

### Phase 3: Optimization (Higher Risk)
- 🔄 Remove/archive truly legacy tests
- 🔄 Create comprehensive real-world test scenarios
- 🔄 Add performance monitoring

## Benefits of New Structure

1. **Clear Separation**: Unit vs Integration vs E2E
2. **Faster Tests**: Virtual FS for 90% of tests
3. **Better Organization**: By functionality, not file type
4. **Easier Maintenance**: Centralized test utilities
5. **Scalability**: Easy to add new test scenarios
6. **Performance**: Benchmarking and monitoring built-in
