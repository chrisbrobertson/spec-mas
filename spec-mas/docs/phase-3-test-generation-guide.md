# Phase 3: Test Generation Quick Reference Guide

## Overview

Phase 3 automatically generates test scaffolding from validated specifications. Tests are generated based on acceptance criteria, user stories, and functional requirements.

## Quick Start

### 1. Generate Tests from a Spec

```bash
# Generate all test types (unit, integration, e2e)
npm run generate-tests docs/examples/level-3-filter-spec.md

# Generate specific test type
npm run generate-tests spec.md --type unit
npm run generate-tests spec.md --type integration
npm run generate-tests spec.md --type e2e

# Custom output directory
npm run generate-tests spec.md --output-dir my-tests/
```

### 2. Generate Deterministic Tests (Level 5 specs)

```bash
npm run generate-deterministic docs/examples/level-5-auth-spec.md
```

### 3. Enhance Tests with AI

```bash
# Enhance with AI (requires ANTHROPIC_API_KEY)
npm run enhance-tests tests/unit/feature.test.js --spec spec.md

# Dry-run to preview changes
npm run enhance-tests tests/ --spec spec.md --dry-run
```

### 4. Run Generated Tests

```bash
# Run all tests
npm test

# Run by type
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:deterministic
```

## What Gets Generated

### Based on Complexity Level

**EASY Complexity:**
- ✅ Unit tests
- ✅ Integration tests
- ❌ E2E tests (optional)

**MODERATE Complexity:**
- ✅ Unit tests
- ✅ Integration tests
- ✅ E2E tests

**HIGH Complexity:**
- ✅ Unit tests
- ✅ Integration tests
- ✅ E2E tests
- ✅ Deterministic tests (if maturity >= 5)

### Files Generated

```
tests/
├── unit/
│   └── feature-name.test.js
├── integration/
│   └── feature-name.integration.test.js
├── e2e/
│   └── feature-name.e2e.test.js
├── deterministic/
│   └── feature-name.deterministic.test.js
└── TEST_MAPPING.md  (traceability document)
```

## Test Generation Logic

### Acceptance Criteria → Tests

**Input (from spec):**
```
Given I'm on the products page
When I set a maximum price of 100
Then only products equal to or below $100 are shown
```

**Output (generated test):**
```javascript
it('should show only products below max price when max price is set', async () => {
  // Given I'm on the products page
  // Arrange
  const maxPrice = 100;
  // TODO: Setup test data

  // When I set a maximum price
  // Act
  // TODO: Execute the action being tested

  // Then only products equal to or below that price are shown
  // Assert
  // TODO: Verify the expected results
  expect(true).toBe(true); // Replace with actual assertions
});
```

### Test Type Classification

The generator automatically determines the appropriate test type:

**E2E Tests** (UI interactions):
- Keywords: `click`, `navigate`, `page`, `button`, `form`, `redirected`, `shown on screen`
- Example: "Given I'm on the login page, When I click submit..."

**Integration Tests** (API/Database):
- Keywords: `api`, `endpoint`, `request`, `response`, `database`, `stored`, `email sent`
- Example: "When the API call succeeds, Then data is persisted..."

**Unit Tests** (Business Logic):
- Default for validation, calculations, transformations
- Example: "Given valid input, When I validate, Then no errors returned"

## Template Variables

### Unit Test Template

```javascript
{{testSuiteName}}          // Test suite name
{{testCases}}              // Generated test cases
{{imports}}                // Import statements
{{beforeAllSetup}}         // Setup code
{{helperFunctions}}        // Helper utilities
{{mockSetup}}              // Mock configuration
```

### Integration Test Template

```javascript
{{endpoint}}               // API endpoint
{{method}}                 // HTTP method
{{apiTestCases}}           // API test cases
{{databaseTestCases}}      // Database test cases
{{errorTestCases}}         // Error scenarios
{{performanceTestCases}}   // Performance tests
{{securityTestCases}}      // Security validation
```

### E2E Test Template

```javascript
{{pageUrl}}                // Page URL
{{userStoryTests}}         // User story tests
{{acceptanceCriteriaTests}}// Acceptance tests
{{interactionTests}}       // User interactions
{{navigationTests}}        // Navigation flows
{{accessibilityTests}}     // A11y tests
```

## AI Enhancement

### How It Works

1. Scans test files for `// TODO:` comments
2. Extracts context (spec, surrounding code)
3. Sends to Claude API
4. Generates implementation
5. Inserts code with backup

### Example Enhancement

**Before (generated scaffold):**
```javascript
it('should filter products by price range', () => {
  // TODO: Setup test data and preconditions
  // TODO: Execute the action being tested
  // TODO: Verify the expected results
  expect(true).toBe(true);
});
```

**After (AI enhanced):**
```javascript
it('should filter products by price range', () => {
  // AI-generated implementation (review required)
  // Arrange
  const products = [
    { id: 1, name: 'Product A', price: 50 },
    { id: 2, name: 'Product B', price: 150 },
    { id: 3, name: 'Product C', price: 100 }
  ];
  const minPrice = 50;
  const maxPrice = 100;

  // Act
  const filtered = filterByPriceRange(products, minPrice, maxPrice);

  // Assert
  expect(filtered).toHaveLength(2);
  expect(filtered.map(p => p.id)).toEqual([1, 3]);
  expect(filtered.every(p => p.price >= minPrice && p.price <= maxPrice)).toBe(true);
});
```

### Cost Estimation

AI enhancement costs vary by usage:
- **Small test file** (~10 TODO sections): $0.10 - $0.30
- **Medium test file** (~30 TODO sections): $0.30 - $0.90
- **Large test suite** (~100 TODO sections): $1.00 - $3.00

