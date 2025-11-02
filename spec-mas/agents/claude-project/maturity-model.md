# Specification Maturity Model

## Overview
The Spec-MAS Maturity Model ensures specifications are sufficiently detailed for AI agents to implement features successfully. Higher complexity features require higher maturity levels to reduce ambiguity and implementation errors.

## Maturity Levels

### Level 1: Foundation (Basic Requirements)
**Purpose:** Establish the fundamental "what" and "why"

**Required Elements:**
- **User Stories** (minimum 1, typically 2-3)
  - Format: As a [user type], I want [goal], so that [benefit]
  - Must identify clear actors and objectives
  
- **Acceptance Criteria** (minimum 5, typically 8-12)
  - Format: Given [context], When [action], Then [outcome]
  - Must be testable and measurable
  - Binary pass/fail conditions

- **Success Metrics**
  - How to measure if the feature achieves its goal
  - Quantifiable targets

**Example:**
```markdown
User Story: As a customer, I want to filter products by price, so that I can find items within my budget.

Acceptance Criteria:
- Given I'm on the product page, When I set max price to $100, Then only products ≤$100 show
- Given no products match, When filter applied, Then "No products found" message appears

Success Metric: 80% of users successfully use price filter within first attempt
```

### Level 2: Technical Context
**Purpose:** Define the "how" at a technical level

**Required Elements:**
- **Technical Constraints**
  - Programming language and framework requirements
  - Library restrictions or preferences
  - Performance boundaries
  
- **Integration Points**
  - External APIs or services
  - Database schemas affected
  - Existing components to reuse
  
- **Data Models**
  - Input/output formats
  - Validation rules
  - State management requirements

**Example:**
```markdown
Technical Constraints:
- React 18+ with TypeScript
- Material-UI components only
- Max bundle size increase: 50KB

Integration Points:
- GET /api/products endpoint (existing)
- Redux store: products slice
- Analytics service: track filter usage

Data Model:
{
  minPrice?: number,  // Optional, >= 0
  maxPrice?: number,  // Optional, >= minPrice
  currency: "USD"     // Fixed for MVP
}
```

### Level 3: Robustness (Minimum for Easy Features)
**Purpose:** Ensure reliability and production-readiness

**Required Elements:**
- **Error Scenarios** (minimum 3, typically 5-7)
  - Network failures
  - Invalid inputs
  - Edge cases
  - Recovery strategies
  
- **Performance Requirements**
  - Response time targets (p50, p95, p99)
  - Throughput expectations
  - Resource constraints
  
- **Security Considerations**
  - Authentication/authorization needs
  - Data sensitivity levels
  - Input sanitization requirements

**Example:**
```markdown
Error Scenarios:
1. Network timeout → Show cached results with warning
2. Invalid price (negative) → Reset to 0, show validation message
3. Max < Min price → Auto-adjust max to match min
4. API returns 500 → Retry 3x with exponential backoff
5. No products exist → Show helpful empty state

Performance Requirements:
- Filter update: <100ms client-side
- API response: <500ms p95
- Support 100 concurrent filter operations

Security:
- Sanitize price inputs (prevent SQL injection)
- Rate limit: 10 filter changes per minute per user
- Log suspicious patterns (e.g., automated scanning)
```

### Level 4: Architecture & Governance (Required for Moderate)
**Purpose:** Ensure architectural consistency and compliance

**Required Elements:**
- **Architectural Patterns**
  - Design patterns to follow
  - Service boundaries
  - Component responsibilities
  
- **Compliance Requirements**
  - Regulatory constraints (GDPR, HIPAA, etc.)
  - Industry standards
  - Company policies
  
- **Observability**
  - Metrics to track
  - Logging requirements
  - Alerting thresholds
  - Debugging hooks

**Example:**
```markdown
Architecture:
- Follow Repository pattern for data access
- Use Strategy pattern for filter types
- Maintain separation: UI logic vs business logic
- Cache filtered results for 5 minutes

Compliance:
- GDPR: Don't log price filters (could reveal income)
- PCI: No price data in URLs (browser history)
- A11y: WCAG 2.1 AA compliance required

Observability:
- Metrics: filter_usage_count, filter_performance_ms
- Log: Filter combinations (anonymized)
- Alert: If p99 latency > 1000ms
- Debug: Feature flag for verbose console logging
```

### Level 5: Complete Specification (Required for High Complexity)
**Purpose:** Eliminate all ambiguity with concrete examples

**Required Elements:**
- **Concrete Examples** (minimum 2-3)
  - Real-world usage scenarios
  - Actual data samples
  - Step-by-step workflows
  
- **Counter-Examples**
  - What the feature should NOT do
  - Common misconceptions
  - Scope boundaries
  
- **Edge Cases**
  - Boundary conditions
  - Unusual but valid scenarios
  - Graceful degradation
  
- **Migration Strategy**
  - Rollout plan
  - Rollback procedure
  - Data migration needs

