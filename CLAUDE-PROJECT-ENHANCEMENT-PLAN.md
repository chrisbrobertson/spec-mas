# Spec-MAS Claude Project Enhancement Plan
## Architecture Analysis & Validation Integration

**Date:** 2025-11-01  
**Objective:** Ensure Claude Project agent properly leverages spec splitting recommendations and validation before completion

---

## Current State Assessment

### ✅ Already Implemented (Code Level)

1. **Architecture Analyzer** (`/Users/chrisrobertson/repos/Spec-MAS/.spec-mas/src/architecture/spec-analyzer.js`)
   - Complexity scoring (requirements, entities, integrations, etc.)
   - Cohesion analysis (business domains, workflows)
   - Size metrics (lines, words, sections)
   - Split recommendations with confidence levels
   - Status: **FULLY FUNCTIONAL**

2. **CLI Tool** (`/Users/chrisrobertson/repos/Spec-MAS/.spec-mas/scripts/analyze-spec.js`)
   - Analyzes specs for splitting recommendations
   - JSON and human-readable output
   - Integration with package.json scripts
   - Status: **FULLY FUNCTIONAL**

3. **Validator** (`/Users/chrisrobertson/repos/Spec-MAS/.spec-mas/scripts/validate-spec.js`)
   - 4-gate validation system (G1-G4)
   - Structure, semantic, traceability, invariant checks
   - Maturity and complexity-aware validation
   - Status: **FULLY FUNCTIONAL**

4. **Claude Project Agent Documentation**
   - System prompt v3.1 mentions both capabilities
   - Architecture analysis guide exists
   - Validation integration guide exists
   - Status: **DOCUMENTED BUT NEEDS VERIFICATION**

### ⚠️ Gaps Identified

1. **Workflow Integration**
   - Architecture analysis may not be called at optimal times
   - Validation might not be strictly enforced before "completion"
   - No automated triggers in Claude Project workflow

2. **Agent Behavior**
   - Need to verify agent actually uses these tools properly
   - May need enhanced prompts/examples for edge cases
   - Should have specific decision trees for when to analyze/validate

3. **User Experience**
   - Need clear indicators when analysis/validation should run
   - Better feedback on why splitting is recommended
   - More guidance on fixing validation issues

---

## Implementation Plan

### Phase 1: Claude Project Agent Enhancement
**Goal:** Ensure agent properly triggers analysis and validation at the right times

#### Task 1.1: Enhanced System Prompt Directives
**File:** `/Users/chrisrobertson/repos/Spec-MAS/.spec-mas/agents/claude-project/system-prompt.md`

**Changes Needed:**
```markdown
## Enhanced Decision Trees

### Architecture Analysis Decision Tree
┌─────────────────────────────────────────────────┐
│ User provides initial description               │
└─────────────┬───────────────────────────────────┘
              ↓
         Is it > 3 sentences?
         Mentions "and"/"also" 2+ times?
         Contains 2+ major feature names?
              ↓ YES
    ┌─────────────────────┐
    │ IMMEDIATE ANALYSIS  │ → "Let me analyze the scope..."
    │ Before Level 1      │    [Call internal analysis logic]
    └─────────────────────┘    [Present recommendations]
              ↓ NO
         Start Level 1
              ↓
    At Level 2 completion:
    ┌─────────────────────┐
    │ COUNT INDICATORS:   │
    │ • FRs > 8?         │
    │ • Entities > 6?    │
    │ • Multiple domains?│
    └──────┬──────────────┘
           ↓ YES (2+ indicators)
    ┌─────────────────────┐
    │ SCOPE WARNING      │ → "I notice this is growing..."
    │ Recommend analysis │    [Offer to analyze]
    └─────────────────────┘
           ↓ NO
    Continue to Level 3

### Validation Decision Tree
┌─────────────────────────────────────────────────┐
│ At Required Maturity Level                      │
└─────────────┬───────────────────────────────────┘
              ↓
         User says "done" / "complete"?
         OR asks for /export?
              ↓ YES
    ┌─────────────────────┐
    │ MANDATORY           │ → "Let me validate before..."
    │ VALIDATION          │    [Run full validation]
    │ (blocking)          │    [Report all issues]
    └─────────────────────┘
              ↓
         All checks passed?
              ↓ YES
    ┌─────────────────────┐
    │ MARK AS COMPLETE    │ → "✅ Specification validated!"
    │ Provide next steps  │    [Show CLI commands]
    └─────────────────────┘
              ↓ NO
    ┌─────────────────────┐
    │ BLOCK COMPLETION    │ → "⚠️ Issues found..."
    │ Provide fixes       │    [Guide through fixes]
    │ Re-validate        │    [Loop until passed]
    └─────────────────────┘
```

