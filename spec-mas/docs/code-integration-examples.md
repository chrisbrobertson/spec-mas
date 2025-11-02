# Code Integration Examples

This document provides practical examples of using the Spec-MAS code integration system.

## Basic Usage

### Example 1: First-Time Integration (Clean Project)

**Scenario:** You just implemented a spec and want to integrate the generated code.

```bash
# 1. Check what would happen (dry run)
npm run integrate-code:check

# 2. Review the report
cat src/INTEGRATION_REPORT.md

# 3. If satisfied, run the integration
npm run integrate-code
```

**Expected Output:**
```
════════════════════════════════════════════════════════
  CODE INTEGRATION
════════════════════════════════════════════════════════

Source: implementation-output/
Target: src/

─── Scanning Generated Code ─────────────────────────────
  Found 5 files:
  ✓ src/components/UserProfile.jsx
  ✓ src/services/userService.js
  ✓ src/models/User.js
  ✓ src/utils/validation.js
  ✓ src/routes/users.routes.js

─── Conflict Detection ──────────────────────────────────
  ✓ No conflicts detected

─── Quality Checks ──────────────────────────────────────
  ✓ Syntax validation: 5/5 passed
  ✓ ESLint: 5/5 passed
  ✓ Import resolution: 5/5 passed

─── Integration ─────────────────────────────────────────
  ✓ Created: src/components/UserProfile.jsx
  ✓ Created: src/services/userService.js
  ✓ Created: src/models/User.js
  ✓ Created: src/utils/validation.js
  ✓ Created: src/routes/users.routes.js

✓ Integration complete in 2.1s
```

---

### Example 2: Merging with Existing Code

**Scenario:** You have existing files and want to add new functionality.

**Existing file:** `src/services/productService.js`
```javascript
export async function fetchProducts() {
  const response = await fetch('/api/products');
  return response.json();
}

export function sortProducts(products) {
  return products.sort((a, b) => a.price - b.price);
}
```

**Generated file:** `implementation-output/src/services/productService.js`
```javascript
export async function fetchProducts() {
  const response = await fetch('/api/products');
  return response.json();
}

export function filterProducts(products, filters) {
  // New function
  return products.filter(p => matchesFilters(p, filters));
}

export async function fetchProductById(id) {
  // New function
  const response = await fetch(`/api/products/${id}`);
  return response.json();
}
```

**Run Integration:**
```bash
npm run integrate-code
```

**Output:**
```
─── Conflict Detection ──────────────────────────────────
  Conflicts: 2 warning, 0 blocking

  ⚠ WARNING: src/services/productService.js
    File exists in target directory
    → Will merge functions

  ⚠ WARNING: src/services/productService.js - fetchProducts
    Function 'fetchProducts' already exists
    → Kept existing version

─── Integration ─────────────────────────────────────────
  ✓ Merged: src/services/productService.js
    Added function filterProducts()
    Added function fetchProductById()
```

**Result:** Merged file contains:
```javascript
export async function fetchProducts() {
  // EXISTING version preserved
  const response = await fetch('/api/products');
  return response.json();
}

export function sortProducts(products) {
  // EXISTING function preserved
  return products.sort((a, b) => a.price - b.price);
}

// NEW functions added
export function filterProducts(products, filters) {
  return products.filter(p => matchesFilters(p, filters));
}

export async function fetchProductById(id) {
  const response = await fetch(`/api/products/${id}`);
  return response.json();
}
```

---

### Example 3: Handling Import Merges

**Existing file:** `src/components/Dashboard.jsx`
```javascript
import React, { useState, useEffect } from 'react';
import { fetchData } from '../services/api';
```

**Generated file:** `implementation-output/src/components/Dashboard.jsx`
```javascript
import React, { useState, useMemo } from 'react';
import { fetchData } from '../services/api';
import { formatDate } from '../utils/dates';
```

**Integration Result:**
```javascript
import React, { useState, useEffect, useMemo } from 'react';
import { fetchData } from '../services/api';
import { formatDate } from '../utils/dates';
```

**Console Output:**
```
ℹ INFO: Import merge needed
  Existing imports: React, useState, useEffect
  Generated imports: React, useState, useMemo, formatDate
  Resolution: Merge to [React, useState, useEffect, useMemo] + new imports
```

---

### Example 4: Force Overwrite Mode

**Scenario:** You want to completely replace an existing file.

```bash
npm run integrate-code --force
```

