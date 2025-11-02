# System-to-Features: Agent-Driven Iteration (Revised Design)

**Date:** 2025-11-01  
**Status:** Revised Design  
**Key Insight:** Don't generate stubs - guide interactive creation of complete specs

---

## ❌ **What Was Wrong With Previous Design**

### The Stub Approach Problem
```
CLI generates 80% complete stubs
  ↓
User manually fills in 20%
  ↓
Result: Medium quality, lots of manual work
```

**Issues:**
- ❌ Loses the interactive creation quality
- ❌ User still does repetitive work (8 times)
- ❌ Agent becomes a "filler" not a "creator"
- ❌ Validation criteria, edge cases still manual
- ❌ Not leveraging agent's actual strength

### What Makes Claude Project Valuable
✅ **Interactive conversation** to understand requirements  
✅ **Iterative refinement** through questions  
✅ **Context-aware suggestions** based on system design  
✅ **Quality validation** as you build  
✅ **Edge case discovery** through dialogue  

**The agent shouldn't fill in stubs - it should CREATE complete specs through conversation, one at a time.**

---

## ✅ **Revised Approach: Agent-Driven Iteration**

### Core Concept
The agent systematically walks through each feature from the system spec, having the SAME high-quality interactive conversation it would have for a single feature, but with full system context.

```
User has System Spec with 8 features
  ↓
Agent: "Let's create all 8 feature specs. Starting with #1: Auth Service"
  ↓
[SAME INTERACTIVE PROCESS as creating standalone feature]
  - Agent asks clarifying questions
  - Agent suggests validation criteria
  - Agent creates deterministic tests
  - Agent validates before moving on
  ↓
Agent: "Auth Service complete! Ready for #2: API Gateway?" (2/8)
  ↓
[Repeat for all features]
  ↓
Result: 8 complete, validated, high-quality feature specs
```

---

## 🎯 **The Agent Workflow**

### Mode: `/create-features-from-system`

**Trigger:** User has completed a System Architecture Spec

**Agent Behavior:**

