# Spec-MAS Architecture Analysis Guide

## Purpose

The architecture analysis capability helps identify when specifications have grown too large or cover multiple distinct concerns, and provides recommendations for splitting them into smaller, more focused specifications.

## When to Use Architecture Analysis

### During Spec Creation
- User describes multiple major features in initial description
- Description contains 3+ distinct business domains
- User mentions multiple user personas with different workflows
- Initial description is longer than 4-5 sentences

### During Spec Development
- Functional requirements exceed 12
- More than 8 data entities defined
- More than 3 external integrations
- More than 5 distinct API endpoint groups
- More than 5 UI views/screens

### Before Finalization
- Always recommend running architecture analysis as final check
- Helps catch scope creep before implementation
- Validates spec is appropriately sized for team capacity

## Analysis Criteria

### Complexity Indicators (Red Flags)
| Indicator | Threshold | Weight | Description |
|-----------|-----------|--------|-------------|
| Multiple Personas | 3+ | High | Different user types with distinct needs |
| Many Requirements | 12+ | Medium | Large number of functional requirements |
| Many Entities | 8+ | Medium | Complex data model |
| Many Endpoints | 10+ | Low | Large API surface |
| Many Integrations | 3+ | High | Multiple external dependencies |
| Multiple Workflows | 4+ | Medium | Distinct processes or flows |
| Complex Security | 5+ roles | Medium | Many authorization levels |
| Many Views | 5+ | Low | Large UI scope |

### Cohesion Indicators (Distinct Concerns)
| Indicator | Threshold | Description |
|-----------|-----------|-------------|
| Multiple Domains | 3+ | Different business areas (auth, billing, etc.) |
| Multiple CRUD Sets | 6+ | Operations across many entity types |
| Multiple Integration Types | 4+ | Different integration patterns |

### Size Metrics
| Metric | Yellow | Red | Impact |
|--------|--------|-----|--------|
| Lines | 700+ | 1000+ | Hard to navigate |
| Words | 3500+ | 5000+ | Hard to review |
| Sections | 10+ | 15+ | Overly complex |

## Recommendation Types

### 1. Domain Split (Priority: HIGH)
**When:** Spec covers 3+ distinct business domains

**Example:**
```
Current Spec: "Customer Management System"
Covers: User auth, billing, notifications, support tickets

Recommended Split:
1. User Authentication & Authorization
2. Billing & Payment Processing  
3. Notification System
4. Support Ticket Management
```

**Why Split:**
- Different stakeholders and priorities
- Different security requirements
- Can be implemented independently
- Enables parallel development

### 2. Persona Split (Priority: HIGH)
**When:** Spec addresses 4+ different user personas with distinct workflows

**Example:**
```
Current Spec: "E-commerce Platform"
Personas: Customer, Vendor, Admin, Support

Recommended Split:
1. Customer Shopping Experience
2. Vendor Store Management
3. Admin Dashboard & Controls
4. Support Tools & Ticketing
```

**Why Split:**
- Each persona has unique needs
- Different UX requirements
- Can prioritize by user value
- Easier to test per persona

### 3. Functional Split (Priority: MEDIUM)
**When:** 12+ functional requirements

**Example:**
```
Current Spec: "Product Management"
FRs cover: CRUD, search, categories, tags, reviews, ratings, inventory

Recommended Split:
1. Product CRUD & Details (FR-1 to FR-5)
2. Product Discovery (Search, Filter, Categories) (FR-6 to FR-9)
3. Product Reviews & Ratings (FR-10 to FR-12)
4. Inventory Management (FR-13 to FR-15)
```

**Why Split:**
- Easier to implement incrementally
- Clear boundaries and dependencies
- Better testability
- Can deliver value progressively

### 4. Integration Split (Priority: MEDIUM)
**When:** 3+ external integrations

**Example:**
```
Current Spec: "Payment Processing"
Integrations: Stripe, PayPal, Square, email, SMS

Recommended Split:
1. Core Payment Processing (Stripe)
2. Alternative Payment Methods (PayPal, Square)
3. Payment Notifications (Email, SMS)
```

**Why Split:**
- Each integration has learning curve
- Different vendor SLAs and limitations
- Can phase rollout
- Easier to test and mock

### 5. Size Split (Priority: LOW)
**When:** Spec exceeds 1000 lines or 5000 words

**Why Split:**
- Hard to navigate and review
- Difficult to maintain
- Context switching overhead
- Review fatigue

## How to Split Specifications

### Step 1: Identify Natural Boundaries
Look for:
- **Business domain boundaries** (different product areas)
- **Data entity boundaries** (independent data models)
- **User workflow boundaries** (distinct user journeys)
- **Integration boundaries** (external system dependencies)
- **Technical boundaries** (frontend vs backend vs data)

### Step 2: Create Split Plan
For each new spec:
- **Clear single purpose** - One sentence description
- **Independence** - Minimal dependencies on other specs
- **Completeness** - Can be implemented and tested standalone
- **Value** - Delivers user value independently

