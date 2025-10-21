# Specification Creation Workflow

This guide walks you through the interactive process of creating a specification with the Spec-MAS assistant.

---

## Phase 1: Initiation & Assessment

### Step 1: Start the Conversation
**You say:** `/new [brief description of your feature]`

**Example:**
```
/new Add a product filtering feature that lets users filter by price range
```

### Step 2: Assistant Assesses Complexity
The assistant will:
1. Analyze your description
2. Identify complexity indicators
3. Classify as EASY, MODERATE, or HIGH
4. Tell you the required maturity level

**Assistant responds with:**
```
I'll help you create an agent-ready specification for product price filtering.

Based on your description, I've classified this as EASY complexity.

📊 Requirements:
- Complexity: EASY
- Required Level: 3 (Foundation → Technical → Robustness)
- Current Level: 0

Let's start with the foundation...
```

---

## Phase 2: Level 1 - Foundation

### What You'll Define:
- User stories (1-3)
- Acceptance criteria (5-12)
- Success metrics

### The Conversation Flow

**Assistant asks:**
```
For Level 1, I need to understand the users and their goals.

Question 1: Who are the primary users of this feature?
- Customers browsing products?
- Administrators managing the catalog?
- Both?
```

**You answer:**
```
Customers browsing products
```

**Assistant asks:**
```
Perfect. Now let's define what they want to accomplish.

Question 2: What specific goal do customers have when filtering by price?
Some examples:
- Find products within their budget
- Compare prices in a certain range
- Filter expensive/cheap items
```

**You answer:**
```
Find products within their budget
```

**Assistant asks:**
```
Great! Now let's think about the benefit.

Question 3: Why is finding products in their budget valuable?
- So they don't waste time looking at unaffordable items?
- So they can make purchase decisions faster?
- So they feel the site respects their budget?
```

**Continue this pattern until all Level 1 requirements are gathered.**

### Level 1 Completion

**Assistant says:**
```
✅ Level 1 Complete!

You've successfully defined:
- 2 user stories covering customer goals
- 8 acceptance criteria in Given/When/Then format
- 3 measurable success metrics

📊 Progress:
- Current Level: 1/5
- Required Level: 3/5
- Agent Ready: No (need Level 3)

Next: Level 2 - Technical Context
```

---

## Phase 3: Level 2 - Technical Context

### What You'll Define:
- Technical constraints
- Integration points
- Data models

### The Conversation Flow

**Assistant asks:**
```
Now let's get technical.

Question 1: What's your tech stack for this feature?
I need to know:
- Frontend framework (React, Vue, Angular?)
- Backend language (Node, Python, Java?)
- Any specific libraries or constraints?
```

**You answer:**
```
React 18 with TypeScript for frontend
Node.js backend
Using Material-UI for components
```

**Assistant asks:**
```
Perfect. Now about integrations...

Question 2: What existing systems does this feature connect to?
Examples:
- Product database or API
- Search service
- Analytics system
```

**Continue this pattern until all Level 2 requirements are gathered.**

### Level 2 Completion

**Assistant says:**
```
✅ Level 2 Complete!

You've successfully defined:
- Technical stack (React 18, TypeScript, Material-UI)
- Integration with Product API and Analytics
- Data model for price filters

📊 Progress:
- Current Level: 2/5
- Required Level: 3/5
- Agent Ready: No (need Level 3)

Next: Level 3 - Robustness
```

---

## Phase 4: Level 3 - Robustness

### What You'll Define:
- Error scenarios (3-7)
- Performance requirements
- Security considerations

### The Conversation Flow

**Assistant asks:**
```
Now let's make this production-ready by handling errors.

Question 1: What could go wrong with the API call?
Think about:
- Network timeouts
- API returning errors
- No products matching the filter
```

**You answer:**
```
API might timeout or return 500 error
No products might match the price range
```

**Assistant asks:**
```
Good! How should we handle these?

For API timeout/error:
A) Show an error message
B) Show cached results with a warning
C) Retry automatically
D) Combination of above

What makes sense for your users?
```

**Continue this pattern through all error scenarios, performance targets, and security considerations.**

### Level 3 Completion (EASY features stop here)

**Assistant says:**
```
✅ Level 3 Complete!

You've successfully defined:
- 5 error scenarios with recovery strategies
- Performance targets (<200ms p95, <500ms API)
- Security considerations (input validation, rate limiting)

📊 Progress:
- Current Level: 3/5
- Required Level: 3/5 ✓
- Agent Ready: YES! ✅

🎉 This specification is now agent-ready!

Would you like to:
1. Export to final Spec-MAS v3 format
2. Review the complete specification
3. Add optional Level 4 details (not required for EASY)
```

---

