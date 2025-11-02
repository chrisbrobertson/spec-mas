# System-to-Features Generation - Quick Summary

**Goal:** Automatically/semi-automatically create all feature specs from System Architecture Spec

---

## The Approach: Two-Stage Hybrid

### Stage 1: CLI Tool (Automated)
```bash
npm run generate-features specs/architecture/system-ecommerce.md
```

**What it does:**
1. Parses System Architecture Spec
2. Extracts components from roadmap
3. Generates feature spec **stubs** (80% complete)
4. Injects system context into each stub
5. Creates cross-references between specs

**Output:** 8 feature spec files (one per component)

### Stage 2: Agent Refinement (Interactive)
User opens each stub in Claude Project:
- Agent reads stub + system spec
- Agent helps fill in remaining details
- Agent ensures consistency

---

## Example Workflow

**You have:** System Architecture Spec with 8 components

**Step 1: Generate Stubs**
```bash
cd ~/repos/Spec-MAS
npm run generate-features specs/architecture/sys-ecommerce.md

✓ Generated feat-auth-service.md (80% complete)
✓ Generated feat-api-gateway.md (80% complete)
✓ Generated feat-user-profile.md (80% complete)
... (5 more)
```

**Step 2: Refine Each Feature**
```
Open feat-auth-service.md in Claude Project

Claude: I see this is generated from the system spec. 
Let me help you complete the remaining 20%:
- Detailed validation criteria for each FR
- Specific deterministic tests
- Edge cases
- Deployment specifics

Ready to start?
```

---

## What Gets Injected Automatically

From System Spec → Into Each Feature Spec:

✅ **Metadata**
- Complexity level
- Maturity level
- Dependencies
- Related specs

✅ **Architecture Context**
- Authentication model
- Security requirements
- Performance targets
- Data strategy
- Deployment architecture

✅ **Component Details**
- Responsibility
- Technology stack
- APIs exposed
- Data ownership

✅ **Cross-References**
- Links to system spec
- Links to dependent features
- Links to consuming features

---

## What Still Needs Human/Agent Input

The 20% that requires judgment:

⚠️ **Detailed Requirements**
- Specific validation criteria per FR
- Edge cases and error scenarios
- Business rules

⚠️ **Deterministic Tests**
- Concrete test inputs
- Exact expected outputs
- Checksums/specific values

⚠️ **Implementation Details**
- Specific algorithms
- Data transformation logic
- UI component details

---

## Key Design Decisions

### Decision 1: Stub-Based vs Full Generation
**Choice:** Generate 80% complete stubs, not 100% complete specs

**Why:**
- Some details require human judgment
- Agent can help with the nuanced parts
- Prevents "garbage in, garbage out"
- Allows for creativity in implementation

### Decision 2: Hybrid CLI + Agent
**Choice:** CLI generates, Agent refines

**Why:**
- CLI ensures consistency
- CLI is fast and repeatable
- Agent adds human-level reasoning
- Best of both worlds

### Decision 3: Context Injection
**Choice:** Inject system-level context into each feature

**Why:**
- Prevents copy-paste errors
- Ensures consistency
- Makes features self-documenting
- Reduces back-and-forth

---

## Components to Build

### 1. System Spec Parser
**File:** `.spec-mas/src/system/system-spec-parser.js`
- Parse markdown sections
- Extract components, APIs, data models
- Extract roadmap order
- Extract cross-cutting concerns

### 2. Feature Spec Generator
**File:** `.spec-mas/src/system/feature-spec-generator.js`
- Load templates based on complexity
- Populate metadata
- Inject system context
- Add cross-references

### 3. CLI Tool
**File:** `.spec-mas/scripts/generate-feature-specs.js`
- Interactive mode
- Dry-run mode
- Verbose logging

### 4. Agent Integration
**Update:** `.spec-mas/agents/claude-project/system-prompt.md`
- `/generate-features` command
- Guided iteration workflow
- Context preservation

---

## Estimated Effort

| Phase | Tasks | Time |
|-------|-------|------|
| Parser + Generator | Core logic | 4-6 hours |
| CLI Tool | Interface | 2-3 hours |
| Agent Integration | Workflows | 2-3 hours |
| Testing | End-to-end | 2-3 hours |
| **Total** | | **10-15 hours** |

---

## Benefits

### For Single System → 8 Features

**Manual Approach:**
- 8 hours × 8 features = 64 hours
- High risk of inconsistency
- Easy to miss cross-references
- Copy-paste errors

**Automated Approach:**
- 1 minute to generate stubs
- 2 hours × 8 features to refine = 16 hours
- **Saves 48 hours** (75% time savings)
- Guaranteed consistency
- All cross-references included
- No copy-paste errors

---

## Next Steps - Your Decision

**Option A: Approve & Implement**
- I'll build the parser, generator, and CLI
- Create the agent integration
- Test with an example system spec
- Estimated: 10-15 hours

**Option B: Modify Approach**
- Different split between CLI vs Agent?
- Different level of automation?
- Different template structure?

**Option C: Pilot First**
- Build just the parser + generator
- Test with one example
- Refine based on output quality
- Then add CLI + Agent

**What's your preference?**

---

## Questions to Consider

1. **Automation Level:** 80/20 split good? Or want more/less?
2. **Template Complexity:** Simple stubs or detailed stubs?
3. **Agent Role:** Refinement only, or also validation?
4. **CLI vs Agent:** Prefer CLI-heavy or Agent-heavy workflow?
5. **Priority:** Do this before or after system detection?

**My Recommendation:** 
- Approve Option A
- Keep 80/20 split (proven in software generation)
- Build after system detection (logical sequence)
- Prioritize CLI tool first, agent second
