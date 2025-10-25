# Complete Spec-MAS Workflow Example

This document demonstrates the complete workflow from specification to tested implementation using all three phases.

## The Feature: Product Price Filter

We want to build a product filter that lets users filter by price range.

## Step 1: Write Specification (30 minutes)

Create `specs/features/product-filter.md`:

```markdown
---
specmas: v3
kind: FeatureSpec
id: feat-product-price-filter
name: Product Price Filter
complexity: EASY
maturity: 3
---

# Product Price Filter

## User Stories

As a customer, I want to filter products by price range, so that I can find items within my budget.

## Acceptance Criteria

- [ ] Given I'm on the products page, When I set a maximum price, Then only products equal to or below that price are shown
- [ ] Given I set both min and max price, When I apply the filter, Then only products within that range are shown
- [ ] Given invalid price input (negative), When I try to apply, Then an error message appears

## Functional Requirements

### FR-1: Filter by Maximum Price

The system shall filter products based on maximum price.

Validation Criteria:
- Maximum price must be positive number
- Products with price <= max are included
- Empty array if no matches

### FR-2: Filter by Price Range

The system shall filter products based on min and max price.

Validation Criteria:
- Both prices must be positive
- Max must be >= min
- Products within range [min, max] included
```

## Step 2: Validate Specification (2 minutes)

```bash
$ npm run validate-spec specs/features/product-filter.md

📋 Spec-MAS v3 Validator

✅ Validation PASSED

Summary:
  Structure: ✅ Valid
  Front-matter: ✅ Complete
  Sections: ✅ 3/3 required sections present
  Quality: ✅ Gate 2 (Ready for Review)
```

## Step 3: Review Specification (5 minutes)

```bash
$ npm run review-spec specs/features/product-filter.md

🔍 Spec-MAS v3 Multi-Agent Review System

Agent 1/3: Implementation Feasibility (Claude)
✅ Review complete: 3 suggestions, 0 blocking issues

Agent 2/3: Security Review (Claude)
✅ Review complete: 2 suggestions, 0 blocking issues

Agent 3/3: UX Review (Claude)
✅ Review complete: 1 suggestion, 0 blocking issues

📊 Review Summary:
   Total suggestions: 6
   Blocking issues: 0
   Status: ✅ APPROVED (with suggestions)
```

## Step 4: Generate Tests (1 minute)

```bash
$ npm run generate-tests specs/features/product-filter.md

🧪 Spec-MAS Test Generator

📄 Parsing spec: specs/features/product-filter.md
✅ Spec parsed: Product Price Filter
   Complexity: EASY
   Maturity: 3

🔧 Generating test types: unit, integration

  Generating unit tests...
  ✅ Created: tests/unit/product-price-filter.test.js (8 test cases)

  Generating integration tests...
  ✅ Created: tests/integration/product-price-filter.integration.test.js (4 test cases)

📋 Generating test mapping...
  ✅ Created: tests/TEST_MAPPING.md

✨ Test Generation Complete!

Summary:
  📊 Total test files: 2
  🧪 Total test cases: 12
  📂 Output directory: tests/
```

## Step 5: Review Generated Tests

```bash
$ cat tests/unit/product-price-filter.test.js
```

Generated test (excerpt):

```javascript
describe('Product Price Filter', () => {
  it('should only products equal to or below that price are shown when i set a maximum price', async () => {
    // Given I'm on the products page, When I set a maximum price,
    // Then only products equal to or below that price are shown

    // Arrange (Given: I'm on the products page)
    // TODO: Setup test data and preconditions

    // Act (When: I set a maximum price)
    // TODO: Execute the action being tested

    // Assert (Then: only products equal to or below that price are shown)
    // TODO: Verify the expected results

    expect(true).toBe(true); // Replace with actual assertions
  });

  it('should only products within that range are shown when i apply the filter given i set both min and max price', async () => {
    // ... similar structure
  });
});
```

## Step 6: Enhance Tests with AI (Optional, 2 minutes)

```bash
$ export ANTHROPIC_API_KEY=your-key-here
$ npm run enhance-tests tests/unit/product-price-filter.test.js \
    --spec specs/features/product-filter.md

🤖 Spec-MAS AI Test Enhancement

📄 Loaded spec context: specs/features/product-filter.md

  📝 Processing: tests/unit/product-price-filter.test.js
     Found 8 TODO sections
     [1/8] // TODO: Setup test data and preconditions
       ✅ Enhanced
     [2/8] // TODO: Execute the action being tested
       ✅ Enhanced
     ...

     ✅ Enhanced 8/8 sections
     💾 Backup saved: tests/unit/product-price-filter.test.js.backup

✨ AI Test Enhancement Complete!
```

Enhanced test:

```javascript
it('should only products equal to or below that price are shown when i set a maximum price', async () => {
  // AI-generated implementation (review required)
  // Arrange
  const products = [
    { id: 1, name: 'Product A', price: 50 },
    { id: 2, name: 'Product B', price: 150 },
    { id: 3, name: 'Product C', price: 100 }
  ];
  const maxPrice = 100;

  // Act
  const result = filterByMaxPrice(products, maxPrice);

  // Assert
  expect(result).toHaveLength(2);
  expect(result.map(p => p.id)).toEqual([1, 3]);
  expect(result.every(p => p.price <= maxPrice)).toBe(true);
});
```

## Step 7: Implement the Feature (1 hour)

Create `src/product-filter.js`:

```javascript
/**
 * Filter products by maximum price
 * @see Spec: specs/features/product-filter.md (FR-1)
 */
function filterByMaxPrice(products, maxPrice) {
  if (maxPrice < 0) {
    throw new Error('Maximum price must be positive');
  }

  return products.filter(product => product.price <= maxPrice);
}

/**
 * Filter products by price range
 * @see Spec: specs/features/product-filter.md (FR-2)
 */
function filterByPriceRange(products, minPrice, maxPrice) {
  if (minPrice < 0 || maxPrice < 0) {
    throw new Error('Prices must be positive');
  }

  if (maxPrice < minPrice) {
    throw new Error('Maximum price must be >= minimum price');
  }

  return products.filter(
    product => product.price >= minPrice && product.price <= maxPrice
  );
}

module.exports = {
  filterByMaxPrice,
  filterByPriceRange
};
```

## Step 8: Update Tests to Use Implementation

```bash
$ vim tests/unit/product-price-filter.test.js
```

Update imports:

```javascript
const { filterByMaxPrice, filterByPriceRange } = require('../../src/product-filter');
```

## Step 9: Run Tests

```bash
$ npm run test:unit

PASS  tests/unit/product-price-filter.test.js
  Product Price Filter
    ✓ should only products equal to or below that price are shown (3 ms)
    ✓ should only products within that range are shown (2 ms)
    ✓ should throw error for negative maximum price (1 ms)
    ✓ should throw error for negative prices in range (1 ms)
    ✓ should throw error when max < min (1 ms)
    ✓ should return empty array when no matches (1 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Time:        0.5s
```

## Step 10: Check Traceability

```bash
$ cat tests/TEST_MAPPING.md
```

```markdown
# Test Mapping: Product Price Filter

**Spec ID:** feat-product-price-filter
**Spec File:** specs/features/product-filter.md

## Test Coverage

### Functional Requirements

- **FR-1:** Filter by maximum price
  - Test files: `product-price-filter.test.js`

- **FR-2:** Filter by price range
  - Test files: `product-price-filter.test.js`

### Acceptance Criteria

1. Given I'm on the products page, When I set a maximum price, Then only products equal to or below that price are shown
   - **Test Type:** unit
   - **Test File:** `product-price-filter.test.js`

2. Given I set both min and max price, When I apply the filter, Then only products within that range are shown
   - **Test Type:** unit
   - **Test File:** `product-price-filter.test.js`

3. Given invalid price input (negative), When I try to apply, Then an error message appears
   - **Test Type:** unit
   - **Test File:** `product-price-filter.test.js`
```

## Step 11: Commit and Ship

```bash
$ git add specs/ src/ tests/
$ git commit -m "feat: add product price filter

- Spec: specs/features/product-filter.md
- Implementation: src/product-filter.js
- Tests: tests/unit/product-price-filter.test.js (6 passing)
- Coverage: 100%"

$ git push origin main
```

## Summary

**Total Time Breakdown:**
- Write spec: 30 min
- Validate: 2 min
- Review: 5 min
- Generate tests: 1 min
- AI enhance: 2 min (optional)
- Implement: 60 min
- Test: 5 min
- **Total: ~1 hour 45 minutes**

**Traditional Approach Time:**
- Write spec (mental): 10 min
- Implement: 90 min
- Write tests: 45 min
- Debug: 30 min
- **Total: ~3 hours**

**Time Saved:** ~1 hour 15 minutes (40%)

**Quality Improvements:**
- ✅ Specification validated before coding
- ✅ Multi-agent review caught edge cases
- ✅ Tests auto-generated with 100% coverage
- ✅ Full traceability from requirements to tests
- ✅ Reduced bugs (caught by validation/review)

**Cost (with AI enhancement):**
- Validation: $0 (local)
- Review: ~$0.10 (3 Claude calls)
- Test enhancement: ~$0.20 (8 TODO sections)
- **Total: ~$0.30**

---

**ROI:** Save 1+ hour, spend $0.30, gain better quality = 200x+ return!