## Test Mapping

Generated `TEST_MAPPING.md` provides traceability:

```markdown
### Acceptance Criteria

1. Given I'm on products page, When I set max price, Then only products ≤ price shown
   - Test Type: e2e
   - Test File: `product-filter.e2e.test.js`

### Functional Requirements

- FR-1: Filter by price range
  - Test files: `product-filter.test.js`, `product-filter.integration.test.js`
```

## Best Practices

### 1. Review Generated Tests

Always review generated tests before running:
- Check test names make sense
- Verify assertions align with requirements
- Add edge cases if missing

### 2. Fill TODO Sections

Generated tests have TODO comments for manual work:
```javascript
// TODO: Setup test data and preconditions
// TODO: Execute the action being tested
// TODO: Verify the expected results
```

Fill these in or use AI enhancement.

### 3. Use AI Enhancement Wisely

AI enhancement is great for:
- ✅ Boilerplate code
- ✅ Simple assertions
- ✅ Test data generation

Still manually review for:
- ❌ Complex business logic
- ❌ Security-critical tests
- ❌ Edge cases

### 4. Maintain Test Mapping

Keep `TEST_MAPPING.md` updated when:
- Adding new tests manually
- Changing requirements
- Refactoring tests

### 5. Follow AAA Pattern

All generated tests follow Arrange/Act/Assert:
```javascript
// Arrange - Setup test data
const input = { /* test data */ };

// Act - Execute the action
const result = functionUnderTest(input);

// Assert - Verify expectations
expect(result).toBe(expected);
```

## Troubleshooting

### No Tests Generated

**Problem:** `No test files generated`

**Solutions:**
- Check spec has acceptance criteria in Given/When/Then format
- Verify spec has user stories
- Ensure spec metadata includes complexity and maturity

### Wrong Test Type

**Problem:** E2E test needed but unit test generated

**Solutions:**
- Use manual override: `--type e2e`
- Update acceptance criteria to include UI keywords (`click`, `navigate`, etc.)
- Manually move test to correct directory

### AI Enhancement Fails

**Problem:** `Error calling Claude API`

**Solutions:**
- Check `ANTHROPIC_API_KEY` is set
- Verify API key is valid
- Check rate limits (add delays between requests)
- Use `--dry-run` to test without API calls

### Templates Not Found

**Problem:** `Template not found: templates/test-templates/unit-test.template.js`

**Solution:**
- Ensure templates directory exists
- Run from project root directory
- Check file permissions

## Advanced Usage

### Custom Templates

Create your own templates:

1. Copy existing template:
```bash
cp templates/test-templates/unit-test.template.js \
   templates/test-templates/custom-test.template.js
```

2. Modify template variables

3. Update `generate-tests.js` to use custom template

### Framework-Specific Generation

Generate for specific test frameworks:

```bash
# Jest (default)
npm run generate-tests spec.md --framework jest

# Mocha
npm run generate-tests spec.md --framework mocha

# Playwright
npm run generate-tests spec.md --framework playwright
```

### Batch Generation

Generate tests for all specs:

```bash
# Find all specs and generate tests
find specs -name "*.md" -exec npm run generate-tests {} \;
```

### CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Generate tests from specs
  run: |
    npm run generate-tests specs/feature.md
    npm test
```

## Complete Workflow Example

```bash
# 1. Write specification
vim specs/feature.md

# 2. Validate spec
npm run validate-spec specs/feature.md

# 3. Review spec
npm run review-spec specs/feature.md

# 4. Approve spec
npm run review-approve specs/feature.md

# 5. Generate tests
npm run generate-tests specs/feature.md

# 6. Review generated tests
cat tests/unit/feature.test.js

# 7. Enhance with AI (optional)
npm run enhance-tests tests/unit/feature.test.js --spec specs/feature.md

# 8. Review AI-generated code
git diff tests/unit/feature.test.js

# 9. Run tests (they'll fail - no implementation yet!)
npm run test:unit

# 10. Implement the feature
vim src/feature.js

# 11. Run tests until they pass
npm run test:unit -- --watch

# 12. Commit when all tests pass
git add tests/ src/
git commit -m "feat: implement feature with tests"

# 13. Ship it!
git push origin main
```

## Command Reference

| Command | Description |
|---------|-------------|
| `npm run generate-tests <spec>` | Generate all test types |
| `npm run generate-tests:unit <spec>` | Generate unit tests only |
| `npm run generate-tests:integration <spec>` | Generate integration tests only |
| `npm run generate-tests:e2e <spec>` | Generate e2e tests only |
| `npm run generate-tests:ai <spec>` | Generate with AI enhancement |
| `npm run generate-deterministic <spec>` | Generate deterministic tests |
| `npm run enhance-tests <test-file>` | Enhance existing tests with AI |
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests |
| `npm run test:integration` | Run integration tests |
| `npm run test:e2e` | Run e2e tests |
| `npm run test:deterministic` | Run deterministic tests |

## Resources

- **Templates:** `templates/test-templates/`
- **Generated Tests:** `tests/{unit,integration,e2e}/`
- **Test Mapping:** `tests/TEST_MAPPING.md`
- **Full Documentation:** `PHASE-3-IMPLEMENTATION-SUMMARY.md`

## Support

For issues or questions:
1. Check this guide
2. Review `PHASE-3-IMPLEMENTATION-SUMMARY.md`
3. Check generated `TEST_MAPPING.md`
4. Open GitHub issue

---

**Happy Testing!** 🧪