**Example:**
```markdown
Concrete Examples:
1. User sets filter $50-$100:
   - Products shown: IDs [123, 456, 789]
   - URL updates to: /products?min=50&max=100
   - Analytics event: {action: "filter", min: 50, max: 100}

2. User clears filter:
   - All products shown (paginated)
   - URL returns to: /products
   - Previous filter saved in localStorage

Counter-Examples:
- NOT a sorting feature (separate requirement)
- NOT filtering by price ranges (e.g., "$0-50, $50-100")
- NOT currency conversion (USD only)
- NOT saved filters (future feature)

Edge Cases:
- Single product at exact max price → Include it
- All products same price → Filter appears disabled
- Prices update while filtering → Maintain filter, refresh results
- Browser back button → Restore previous filter state

Migration:
- Phase 1: Feature flag 10% users (1 week)
- Phase 2: 50% rollout with monitoring (1 week)
- Phase 3: 100% if metrics stable
- Rollback: Disable flag, filters ignored but not lost
```

## Complexity-to-Level Mapping

### Easy Complexity → Level 3 Minimum
**Characteristics:**
- CRUD operations
- Simple UI changes
- Basic validations
- Standalone features

**Why Level 3?**
- Basic requirements could work but lead to edge case bugs
- Error handling prevents production incidents
- Performance requirements ensure good UX

### Moderate Complexity → Level 4 Minimum
**Characteristics:**
- Multi-system integrations
- Complex workflows
- Business logic heavy
- Data transformations

**Why Level 4?**
- Architecture patterns prevent technical debt
- Compliance needs are often hidden requirements
- Observability crucial for debugging integrated systems

### High Complexity → Level 5 Minimum
**Characteristics:**
- Security features
- Performance critical
- Architecture changes
- Compliance heavy
- Real-time systems

**Why Level 5?**
- Examples eliminate interpretation errors
- Edge cases in critical features cause major incidents
- Migration strategy essential for safe deployment

## Validation Checklist

### Quick Assessment
```
□ Can a new developer understand what to build? (Level 1)
□ Do they know which technologies and systems? (Level 2)  
□ Can they handle errors and meet performance needs? (Level 3)
□ Will it fit architecture and meet compliance? (Level 4)
□ Are all edge cases and examples clear? (Level 5)
```

### Red Flags (Incomplete Specification)
- Vague terms: "fast", "user-friendly", "secure", "scalable"
- Missing numbers: "improve performance" vs "reduce latency to <200ms"
- Assumed knowledge: "standard authentication" vs specific requirements
- Incomplete scenarios: Happy path only, no error cases
- No examples: Abstract requirements without concrete usage

## Progressive Refinement Strategy

### Level 1 → 2
Ask: "How will this be built technically?"
- Which systems are involved?
- What data structures?
- What are the constraints?

### Level 2 → 3
Ask: "What could go wrong?"
- How do we handle failures?
- What are the performance needs?
- What security risks exist?

### Level 3 → 4
Ask: "How does this fit the bigger picture?"
- Which patterns should we follow?
- What compliance needs exist?
- How will we monitor it?

### Level 4 → 5
Ask: "Can you show me exactly?"
- What are real examples?
- What should it NOT do?
- What are the edge cases?

## Maturity Score Calculation

```python
def calculate_maturity_score(spec):
    score = 0
    max_score = 100
    
    # Level 1 (20 points)
    if has_user_stories(spec): score += 10
    if has_acceptance_criteria(spec): score += 10
    
    # Level 2 (20 points)
    if has_technical_constraints(spec): score += 7
    if has_integration_points(spec): score += 7
    if has_data_models(spec): score += 6
    
    # Level 3 (20 points)
    if has_error_scenarios(spec): score += 7
    if has_performance_reqs(spec): score += 7
    if has_security_considerations(spec): score += 6
    
    # Level 4 (20 points)
    if has_architecture_patterns(spec): score += 7
    if has_compliance_reqs(spec): score += 7
    if has_observability(spec): score += 6
    
    # Level 5 (20 points)
    if has_concrete_examples(spec): score += 5
    if has_counter_examples(spec): score += 5
    if has_edge_cases(spec): score += 5
    if has_migration_strategy(spec): score += 5
    
    return score / max_score
```

## Common Pitfalls and Solutions

### Pitfall: Skipping Levels
**Problem:** Jumping to implementation details without requirements
**Solution:** Enforce sequential progression in tooling

### Pitfall: Vague Requirements
**Problem:** "Make it fast" instead of specific metrics
**Solution:** Always ask for numbers and thresholds

### Pitfall: Over-Specification
**Problem:** Level 5 for simple CRUD operation
**Solution:** Match level to complexity automatically

### Pitfall: Missing Non-Functional Requirements
**Problem:** Focus only on features, not quality attributes
**Solution:** Explicit prompts for performance, security, etc.

### Pitfall: No Examples
**Problem:** Abstract requirements open to interpretation
**Solution:** Require 2-3 concrete examples for Level 5