```
User: I've completed my system architecture spec with 8 components.
      I'm ready to create the feature specs now.

Agent: Perfect! I can see your system architecture spec defines:
       
       📋 **8 Features to Implement:**
       1. Auth Service (MODERATE, Level 4) - Foundation
       2. API Gateway (EASY, Level 3) - Depends on: Auth
       3. User Profile Service (EASY, Level 3) - Depends on: Auth
       4. Product Service (MODERATE, Level 4) - Depends on: Auth
       5. Order Service (MODERATE, Level 4) - Depends on: Auth, Product, User
       6. Billing Service (HIGH, Level 5) - Depends on: Auth, Order
       7. Notification Service (EASY, Level 3) - Depends on: Auth, Order, Billing
       8. Admin Dashboard (EASY, Level 3) - Depends on: All above
       
       **Recommended approach:** Create these in dependency order.
       
       I'll guide you through creating each feature spec with the same 
       interactive process you'd use for a standalone feature, but I'll 
       have full context from your system architecture.
       
       **For each feature, we'll:**
       - Define detailed user stories
       - Create functional requirements with validation criteria
       - Design API endpoints (using system contracts)
       - Define data models (using system data architecture)
       - Create deterministic tests
       - Validate before moving to next
       
       **Time estimate:** ~30-45 minutes per feature (4-6 hours total)
       
       Ready to start with #1: Auth Service?

User: Yes, let's start.

Agent: **Feature 1 of 8: Auth Service**
       
       I have the component details from your system spec:
       - Responsibility: Handle user authentication and authorization
       - Technology: Node.js + Express
       - High-level features: Registration, Login, JWT tokens, Password reset
       - System context: JWT with 1hr expiry, bcrypt passwords, RBAC
       
       Let's start with Level 1. For the Auth Service, I need to 
       understand the key user workflows:
       
       **Q1:** Walk me through your typical user registration flow. 
       Do users:
       - Register and immediately access the system?
       - Register and wait for email verification?
       - Register with admin approval?
       
       **Q2:** For login, are we implementing:
       - Just email/password?
       - Any social login (Google, etc.)?
       - Any SSO requirements?
       
       **Q3:** For password reset:
       - Email-based reset link?
       - Security questions?
       - Admin-assisted reset?

User: [Answers questions]

Agent: Great! Based on your answers, here are the user stories:
       
       **Story 1: User Registration**
       As a new user, I want to register with email and password,
       then verify via email link, so that I can access the platform.
       
       **Story 2: User Login**
       As a registered user, I want to log in with my verified credentials
       to receive a JWT token for API access.
       
       [... more stories ...]
       
       Does this capture your registration and login flows correctly?
       Any stories missing?

User: [Provides feedback]

Agent: [Refines stories based on feedback]
       
       Now let's move to Level 2: Functional Requirements.
       
       Based on your user stories, here are the functional requirements:
       
       **FR-1: User Registration**
       Description: System must allow new users to register...
       
       **Validation Criteria:**
       - Email must be valid RFC 5322 format, max 255 characters
       - Password must be minimum 8 characters with...
       - Duplicate email returns 409 with clear message
       - Verification email sent within 5 seconds
       - Registration rate limited to 5 per minute per IP
       
       **Priority:** MUST
       **Dependencies:** None
       
       Does FR-1 look complete? Any edge cases I'm missing?

User: [Feedback]

Agent: [Continues through all sections with same quality]
       
       [After completing all sections for Auth Service]
       
       Let me validate this spec before we move on...
       
       🔍 **Validation Check:**
       ✓ YAML front-matter complete
       ✓ All Level 4 sections present
       ✓ 8 functional requirements with validation criteria
       ✓ 5 deterministic tests defined
       ✓ Security section complete
       ✓ API specification complete
       ✓ Data model defined
       ✓ No placeholders
       
       ✅ **Auth Service spec is complete and validated!**
       
       **Progress: 1 of 8 features complete (12.5%)**
       **Estimated remaining time: 5-6 hours**
       
       Here's your completed Auth Service spec:
       [Provides complete spec in markdown]
       
       Save this as: specs/features/feat-auth-service.md
       
       **Ready to move to Feature 2: API Gateway?**
       
       This one should be faster (Level 3, EASY complexity).
       I'll use the Auth Service context we just created.

User: Yes, continue.

Agent: **Feature 2 of 8: API Gateway**
       
       This component depends on Auth Service (which we just completed).
       
       From your system spec:
       - Responsibility: Route requests, rate limiting, authentication
       - Technology: Kong
       - Routes to: Auth Service, User Service, Product Service, etc.
       
       Key integration: Uses Auth Service's /api/v1/auth/validate endpoint
       for token validation on all protected routes.
       
       Let's define the user stories...
       
       [Continues with same interactive process]
```

---

## 🏗️ **Implementation Architecture**

### Component 1: System Context Manager

**Purpose:** Parse system spec and maintain context throughout feature creation

**File:** Update `.spec-mas/agents/claude-project/system-prompt.md`

