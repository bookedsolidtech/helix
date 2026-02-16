# Health Scoring Debug Analysis

## Problem Statement

Components show C grades despite having 95%+ scores on dimensions.

## Docs Coverage Verification

✓ Docs files exist in `/Volumes/Development/wc-2026/apps/docs/src/content/docs/component-library/`
✓ `hasDocsPage()` function correctly detects these files
✓ Docs Coverage dimension should score 100% for all components with docs

## Critical Dimensions (must pass for high grades)

1. **API Documentation** (JSDoc) - Weight: 15%
2. **CEM Completeness** - Weight: 15%
3. **Test Coverage** - Weight: 10%
4. **Accessibility** - Weight: 10%
5. **Type Safety** - Weight: 10%
6. **Docs Coverage** - Weight: 5%

## Grade Thresholds

| Grade | Min Weighted Score | Min Critical Score | Max Untested Critical |
| ----- | ------------------ | ------------------ | --------------------- |
| A     | 90%                | 80%                | 0                     |
| B     | 80%                | 70%                | 1                     |
| C     | 70%                | 60%                | 2                     |
| D     | 60%                | 50%                | 3                     |
| F     | <60%               | <50%               | >3                    |

## Hypothesis

If components are getting C grades despite high scores, one of these must be true:

1. **Weighted score < 90%** - Some dimensions are 0% or untested
2. **Critical dimensions < threshold** - At least one critical dimension is below the minimum
3. **Too many untested critical dimensions** - More than allowed for target grade
4. **Measured vs Unmeasured confusion** - The algorithm treats untested as 0% for thresholds

## Likely Root Cause

Looking at the code (lines 231-236):

```typescript
const allCriticalsMeetThreshold = measuredCriticalScores.every(
  (score) => score >= constraints.minCriticalScore,
);
```

This only checks MEASURED critical dimensions. But for weighted score (lines 434-438):

```typescript
const dimensionScore = d.measured && d.score !== null ? d.score : 0;
```

**Unmeasured dimensions contribute 0 to the weighted score!**

So if a component has:

- Docs Coverage: 100% ✓
- CEM Completeness: 100% ✓
- API Documentation: 95% ✓
- Test Coverage: **UNTESTED** (0% contribution)
- Accessibility: **UNTESTED** (0% contribution)
- Type Safety: **UNTESTED** (0% contribution)

The weighted score would be much lower than expected, capping the grade at C.

## Solution

The system is working as designed - untested critical dimensions hurt the overall score.
The real issue is that critical analyzers are returning `null` (untested) instead of actual scores.

We need to verify:

1. Are test results being generated? (`/packages/wc-library/.cache/test-results.json`)
2. Are the analyzers finding the data they need?
3. What are the actual dimension scores for each component?