**Action Items:**
- [x] Review existing system prompt
- [ ] Add explicit decision trees
- [ ] Add "never skip validation" policy
- [ ] Add architectural red lines (hard limits)
- [ ] Add examples of good vs bad scope detection

#### Task 1.2: Custom Instructions Enhancement
**File:** Create `/Users/chrisrobertson/repos/Spec-MAS/.spec-mas/agents/claude-project/CUSTOM_INSTRUCTIONS.md`

**Purpose:** Provide exact instructions for Claude Projects Custom Instructions field

**Content:**
```markdown
# Spec-MAS Assistant Custom Instructions

## Identity
You are a Spec-MAS specification architect helping create agent-ready specifications.

## Critical Rules (NEVER BREAK)
1. **Architecture Red Lines:**
   - NEVER allow specs with 4+ distinct business domains
   - ALWAYS recommend splitting if FRs > 15
   - ALERT if description mentions 3+ major features
   
2. **Validation Gates:**
   - NEVER mark spec "complete" without validation passing
   - ALWAYS run validation before export
   - BLOCK completion if critical validation fails

3. **Progressive Development:**
   - NEVER skip maturity levels
   - ALWAYS complete current level before next
   - VERIFY each requirement is met

## When to Analyze Architecture
- **Immediately:** If initial description is > 4 sentences OR mentions multiple features
- **At Level 2:** If FRs > 8 OR entities > 6 OR multiple domains mentioned
- **At Level 3:** As final check before proceeding
- **User requests:** /analyze command

## When to Validate
- **At transitions:** Quick check at level boundaries
- **Before completion:** Full validation MANDATORY
- **User requests:** /validate command
- **Before export:** Full validation MANDATORY (blocking)

## Output Format
Always maintain the specification in a properly formatted markdown code block that users can copy.

## Architecture Analysis Format
When recommending splits, use this format:

```
⚠️ **ARCHITECTURE ANALYSIS**

**Current Scope:**
- Covers [N] distinct concerns: [list them]
- [N] functional requirements
- [N] data entities
- [N] integrations

**Complexity Score:** [X]/20 (threshold: 10)

**Recommendation:** SPLIT into [N] specifications

**Proposed Split:**
1. **[Spec Name 1]** - Focus: [single purpose]
   - Requirements: FR-X, FR-Y, FR-Z
   - Priority: [High/Medium/Low]
   
2. **[Spec Name 2]** - Focus: [single purpose]
   - Requirements: FR-A, FR-B, FR-C
   - Priority: [High/Medium/Low]

**Benefits:**
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

**Next Step:** Which spec should we start with?
```

## Validation Report Format
When validation fails, use this format:

```
⚠️ **VALIDATION REPORT**

**Critical Issues (Must Fix):**
❌ [Issue 1 with fix instructions]
❌ [Issue 2 with fix instructions]

**Warnings (Should Fix):**
⚠️ [Warning 1]
⚠️ [Warning 2]

**Readiness Score:** [X]/100 (need 80+)

**To Proceed:**
Let me help you fix these. I'll start with [first issue].
```

When validation passes:

```
✅ **VALIDATION PASSED**

**All Checks:**
✓ YAML front-matter valid
✓ All Level [N] sections complete
✓ [N] FRs with validation criteria
✓ [N] deterministic tests
✓ Security section complete
✓ No placeholders

**Readiness Score:** [90+]/100

This specification is agent-ready! 🎉

**Next Steps:**
1. Save to: specs/features/[name].md
2. Confirm: npm run validate-spec [file]
3. Implement: npm run implement-spec [file]
```

## Response Templates Loaded From
- system-prompt.md
- architecture-analysis-guide.md
- validation-integration-guide.md
- validation-rules.md
```

**Action Items:**
- [ ] Create CUSTOM_INSTRUCTIONS.md
- [ ] Test in Claude Project
- [ ] Refine based on behavior

#### Task 1.3: Validation Rules Enhancement
**File:** `/Users/chrisrobertson/repos/Spec-MAS/.spec-mas/agents/claude-project/validation-rules.md`

**Changes Needed:**
- Add more specific examples of passing vs failing validation
- Add troubleshooting section for common issues
- Add quick reference checklist
- Add mapping from error messages to fixes

**Action Items:**
- [ ] Review existing validation-rules.md
- [ ] Add examples for each validation gate
- [ ] Add "fix patterns" for common issues
- [ ] Add visual checklist

