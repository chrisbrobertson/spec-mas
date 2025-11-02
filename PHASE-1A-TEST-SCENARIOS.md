# Phase 1A Test Scenarios: System Detection

**Date:** 2025-11-01  
**Version:** 1.0  
**Purpose:** Test system vs feature detection in Claude Project

---

## Test Scenario 1: Clear System Detection

**Input:**
```
User: I want to build a system that handles user authentication, billing and payments, and notifications.
```

**Expected Behavior:**
1. Agent detects SYSTEM (3 major domains: auth, billing, notifications)
2. Agent responds with 🏗️ **SYSTEM DETECTED** message
3. Agent lists the 3 major components identified
4. Agent recommends System Architecture Spec first
5. Agent provides time comparison and benefits
6. Agent offers choice: Create system arch / Skip / Learn more
7. Agent does NOT proceed to feature spec creation

**Validation Checklist:**
- [ ] Agent says "SYSTEM DETECTED" or equivalent
- [ ] Agent identifies all 3 components
- [ ] Agent recommends system architecture first
- [ ] Agent explains WHY (benefits listed)
- [ ] Agent provides clear workflow (System Spec → Feature Specs)
- [ ] Agent does NOT start Level 1 of feature spec
- [ ] Agent waits for user decision

---

## Test Scenario 2: Clear Feature Detection

**Input:**
```
User: I want to add user authentication with OAuth, MFA, and password reset functionality.
```

**Expected Behavior:**
1. Agent detects FEATURE (single domain: authentication)
2. Agent responds with ✓ **SINGLE FEATURE DETECTED** message
3. Agent assesses complexity (probably MODERATE or HIGH)
4. Agent states required maturity level
5. Agent proceeds to Level 1 questions

**Validation Checklist:**
- [ ] Agent says "SINGLE FEATURE" or "Good scope" 
- [ ] Agent does NOT trigger system detection
- [ ] Agent assesses complexity correctly
- [ ] Agent starts Level 1 normally
- [ ] No mention of system architecture

---

## Test Scenario 3: Borderline Case (2 Domains)

**Input:**
```
User: I need to build user authentication and authorization with role management.
```

**Expected Behavior:**
1. Agent recognizes 2 related domains (auth and authz)
2. Agent asks clarifying question
3. Agent presents options:
   - Tightly integrated (one feature)
   - Separate features
   - Part of larger system
4. Agent waits for user response before proceeding

**Validation Checklist:**
- [ ] Agent acknowledges 2 domains detected
- [ ] Agent asks clarifying question
- [ ] Agent provides 2-3 options
- [ ] Agent does NOT make assumption
- [ ] Agent waits for user guidance

---

## Test Scenario 4: System with Keywords

**Input:**
```
User: I want to build a platform with API gateway, authentication service, and product catalog.
```

**Expected Behavior:**
1. Agent detects SYSTEM (keyword "platform" + 3 components)
2. Agent responds with system detection message
3. Agent recommends system architecture
4. Lists 3 components identified

**Validation Checklist:**
- [ ] System detection triggered
- [ ] "platform" keyword recognized
- [ ] All 3 components listed
- [ ] System architecture recommended

---

## Test Scenario 5: User Insists on Feature Despite System

**Input:**
```
User: I want to build a system that handles user auth, billing, and notifications.
Agent: [Shows system detection message]
User: No, just create it as one feature spec.
```

**Expected Behavior:**
1. Agent provides warning about risks
2. Agent lists potential issues:
   - Spec too large
   - Architectural issues late
   - Higher rework costs
3. Agent confirms user wants to proceed
4. Agent proceeds but maintains concern

**Validation Checklist:**
- [ ] Agent shows ⚠️ warning
- [ ] Agent lists specific risks
- [ ] Agent confirms user choice
- [ ] Agent proceeds if confirmed
- [ ] Warning is clear but not preachy

---

## Test Scenario 6: E-commerce System

**Input:**
```
User: Create a full e-commerce application with product catalog, shopping cart, checkout, payment processing, order management, and inventory tracking.
```

**Expected Behavior:**
1. Agent detects SYSTEM (6 major domains!)
2. Strong system detection message
3. Lists all 6 components
4. Emphasizes need for system architecture
5. Warns about complexity