**Warning Message:**
```
⚠ WARNING: --force flag enabled
  Existing files will be OVERWRITTEN
  This cannot be undone!

  Affected files:
  - src/services/productService.js
  - src/components/ProductFilter.jsx

  Continue? (This is automatic in --force mode)
```

**Use Case:** When you've completely redesigned a feature and want a fresh start.

**Caution:** ⚠️ Use with extreme care! Consider backing up first:
```bash
git commit -m "backup before force integration"
npm run integrate-code --force
```

---

### Example 5: Check-Only Mode (Dry Run)

**Scenario:** You want to see what would happen without making changes.

```bash
npm run integrate-code:check
```

**Benefits:**
- See all conflicts before integrating
- Review quality check results
- Generate integration report
- No changes to code

**Output:**
```
════════════════════════════════════════════════════════
  CHECK COMPLETE
════════════════════════════════════════════════════════

✓ Quality checks complete - no changes made

Remove --check-only flag to integrate code

Report saved: src/INTEGRATION_REPORT.md
```

**Review the report:**
```bash
cat src/INTEGRATION_REPORT.md
```

---

### Example 6: Skip Tests for Speed

**Scenario:** You want faster integration during development.

```bash
npm run integrate-code --skip-tests
```

**Time Saved:**
- Without flag: ~45 seconds (runs full test suite)
- With flag: ~3 seconds (skips tests)

**Use Case:** Rapid iteration during development

**Warning:** ⚠️ Always run tests before committing!

```bash
# Fast integration during dev
npm run integrate-code --skip-tests

# Before committing
npm test
```

---

### Example 7: Create Pull Request Automatically

**Scenario:** You want to integrate code and create a PR in one command.

**Prerequisites:**
- GitHub CLI installed (`gh`)
- Authenticated with GitHub
- Git repository configured

```bash
npm run integrate-code --create-pr
```

**Output:**
```
─── Git Integration ─────────────────────────────────────
  ✓ Created commit: abc1234
  ✓ Created pull request: https://github.com/user/repo/pull/42

Next steps:
  1. Review PR: https://github.com/user/repo/pull/42
  2. Request reviews from team
  3. Merge when approved
```

**Generated PR:**
- **Title:** `feat: Implement Product Filter Feature`
- **Body:** Auto-generated with spec details
- **Labels:** None (can be added manually)

---

### Example 8: Custom Directories

**Scenario:** Integrate from/to specific directories.

```bash
# From custom output directory
npm run integrate-code feature-output/ src/features/products/

# From different source
npm run integrate-code ~/Downloads/generated-code/ src/
```

**Use Cases:**
- Multiple feature branches
- Organizing by domain
- External code generation tools

---

### Example 9: Verbose Mode for Debugging

**Scenario:** Something went wrong, need detailed information.

```bash
npm run integrate-code --verbose
```

**Additional Output:**
- Full stack traces for errors
- Detailed conflict information
- Import resolution paths
- Quality check details

**Example:**
```
─── Conflict Detection (Verbose) ────────────────────────
  ⚠ WARNING: src/services/productService.js - filterProducts
    Function 'filterProducts' already exists
    Existing location: Line 42
    Generated location: Line 15
    Existing signature: function filterProducts(products, category)
    Generated signature: function filterProducts(products, filters)
    → Signatures differ - manual review recommended
```

---

### Example 10: Full Workflow Example

**Complete workflow from spec to deployed code:**

```bash
# 1. Create and validate spec
vim specs/product-search.md
npm run validate-spec specs/product-search.md

# 2. Generate tests
npm run generate-tests specs/product-search.md

# 3. Decompose tasks
npm run decompose-tasks specs/product-search.md

# 4. Implement with AI
npm run implement-spec specs/product-search.md

# 5. Check integration (dry run)
npm run integrate-code:check

# 6. Review report
cat src/INTEGRATION_REPORT.md

# 7. Integrate code
npm run integrate-code

# 8. Run tests
npm test

# 9. Review changes
git diff

# 10. Commit and push
git add .
git commit -m "feat: implement product search"
git push

# 11. Create PR (or use --create-pr in step 7)
gh pr create
```

---

## Integration Report Example

After integration, you'll find `INTEGRATION_REPORT.md` in your target directory:

```markdown
# Code Integration Report

## Specification
- **Name:** Product Filter Feature
- **ID:** SPEC-001
- **Source:** specs/product-filter.md

## Integration Summary
- **Duration:** 3.4s
- **Status:** ✅ SUCCESS

## Files Integrated
- **Merged:** 3
- **New:** 5
- **Skipped:** 0
- **Errors:** 0

### Merged Files
- `src/services/productService.js`
  - Strategy: intelligent_merge
  - Changes: Added function filterProducts(), Added function fetchProductById()

### New Files
- `src/components/ProductFilter.jsx`
- `src/components/ProductList.jsx`
- `src/models/Product.js`

## Conflicts Detected

### Warnings (2)
- **function_overlap**: src/services/productService.js - fetchProducts
  - Function 'fetchProducts' already exists
  - Resolution: Kept existing version

## Quality Checks

### Syntax Validation
- Passed: 8/8

### ESLint
- Passed: 8
- Failed: 0
- Warnings: 2

### Import Resolution
- ✅ All imports resolved

## Test Results
- Generated tests: 12/12 passed
- Full test suite: 45/45 passed

## Git Integration
- ✅ Committed: abc1234

## Next Steps
1. Review merged code
2. Run: git log -1
3. Run: git diff HEAD~1
4. Create PR if not already done
```

---

## Common Patterns

### Pattern 1: Iterative Development

```bash
# Implement → Check → Fix → Integrate loop
while true; do
  npm run implement-spec spec.md
  npm run integrate-code:check

  # Review report, fix conflicts manually if needed
  vim src/INTEGRATION_REPORT.md

  # When satisfied
  npm run integrate-code && break
done
```

### Pattern 2: Multi-Feature Integration

```bash
# Implement multiple features
npm run implement-spec specs/feature-1.md --output-dir output/feature-1
npm run implement-spec specs/feature-2.md --output-dir output/feature-2

# Integrate one at a time
npm run integrate-code output/feature-1/ src/
npm run integrate-code output/feature-2/ src/
```

### Pattern 3: Safe Integration with Backup

```bash
# Create backup branch
git checkout -b backup-$(date +%Y%m%d)
git checkout main

# Integrate
npm run integrate-code

# If something goes wrong
git reset --hard HEAD~1
git checkout backup-20251025
```

---

## Troubleshooting

### Issue: ESLint Errors After Integration

```bash
# Fix automatically
npm run lint:fix

# Or manually review
npm run lint
```

### Issue: Tests Failing After Integration

```bash
# Check which tests failed
npm test -- --verbose

# Review changes
git diff

# Fix conflicts or issues
vim src/services/productService.js
```

### Issue: Import Resolution Warnings

```
⚠ Unresolved imports: ../services/newService
```

**Solution:**
```bash
# Create the missing file
touch src/services/newService.js

# Or fix the import path
vim src/components/MyComponent.jsx
```

### Issue: Duplicate Functions

```
⚠ WARNING: Function 'filterProducts' appears twice
```

**Solution:** Manually remove duplicate:
```bash
vim src/services/productService.js
# Remove the duplicate function definition
```

---

## Exit Codes

Understanding exit codes for CI/CD:

```bash
npm run integrate-code
echo $?  # Check exit code

# 0 = Success
# 1 = Conflicts detected (but handled)
# 2 = Errors or test failures
```

**In CI/CD:**
```yaml
# GitHub Actions example
- name: Integrate Code
  run: npm run integrate-code
  continue-on-error: true  # If exit code 1 is acceptable

- name: Check Integration Status
  run: |
    if [ $? -eq 2 ]; then
      echo "Integration failed with errors"
      exit 1
    fi
```

---

## Best Practices

### 1. Always Check First
```bash
npm run integrate-code:check  # Dry run
npm run integrate-code         # Actual integration
```

### 2. Run Tests After Integration
```bash
npm run integrate-code && npm test
```

### 3. Review Before Committing
```bash
npm run integrate-code --skip-git  # Integrate without committing
git diff                            # Review changes
git add .                           # Stage when satisfied
git commit -m "feat: ..."          # Commit manually
```

### 4. Use Verbose Mode for Issues
```bash
npm run integrate-code --verbose
```

### 5. Backup Before Force
```bash
git commit -m "backup"
npm run integrate-code --force
```

---

## Summary

The code integration system provides:
- ✅ Safe merging with conflict detection
- ✅ Quality checks (ESLint, TypeScript, syntax)
- ✅ Intelligent function merging
- ✅ Import deduplication
- ✅ Git integration
- ✅ Comprehensive reporting

**Remember:** Always review integrated code before deploying to production!
