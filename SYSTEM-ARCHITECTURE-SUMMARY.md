# System Architecture Detection - Enhancement Summary

**Date:** 2025-11-01  
**Status:** Plan Updated + Template Created

---

## What Was Changed

### 1. Enhanced the Implementation Plan ✅
**File:** `/Users/chrisrobertson/repos/Spec-MAS/CLAUDE-PROJECT-ENHANCEMENT-PLAN.md`

**Key Additions:**
- **System vs Feature Detection** logic in decision tree
- New **Task 1.1b: System Architecture Detection** as Priority 1
- Updated **Custom Instructions** to include system detection rules
- Added **Test Scenario 0** for system detection
- Updated priority order to make system detection #1 priority

### 2. Created System Architecture Template ✅
**File:** `/Users/chrisrobertson/repos/Spec-MAS/.spec-mas/agents/claude-project/templates/SYSTEM-ARCHITECTURE-SPEC.md`

**Template Sections:**
1. System Overview (Purpose, Scope, Success Criteria)
2. System Components (with diagram)
3. Component Interactions (Data flows, API contracts)
4. Data Architecture (DB strategy, data models)
5. Integration Architecture (API gateway, external systems)
6. Deployment Architecture (Infrastructure, scaling)
7. Cross-Cutting Concerns (Logging, monitoring, security)
8. Implementation Roadmap (Feature spec breakdown)
9. Risk Assessment
10. Success Metrics
11. Next Steps

---

## How It Works

### Detection Logic

When a user describes something like:
> "I want to build a system that handles user auth, billing, and notifications"

The agent will:

1. **Detect System** (3+ major domains: auth, billing, notifications)
2. **Stop before creating feature spec**
3. **Recommend System Architecture Spec first**
4. **Explain the workflow:**
   - Phase 1: System Architecture Spec (defines structure)
   - Phase 2: Individual Feature Specs (detailed implementation)

### Agent Response Template

```
🏗️ **SYSTEM ARCHITECTURE NEEDED**

I notice you're describing a complete system with 3 major components:
- User Authentication & Authorization
- Billing & Payment Processing
- Notification System

**Recommended Approach:**

**Phase 1: System Architecture Spec** (2-4 hours)
Create a high-level architecture specification that defines:
- System components and their responsibilities
- Component interactions and data flows
- Integration points and APIs
- Data architecture and storage strategy
- Security and authentication model
- Deployment architecture

**Phase 2: Individual Feature Specs** (1-3 days total)
Then create focused feature specs for each component:
1. Feature Spec: User Authentication (Level 4)
2. Feature Spec: Billing System (Level 4) 
3. Feature Spec: Notification Service (Level 3)

**Benefits:**
✅ Clear system boundaries before implementation
✅ Identifies dependencies between components
✅ Prevents architectural rework later
✅ Enables parallel development of features
✅ Better cost and timeline estimates

Would you like me to:
1. **Start with System Architecture Spec** (recommended)
2. Skip architecture and dive into first feature
3. Get more guidance on this approach
```

---

## System Detection Criteria

### Indicators for SYSTEM (not a feature):

**Strong Indicators (3+ means System):**
- Multiple major business domains (auth, billing, notifications, etc.)
- 3+ major components that each need separate implementation
- System-level keywords: "system", "platform", "application infrastructure"

**Examples:**

**SYSTEMS:**
- ✅ "Build a system that handles user auth, billing, and notifications"
- ✅ "Create a platform for e-commerce with product catalog, checkout, and inventory"
- ✅ "Build an application with customer management, ticketing, and reporting"

**FEATURES:**
- ❌ "Add user authentication with OAuth"
- ❌ "Create a billing invoice generation feature"
- ❌ "Build a notification email system"

---

## Implementation Workflow

### Current Priority Order (Updated)

**Priority 1 - Core Workflow:**
1. ⭐ **System Architecture Detection** (NEW - addresses your concern)
2. Enhanced decision trees in system prompt
3. Create custom instructions
4. Create and run test scenarios
5. Create quick start guide

---

## What the System Architecture Spec Defines

The template helps users define:

### Component-Level Details
- What each major component does
- Technology choices per component
- APIs each component exposes
- Dependencies between components

### System-Level Details
- How components interact (data flows)
- Where data lives (data architecture)
- How external systems integrate
- How the system scales and deploys

### Implementation Roadmap
- **Ordered list of feature specs** to create next
- Dependencies between features
- Timeline estimates
- Priority ordering

