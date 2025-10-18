# Spec-MAS Open Issues & Deferred Decisions

**Document Version:** 1.0  
**As of:** October 2025  
**Status:** Design phase - Ready for tracking/scheduling

---

## Issues Deferred as "Not Worth Handling Now"

### DEFERRED-001: Local-to-Distributed Migration Path
**Category:** Architecture Decision  
**Priority:** Medium  
**Deferred Because:** Unknown at this point - pattern compatibility not yet proven  
**What This Means:**  
- Teams cannot currently graduate from Local to Distributed pattern mid-project
- Recommend: Run both patterns separately or plan for starting Distributed from scratch
- When needed: Post v1 release after patterns stabilize

**Decision Required Later:**
- How do specifications from Local pattern translate to Distributed?
- Must specs be rewritten? Migrated? Updated?
- What's the conversion process?
- How much rework is required?

**Estimated Timeline:** 3-6 months post-v1 release

---

### DEFERRED-002: Context Management & Token Accounting
**Category:** Operations/Cost Planning  
**Priority:** Low  
**Deferred Because:** Left to the underlying tools (Claude SDK, LangGraph); not relevant at early stage  
**What This Means:**
- Don't build custom token tracking - use Claude SDK's native context compaction
- Don't budget detailed cost projections - treat estimates as order-of-magnitude only
- Accept that token consumption will vary by implementation

**Decision Required Later:**
- When cost becomes a constraint (high-volume usage), develop sophisticated token accounting
- May need to implement per-team/per-agent cost allocation
- Revisit v2 if costs exceed targets by >20%

**Estimated Timeline:** Post-v1 when production usage patterns become clear

---

### DEFERRED-003: Regulated Industry Compliance
**Category:** Regulatory/Governance  
**Priority:** TBD (depends on target market)  
**Deferred Because:** Leave ambiguous - don't claim unsuitability for regulated industries, don't claim suitability  
**What This Means:**
- Design intentionally makes no claims about financial/healthcare/security compliance
- Teams in regulated industries must validate independently before use
- Audit trail via git commits is better than nothing but may not meet all compliance standards

**Decision Required Later:**
- If targeting regulated industries: Define formal audit logging
- Compliance requirements by industry (HIPAA, SOC2, PCI-DSS, etc.)
- Legal review of AI-generated code liability

**Estimated Timeline:** If/when pursuing regulated industry sales

---

### DEFERRED-004: Specification Version Control Merge Conflicts
**Category:** Team Process  
**Priority:** Medium (high when multi-team)  
**Deferred Because:** This is fundamentally a human problem, not an AI/tool problem  
**What This Means:**
- When multiple teams edit same spec, let them resolve conflicts manually
- Spec conflicts require human judgment about intent
- Process: Last committer is responsible for resolving conflicts (via rebase/redo)

**Decision Required Later:**
- Conflict resolution playbook for common scenarios
- When do you involve product owner vs. tech lead?
- Escalation path for unsolvable conflicts

**Estimated Timeline:** When multi-team Distributed pattern gets active use

---

### DEFERRED-005: Specification Complexity Limits
**Category:** Architecture/Operations  
**Priority:** High (but deferred, not urgent)  
**Deferred Because:** Need real data before setting hard limits  
**What This Means:**
- Create upper limit on specification complexity (TBD threshold)
- When spec exceeds limit, work with user to split into smaller specs
- Guidance: "Many small features are easier than fewer larger ones"

**Decision Required Later:**
- What's the complexity threshold? (line count? section count? acceptance criteria count?)
- How to measure spec complexity?
- What's the process for splitting complex specs?
- Training for teams on decomposition

**Estimated Timeline:** v1.1 after collecting user feedback

---

## Issues Requiring Early Decision

### OPEN-001: Agent-to-Agent Communication Protocol
**Category:** Critical Architecture  
**Priority:** CRITICAL (blocks Distributed pattern)  
**Current Resolution:**  
Agents communicate via git branch + well-known file locations for reports. Each agent:
1. Reads branch status and other agents' reports
2. Executes its own work
3. Writes results to known location on shared branch
4. Next agent sees results and incorporates them

**Still Needs:**
- Specific directory structure for reports (`/reports/<agent-name>/output.json`)
- Report format specification (JSON schema)
- Timing/coordination protocol (what order do agents run?)
- How does orchestrator signal "ready for next agent"?

**Decision Timeline:** BEFORE v1 release

---

### OPEN-002: State Conflict Resolution
**Category:** Critical Architecture  
**Priority:** CRITICAL (blocks Distributed pattern)  
**Current Resolution:**  
- Eventually consistent state (acceptable window: 10s of minutes to hours)
- Consistency only required before final validation
- Conflict resolution: Agent who commits second is responsible for conflict resolution (via redo)

**Still Needs:**
- Specific LangGraph state schema
- Exactly how conflicts are detected/reported
- What triggers a "redo"?
- How does agent know what to redo?
- Automatic retry logic or manual escalation?

**Decision Timeline:** BEFORE v1 release

---

