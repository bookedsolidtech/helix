# TIER 3 REQUIRED FIXES

**Status:** BLOCKING — Must fix before merge to main
**Reviewer:** Viktor S. Kozlov (Chief Code Reviewer - Tier 3)
**Date:** 2026-02-16

---

## ISSUE #1: TypeScript Strict Mode Build Failure (CRITICAL)

**File:** `/Volumes/Development/wc-2026/apps/admin/src/components/health/ComponentDrillDown.tsx`
**Line:** 188
**Severity:** CRITICAL (blocks production build)

### Current Code (WRONG):

```tsx
<div className="text-muted-foreground">
  {dimension.score < 50
    ? '🔴 Critical: Immediate attention required'
    : '🟡 Warning: Improvement recommended'}
</div>
```

### Fixed Code:

```tsx
<div className="text-muted-foreground">
  {dimension.score !== null && dimension.score < 50
    ? '🔴 Critical: Immediate attention required'
    : '🟡 Warning: Improvement recommended'}
</div>
```

### Why:

With `noUncheckedIndexedAccess: true`, `dimension.score` can be `null`. Line 205 of the same file shows this: `d.score === null`. The code must check for null before using the value in a comparison.

---

## ISSUE #2: Inconsistent Internal ID Naming (HIGH PRIORITY)

**Severity:** HIGH (confuses developers, breaks naming standards)

### Files to Fix:

#### 1. `/Volumes/Development/wc-2026/packages/hx-library/src/components/hx-text-input/hx-text-input.ts`

**Line 269:**

```typescript
// WRONG:
private _inputId = `wc-text-input-${Math.random().toString(36).slice(2, 9)}`;

// CORRECT:
private _inputId = `hx-text-input-${Math.random().toString(36).slice(2, 9)}`;
```

#### 2. `/Volumes/Development/wc-2026/packages/hx-library/src/components/hx-textarea/hx-textarea.ts`

**Line 302:**

```typescript
// WRONG:
private _textareaId = `wc-textarea-${Math.random().toString(36).slice(2, 9)}`;

// CORRECT:
private _textareaId = `hx-textarea-${Math.random().toString(36).slice(2, 9)}`;
```

#### 3. `/Volumes/Development/wc-2026/packages/hx-library/src/components/hx-switch/hx-switch.ts`

**Line 233:**

```typescript
// WRONG:
private _switchId = `wc-switch-${Math.random().toString(36).slice(2, 9)}`;

// CORRECT:
private _switchId = `hx-switch-${Math.random().toString(36).slice(2, 9)}`;
```

#### 4. `/Volumes/Development/wc-2026/packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts`

**Line 234:**

```typescript
// WRONG:
private _id = `wc-checkbox-${Math.random().toString(36).slice(2, 9)}`;

// CORRECT:
private _id = `hx-checkbox-${Math.random().toString(36).slice(2, 9)}`;
```

#### 5. `/Volumes/Development/wc-2026/packages/hx-library/src/components/hx-select/hx-select.ts`

**Line 282:**

```typescript
// WRONG:
private _selectId = `wc-select-${Math.random().toString(36).slice(2, 9)}`;

// CORRECT:
private _selectId = `hx-select-${Math.random().toString(36).slice(2, 9)}`;
```

#### 6. `/Volumes/Development/wc-2026/packages/hx-library/src/components/hx-radio-group/hx-radio-group.ts`

**Line 111:**

```typescript
// WRONG:
private _groupId = `wc-radio-group-${Math.random().toString(36).slice(2, 9)}`;

// CORRECT:
private _groupId = `hx-radio-group-${Math.random().toString(36).slice(2, 9)}`;
```

**Also in same file:**

- **Line 9:** Comment says `<wc-radio>` → change to `<hx-radio>`
- **Line 15:** Slot documentation says `<wc-radio>` → change to `<hx-radio>`

### Why:

The library is named **Helix** (hx-). All internal IDs, CSS classes, and component references must use `hx-` prefix for consistency. The `wc-` prefix is from the old "Web Components" naming and was not fully migrated.

---

## ISSUE #3: Inconsistent Comment Divider Style (MEDIUM PRIORITY)

**Severity:** MEDIUM (formatting consistency)

### Decision: Standardize on em-dash style

**Choose this style:**

```typescript
// ─── Form Association ───
```

**NOT this style:**

```typescript
// --- Form Association ---
```

### Files to Fix:

#### 1. `/Volumes/Development/wc-2026/packages/hx-library/src/components/hx-switch/hx-switch.ts`

**Lines:** 40, 51, 116, 129, 185, 224, 231

Change ALL instances of:

```typescript
// --- Form Association ---
// --- Properties ---
// --- Lifecycle ---
// --- Form Integration ---
// --- Slot Handlers ---
// --- Event Handling ---
// --- Public Methods ---
// --- Render ---
```

To:

```typescript
// ─── Form Association ───
// ─── Properties ───
// ─── Lifecycle ───
// ─── Form Integration ───
// ─── Slot Handlers ───
// ─── Event Handling ───
// ─── Public Methods ───
// ─── Render ───
```

#### 2. `/Volumes/Development/wc-2026/packages/hx-library/src/components/hx-textarea/hx-textarea.ts`

**Lines:** 45, 56, 177, 187, 243, 288, 300

Same changes as above.

### Why:

Enterprise code requires ONE consistent style. The em-dash style (`─`) renders more cleanly in most code editors and matches the style used in the majority of component files.

---

## VERIFICATION CHECKLIST

After applying fixes, verify:

- [ ] `npm run type-check` passes with zero errors (both library and admin)
- [ ] `npm run build` succeeds for all packages
- [ ] `npm run test` still passes (563 tests)
- [ ] No new TypeScript errors introduced
- [ ] Git diff shows ONLY the intended changes
- [ ] All internal IDs use `hx-` prefix consistently
- [ ] All comment dividers use `// ─── Section ───` style

---

## AUTOMATED FIX SCRIPT (Optional)

You can use this script to automate the naming fixes:

```bash
# Fix internal ID naming (Issue #2)
sed -i '' 's/`wc-text-input-/`hx-text-input-/g' packages/hx-library/src/components/hx-text-input/hx-text-input.ts
sed -i '' 's/`wc-textarea-/`hx-textarea-/g' packages/hx-library/src/components/hx-textarea/hx-textarea.ts
sed -i '' 's/`wc-switch-/`hx-switch-/g' packages/hx-library/src/components/hx-switch/hx-switch.ts
sed -i '' 's/`wc-checkbox-/`hx-checkbox-/g' packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts
sed -i '' 's/`wc-select-/`hx-select-/g' packages/hx-library/src/components/hx-select/hx-select.ts
sed -i '' 's/`wc-radio-group-/`hx-radio-group-/g' packages/hx-library/src/components/hx-radio-group/hx-radio-group.ts
sed -i '' 's/<wc-radio>/<hx-radio>/g' packages/hx-library/src/components/hx-radio-group/hx-radio-group.ts

# Fix comment divider style (Issue #3)
sed -i '' 's|// --- \(.*\) ---|// ─── \1 ───|g' packages/hx-library/src/components/hx-switch/hx-switch.ts
sed -i '' 's|// --- \(.*\) ---|// ─── \1 ───|g' packages/hx-library/src/components/hx-textarea/hx-textarea.ts
```

**Note:** Issue #1 (TypeScript strict mode) must be fixed manually as it requires logic changes.

---

**Status:** Ready for fixes
**Next Step:** Apply fixes, verify, commit
**Estimated Time:** 10-15 minutes