```markdown
## System Context Management

When creating features from a system spec, I maintain context:

### Context Structure
```javascript
systemContext = {
  systemSpec: {
    id: 'sys-ecommerce',
    name: 'E-commerce Platform',
    // ... full system spec data
  },
  
  features: [
    { name: 'Auth Service', status: 'completed', specId: 'feat-auth-service' },
    { name: 'API Gateway', status: 'in-progress', specId: 'feat-api-gateway' },
    { name: 'User Profile', status: 'pending', specId: null },
    // ... remaining features
  ],
  
  currentFeature: {
    index: 1,  // 2 of 8
    component: { /* component details */ },
    dependencies: ['feat-auth-service'],  // Already completed
    dependents: ['feat-user-profile', 'feat-product-service']
  },
  
  crossCuttingConcerns: {
    authentication: { /* from system spec */ },
    security: { /* from system spec */ },
    performance: { /* from system spec */ },
    deployment: { /* from system spec */ }
  }
}
```

### Context Injection Rules

When creating each feature spec, I automatically inject:

1. **System Context Section** (at top of spec)
   ```markdown
   > **System Context:** This implements the [Component Name] from 
   > [System Name] ([sys-id.md](sys-id.md)).
   >
   > **Dependencies:** This feature requires:
   > - [feat-auth-service.md](feat-auth-service.md) - Authentication
   >
   > **Dependents:** This feature is required by:
   > - [feat-user-profile.md](feat-user-profile.md) - User data
   ```

2. **Security Requirements** (injected into Security section)
   ```markdown
   ### From System Architecture
   *[Reference: sys-id.md#security-model]*
   
   This feature implements these system-wide security controls:
   - [List from system spec]
   ```

3. **Performance Targets** (injected into NFRs)
   ```markdown
   ### From System Architecture
   *[Reference: sys-id.md#performance-targets]*
   
   This feature must meet these system-wide targets:
   - [Targets from system spec]
   ```

4. **API Contracts** (injected into API Specification)
   ```markdown
   ### Internal API Contracts
   *[Reference: sys-id.md#api-contracts]*
   
   This component must implement these contracts with other services:
   - [Contracts from system spec]
   ```
```

### Component 2: Iterative Creation Workflow

**File:** Update `.spec-mas/agents/claude-project/system-prompt.md`

```markdown
## Command: /create-features-from-system

### Purpose
Guide user through creating all feature specs from completed system architecture spec.

### Workflow

#### Phase 1: Initialization
1. Parse system architecture spec (user provides)
2. Extract implementation roadmap
3. Identify feature count and dependencies
4. Present plan to user
5. Confirm approach

#### Phase 2: Feature Creation Loop
For each feature in roadmap order:
  1. **Announce feature** (N of M, complexity, maturity)
  2. **Load context:**
     - Component details from system spec
     - Dependencies (already completed features)
     - Cross-cutting concerns
  3. **Create feature spec interactively:**
     - Same quality as standalone feature creation
     - All maturity levels (1-5) based on complexity
     - All sections complete with validation
  4. **Validate feature spec:**
     - Run validation checks
     - Ensure no placeholders
     - Check all required sections
  5. **Provide complete spec:**
     - Generate full markdown
     - Show save location
     - Update progress (N of M complete)
  6. **Confirm before continuing:**
     - User reviews
     - User saves locally
     - User confirms ready for next

#### Phase 3: Completion
1. All features created and validated
2. Provide summary of all created specs
3. Suggest next steps (validation, implementation)

### Progress Tracking

Throughout the process:
- **Visual progress:** "Feature 3 of 8 (37.5%)"
- **Time estimates:** Based on complexity and maturity
- **Dependency tracking:** Show what's complete, what's enabled
- **Quality gates:** Validate each before moving on

### Pausing and Resuming

If user needs to pause:
- Save progress state
- User can resume: "Continue with feature creation (was on 3 of 8)"
- Agent picks up where left off with full context

### Example Progress Display

```
📊 **Feature Creation Progress**

✅ 1. Auth Service (MODERATE, L4) - Complete
✅ 2. API Gateway (EASY, L3) - Complete
🔄 3. User Profile (EASY, L3) - In Progress
⏳ 4. Product Service (MODERATE, L4) - Pending
⏳ 5. Order Service (MODERATE, L4) - Pending (needs: Product)
⏳ 6. Billing Service (HIGH, L5) - Pending (needs: Order)
⏳ 7. Notification (EASY, L3) - Pending (needs: Billing)
⏳ 8. Admin Dashboard (EASY, L3) - Pending (needs: All)

**Progress:** 25% complete (2/8)
**Time spent:** 1.5 hours
**Estimated remaining:** 4.5 hours
```
```

### Component 3: Quality Assurance Per Feature

**Built-in validation after each feature:**

```markdown
## Validation Per Feature

After creating each feature spec, I perform validation:

### Automated Checks
- [ ] YAML front-matter complete and valid
- [ ] All required sections for maturity level present
- [ ] All FRs have validation criteria (min 2 per FR)
- [ ] Security section addresses system requirements
- [ ] API endpoints match system contracts
- [ ] Data model aligns with system data architecture
- [ ] At least 3 deterministic tests defined
- [ ] No [placeholder] text remaining
- [ ] Cross-references to system spec and dependencies

### Quality Checks
- [ ] User stories are specific and testable
- [ ] Validation criteria are concrete (no vague terms)
- [ ] Deterministic tests have exact inputs/outputs
- [ ] Security requirements are detailed
- [ ] Performance targets are quantified
- [ ] API responses show exact JSON structures

### Context Checks
- [ ] Injected system authentication model
- [ ] Injected system security requirements
- [ ] Injected system performance targets
- [ ] Injected system deployment strategy
- [ ] Referenced dependent features correctly
- [ ] Noted features that depend on this one

**Only after all checks pass do I mark feature as complete and move to next.**
```

---

## 🎨 **User Experience**

### Full Session Example

```
User: I've completed my system architecture spec. Ready to create the feature specs.

Agent: Great! Let me review your system architecture...
       
       I see you have 8 components to implement:
       [Lists all 8 with complexity and dependencies]
       
       I'll guide you through creating each feature spec with the same
       interactive quality you'd get creating them individually, but with
       full system context.
       
       This will take about 4-6 hours total:
       - 2 EASY features (~20 min each)
       - 4 MODERATE features (~30-40 min each)  
       - 2 HIGH features (~60-90 min each)
       
       We'll work in dependency order, validating each before moving on.
       
       Ready to start? [Yes/No/Let me review the plan first]

User: Yes

Agent: **Feature 1 of 8: Auth Service**
       Complexity: MODERATE | Maturity: Level 4 | Est. time: 40 min
       
       [30-40 minutes of interactive creation]
       
       ✅ Auth Service complete and validated!
       
       Progress: 1/8 (12.5%) | Time spent: 42 min | Est. remaining: 5h 18min
       
       **Ready for Feature 2?** [Yes/Take a break/Show me what's next]

User: Take a break

Agent: No problem! We've completed:
       ✅ Auth Service
       
       When you're ready to continue, just say:
       "Continue feature creation" or "Resume with API Gateway"
       
       I'll pick up right where we left off.

[1 hour later]

User: Continue feature creation

Agent: Welcome back! We left off after completing Auth Service (1 of 8).
       
       **Next up: Feature 2 of 8: API Gateway**
       Complexity: EASY | Maturity: Level 3 | Est. time: 20 min
       
       This is simpler than Auth Service since it's Level 3.
       
       Ready to continue? [Yes/Show progress/Skip to different feature]

[Process continues through all 8 features]

Agent: 🎉 **All 8 feature specs complete!**
       
       **Summary:**
       ✅ Auth Service (feat-auth-service.md)
       ✅ API Gateway (feat-api-gateway.md)
       ✅ User Profile Service (feat-user-profile.md)
       ✅ Product Service (feat-product-service.md)
       ✅ Order Service (feat-order-service.md)
       ✅ Billing Service (feat-billing-service.md)
       ✅ Notification Service (feat-notification-service.md)
       ✅ Admin Dashboard (feat-admin-dashboard.md)
       
       **Total time:** 6 hours 23 minutes
       **All specs validated:** Yes
       **Ready for implementation:** Yes
       
       **Next steps:**
       1. Save all 8 specs to your specs/features/ directory
       2. Optional: Run CLI validation to confirm
          npm run validate-spec specs/features/*.md
       3. Begin implementation in priority order:
          npm run implement-spec specs/features/feat-auth-service.md
       
       Great work! You now have a complete, validated specification
       set for your entire system. 🚀
```

---

## 🔧 **No CLI Tool Needed**

The CLI stub generation is **no longer necessary**. Instead:

### What We Actually Need

**1. Agent Enhancement (Priority 1)**
- `/create-features-from-system` command
- System context management
- Progress tracking
- Iterative creation workflow

**2. Optional: Progress Tracker (Priority 3)**
Simple CLI tool to show what's been created:

```bash
npm run feature-progress

# Output:
System: E-commerce Platform (sys-ecommerce.md)

Feature Specs:
✅ feat-auth-service.md (validated)
✅ feat-api-gateway.md (validated)
⏳ feat-user-profile.md (not started)
⏳ feat-product-service.md (not started)
⏳ feat-order-service.md (not started)
⏳ feat-billing-service.md (not started)
⏳ feat-notification-service.md (not started)
⏳ feat-admin-dashboard.md (not started)

Progress: 2 of 8 complete (25%)
```

---

## ✅ **Revised Implementation Plan**

### Phase 1: Agent Workflow Enhancement (4-6 hours)

**Task 1.1: Add System Context Manager**
- [ ] Update system-prompt.md with context management
- [ ] Add system spec parsing logic to agent instructions
- [ ] Define context injection rules
- [ ] Add examples of context usage

**Task 1.2: Add Iterative Creation Workflow**
- [ ] Add `/create-features-from-system` command
- [ ] Define feature creation loop
- [ ] Add progress tracking display
- [ ] Add pause/resume capability
- [ ] Add per-feature validation

**Task 1.3: Update Custom Instructions**
- [ ] Add workflow to CUSTOM_INSTRUCTIONS.md
- [ ] Add examples of iterative creation
- [ ] Add troubleshooting guide

### Phase 2: Testing (2-3 hours)

**Task 2.1: Create Test System Spec**
- [ ] Create example system with 3-4 features
- [ ] Test iterative creation workflow
- [ ] Verify quality of created specs
- [ ] Verify context injection works

**Task 2.2: User Acceptance**
- [ ] Test with real user creating multi-feature system
- [ ] Gather feedback on workflow
- [ ] Refine based on feedback

### Phase 3: Documentation (1-2 hours)

**Task 3.1: Update Guides**
- [ ] Update WORKFLOW_GUIDE.md with iterative creation
- [ ] Add examples and screenshots
- [ ] Add FAQ section

**Total Estimated Time: 7-11 hours**

---

## 💡 **Key Advantages of This Approach**

### vs. CLI Stub Generation
| Aspect | CLI Stubs | Agent Iteration |
|--------|-----------|-----------------|
| Quality | Medium (80% complete) | High (100% complete) |
| User effort | High (manual refinement × 8) | Low (answer questions) |
| Consistency | Varies | Guaranteed |
| Validation | Manual | Automatic per feature |
| Context | Static injection | Dynamic conversation |
| Time | Faster generate, slower refine | Consistent per feature |

### vs. Manual Creation
| Aspect | Manual | Agent Iteration |
|--------|--------|-----------------|
| Repetition | High (8× same process) | Automated (guided once per feature) |
| Context preservation | Must remember | Automatic |
| Cross-references | Manual | Automatic |
| System alignment | Easy to miss | Enforced |
| Quality | Varies | Consistent |
| Time | 8-12 hours | 4-6 hours |

---

## 🎯 **Summary**

**The right answer:** Keep spec creation in Claude Project with agent-driven iteration.

**Why this works:**
- ✅ Maintains high-quality interactive creation
- ✅ Systematic iteration through all features
- ✅ Full system context throughout
- ✅ Automatic validation per feature
- ✅ Progress tracking and pause/resume
- ✅ No stub refinement needed
- ✅ Complete, validated specs as output

**What we DON'T need:**
- ❌ CLI stub generator
- ❌ Manual refinement workflow
- ❌ Template complexity
- ❌ 80/20 split approach

**What we DO need:**
- ✅ Enhanced agent workflows
- ✅ System context management
- ✅ Progress tracking
- ✅ Per-feature validation

This preserves the interactive quality while systematizing the process. The agent does what it does best: have intelligent conversations. We just give it the workflow to do that systematically for multiple features.

Does this align with your vision?
