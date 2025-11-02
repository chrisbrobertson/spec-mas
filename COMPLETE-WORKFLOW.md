# Spec-MAS Claude Project: Complete Workflow

**Status:** Ready for Implementation  
**Total Estimated Effort:** 14-21 hours (Priority 1 tasks)

---

## 🎯 **The Complete User Journey**

### Scenario: User wants to build an e-commerce system

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Initial Description                                 │
├─────────────────────────────────────────────────────────────┤
│ User: "I want to build a system that handles user auth,    │
│        billing, and notifications"                          │
└────────────────────┬────────────────────────────────────────┘
                     ↓
         ┌───────────────────────┐
         │ SYSTEM DETECTED       │
         │ (3 major domains)     │
         └───────────┬───────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Agent Recommends System Architecture First          │
├─────────────────────────────────────────────────────────────┤
│ Agent: "🏗️ You're describing a SYSTEM with 3 components.   │
│         Before we create feature specs, let's create a      │
│         System Architecture Spec to define:                 │
│         - Overall system structure                          │
│         - Component interactions                            │
│         - Integration points                                │
│         - Implementation roadmap                            │
│                                                             │
│         This will make feature specs clearer and prevent    │
│         architectural issues later.                         │
│                                                             │
│         Ready to create the system architecture spec?"      │
└────────────────────┬────────────────────────────────────────┘
                     ↓
              User: "Yes"
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Create System Architecture Spec (Interactive)       │
├─────────────────────────────────────────────────────────────┤
│ [Agent guides through creating system spec]                 │
│ - System overview                                           │
│ - Component definitions                                     │
│ - Component interactions                                    │
│ - Data architecture                                         │
│ - Integration architecture                                  │
│ - Deployment architecture                                   │
│ - Cross-cutting concerns                                    │
│ - **Implementation Roadmap** (key section!)                 │
│                                                             │
│ Time: 2-4 hours                                            │
│ Output: sys-ecommerce.md (System Architecture Spec)         │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Validate System Architecture Spec                   │
├─────────────────────────────────────────────────────────────┤
│ Agent: "Let me validate the system architecture spec..."    │
│                                                             │
│ ✓ All components defined                                   │
│ ✓ Component interactions clear                             │
│ ✓ Data architecture strategy defined                       │
│ ✓ Implementation roadmap complete                          │
│ ✓ 8 features identified with dependencies                  │
│                                                             │
│ ✅ System Architecture Spec validated!                      │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Begin Feature Spec Creation (Iterative)             │
├─────────────────────────────────────────────────────────────┤
│ Agent: "Your system spec defines 8 features to implement:   │
│                                                             │
│         1. Auth Service (MODERATE, L4) - 40 min            │
│         2. API Gateway (EASY, L3) - 20 min                 │
│         3. User Profile (EASY, L3) - 20 min                │
│         4. Product Service (MODERATE, L4) - 40 min         │
│         5. Order Service (MODERATE, L4) - 40 min           │
│         6. Billing Service (HIGH, L5) - 90 min             │
│         7. Notification (EASY, L3) - 20 min                │
│         8. Admin Dashboard (EASY, L3) - 20 min             │
│                                                             │
│         Total: ~5 hours to create all feature specs         │
│                                                             │
│         I'll guide you through each one with the same       │
│         interactive quality as standalone features, but     │
│         with full system context.                           │
│                                                             │
│         Ready to start with Feature 1: Auth Service?"       │
└────────────────────┬────────────────────────────────────────┘
                     ↓
              User: "Yes"
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Feature 1 - Auth Service (Interactive Creation)     │
├─────────────────────────────────────────────────────────────┤
│ Agent: "**Feature 1 of 8: Auth Service**                    │
│         Complexity: MODERATE | Level 4 | Est: 40 min        │
│                                                             │
│         From system spec, I know this component:            │
│         - Handles authentication and authorization          │
│         - Uses JWT tokens (1hr expiry)                      │
│         - Technology: Node.js + Express                     │
│         - Integrates with: API Gateway, User Service        │
│                                                             │
│         Let's start with Level 1: User Stories              │
│                                                             │
│         Q1: Walk me through your user registration flow..." │
│                                                             │
│ [Full interactive creation - same quality as standalone]    │
│ - User stories through conversation                         │
│ - Functional requirements with validation criteria          │
│ - API specification (with system contracts)                 │
│ - Data model (aligned with system architecture)             │
│ - Security (injected from system spec)                      │
│ - Deterministic tests                                       │
│ - Validation before moving on                               │
│                                                             │
│ Time: 40 minutes                                            │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Validate Feature 1 Before Continuing                         │
├─────────────────────────────────────────────────────────────┤
│ Agent: "Let me validate Auth Service before we continue...  │
│                                                             │
│         ✓ YAML front-matter complete                        │
│         ✓ All Level 4 sections present                      │
│         ✓ 8 FRs with validation criteria                    │
│         ✓ 5 deterministic tests defined                     │
│         ✓ Security section complete                         │
│         ✓ API specification complete                        │
│         ✓ No placeholders                                   │
│                                                             │
│         ✅ Auth Service validated!                           │
│                                                             │
│         📊 Progress: 1 of 8 (12.5%)                         │
│         ⏱️  Time spent: 42 min | Remaining: ~5h 18min       │
│                                                             │
│         Here's your complete spec:                          │
│         [Provides full markdown]                            │
│                                                             │
│         Save as: specs/features/feat-auth-service.md        │
│                                                             │
│         Ready for Feature 2: API Gateway?"                  │
└────────────────────┬────────────────────────────────────────┘
                     ↓
         [Repeat for Features 2-8]
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: All Features Complete                               │
├─────────────────────────────────────────────────────────────┤
│ Agent: "🎉 All 8 feature specs complete!                    │
│                                                             │
│         ✅ feat-auth-service.md                              │
│         ✅ feat-api-gateway.md                               │
│         ✅ feat-user-profile.md                              │
│         ✅ feat-product-service.md                           │
│         ✅ feat-order-service.md                             │
│         ✅ feat-billing-service.md                           │
│         ✅ feat-notification-service.md                      │
│         ✅ feat-admin-dashboard.md                           │
│                                                             │
│         Total time: 6h 23min                                │
│         All validated: Yes                                  │
│         Ready for implementation: Yes                       │
│                                                             │
│         **Next steps:**                                     │
│         1. Save all specs to specs/features/                │
│         2. Run CLI validation (optional):                   │
│            npm run validate-spec specs/features/*.md        │
│         3. Begin implementation:                            │
│            npm run implement-spec feat-auth-service.md      │
│                                                             │
│         Great work! 🚀"                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 **Key Features of This Workflow**

### 1. System Detection (Automatic)
- Detects when user describes multiple major domains
- Recommends system architecture first
- Prevents feature scope creep

### 2. System Architecture Spec
- Defines overall structure
- Documents component interactions
- Creates implementation roadmap
- Sets architectural standards

### 3. Iterative Feature Creation
- **Same quality** as standalone feature creation
- **Systematic** - one feature at a time
- **Context-aware** - system spec always available
- **Validated** - each feature checked before moving on
- **Trackable** - progress shown throughout

### 4. Validation at Every Step
- System spec validated before features
- Each feature validated before next
- No placeholders allowed
- Cross-references enforced

---

## 📊 **Time Breakdown**

| Activity | Time | Output |
|----------|------|--------|
| System Architecture Spec | 2-4 hours | 1 system spec |
| Feature Specs (8 features) | 4-6 hours | 8 feature specs |
| **Total** | **6-10 hours** | **Complete spec set** |

**Compare to manual (no tooling):**
- Creating 8 features separately: 8-12 hours
- Risk of inconsistency: High
- Missing cross-references: Common
- Context loss: Frequent

**Savings:** 2-4 hours + higher quality

---

## 🔧 **What Needs to Be Built**

### Priority 1: Core Workflow (14-21 hours)

**1. System Detection (4-6 hours)**
- Detect system vs feature in initial description
- Decision tree for when to recommend system spec
- Template for system architecture spec

**2. System Context Management (5-7 hours)**
- Parse completed system specs
- Extract roadmap and components
- Maintain context across feature creation
- Inject system context into features

**3. Iterative Creation Workflow (5-7 hours)**
- `/create-features-from-system` command
- Feature creation loop
- Progress tracking display
- Pause/resume capability
- Per-feature validation

**4. Custom Instructions (1-2 hours)**
- Consolidate all behaviors
- Create CUSTOM_INSTRUCTIONS.md for Claude Projects

---

## ✅ **Success Criteria**

### System Detection
- [ ] Agent detects "auth + billing + notifications" as system
- [ ] Agent recommends system spec before feature specs
- [ ] Agent does not proceed without addressing scope

### System Spec Creation
- [ ] Agent guides through system architecture
- [ ] Implementation roadmap section created
- [ ] All components defined with details
- [ ] System spec validated before features

### Feature Iteration
- [ ] Agent creates all features systematically
- [ ] Each feature has same quality as standalone
- [ ] Progress tracked throughout (N of M)
- [ ] Each feature validated before next
- [ ] User can pause/resume anytime
- [ ] All features cross-reference system spec

### Quality
- [ ] No placeholders in any spec
- [ ] All validation criteria concrete
- [ ] All deterministic tests complete
- [ ] System context injected correctly
- [ ] Cross-references accurate

---

## 🚀 **Implementation Phases**

### Phase 1: System Detection (Week 1)
- Build system vs feature detection
- Create system architecture template
- Add decision tree to agent
- Test with examples

### Phase 2: System Context (Week 2)
- Build system spec parser
- Implement context management
- Test context injection
- Verify cross-references

### Phase 3: Feature Iteration (Week 2-3)
- Build `/create-features-from-system` workflow
- Implement progress tracking
- Add pause/resume
- Add per-feature validation
- Test complete workflow

### Phase 4: Testing & Documentation (Week 3)
- End-to-end testing
- User acceptance testing
- Documentation
- Quick start guide

---

## 📖 **For Developers**

### Files to Create/Modify

**New Files:**
1. `.spec-mas/agents/claude-project/templates/SYSTEM-ARCHITECTURE-SPEC.md` ✅ (Done)
2. `.spec-mas/agents/claude-project/CUSTOM_INSTRUCTIONS.md` (To create)

**Files to Update:**
1. `.spec-mas/agents/claude-project/system-prompt.md` (Major updates)
2. `.spec-mas/agents/claude-project/architecture-analysis-guide.md` (Minor updates)
3. `.spec-mas/agents/claude-project/validation-integration-guide.md` (Minor updates)

**No CLI Tools Needed:**
- System-to-features is agent-driven, not CLI-driven
- Validation already exists in CLI (validate-spec.js)
- Architecture analysis already exists in CLI (analyze-spec.js)

---

## 🎯 **Next Step: Start Implementation?**

We have:
✅ Complete workflow designed  
✅ User journey mapped  
✅ Implementation plan defined  
✅ Time estimates calculated  
✅ Success criteria established  

Ready to begin with **Phase 1: System Detection**?

This would involve:
1. Updating system-prompt.md with system detection logic
2. Creating the system architecture template (already done ✅)
3. Adding decision trees
4. Creating test scenarios

Estimated: 4-6 hours

**Should I proceed with Phase 1?**