### Phase 2: Implementation Script Enhancement
**Goal:** Ensure validation is called at the right point in implementation workflow

#### Task 2.1: Pre-Implementation Validation Enhancement
**File:** `/Users/chrisrobertson/repos/Spec-MAS/.spec-mas/scripts/implement-spec.js`

**Current State:**
- Validation called in `validatePrerequisites()` 
- Uses `isAgentReady()` to check
- Blocks implementation if validation fails
- **Status:** ✅ ALREADY CORRECT

**Verification Needed:**
- [ ] Test that validation actually blocks implementation
- [ ] Verify error messages are clear
- [ ] Check that suggested fixes are helpful

#### Task 2.2: Post-Implementation Validation (New)
**File:** `/Users/chrisrobertson/repos/Spec-MAS/.spec-mas/scripts/implement-spec.js`

**Enhancement:** Add validation check after implementation completes

**Proposed Change:**
```javascript
// In runPostProcessing function, after generating report:

console.log('\n' + colors.bright + 'Validating implementation against spec...' + colors.reset);

try {
  const { validateSpec } = require('./validate-spec');
  const implValidation = validateImplementation(spec, generatedFiles);
  
  if (!implValidation.passed) {
    console.log(colors.yellow + '⚠ Implementation validation warnings:' + colors.reset);
    implValidation.warnings.forEach(w => {
      console.log(colors.yellow + `  - ${w}` + colors.reset);
    });
  } else {
    console.log(colors.green + '✓ Implementation validated against spec' + colors.reset);
  }
} catch (error) {
  console.log(colors.dim + '  Could not validate implementation' + colors.reset);
}
```

**Action Items:**
- [ ] Add post-implementation validation
- [ ] Create `validateImplementation()` function
- [ ] Check that generated files match spec requirements
- [ ] Verify all FRs have corresponding code

### Phase 3: Integration & Testing
**Goal:** Verify everything works end-to-end

#### Task 3.1: Create Test Scenarios
**File:** Create `/Users/chrisrobertson/repos/Spec-MAS/tests/claude-project-integration.md`

**Test Cases:**

**Scenario 1: Early Scope Detection**
```
INPUT: "I want to build a system that handles user auth, billing, and notifications"
EXPECTED: Agent immediately detects 3 domains and recommends splitting
VERIFY: Agent does NOT proceed to Level 1 without addressing scope
```

**Scenario 2: Progressive Scope Warning**
```
INPUT: Start with simple spec, then keep adding requirements
EXPECTED: Agent warns at ~10 FRs and suggests analysis
VERIFY: Agent offers to analyze and shows recommendations
```

**Scenario 3: Validation Blocking**
```
INPUT: User says "done" but spec missing validation criteria
EXPECTED: Agent runs validation, finds issues, blocks completion
VERIFY: Agent provides specific fixes and won't proceed until fixed
```

**Scenario 4: Validation Passing**
```
INPUT: Complete, well-formed spec at required maturity
EXPECTED: Agent validates, reports success, provides next steps
VERIFY: Agent clearly marks as "agent-ready"
```

**Action Items:**
- [ ] Create test scenarios document
- [ ] Test each scenario in Claude Project
- [ ] Document any issues found
- [ ] Create regression test suite

#### Task 3.2: User Acceptance Testing
**Goal:** Ensure actual usage matches expectations

**Test Users:**
- Developer creating EASY spec
- Team lead creating MODERATE spec
- Architect creating HIGH spec

**Test Flow:**
1. Create spec from scratch
2. Document where agent triggers analysis
3. Document where agent validates
4. Note any confusing behavior
5. Verify CLI tools match agent behavior

**Action Items:**
- [ ] Recruit 3 test users
- [ ] Run UAT sessions
- [ ] Collect feedback
- [ ] Refine based on feedback

### Phase 4: Documentation & Training
**Goal:** Ensure users know how to use the enhanced features

#### Task 4.1: Update README
**File:** `/Users/chrisrobertson/repos/Spec-MAS/.spec-mas/agents/claude-project/README.md`

**Additions:**
- Section on architecture analysis workflow
- Section on validation workflow
- Examples of both features in action
- Troubleshooting guide
- FAQs

**Action Items:**
- [ ] Update README with new sections
- [ ] Add workflow diagrams
- [ ] Add example transcripts
- [ ] Add troubleshooting

#### Task 4.2: Create Quick Start Guide
**File:** Create `/Users/chrisrobertson/repos/Spec-MAS/.spec-mas/agents/claude-project/QUICK_START.md`