### Step 3: Extract and Refactor
1. Create new spec files from template
2. Copy relevant sections to each new spec
3. Remove duplicated content
4. Add cross-references between related specs
5. Update dependencies and sequencing
6. Validate each new spec independently

### Step 4: Document Relationships
In each spec:
```yaml
related_specs:
  - id: feat-auth-001
    relationship: depends_on
    description: Requires authentication for access control
  - id: feat-notify-001  
    relationship: triggers
    description: Sends notification on completion
```

## Examples

### Example 1: E-commerce Platform (Domain Split)

**Original Spec:**
- User registration, login, profile management
- Product catalog, search, filtering
- Shopping cart, checkout, payment
- Order tracking, shipping, returns
- Customer reviews and ratings
- Admin dashboard for inventory

**Analysis:**
- 6 distinct domains
- 25+ functional requirements
- 12+ data entities
- 3 external integrations

**Recommended Split:**
1. **User Management** (auth, profile, preferences)
2. **Product Catalog** (products, search, categories)
3. **Shopping & Checkout** (cart, payment, orders)
4. **Order Fulfillment** (tracking, shipping, returns)
5. **Reviews & Ratings** (customer feedback)
6. **Admin Tools** (inventory, reporting)

### Example 2: CRM System (Persona Split)

**Original Spec:**
- Sales rep dashboard and lead management
- Manager reporting and analytics
- Customer service ticketing
- Admin user and permission management

**Analysis:**
- 4 distinct personas
- Different workflows and priorities
- 15+ functional requirements

**Recommended Split:**
1. **Sales Tools** (for sales reps)
2. **Management Dashboard** (for managers)
3. **Customer Service** (for support)
4. **System Administration** (for admins)

### Example 3: API Service (Integration Split)

**Original Spec:**
- Core API endpoints (CRUD)
- Stripe payment integration
- SendGrid email integration
- Twilio SMS integration
- Slack notification integration

**Analysis:**
- 4 external integrations
- Each integration has unique auth and error handling
- 10+ endpoints

**Recommended Split:**
1. **Core API** (CRUD, business logic)
2. **Payment Integration** (Stripe)
3. **Communication Services** (Email + SMS)
4. **Team Notifications** (Slack)

## Best Practices

### DO:
- ✅ Split early rather than late
- ✅ Create clear boundaries between specs
- ✅ Document relationships and dependencies
- ✅ Maintain consistent naming and structure
- ✅ Cross-reference related specs
- ✅ Validate each split spec independently

### DON'T:
- ❌ Split arbitrarily without clear boundaries
- ❌ Create specs that are too granular (< 3 FRs)
- ❌ Have circular dependencies between split specs
- ❌ Duplicate content across specs without references
- ❌ Split just to split (have a good reason)
- ❌ Forget to update related documentation

## Commands Reference

```bash
# Analyze a spec for splitting recommendations
npm run analyze-spec specs/features/my-feature.md

# Analyze with JSON output
npm run analyze-spec specs/features/my-feature.md --json

# Save analysis to file
npm run analyze-spec specs/features/my-feature.md --output analysis.txt
```

## Integration with Workflow

### Recommended Workflow:
1. **Create initial spec** (Level 1-2)
2. **Run architecture analysis** 
3. **Split if recommended**
4. **Continue development** on each split spec
5. **Validate each spec** independently
6. **Implement in priority order**

### Quality Gates:
- ✅ Architecture analysis passed (no split needed or split completed)
- ✅ Each spec < 700 lines
- ✅ Each spec < 12 functional requirements
- ✅ Clear boundaries and minimal dependencies
- ✅ All specs validated successfully

## Troubleshooting

### "Should I split or not?"
**If unsure, ask:**
- Can this be implemented in < 2 weeks by 1-2 people?
- Does this have a single, clear purpose?
- Are there obvious natural boundaries?
- Would splitting create too many small pieces?

**General rule:** If total score >= 10, strongly consider splitting.

### "How granular should splits be?"
**Target per spec:**
- 3-8 functional requirements
- 2-6 data entities
- 400-600 lines
- 1-2 week implementation
- Single business purpose

### "What about dependencies between split specs?"
**Dependencies are OK if:**
- Clearly documented in both specs
- Implementation order is obvious
- Each spec can still be tested independently
- Dependencies are minimal (1-2 max)

**Dependencies are problematic if:**
- Circular dependencies exist
- More than 2-3 dependencies per spec
- Can't implement any spec independently
- Changes ripple across many specs

## Summary

Architecture analysis helps you:
1. **Identify** when specs are too large
2. **Understand** natural split boundaries
3. **Decide** how to divide into focused specs
4. **Maintain** quality through appropriate scoping

**Remember:** It's better to have 3 well-scoped specs that ship quickly than 1 massive spec that takes forever and has higher risk of failure.
