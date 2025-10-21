# Spec-MAS Quick Reference Guide

## Complexity Assessment

### EASY (Level 3 Required)
**Characteristics:**
- CRUD operations
- Simple UI components
- Basic forms and lists
- Straightforward validations
- Standalone features

**Keywords that indicate EASY:**
`form`, `list`, `display`, `show`, `create`, `read`, `update`, `delete`, `validation`, `style`, `layout`

**Examples:**
- Add a product filter by price range
- Create a user profile edit form
- Display a list of recent orders
- Add a search bar to navigation

---

### MODERATE (Level 4 Required)
**Characteristics:**
- Multi-system integrations
- Complex workflows
- Business logic heavy
- Data transformations
- Reporting features

**Keywords that indicate MODERATE:**
`integration`, `API`, `workflow`, `process`, `calculate`, `transform`, `report`, `dashboard`, `notification`, `multi-step`

**Examples:**
- Integrate with payment gateway
- Generate monthly analytics report
- Implement order processing workflow
- Build admin dashboard with metrics

---

### HIGH (Level 5 Required)
**Characteristics:**
- Security-critical features
- Authentication/Authorization
- Real-time systems
- Distributed architecture
- Compliance requirements
- Performance critical

**Keywords that indicate HIGH:**
`security`, `authentication`, `authorization`, `real-time`, `encryption`, `compliance`, `distributed`, `payment`, `healthcare`, `financial`, `architecture`

**Examples:**
- Implement OAuth 2.0 authentication
- Build real-time notification system
- Create HIPAA-compliant patient data storage
- Design distributed caching layer

---

## Maturity Levels

### Level 1: Foundation ⭐
**Purpose:** Establish the "what" and "why"

**Required:**
- [ ] 1-3 user stories (As a [user], I want [goal], so that [benefit])
- [ ] 5-12 acceptance criteria (Given/When/Then)
- [ ] Success metrics (measurable)

**Time to complete:** 15-20 minutes

---

### Level 2: Technical Context ⭐⭐
**Purpose:** Define the "how" technically

**Required:**
- [ ] Technical constraints (languages, frameworks, versions)
- [ ] Integration points (APIs, databases, services)
- [ ] Data models (structures, types, validation)

**Time to complete:** 20-30 minutes

---

### Level 3: Robustness ⭐⭐⭐
**Purpose:** Ensure reliability and production-readiness
**Minimum for EASY complexity**

**Required:**
- [ ] 3-7 error scenarios with recovery strategies
- [ ] Performance requirements (numeric targets with percentiles)
- [ ] Security considerations (auth, authorization, data handling)

**Time to complete:** 30-45 minutes

---

### Level 4: Architecture & Governance ⭐⭐⭐⭐
**Purpose:** Ensure architectural consistency and compliance
**Minimum for MODERATE complexity**

**Required:**
- [ ] Architectural patterns to follow
- [ ] Compliance requirements (GDPR, HIPAA, SOC2, etc.)
- [ ] Observability plan (metrics, logs, alerts)

**Time to complete:** 45-60 minutes

---

### Level 5: Complete Specification ⭐⭐⭐⭐⭐
**Purpose:** Eliminate all ambiguity
**Minimum for HIGH complexity**

**Required:**
- [ ] 2-3 concrete examples with real data
- [ ] Counter-examples (what it should NOT do)
- [ ] 3+ edge cases with handling
- [ ] Migration strategy (rollout, rollback)

**Time to complete:** 60-90 minutes

---

## Validation Gates

### Gate 1: Structure
**Checks:**
- ✓ Front-matter present and well-formed
- ✓ Required sections exist
- ✓ Metadata fields valid
- ✓ Markdown syntax correct

### Gate 2: Semantics
**Checks:**
- ✓ Each FR has validation criteria
- ✓ Security section complete
- ✓ Glossary resolves ambiguous terms
- ✓ Acceptance criteria measurable

### Gate 3: Traceability & Coverage
**Checks:**
- ✓ Every FR has ≥1 test
- ✓ Non-functional claims have metrics
- ✓ Integration points documented
- ✓ Dependencies identified

### Gate 4: Determinism & Invariants
**Checks:**
- ✓ Deterministic tests have checksums
- ✓ Security invariants enforced
- ✓ Edge cases covered
- ✓ Migration strategy defined

---

## Common Pitfalls

### ❌ Vague Terms (Replace These)
| Don't Say | Do Say |
|-----------|--------|
| "fast" | "response time < 200ms at p95" |
| "user-friendly" | "complete task in ≤3 clicks" |
| "scalable" | "support 10,000 concurrent users" |
| "secure" | "implements OAuth 2.0 with PKCE" |
| "reliable" | "99.9% uptime SLA" |

### ❌ Untestable Criteria
| Bad | Good |
|-----|------|
| "System handles errors gracefully" | "When API returns 500, display 'Service unavailable' message" |
| "Page loads quickly" | "Page load time <3s on 3G connection" |
| "Works well under load" | "Maintains <500ms p95 latency under 1000 concurrent users" |

### ❌ Skipping Levels
**Problem:** Jumping straight to implementation details without foundation  
**Solution:** Always build Level 1 first, then progress sequentially

### ❌ Missing Error Handling
**Problem:** Only documenting the happy path  
**Solution:** For every integration, define timeout, retry, and failure behaviors

---

## Agent Readiness Checklist

Before submitting to AI agents, ensure:

- [ ] Complexity correctly assessed
- [ ] Required maturity level achieved
- [ ] No "TBD" or "To be determined" anywhere
- [ ] No vague terms without glossary definitions
- [ ] All requirements testable and measurable
- [ ] Error scenarios documented
- [ ] Performance targets specific
- [ ] Integration points fully documented
- [ ] Security considerations complete
- [ ] Examples use real data (not foo/bar)

---

## Time Estimates

| Complexity | Required Level | Estimated Time |
|------------|----------------|----------------|
| EASY | Level 3 | 1-1.5 hours |
| MODERATE | Level 4 | 1.5-2.5 hours |
| HIGH | Level 5 | 2.5-4 hours |

**Note:** These are for initial specification creation. Refinement and reviews add time.

---

## Getting Help

### Commands
- `/new [description]` - Start new spec
- `/assess [spec]` - Evaluate existing spec
- `/enhance` - Move to next level
- `/validate` - Check agent readiness
- `/examples` - See examples for current level
- `/export` - Generate final markdown

### Resources
- Examples: See `docs/examples/` directory
- Templates: See `templates/` directory
- Full guide: See `maturity-model.md`

---

**Remember:** The goal is creating specifications that AI agents can implement without human clarification, while preventing production incidents through thorough planning.