**Content:**
```markdown
# Quick Start: Spec-MAS Claude Project Agent

## Setup (One-Time)
1. Create new Claude Project
2. Copy contents from `CUSTOM_INSTRUCTIONS.md` to Project Instructions
3. Add these knowledge files:
   - system-prompt.md
   - architecture-analysis-guide.md
   - validation-integration-guide.md
   - validation-rules.md

## Usage

### Creating a Spec
1. **Start:** "I want to build [feature description]"
2. **Watch for:** Agent may immediately suggest splitting if scope is large
3. **Proceed:** Follow agent through maturity levels
4. **Monitor:** Agent will warn if scope grows too large
5. **Complete:** Agent will validate before marking complete

### Key Behaviors
- 🔍 **Auto Analysis:** Agent analyzes scope when detecting growth
- ⚠️ **Scope Warnings:** Agent alerts when approaching complexity limits
- ✅ **Mandatory Validation:** Agent blocks completion if validation fails
- 📋 **Clear Fixes:** Agent provides specific remediation steps

### Commands
- `/analyze` - Run architecture analysis
- `/validate` - Run validation check
- `/split` - Get splitting guidance
- `/help` - Show all commands

### Tips
✅ **DO:**
- Describe single features/capabilities
- Provide specific details when asked
- Fix validation issues as they arise

❌ **DON'T:**
- Describe multiple features in one spec
- Skip validation to "finish faster"
- Use placeholder text

## Examples
See: EXAMPLE_PROJECTS.md
```

**Action Items:**
- [ ] Create QUICK_START.md
- [ ] Test with new users
- [ ] Refine based on feedback

---

## Success Criteria

### Phase 1 Success (Agent Enhancement)
- [ ] System prompt has explicit decision trees
- [ ] Custom instructions created and tested
- [ ] Agent correctly detects scope issues 90%+ of time
- [ ] Agent blocks completion without validation 100% of time

### Phase 2 Success (Implementation Scripts)
- [ ] Validation blocks implementation if spec fails
- [ ] Clear error messages with actionable fixes
- [ ] Post-implementation validation warns of gaps

### Phase 3 Success (Integration)
- [ ] All test scenarios pass
- [ ] 3+ users successfully create specs
- [ ] No confusion about when to analyze/validate
- [ ] CLI tools align with agent behavior

### Phase 4 Success (Documentation)
- [ ] Complete documentation exists
- [ ] Quick start guide tested
- [ ] New users can succeed in < 30 minutes
- [ ] FAQs address common issues

---

## Timeline Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Agent Enhancement | 3 tasks | 2-3 hours |
| Phase 2: Script Enhancement | 2 tasks | 1-2 hours |
| Phase 3: Integration & Testing | 2 tasks | 2-3 hours |
| Phase 4: Documentation | 2 tasks | 1-2 hours |
| **Total** | **9 tasks** | **6-10 hours** |

---

## Implementation Order

**Priority 1 (Must Have):**
1. Task 1.1: Enhanced decision trees in system prompt
2. Task 1.2: Create custom instructions
3. Task 3.1: Create and run test scenarios
4. Task 4.2: Create quick start guide

**Priority 2 (Should Have):**
5. Task 1.3: Enhanced validation rules
6. Task 2.2: Post-implementation validation
7. Task 3.2: User acceptance testing

**Priority 3 (Nice to Have):**
8. Task 4.1: Update README
9. Additional examples and templates

---

## Risk Mitigation

### Risk: Agent doesn't follow prompts consistently
**Mitigation:** 
- Use very explicit decision trees
- Add examples for each decision point
- Test extensively with edge cases
- Iterate based on observed behavior

### Risk: Validation too strict, users frustrated
**Mitigation:**
- Provide very clear error messages
- Show examples of correct format
- Offer to fix issues automatically when possible
- Allow warnings (non-blocking) for minor issues

### Risk: Architecture analysis triggers too often
**Mitigation:**
- Set clear thresholds
- Only warn when multiple indicators present
- Make recommendations, don't force splits
- Show clear benefits of splitting

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Get approval** to proceed
3. **Start with Priority 1 tasks**
4. **Test after each phase**
5. **Iterate based on feedback**

---

## Notes

- The underlying functionality (analyzer and validator) already exists and works well
- Main effort is ensuring Claude Project agent uses these tools correctly
- Focus on clear, explicit instructions and decision trees
- Test thoroughly with real usage patterns

## Questions for Review

1. Is the phased approach appropriate?
2. Are the success criteria clear and measurable?
3. Should we add any additional test scenarios?
4. Is the timeline realistic?
5. Are there any missing risks?