**Validation Checklist:**
- [ ] System detection triggered
- [ ] All 6 domains identified
- [ ] Complexity acknowledged
- [ ] System architecture strongly recommended
- [ ] Clear component breakdown provided

---

## Test Scenario 7: Microservices Architecture

**Input:**
```
User: We need a microservices architecture with authentication service, API gateway, user service, product service, and order service.
```

**Expected Behavior:**
1. Agent detects SYSTEM (keyword "microservices" + 5 services)
2. Lists all 5 services as components
3. Recommends system architecture
4. Notes microservices complexity

**Validation Checklist:**
- [ ] "microservices" keyword recognized
- [ ] All 5 services identified
- [ ] System architecture recommended
- [ ] Appropriate for microservices context

---

## Test Scenario 8: Simple CRUD Feature

**Input:**
```
User: Add a form to create and edit blog posts with title, content, and tags.
```

**Expected Behavior:**
1. Agent detects FEATURE (single domain: blog post management)
2. Assesses complexity as EASY
3. Sets maturity to Level 3
4. Proceeds to Level 1

**Validation Checklist:**
- [ ] Feature detection (not system)
- [ ] Complexity = EASY
- [ ] Maturity = Level 3
- [ ] Proceeds normally
- [ ] No system architecture mention

---

## Test Scenario 9: Integration Feature (Not System)

**Input:**
```
User: Integrate with Stripe to process payments including one-time and subscription charges.
```

**Expected Behavior:**
1. Agent detects FEATURE (single domain: payment integration)
2. Assesses complexity as MODERATE or HIGH
3. Sets appropriate maturity level
4. Proceeds to Level 1

**Validation Checklist:**
- [ ] Feature detection (integration is ONE feature)
- [ ] Complexity appropriately assessed
- [ ] No system detection triggered
- [ ] Proceeds to spec creation

---

## Test Scenario 10: Vague Description

**Input:**
```
User: I want to build something for managing users.
```

**Expected Behavior:**
1. Agent asks for clarification
2. Agent probes for scope:
   - Just user CRUD?
   - Or auth + permissions + profile + ...?
3. Agent waits for more details before detection

**Validation Checklist:**
- [ ] Agent asks clarifying questions
- [ ] Agent does NOT assume system or feature
- [ ] Agent probes for scope indicators
- [ ] Detection deferred until clarity

---

## Testing Protocol

### How to Test

**Setup:**
1. Open Claude Project with updated system-prompt.md
2. Start fresh conversation
3. Use test inputs verbatim

**For Each Test:**
1. Input the user message
2. Check validation checklist
3. Note any deviations
4. Score: Pass / Partial / Fail

**Scoring:**
- **Pass**: All checklist items met
- **Partial**: 75%+ checklist items met
- **Fail**: <75% checklist items met

### Success Criteria for Phase 1A

**Minimum Requirements:**
- 8/10 tests pass completely
- 2/10 tests partial (no fails)
- All critical scenarios pass (1, 2, 6, 7)

**Ideal:**
- 10/10 tests pass completely
- Consistent messaging
- Appropriate tone

---

## Results Template

### Test Run: [Date]

| Scenario | Pass/Partial/Fail | Notes |
|----------|-------------------|-------|
| 1. Clear System | | |
| 2. Clear Feature | | |
| 3. Borderline (2 domains) | | |
| 4. System with Keywords | | |
| 5. User Insists | | |
| 6. E-commerce | | |
| 7. Microservices | | |
| 8. Simple CRUD | | |
| 9. Integration | | |
| 10. Vague Description | | |

**Overall Score:** X/10 Pass, Y/10 Partial, Z/10 Fail

**Phase 1A Status:** [PASS / NEEDS WORK]

**Issues Found:**
1. [Issue description]
2. [Issue description]

**Recommended Fixes:**
1. [Fix description]
2. [Fix description]

---

## Next Steps After Testing

**If Pass (8+ pass, 0 fail):**
- ✅ Phase 1A complete
- Move to Phase 1B documentation
- Consider Phase 1B: Feature Iteration

**If Partial (6-7 pass):**
- Review failed scenarios
- Adjust system prompt
- Re-test failed scenarios
- Iterate until pass

**If Fail (<6 pass):**
- Major review of detection logic
- Simplify or clarify criteria
- Re-test all scenarios
- May need design changes