### OPEN-003: Test Generation vs. Test Design Boundary
**Category:** Quality Assurance  
**Priority:** HIGH  
**Current Resolution:**  
Hybrid approach:
- Constraint tests (specified in spec, non-negotiable): written by humans
- Generated tests (from implementation): AI-generated
- Key tests: explicitly specified in acceptance criteria
- Routine tests: AI-generated for coverage

**Still Needs:**
- Definition of "routine test" vs. "constraint test"
- Who decides which tests are which?
- How to mark tests in spec (special syntax)?
- What if AI finds test gaps?

**Decision Timeline:** BEFORE v1 release

---

### OPEN-004: Different Models for Testing vs. Code Generation
**Category:** Quality Assurance  
**Priority:** HIGH  
**Current Resolution:**  
Use different LLMs for code generation vs. test generation to reduce correlated hallucinations.

**Still Needs:**
- Which models? (Claude Opus for testing, GPT-4 for generation?)
- Cost impact of multi-model approach?
- How to manage model differences in outputs?
- Fallback if one model fails?

**Decision Timeline:** BEFORE v1 release

---

### OPEN-005: Specification Suggestion Workflow
**Category:** Governance  
**Priority:** HIGH  
**Current Resolution:**  
Agents can suggest spec changes. Must be human-approved before becoming live.

**Still Needs:**
- Where do suggestions go? (branch? PR? notification?)
- Who approves? (product owner? tech lead? both?)
- Approval criteria
- SLA for approval
- What if suggestion is rejected?

**Decision Timeline:** BEFORE v1 release

---

### OPEN-006: Human-in-the-Loop Decision Logging
**Category:** Compliance/Audit  
**Priority:** MEDIUM-HIGH  
**Current Resolution:**  
Add structured decision logging capturing which human approved/rejected what work and why.

**Still Needs:**
- Log format/schema
- What metadata is required? (who, what, when, why, email, IP?)
- Where are logs stored? (git? separate logging system?)
- Retention policy
- Privacy considerations

**Decision Timeline:** v1.1 (can ship v1 without this if needed)

---

### OPEN-007: Error Recovery Escalation Heuristics
**Category:** Operations  
**Priority:** MEDIUM-HIGH  
**Current Resolution:**  
Error recovery strategy:
- First failure: agent retries
- Second failure: try with alternate LLM
- Third failure: escalate to human for review

**Still Needs:**
- Exactly what's a "failure"? (test not passing? task not completing? both?)
- Which alternate LLM to use?
- Escalation message format/routing
- Human review turnaround SLA

**Decision Timeline:** BEFORE v1 release

---

## Non-Issues (Explicitly Resolved as "Not Problems")

### RESOLVED-A: Agent autonomy constraints
Addressed by: Optional human intervention at later stages (agent outputs work, human approves later)

### RESOLVED-B: Specification format flexibility
Addressed by: Use standard LangGraph implementation; don't invent new patterns

### RESOLVED-C: Distributed state complexity
Addressed by: Eventually consistent state with simple conflict resolution (last-writer-wins with redo)

### RESOLVED-D: Test circularity (tests constrain implementation)
Addressed by: Hybrid approach (constraint + generated tests); human stays in loop

### RESOLVED-E: Correlated hallucinations in parallel execution
Addressed by: Use different models for generation vs. testing

---

## Dependencies Between Open Issues

```
OPEN-002 (State Conflict)
    ↓
OPEN-001 (Agent Communication) 
    ↓
OPEN-007 (Error Recovery)
    ↓
OPEN-003 & OPEN-004 (Testing Strategy)
    ↓
OPEN-005 & OPEN-006 (Governance & Logging)
```

**Meaning:** You can't properly define agent communication until you know how state conflicts are resolved. Can't define testing strategy until agents communicate. Etc.

**Recommendation:** Address in this order:
1. OPEN-002 (State - foundational)
2. OPEN-001 (Communication - depends on state)
3. OPEN-007 (Errors - depends on communication)
4. OPEN-003 & OPEN-004 (Testing - quality gates)
5. OPEN-005 & OPEN-006 (Governance - operational)

---

## Timeline Recommendations

### Before v1.0 Release
- OPEN-001: Agent Communication Protocol
- OPEN-002: State Conflict Resolution  
- OPEN-003: Test Generation Boundary
- OPEN-004: Multi-Model Strategy
- OPEN-007: Error Recovery Heuristics

### Before v1.5 Release (post-user-feedback)
- OPEN-005: Spec Suggestion Workflow
- DEFERRED-005: Specification Complexity Limits
- DEFERRED-004: Multi-Team Spec Conflict Process

### v2.0+ (longer-term)
- OPEN-006: Human Decision Logging (operational priority)
- DEFERRED-001: Local-to-Distributed Migration (architectural)
- DEFERRED-002: Token Accounting (when cost becomes issue)
- DEFERRED-003: Regulated Industry Compliance (if pursuing that market)

---

## Tracking Recommendations

Track these issues in:
- **GitHub Issues** for technical decisions
- **Architecture Decision Records (ADR)** when decisions are made
- **Product Roadmap** for timeline visibility
- **Risk Register** for escalation paths

Each issue should link to:
- Which design document section it relates to
- Which conflicts/gaps it addresses
- Decision criteria (what makes it "resolved"?)
- Approval path (who decides?)