### Example Roadmap from Template:
```
Phase 1: Foundation
  1. Auth Service Feature Spec (Level 4) - 3-5 days
  2. API Gateway Setup (Level 3) - 2-3 days

Phase 2: Core Features  
  3. User Profile Service (Level 3) - 2-3 days
  4. Product Service (Level 4) - 4-5 days

Phase 3: Business Logic
  5. Order Service (Level 4) - 5-7 days
  6. Billing Service (Level 5) - 7-10 days

Phase 4: Enhancements
  7. Notification Service (Level 3) - 2-3 days
  8. Admin Dashboard (Level 3) - 3-4 days
```

---

## Benefits of This Approach

### For Users
- ✅ **Clear direction** before writing code
- ✅ **Better planning** and timeline estimates
- ✅ **Identifies issues early** (dependencies, integration challenges)
- ✅ **Enables parallel work** (once dependencies clear)
- ✅ **Prevents architectural rework**

### For Implementation
- ✅ Each feature spec is **appropriately scoped**
- ✅ **Dependencies are clear** (build in right order)
- ✅ **Integration points defined** (APIs between components)
- ✅ Can **implement incrementally** (deliver value sooner)

### For the Team
- ✅ **Shared understanding** of system structure
- ✅ **Clear ownership** (who builds what)
- ✅ **Better cost estimates** (spec per component)
- ✅ **Risk mitigation** (identify risks upfront)

---

## Next Steps

### To Complete Implementation:

**Phase 1: Agent Enhancement** (2-3 hours)
- [ ] Update system-prompt.md with system detection decision tree
- [ ] Create CUSTOM_INSTRUCTIONS.md with system detection rules
- [ ] Add examples of system vs feature detection
- [ ] Test in Claude Project

**Phase 2: Testing** (1-2 hours)
- [ ] Test Scenario 0: System detection works
- [ ] Test that agent recommends arch spec
- [ ] Test that agent doesn't proceed without addressing system scope
- [ ] Verify template is helpful

**Phase 3: Documentation** (1 hour)
- [ ] Update quick start guide
- [ ] Add example: "Building a Complete System"
- [ ] Document workflow: Architecture → Features

---

## Testing Checklist

When testing, verify:

**System Detection:**
- [ ] Agent detects "user auth AND billing AND notifications" as system
- [ ] Agent does NOT proceed to Level 1 of feature spec
- [ ] Agent recommends system architecture spec
- [ ] Agent explains why (benefits of arch-first approach)

**Feature Detection:**
- [ ] Agent correctly identifies single features
- [ ] Agent proceeds normally for single features
- [ ] Agent doesn't over-trigger system warnings

**Edge Cases:**
- [ ] User with 2 major domains → Agent asks for clarification
- [ ] User says "actually just the auth part" → Agent proceeds with feature
- [ ] User insists on feature despite system → Agent warns but allows

---

## Questions Answered

### Q: What if user describes a system but wants to start with one feature?
**A:** Agent should:
1. Acknowledge it's a system
2. Recommend architecture spec for context
3. Offer choice: "Would you like to (a) create arch spec first, or (b) create just the [auth] feature spec"
4. If user chooses (b), note in feature spec: "Part of larger [System Name] system"

### Q: How detailed should the system architecture spec be?
**A:** 
- **High-level:** Component responsibilities, interactions, data flows
- **Not detailed:** Individual API endpoints, specific algorithms, UI designs
- **Goal:** Enough to create good feature specs with clear boundaries

### Q: When should you skip the system architecture spec?
**A:**
- Never skip for true systems (3+ major domains)
- Can skip if user has existing architecture docs
- Can skip if only 2 related components (border case - ask user)

---

## File Locations

All files are on your local system:

**Plan:**
```
/Users/chrisrobertson/repos/Spec-MAS/CLAUDE-PROJECT-ENHANCEMENT-PLAN.md
```

**Template:**
```
/Users/chrisrobertson/repos/Spec-MAS/.spec-mas/agents/claude-project/templates/SYSTEM-ARCHITECTURE-SPEC.md
```

**This Summary:**
```
/Users/chrisrobertson/repos/Spec-MAS/SYSTEM-ARCHITECTURE-SUMMARY.md
```

---

## What This Solves

Your original concern:
> "For cases like 'I want to build a system that handles user auth, billing, and notifications', the agent should check if there is an architectural design first and if not recommend doing the high level system design first, then getting into the specific feature implementations."

**Solution:** 
✅ Agent now detects systems (3+ domains)  
✅ Agent recommends System Architecture Spec first  
✅ Agent doesn't proceed to feature specs without addressing system scope  
✅ System Architecture template guides users through high-level design  
✅ Template includes roadmap section that breaks into feature specs  

**Status:** Plan updated, template created, ready for implementation Phase 1.