## Phase 5: Level 4 - Architecture & Governance
*(Required only for MODERATE complexity)*

### What You'll Define:
- Architectural patterns
- Compliance requirements
- Observability plan

### The Conversation Flow

**Assistant asks:**
```
This MODERATE complexity feature needs architectural guidance.

Question 1: What design patterns should guide implementation?
Examples:
- Repository pattern for data access
- Strategy pattern for different filter types
- Observer pattern for state changes
```

**Continue through architecture, compliance, and observability.**

### Level 4 Completion (MODERATE features stop here)

**Assistant says:**
```
✅ Level 4 Complete!

You've successfully defined:
- Architectural patterns (Repository, Service Layer)
- Compliance requirements (GDPR considerations)
- Observability plan (metrics, logs, alerts)

📊 Progress:
- Current Level: 4/5
- Required Level: 4/5 ✓
- Agent Ready: YES! ✅

This specification is now agent-ready!
```

---

## Phase 6: Level 5 - Complete Specification
*(Required only for HIGH complexity)*

### What You'll Define:
- Concrete examples (2-3)
- Counter-examples
- Edge cases (3+)
- Migration strategy

### The Conversation Flow

**Assistant asks:**
```
For HIGH complexity features, we need concrete examples.

Question 1: Can you walk me through a specific example?
- What's the exact input?
- What should the exact output be?
- Use real data, not placeholders
```

**You answer:**
```
User sets filter: minPrice=50, maxPrice=100
System returns products: IDs [123, 456, 789]
URL updates to: /products?min=50&max=100
```

**Assistant asks:**
```
Perfect! That's a concrete example.

Now let's define what this is NOT.

Question 2: What are common misconceptions about this feature?
Examples:
- It's NOT a sorting feature
- It does NOT handle currency conversion
- It's NOT a saved filter system
```

**Continue through all examples, counter-examples, edge cases, and migration strategy.**

### Level 5 Completion (HIGH features complete)

**Assistant says:**
```
✅ Level 5 Complete!

You've successfully defined:
- 3 concrete examples with real data
- 4 counter-examples clarifying scope
- 5 edge cases with handling strategies
- Complete migration strategy with rollback plan

📊 Progress:
- Current Level: 5/5
- Required Level: 5/5 ✓
- Agent Ready: YES! ✅

This specification is now agent-ready!
```

---

## Phase 7: Validation & Export

### Final Validation

**You say:** `/validate`

**Assistant provides:**
```markdown
# Specification Validation Report

## Product Price Filter
**Maturity:** ⭐⭐⭐ Level 3/5  
**Complexity:** EASY
**Status:** ✅ Agent-Ready

### ✅ Passed All Checks (15)
- Front-matter complete
- All required sections present
- User stories well-formed
- Acceptance criteria testable
- Error scenarios comprehensive
- Performance metrics specific
- Security considerations complete
- No vague terms found
- All requirements measurable
- Integration points documented
- Data models defined
- Glossary complete
- Tests mapped to requirements
- No placeholders or TBDs
- Format valid

### Gates Status
- G1 (Structure): ✅ PASS
- G2 (Semantics): ✅ PASS
- G3 (Traceability): ✅ PASS
- G4 (Invariants): Not Required (EASY complexity)

### Readiness Score: 100/100

**This specification is ready for AI agents to implement.**
```

### Export to Final Format

**You say:** `/export`

**Assistant generates:**
- Complete Spec-MAS v3 markdown file
- Properly formatted front-matter
- All sections filled out
- Ready to commit to repository

---

## Tips for Success

### Do:
✅ Answer questions based on your actual requirements  
✅ Ask for clarification if you don't understand  
✅ Be specific with numbers and metrics  
✅ Think through error cases carefully  
✅ Use real examples, not placeholders  

### Don't:
❌ Rush through levels to "get it done"  
❌ Leave TBDs or "to be determined"  
❌ Use vague terms without defining them  
❌ Skip error handling  
❌ Assume agents will "figure it out"  

---

## Example Timeline

| Feature Type | Required Level | Typical Duration |
|--------------|----------------|------------------|
| Simple form (EASY) | 3 | 45-90 minutes |
| API integration (MODERATE) | 4 | 1.5-2.5 hours |
| Auth system (HIGH) | 5 | 3-4 hours |

**Remember:** Time spent on specification saves 10x time in implementation and debugging.

---

## What Happens Next?

Once your specification is agent-ready:

1. **Export** - Generate the final markdown file
2. **Review** - Have teammates review the spec
3. **Approve** - Get sign-off from relevant stakeholders
4. **Commit** - Add to your repository
5. **Validate** - Run through validation gates
6. **Implement** - Hand off to AI agents or development team

The specification becomes the source of truth for implementation, testing, and validation.
