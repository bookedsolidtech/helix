# ACTION PLAN: MCP Server Test Coverage (P0 - BLOCKING)

**Created**: 2026-02-21
**Priority**: P0 - CRITICAL - BLOCKING PRODUCTION
**Status**: 🔴 NOT STARTED
**Owner**: test-architect (strategy) + qa-engineer-automation (implementation)

---

## Problem Statement

Three MCP servers were built and committed to `main` with **ZERO test coverage**:

- `@helix/mcp-health-scorer` - 3 source files, ~300 lines
- `@helix/mcp-cem-analyzer` - 3 source files, ~300 lines
- `@helix/mcp-typescript-diagnostics` - 3 source files, ~300 lines

**Total untested code**: 9 files, ~900 lines

**Risk level**: CRITICAL

- Code has never been runtime validated
- Edge cases unknown
- Error handling gaps identified
- Security vulnerabilities possible (path traversal risk in health-scorer)

---

## Required Deliverables

### 1. Test Infrastructure Setup

Create test files for each server:

```
apps/mcp-servers/
├── health-scorer/src/
│   ├── handlers.test.ts     ❌ CREATE
│   ├── tools.test.ts        ❌ CREATE
│   └── index.test.ts        ❌ CREATE
├── cem-analyzer/src/
│   ├── handlers.test.ts     ❌ CREATE
│   ├── tools.test.ts        ❌ CREATE
│   └── index.test.ts        ❌ CREATE
└── typescript-diagnostics/src/
    ├── handlers.test.ts     ❌ CREATE
    ├── tools.test.ts        ❌ CREATE
    └── index.test.ts        ❌ CREATE
```

### 2. Coverage Targets

- **Minimum**: 80% statement coverage per server
- **Target**: 90%+ statement coverage
- **Required**: 100% coverage of error paths

### 3. Test Categories

For each server, implement:

#### Unit Tests

- Each handler function in isolation
- Tool definition validation
- Input validation (schema validation)
- Error handling paths

#### Integration Tests

- Tool execution end-to-end
- File system operations (with temp directories)
- Git operations (with test repos)
- Cross-tool interactions

#### Edge Case Tests

- Empty inputs
- Missing files
- Malformed JSON
- Invalid paths
- Division by zero (already fixed in code, verify fix)
- Negative numbers
- Very large inputs

#### Security Tests

- Path traversal attempts
- Command injection attempts (if applicable)
- Malicious input handling

---

## Test Execution Plan

### Phase 1: health-scorer (Priority 1)

**Why first**: Has identified security risk (path traversal), most complex logic

**Test cases needed**:

#### `handlers.test.ts`

```typescript
describe('scoreComponent', () => {
  test('returns component health from latest history');
  test('throws when no health history exists');
  test('throws when component not found');
  test('handles missing optional fields (score, grade, dimensions)');
});

describe('scoreAllComponents', () => {
  test('returns all components from latest history');
  test('throws when no health history exists');
  test('handles empty components array');
});

describe('getHealthTrend', () => {
  test('calculates trend over N days');
  test('handles missing component in some files');
  test('throws when component has no history');
  test('calculates improving trend correctly');
  test('calculates declining trend correctly');
  test('calculates stable trend correctly');
  test('handles division by zero (firstScore = 0)');
  test('throws when days <= 0'); // NEW: not currently validated
});

describe('getHealthDiff', () => {
  test('compares current vs base branch');
  test('handles component not in base branch');
  test('throws when base branch does not exist'); // NEW: not currently tested
  test('identifies improved dimensions');
  test('identifies regressed dimensions');
  test('calculates score delta correctly');
});
```

#### `tools.test.ts`

```typescript
describe('MCP Tool Definitions', () => {
  test('all tools have valid schemas');
  test('tool names follow conventions');
  test('tool descriptions are present');
  test('input schemas validate correctly');
});
```

#### `index.test.ts`

```typescript
describe('MCP Server', () => {
  test('server starts successfully');
  test('server responds to tool list request');
  test('server handles unknown tools');
  test('server handles malformed requests');
});
```

**Security-specific tests**:

```typescript
describe('Security', () => {
  test('rejects path traversal attempts in file paths');
  test('PROJECT_ROOT is correctly resolved');
  test('file operations stay within workspace');
});
```

### Phase 2: cem-analyzer (Priority 2)

**Why second**: Depends on CEM file integrity, less security risk

**Test cases needed**:

- CEM parsing validation
- Component metadata extraction
- Malformed CEM handling
- Missing CEM file scenarios

### Phase 3: typescript-diagnostics (Priority 3)

**Why third**: TypeScript API dependency, most complex to mock

**Test cases needed**:

- TS diagnostic extraction
- Invalid TS file handling
- Compiler API edge cases
- Performance with large files

---

## Implementation Strategy

### Step 1: Set up test fixtures

Create test data directories:

```
apps/mcp-servers/health-scorer/__tests__/
├── fixtures/
│   ├── health-history/
│   │   ├── 2026-02-20.json
│   │   ├── 2026-02-19.json
│   │   └── 2026-02-18.json
│   └── invalid/
│       ├── empty.json
│       ├── malformed.json
│       └── missing-fields.json
```

### Step 2: Mock external dependencies

- File system operations → use temp directories
- Git operations → mock or use test repos
- PROJECT_ROOT → inject via dependency injection

### Step 3: Write tests incrementally

1. Happy path tests first (establishes baseline)
2. Error path tests second (validates error handling)
3. Edge case tests third (hardens implementation)
4. Security tests last (proves safety)

### Step 4: Fix bugs found during testing

**Expected**: Tests will uncover bugs. Document and fix inline.

### Step 5: Verify in actual MCP runtime

After tests pass:

1. Manually test in Claude Desktop
2. Validate all tools work end-to-end
3. Document setup/usage

---

## Acceptance Criteria

- ✅ All 9 test files created
- ✅ 80%+ coverage for each server
- ✅ All tests passing in CI
- ✅ Error paths explicitly tested
- ✅ Edge cases covered
- ✅ Security tests passing
- ✅ Manual runtime validation complete
- ✅ Documentation updated with usage examples

---

## Timeline Estimate

- **Phase 1 (health-scorer)**: 1 day
  - 4 hours: Test setup + fixtures
  - 4 hours: Write + debug tests

- **Phase 2 (cem-analyzer)**: 0.5 days
  - Reuse patterns from Phase 1

- **Phase 3 (typescript-diagnostics)**: 0.5 days
  - Reuse patterns from Phase 1

- **Manual validation**: 0.5 days
  - Test all tools in Claude Desktop
  - Document findings

**Total**: 2.5 days (assumes dedicated focus)

---

## Blockers / Dependencies

- None identified
- All infrastructure exists (Vitest configured)
- Can start immediately

---

## Definition of Done

This task is complete when:

1. ✅ `npm run test` shows 0 failures for all MCP servers
2. ✅ Coverage reports show 80%+ for each server
3. ✅ All identified bugs fixed
4. ✅ Security tests passing
5. ✅ Manual runtime validation documented
6. ✅ CI pipeline passes
7. ✅ Code reviewed by senior-code-reviewer
8. ✅ This action plan closed and archived

---

## Next Steps

1. **Immediate**: Assign to test-architect for test strategy refinement
2. **Next**: test-architect delegates implementation to qa-engineer-automation
3. **Then**: Daily standups to track progress
4. **Finally**: Code review → merge → close action plan

---

**Status tracking**: Update this file with progress daily.
