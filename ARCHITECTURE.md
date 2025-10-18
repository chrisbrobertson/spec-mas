# Spec-MAS v3 Architecture

**Version:** 3.0  
**Status:** Definition Complete, Implementation Pending  
**Last Updated:** 2025-10-18

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architectural Principles](#2-architectural-principles)
3. [System Architecture](#3-system-architecture)
4. [Component Details](#4-component-details)
5. [Data Architecture](#5-data-architecture)
6. [Orchestration Architecture](#6-orchestration-architecture)
7. [Validation Framework](#7-validation-framework)
8. [Security Architecture](#8-security-architecture)
9. [Deployment Models](#9-deployment-models)
10. [Integration Architecture](#10-integration-architecture)
11. [Quality Attributes](#11-quality-attributes)
12. [Decision Log](#12-decision-log)

---

## 1. System Overview

### 1.1 Mission Statement

Spec-MAS (Specification-Guided Multi-Agent System) is a development framework that enables teams to build high-quality software through specification-driven development coordinated by specialized AI agents with continuous validation.

### 1.2 Core Principle

**The specification is the source of truth. Specialized AI agents are the workforce. Continuous validation ensures quality.**

### 1.3 Design Philosophy

```
Specifications define WHAT → Agents determine HOW → Tests validate THAT
```

### 1.4 Key Goals

1. **Reduce Cognitive Load** - Developers focus on design decisions, agents handle implementation
2. **Ensure Consistency** - Living specifications maintain architectural coherence
3. **Scale Gracefully** - Support solo developers to enterprise teams (1-1000+ engineers)
4. **Maintain Quality** - Continuous validation prevents regressions
5. **Enable Traceability** - Every implementation decision traceable to specification

### 1.5 Non-Goals

- **Not a CI/CD tool** - Integrates with pipelines but doesn't replace them
- **Not a runtime** - Doesn't execute production code, only development agents
- **Not LLM-specific** - Framework-agnostic, works with any LLM
- **Not compliance-certified** - Teams must validate for their regulatory requirements

---

## 2. Architectural Principles

### 2.1 Core Principles

#### P1: Specifications as Single Source of Truth
- All development flows from approved specifications
- Version-controlled in Git
- Human-approved changes only
- Immutable once approved for a version

#### P2: Progressive Disclosure
- Specifications build incrementally (Levels 1→5)
- Cannot skip maturity levels
- Each level adds specific required information
- Quality over speed at every stage

#### P3: Human-in-the-Loop Governance
- Agents suggest, humans approve
- Critical decisions require human review
- Automated validation gates enforce quality
- Audit trail for all decisions

#### P4: Multi-Model Resilience
- Different LLMs for different tasks
- Reduces correlated hallucinations
- No vendor lock-in
- Graceful degradation

#### P5: Eventually Consistent State
- Accept temporary inconsistencies during development
- Enforce consistency at validation gates
- Simple conflict resolution: last writer redoes work
- Git provides synchronization mechanism

#### P6: Separation of Concerns
- MCP: Tool access only
- LangGraph: Orchestration only
- Claude SDK/Cursor: Individual agent execution
- Git: Version control and communication
- Tests: Validation

### 2.2 Design Constraints

1. **Markdown-First** - All specifications in Markdown format (v3 standard)
2. **Git-Based** - Version control is fundamental, not optional
3. **Test-Driven** - Tests generated before implementation
4. **Observable** - All agent actions must be traceable
5. **Recoverable** - Every operation can be rolled back

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     HUMAN DEVELOPERS                             │
│  (Product Owners, Architects, Engineers, QA, Reviewers)         │
└───────────┬─────────────────────────────────────────────────────┘
            │
            │ Write/Approve Specs
            │ Review AI Work
            │ Make Decisions
            ↓
┌─────────────────────────────────────────────────────────────────┐
│                 LAYER 1: SPECIFICATION                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Markdown Specifications (Git Repository)                 │  │
│  │  - Feature Specs                                          │  │
│  │  - Architecture Specs                                     │  │
│  │  - Acceptance Criteria                                    │  │
│  │  - Front-matter Metadata                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────┬─────────────────────────────────────────────────────┘
            │
            │ Spec Changes
            │ Validation Requests
            ↓
┌─────────────────────────────────────────────────────────────────┐
│              LAYER 2: ORCHESTRATION (LangGraph)                  │
│                   [Distributed Pattern Only]                     │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Requirements │  │ Architecture │  │   Planning   │         │
│  │    Agent     │  │    Agent     │  │    Agent     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                 │
│                            │                                     │
│                  ┌─────────▼─────────┐                          │
│                  │   Orchestrator    │                          │
│                  │  (State Manager)  │                          │
│                  └─────────┬─────────┘                          │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                │
│         │                  │                  │                 │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐        │
│  │  Dev Agent 1 │  │  Dev Agent 2 │  │  Dev Agent 3 │        │
│  │  (Backend)   │  │  (Frontend)  │  │(Integration) │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            │                                     │
│                  ┌─────────▼─────────┐                          │
│                  │     QA Agent      │                          │
│                  │   (Validation)    │                          │
│                  └───────────────────┘                          │
└───────────┬─────────────────────────────────────────────────────┘
            │
            │ Execute Work
            │ Access Tools
            ↓
┌─────────────────────────────────────────────────────────────────┐
│           LAYER 3: AGENT EXECUTION                               │
│         (Claude Agent SDK / Cursor)                              │
│                                                                   │
│  Individual Agent Runtime:                                       │
│  ┌────────────────────────────────────────────────────┐         │
│  │ 1. Gather Context (read spec, codebase)           │         │
│  │ 2. Take Action (generate/modify code)             │         │
│  │ 3. Verify Work (run tests, checks)                │         │
│  │ 4. Repeat or Complete                             │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                   │
│  Features:                                                        │
│  - File operations                                               │
│  - Bash execution                                                │
│  - Context management                                            │
│  - Permission system                                             │
└───────────┬─────────────────────────────────────────────────────┘
            │
            │ Tool Requests
            │ Data Access
            ↓
┌─────────────────────────────────────────────────────────────────┐
│              LAYER 4: TOOL ACCESS (MCP)                          │
│           Model Context Protocol Servers                         │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   File   │  │    Git   │  │ Database │  │   Test   │       │
│  │  System  │  │          │  │          │  │ Framework│       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   API    │  │   Docs   │  │  CI/CD   │  │  Custom  │       │
│  │  Access  │  │  Search  │  │  System  │  │  Tools   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└───────────┬─────────────────────────────────────────────────────┘
            │
            │ Validation Requests
            │ Test Execution
            ↓
┌─────────────────────────────────────────────────────────────────┐
│            LAYER 5: VALIDATION & TESTING                         │
│                                                                   │
│  ┌────────────────────────────────────────────┐                 │
│  │         VALIDATION GATES (G1-G4)           │                 │
│  │  ┌─────────────┐  ┌─────────────┐         │                 │
│  │  │ G1: Struct  │  │ G2: Semantic│         │                 │
│  │  └─────────────┘  └─────────────┘         │                 │
│  │  ┌─────────────┐  ┌─────────────┐         │                 │
│  │  │G3:Traceability│ │G4:Invariants│         │                 │
│  │  └─────────────┘  └─────────────┘         │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                   │
│  ┌────────────────────────────────────────────┐                 │
│  │      ADVERSARIAL REVIEW SYSTEM             │                 │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │                 │
│  │  │ Security │ │Ambiguity │ │Compliance│  │                 │
│  │  │Adversary │ │Adversary │ │Adversary │  │                 │
│  │  └──────────┘ └──────────┘ └──────────┘  │                 │
│  │  ┌──────────┐ ┌──────────┐               │                 │
│  │  │   Data   │ │  Impl.   │               │                 │
│  │  │Adversary │ │Adversary │               │                 │
│  │  └──────────┘ └──────────┘               │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                   │
│  ┌────────────────────────────────────────────┐                 │
│  │         TEST EXECUTION                     │                 │
│  │  - Constraint Tests (from spec)            │                 │
│  │  - Generated Tests (AI-created)            │                 │
│  │  - Deterministic Tests (checksums)         │                 │
│  └────────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Two Implementation Patterns

#### 3.2.1 Local Pattern

**Target Users:** 1-5 developers, <100k LOC, solo/small teams

**Simplified Stack:**
```
Developer
    ↓
Specification (Markdown)
    ↓
Claude Agent SDK
    ↓
Test Framework
    ↓
Implementation
```

**Characteristics:**
- Sequential execution (one agent at a time)
- No orchestration layer needed
- Direct CLI/IDE interaction
- Setup time: 2-3 weeks

#### 3.2.2 Distributed Pattern

**Target Users:** 5+ developers, >100k LOC, enterprise teams

**Full Stack:**
```
Multiple Developers
    ↓
Shared Specifications (Git)
    ↓
LangGraph Orchestration
    ↓
Multiple Parallel Agents
    ↓
MCP Tool Integration
    ↓
Distributed Implementation
```

**Characteristics:**
- Parallel execution (multiple agents simultaneously)
- Full orchestration required
- Centralized coordination
- Setup time: 2-3 months

---

## 4. Component Details

### 4.1 Specification Layer

#### 4.1.1 Purpose
- Define WHAT to build in human and machine-readable format
- Serve as source of truth for all development
- Enable traceability and audit

#### 4.1.2 Specification Format (v3)

**Front Matter (YAML):**
```yaml
---
specmas: v3
kind: FeatureSpec | SecurityCriticalSpec
id: <unique-id>
name: <human-readable name>
version: <semver>
owners:
  - name: <n>
    email: <email>
complexity: EASY | MODERATE | HIGH
maturity: 1 | 2 | 3 | 4 | 5
tags: [<tag1>, <tag2>]
---
```

**Required Sections:**
1. **Overview** - Problem statement, scope, success metrics
2. **Functional Requirements** - FR-1, FR-2, etc. with validation criteria
3. **Non-Functional Requirements** - Performance, reliability, scalability
4. **Security** - AuthN/Z, data handling, encryption, audit
5. **Data Model** - Entities and relationships
6. **Interfaces & Contracts** - APIs, events, schemas
7. **Deterministic Tests** - JSON with checksums for critical paths
8. **Acceptance Tests** - AT-1, AT-2, etc.
9. **Glossary & Definitions** - Domain terms, disambiguation
10. **Risks & Open Questions** - R-1, Q-1, etc.

#### 4.1.3 Maturity Model

| Level | Name | Requirements | Min for Complexity |
|-------|------|--------------|-------------------|
| 1 | Foundation | User stories, acceptance criteria | None (draft) |
| 2 | Technical | Constraints, integrations, data models | None (draft) |
| 3 | Robust | Error handling, performance, security | EASY |
| 4 | Governed | Architecture, compliance, observability | MODERATE |
| 5 | Complete | Examples, edge cases, migration | HIGH |

#### 4.1.4 Complexity Assessment

**EASY:** CRUD operations, basic UI, simple business logic
- Keywords: form, list, display, validation, style
- Required Maturity: Level 3

**MODERATE:** Integrations, workflows, calculations
- Keywords: integration, API, process, transform, report
- Required Maturity: Level 4

**HIGH:** Architecture, security, performance, compliance
- Keywords: security, real-time, distributed, authentication
- Required Maturity: Level 5

### 4.2 Orchestration Layer (LangGraph)

#### 4.2.1 Purpose
- Coordinate multiple specialized agents
- Manage shared state
- Implement conditional workflows
- Enable parallel execution

#### 4.2.2 State Management

**State Schema:**
```python
class SpecMASState(TypedDict):
    # Specification Context
    specification: str              # Current spec content
    spec_sha: str                   # Git SHA of spec
    spec_version: str               # Semantic version
    
    # Planning
    plan: Dict[str, Any]           # Decomposed tasks
    tasks: List[Task]              # Task queue
    dependencies: Dict[str, List[str]]  # Task dependencies
    
    # Execution
    implementations: List[Implementation]  # Agent outputs
    reports: Dict[str, Report]     # Agent reports
    
    # Validation
    test_results: TestResults      # Test execution results
    validation_status: ValidationStatus  # Gate results
    findings: List[Finding]        # Adversarial findings
    
    # Governance
    approval_status: str           # pending|approved|rejected
    approver: Optional[str]        # Who approved
    approval_timestamp: Optional[str]
    
    # State Management
    version: int                   # State version
    timestamp: str                 # Last update time
    locked_by: Optional[str]       # Which agent has lock
```

**State Consistency:**
- Eventually consistent (acceptable window: minutes to hours)
- Strict consistency enforced at validation gates
- Conflict resolution: last writer redoes work

#### 4.2.3 Workflow Patterns

**Feature Development Workflow:**
```python
workflow = StateGraph(SpecMASState)

# Planning Phase
workflow.add_node("parse_spec", parse_specification)
workflow.add_node("requirements_analysis", analyze_requirements)
workflow.add_node("architecture_validation", validate_architecture)
workflow.add_node("plan_decomposition", decompose_work)

# Development Phase (Parallel)
workflow.add_node("dev_backend", develop_backend)
workflow.add_node("dev_frontend", develop_frontend)
workflow.add_node("dev_integration", develop_integration)

# Validation Phase
workflow.add_node("run_tests", execute_tests)
workflow.add_node("qa_validation", qa_review)
workflow.add_node("security_audit", security_scan)

# Conditional Routing
workflow.add_conditional_edges(
    "run_tests",
    route_on_test_results,
    {
        "pass": "qa_validation",
        "fail": "dev_backend",  # Route back to fix
        "retry": "run_tests"    # Retry with different approach
    }
)

# Parallel Execution
workflow.add_edge("plan_decomposition", Send("dev_backend", task1))
workflow.add_edge("plan_decomposition", Send("dev_frontend", task2))
workflow.add_edge("plan_decomposition", Send("dev_integration", task3))
```

#### 4.2.4 Node I/O Contract

**Input:**
```json
{
  "spec_markdown": "string",
  "repo_ref": "git_sha_or_branch",
  "run_id": "uuid",
  "requested_gates": ["G1", "G2", "G3", "G4"],
  "complexity": "EASY|MODERATE|HIGH"
}
```

**Output:**
```json
{
  "spec_sha": "git_sha",
  "findings": [
    {
      "severity": "INFO|WARN|ERROR|CRITICAL",
      "category": "security|quality|compliance",
      "code": "finding_code",
      "message": "description",
      "location": "file:line"
    }
  ],
  "invariants": ["list of checked invariants"],
  "coverage": {
    "requirements": "95%",
    "acceptance_tests": "100%"
  },
  "pass_fail": "pass|fail",
  "artifacts": {
    "json_report": "path/to/report.json",
    "sarif_report": "path/to/report.sarif"
  }
}
```

### 4.3 Agent Execution Layer

#### 4.3.1 Agent Types

**Planning Agents:**
- Requirements Analyzer
- Architecture Validator
- Risk Assessor
- Work Decomposer

**Development Agents:**
- Backend Developer (multiple instances)
- Frontend Developer (multiple instances)
- Integration Developer
- Test Generator

**Quality Agents:**
- QA Reviewer
- Security Auditor
- Performance Tester
- Code Reviewer

#### 4.3.2 Agent Execution Loop

```
LOOP until task complete or max_iterations:
    1. GATHER CONTEXT
       - Read specification
       - Search codebase for patterns
       - Load project conventions (CLAUDE.md)
       - Review previous agent reports
    
    2. TAKE ACTION
       - Generate or modify code
       - Run commands (bash, npm, etc.)
       - Use tools via MCP
       - Write progress report
    
    3. VERIFY WORK
       - Run tests automatically
       - Check against acceptance criteria
       - Lint and type check
       - Compare against invariants
    
    4. DECIDE NEXT STEP
       - If tests pass → complete
       - If tests fail → analyze and retry
       - If stuck → escalate to human
       - If max iterations → escalate
```

#### 4.3.3 Agent Communication

**Git-Based Reports:**
```
feature/[feature-name]/
├── reports/
│   ├── requirements-agent/
│   │   ├── analysis.json       # Gaps, conflicts, questions
│   │   └── validation.json     # Spec readiness
│   ├── architecture-agent/
│   │   ├── design.json         # Proposed architecture
│   │   └── validation.json     # Compliance checks
│   ├── dev-agent-1/
│   │   ├── implementation.md   # What was built
│   │   └── status.json         # Tests passing, coverage
│   └── qa-agent/
│       ├── test-plan.md        # Test strategy
│       └── results.json        # Pass/fail, coverage %
```

**Report Schema:**
```json
{
  "agent": "agent-name",
  "phase": "analysis|development|validation",
  "timestamp": "ISO8601",
  "status": "complete|blocked|failed",
  "findings": [
    {
      "type": "gap|conflict|question|risk",
      "severity": "low|medium|high|critical",
      "description": "detailed description"
    }
  ],
  "recommendations": ["actionable suggestions"],
  "dependencies": ["what this agent needs from others"],
  "ready_for_next_phase": true
}
```

### 4.4 Tool Access Layer (MCP)

#### 4.4.1 Purpose
- Standardize how agents access tools and data
- Provide reusable tool definitions
- Enable secure, controlled access

#### 4.4.2 Essential MCP Servers

**File System Server:**
```json
{
  "command": "npx",
  "args": ["@modelcontextprotocol/server-filesystem"],
  "env": {
    "ALLOWED_PATHS": "/workspace,/specs"
  }
}
```

**Git Server:**
```json
{
  "command": "mcp-git-server",
  "args": ["--repo-path", "/workspace"]
}
```

**Database Server:**
```json
{
  "command": "npx",
  "args": ["@modelcontextprotocol/server-postgres"],
  "env": {
    "POSTGRES_CONNECTION_STRING": "postgresql://..."
  }
}
```

**Testing Framework Server:**
```json
{
  "command": "mcp-test-server",
  "args": ["--framework", "jest", "--config", "jest.config.js"]
}
```

#### 4.4.3 MCP vs Orchestration

**MCP Provides:**
- ✅ Tool access protocol
- ✅ Standardized interfaces
- ✅ Security boundaries
- ✅ Tool discovery

**MCP Does NOT Provide:**
- ❌ Agent coordination
- ❌ State management
- ❌ Workflow orchestration
- ❌ Inter-agent communication

**Orchestration is handled by LangGraph**

### 4.5 Validation Layer

#### 4.5.1 Four Validation Gates

**G1: Structure Validation**
- Front-matter present and well-formed
- Required sections exist
- Metadata fields valid
- Markdown syntax correct

**G2: Semantic Validation**
- Each FR has validation criteria
- Security section complete
- Glossary resolves ambiguous terms
- Acceptance criteria measurable

**G3: Traceability & Coverage**
- FR ↔ Test mapping (every FR has ≥1 test)
- Non-functional claims have metrics
- Integration points documented
- Dependencies identified

**G4: Determinism & Invariants**
- Deterministic tests produce stable checksums
- Invariants enforced (security, quality)
- Edge cases covered
- Migration strategy defined (if breaking)

#### 4.5.2 Gate Requirements by Complexity

| Complexity | Required Gates | Before Action |
|------------|----------------|---------------|
| EASY | G1-G3 | G1-G2 before build, G3 before merge |
| MODERATE | G1-G3 | G1-G3 before merge |
| HIGH | G1-G4 | G1-G4 before merge |

#### 4.5.3 Invariant Library

**Security Invariants:**
- No plaintext PII at rest
- At-rest and in-transit encryption specified
- All writes authenticated
- Authorization model stated
- Audit trails for security-relevant actions

**Quality Invariants:**
- Each FR has ≥1 acceptance test
- Deterministic tests for security-critical flows
- Ambiguous terms defined in glossary
- Performance metrics numeric and measurable
- Error scenarios cover critical paths

---

## 5. Data Architecture

### 5.1 Persistence Model

**Minimal Relational Schema:**

```sql
-- Specifications
CREATE TABLE specs (
    id UUID PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    maturity INTEGER CHECK (maturity BETWEEN 1 AND 5),
    complexity VARCHAR(20) CHECK (complexity IN ('EASY', 'MODERATE', 'HIGH')),
    sha256 CHAR(64) NOT NULL UNIQUE,
    author VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL  -- Full markdown content
);

-- Specification Versions (History)
CREATE TABLE spec_versions (
    id UUID PRIMARY KEY,
    spec_id UUID REFERENCES specs(id),
    version_num INTEGER NOT NULL,
    sha256 CHAR(64) NOT NULL,
    diff_summary TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(spec_id, version_num)
);

-- Validation Runs
CREATE TABLE validation_runs (
    run_id UUID PRIMARY KEY,
    spec_sha CHAR(64) NOT NULL,
    gates VARCHAR(50)[] NOT NULL,
    pass_fail VARCHAR(10) CHECK (pass_fail IN ('pass', 'fail')),
    report_json JSONB,
    sarif_report JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Adversarial Findings
CREATE TABLE adversarial_findings (
    id UUID PRIMARY KEY,
    run_id UUID REFERENCES validation_runs(run_id),
    severity VARCHAR(20) CHECK (severity IN ('INFO', 'WARN', 'ERROR', 'CRITICAL')),
    category VARCHAR(50) NOT NULL,
    code VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    location TEXT,  -- file:line
    waived_until TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Decision Log (Governance)
CREATE TABLE decision_log (
    id UUID PRIMARY KEY,
    spec_sha CHAR(64) NOT NULL,
    human_email VARCHAR(255) NOT NULL,
    action VARCHAR(20) CHECK (action IN ('approved', 'rejected', 'waived')),
    work_item VARCHAR(255) NOT NULL,
    rationale TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 5.2 Git-Based Artifacts

**Directory Structure:**
```
.specmas/
├── config.yaml              # Project configuration
├── templates/               # Spec templates
│   ├── feature.md
│   ├── security-critical.md
│   └── simple.md
└── reports/                 # Validation reports (gitignored)

specs/
├── features/                # Feature specifications
│   ├── auth-system.md
│   └── payment-flow.md
├── architecture/            # Architectural specs
│   ├── system-design.md
│   └── data-models.md
└── compliance/              # Compliance requirements
    ├── gdpr.md
    └── security-policy.md

.langgraph/                  # Orchestration (Distributed only)
├── workflows/
│   ├── feature-dev.py
│   └── hotfix.py
└── state/                   # Shared state
    └── current-state.json

memory/
└── constitution.md          # Project conventions
```

### 5.3 State Versioning

**State Version Record:**
```json
{
  "version": 1,
  "timestamp": "2025-10-18T10:30:00Z",
  "spec_sha": "abc123...",
  "locked_by": "dev_agent_1",
  "assignments": {
    "dev_agent_1": {
      "task": "implement_auth",
      "status": "in_progress",
      "started": "2025-10-18T10:15:00Z"
    },
    "qa_agent": {
      "task": "validate_tests",
      "status": "waiting",
      "depends_on": ["dev_agent_1"]
    }
  },
  "artifacts": {
    "code_changes": ["src/auth.ts"],
    "test_results": "pending"
  }
}
```

---

## 6. Orchestration Architecture

### 6.1 LangGraph Reference Implementation

```python
from langgraph.graph import StateGraph, Send, END
from typing import TypedDict, List, Dict, Optional

class SpecMASState(TypedDict):
    specification: str
    spec_sha: str
    plan: Dict
    tasks: List[Dict]
    implementations: List[Dict]
    test_results: Dict
    validation_status: str
    findings: List[Dict]

def create_feature_workflow():
    workflow = StateGraph(SpecMASState)
    
    # Planning Nodes
    workflow.add_node("parse_spec", parse_specification)
    workflow.add_node("validate_spec", validate_specification)
    workflow.add_node("analyze_requirements", analyze_requirements)
    workflow.add_node("validate_architecture", validate_architecture)
    workflow.add_node("decompose_work", decompose_into_tasks)
    
    # Development Nodes
    workflow.add_node("generate_tests", generate_test_suite)
    workflow.add_node("dev_parallel", execute_parallel_development)
    
    # Validation Nodes
    workflow.add_node("run_tests", execute_test_suite)
    workflow.add_node("qa_review", qa_validation)
    workflow.add_node("security_scan", security_audit)
    workflow.add_node("adversarial_review", run_adversarial_review)
    
    # Planning Flow
    workflow.add_edge("parse_spec", "validate_spec")
    workflow.add_edge("validate_spec", "analyze_requirements")
    workflow.add_edge("analyze_requirements", "validate_architecture")
    workflow.add_edge("validate_architecture", "decompose_work")
    
    # Development Flow
    workflow.add_edge("decompose_work", "generate_tests")
    workflow.add_edge("generate_tests", "dev_parallel")
    
    # Validation Flow
    workflow.add_edge("dev_parallel", "run_tests")
    workflow.add_conditional_edges(
        "run_tests",
        route_on_test_results,
        {
            "pass": "qa_review",
            "fail": "dev_parallel",
            "error": END
        }
    )
    workflow.add_edge("qa_review", "security_scan")
    workflow.add_edge("security_scan", "adversarial_review")
    workflow.add_conditional_edges(
        "adversarial_review",
        route_on_findings,
        {
            "approved": END,
            "issues": "analyze_requirements",
            "critical": END
        }
    )
    
    workflow.set_entry_point("parse_spec")
    return workflow.compile()

def route_on_test_results(state: SpecMASState) -> str:
    if state["test_results"]["all_passed"]:
        return "pass"
    elif state["test_results"]["recoverable"]:
        return "fail"
    else:
        return "error"

def route_on_findings(state: SpecMASState) -> str:
    critical = [f for f in state["findings"] if f["severity"] == "CRITICAL"]
    if critical:
        return "critical"
    elif state["findings"]:
        return "issues"
    return "approved"
```

### 6.2 Parallel Execution Pattern

```python
def execute_parallel_development(state: SpecMASState) -> List[Send]:
    tasks = state["tasks"]
    sends = []
    
    for task in tasks:
        if task["type"] == "backend":
            sends.append(Send("dev_backend", {"task": task}))
        elif task["type"] == "frontend":
            sends.append(Send("dev_frontend", {"task": task}))
        elif task["type"] == "integration":
            sends.append(Send("dev_integration", {"task": task}))
    
    return sends
```

### 6.3 Error Recovery Flow

```python
def handle_agent_failure(agent_name: str, task: Dict, error_count: int):
    """
    Error recovery escalation heuristics:
    1. First failure: Retry with same agent/model
    2. Second failure: Try with alternate LLM
    3. Third failure: Escalate to human
    """
    if error_count == 1:
        # Retry with same agent
        logger.info(f"Retrying {agent_name} on {task['id']}")
        return {"action": "retry", "agent": agent_name}
    
    elif error_count == 2:
        # Try alternate LLM
        alternate = get_alternate_llm(agent_name)
        logger.warning(f"Escalating to {alternate} for {task['id']}")
        return {"action": "alternate", "agent": alternate}
    
    else:
        # Escalate to human
        logger.error(f"Escalating {task['id']} to human review")
        notify_human(agent_name, task, "max_retries_exceeded")
        return {"action": "escalate", "requires_human": True}
```

---

## 7. Validation Framework

### 7.1 Validator Architecture

```python
class SpecValidator:
    def __init__(self, spec_path: str):
        self.spec = self.load_spec(spec_path)
        self.findings = []
        self.gates_passed = []
    
    def validate(self, gates: List[str]) -> ValidationReport:
        """Execute requested validation gates"""
        for gate in gates:
            if gate == "G1":
                self.validate_structure()
            elif gate == "G2":
                self.validate_semantics()
            elif gate == "G3":
                self.validate_traceability()
            elif gate == "G4":
                self.validate_invariants()
        
        return self.generate_report()
    
    def validate_structure(self):
        """G1: Structure validation"""
        # Check front matter
        if not self.spec.has_frontmatter():
            self.findings.append(Finding(
                severity="ERROR",
                gate="G1",
                code="MISSING_FRONTMATTER",
                message="Specification must have YAML front matter"
            ))
            return
        
        # Check required fields
        required = ["specmas", "kind", "id", "version", "complexity", "maturity"]
        for field in required:
            if field not in self.spec.frontmatter:
                self.findings.append(Finding(
                    severity="ERROR",
                    gate="G1",
                    code=f"MISSING_FIELD_{field.upper()}",
                    message=f"Front matter must include '{field}'"
                ))
        
        # Check required sections
        required_sections = [
            "Overview",
            "Functional Requirements",
            "Non-Functional Requirements",
            "Security",
            "Acceptance Tests"
        ]
        for section in required_sections:
            if not self.spec.has_section(section):
                self.findings.append(Finding(
                    severity="ERROR",
                    gate="G1",
                    code=f"MISSING_SECTION",
                    message=f"Required section '{section}' not found"
                ))
        
        if not self.has_errors("G1"):
            self.gates_passed.append("G1")
    
    def validate_semantics(self):
        """G2: Semantic validation"""
        # Each FR must have validation criteria
        frs = self.spec.get_functional_requirements()
        for fr in frs:
            if not fr.has_validation_criteria():
                self.findings.append(Finding(
                    severity="WARN",
                    gate="G2",
                    code="FR_NO_VALIDATION",
                    message=f"FR-{fr.number} missing validation criteria",
                    location=f"line {fr.line_number}"
                ))
        
        # Security section completeness
        security = self.spec.get_security_section()
        required_security = ["Authentication", "Authorization", 
                            "Data handling", "Encryption"]
        for requirement in required_security:
            if requirement not in security.subsections:
                self.findings.append(Finding(
                    severity="ERROR",
                    gate="G2",
                    code="SECURITY_INCOMPLETE",
                    message=f"Security section missing '{requirement}'"
                ))
        
        # Check for ambiguous terms
        ambiguous_terms = ["fast", "secure", "reliable", "scalable", 
                          "user-friendly", "soon", "approximately"]
        for term in ambiguous_terms:
            if self.spec.contains_term(term):
                self.findings.append(Finding(
                    severity="WARN",
                    gate="G2",
                    code="AMBIGUOUS_TERM",
                    message=f"Ambiguous term '{term}' found. Define in glossary."
                ))
        
        if not self.has_errors("G2"):
            self.gates_passed.append("G2")
    
    def validate_traceability(self):
        """G3: Traceability & coverage validation"""
        # FR to Test mapping
        frs = self.spec.get_functional_requirements()
        tests = self.spec.get_acceptance_tests()
        
        fr_coverage = {}
        for test in tests:
            for fr_ref in test.references:
                fr_coverage[fr_ref] = fr_coverage.get(fr_ref, 0) + 1
        
        for fr in frs:
            if fr.id not in fr_coverage:
                self.findings.append(Finding(
                    severity="ERROR",
                    gate="G3",
                    code="FR_NOT_TESTED",
                    message=f"FR-{fr.number} has no acceptance tests"
                ))
        
        # Non-functional requirements must have metrics
        nfrs = self.spec.get_nonfunctional_requirements()
        for nfr in nfrs:
            if not nfr.has_numeric_target():
                self.findings.append(Finding(
                    severity="ERROR",
                    gate="G3",
                    code="NFR_NO_METRIC",
                    message=f"NFR '{nfr.name}' missing measurable target"
                ))
        
        if not self.has_errors("G3"):
            self.gates_passed.append("G3")
    
    def validate_invariants(self):
        """G4: Determinism & invariants validation"""
        # Check deterministic tests
        det_tests = self.spec.get_deterministic_tests()
        if len(det_tests) == 0:
            self.findings.append(Finding(
                severity="WARN",
                gate="G4",
                code="NO_DETERMINISTIC_TESTS",
                message="No deterministic tests defined for critical paths"
            ))
        
        for test in det_tests:
            if not test.has_checksum():
                self.findings.append(Finding(
                    severity="ERROR",
                    gate="G4",
                    code="TEST_NO_CHECKSUM",
                    message=f"Deterministic test {test.id} missing checksum"
                ))
        
        # Enforce security invariants
        if self.spec.handles_pii():
            if not self.spec.specifies_encryption_at_rest():
                self.findings.append(Finding(
                    severity="CRITICAL",
                    gate="G4",
                    code="INVARIANT_VIOLATION",
                    message="PII data requires at-rest encryption specification"
                ))
        
        if not self.has_errors("G4"):
            self.gates_passed.append("G4")
```

### 7.2 Adversarial Review System

```python
class AdversarialReviewer:
    def __init__(self, spec: Specification):
        self.spec = spec
        self.adversaries = [
            SecurityAdversary(),
            AmbiguityAdversary(),
            ComplianceAdversary(),
            DataAdversary(),
            ImplementationAdversary()
        ]
    
    def review(self) -> List[Finding]:
        """Run all adversaries and collect findings"""
        findings = []
        
        for adversary in self.adversaries:
            adversary_findings = adversary.review(self.spec)
            findings.extend(adversary_findings)
        
        return self.prioritize_findings(findings)
    
    def prioritize_findings(self, findings: List[Finding]) -> List[Finding]:
        """Sort by severity and impact"""
        severity_order = {"CRITICAL": 0, "ERROR": 1, "WARN": 2, "INFO": 3}
        return sorted(findings, key=lambda f: severity_order[f.severity])

class SecurityAdversary:
    def review(self, spec: Specification) -> List[Finding]:
        findings = []
        
        # Check threat model
        if not spec.has_threat_model():
            findings.append(Finding(
                severity="ERROR",
                category="security",
                code="NO_THREAT_MODEL",
                message="Security-critical feature missing threat model"
            ))
        
        # Check secrets handling
        if spec.mentions_secrets():
            if not spec.specifies_secret_management():
                findings.append(Finding(
                    severity="CRITICAL",
                    category="security",
                    code="SECRETS_UNMANAGED",
                    message="Secrets mentioned but no management strategy"
                ))
        
        # Check egress controls
        if spec.has_external_integrations():
            if not spec.defines_egress_controls():
                findings.append(Finding(
                    severity="WARN",
                    category="security",
                    code="NO_EGRESS_CONTROLS",
                    message="External integrations should define egress controls"
                ))
        
        return findings

class AmbiguityAdversary:
    def review(self, spec: Specification) -> List[Finding]:
        findings = []
        
        # Flag vague language
        vague_patterns = [
            r"\b(fast|quick|slow)\b",
            r"\b(secure|safe)\b",
            r"\b(scalable|performant)\b",
            r"\b(user[- ]friendly|easy)\b",
            r"\b(soon|later|eventually)\b"
        ]
        
        for pattern in vague_patterns:
            matches = spec.find_pattern(pattern)
            for match in matches:
                findings.append(Finding(
                    severity="WARN",
                    category="ambiguity",
                    code="VAGUE_LANGUAGE",
                    message=f"Vague term '{match.text}' at line {match.line}. Add to glossary with specific meaning.",
                    location=f"line {match.line}"
                ))
        
        return findings
```

---

## 8. Security Architecture

### 8.1 Security Principles

1. **Defense in Depth** - Multiple layers of validation
2. **Least Privilege** - Agents have minimal necessary permissions
3. **Audit Everything** - All actions logged with attribution
4. **Fail Secure** - Default to denying access on errors
5. **Human Review** - Critical operations require approval

### 8.2 Agent Permission Model

```yaml
# .claude/settings.json
{
  "permissionMode": "acceptEdits",  # Accept file edits without prompting
  "allowedTools": [
    "Read",      # Read files
    "Write",     # Write files
    "Bash",      # Execute bash commands
    "Grep"       # Search codebase
  ],
  "restrictedOperations": {
    "deleteFile": "requireApproval",      # Must ask before deleting
    "runSudo": "deny",                    # Never allow sudo
    "networkAccess": "requireApproval",   # Must ask for network calls
    "installPackages": "requireApproval"  # Must ask before npm install
  },
  "fileAccessControl": {
    "allowed": ["/workspace", "/specs"],
    "denied": ["/etc", "/root", "/.git/config"]
  }
}
```

### 8.3 Data Classification

| Classification | Examples | Requirements |
|----------------|----------|--------------|
| Public | Marketing content, public docs | No restrictions |
| Internal | Code, specs, test data | Access control, audit logging |
| Confidential | API keys, secrets | Encryption at rest, restricted access |
| Restricted | PII, financial data | Encryption, audit, compliance |

### 8.4 Secure Communication

**Agent to MCP Server:**
```
Agent
  ↓ (TLS 1.3)
MCP Server
  ↓ (Encrypted connection)
Resource (DB, API, etc.)
```

**Agent to Git:**
```
Agent
  ↓ (SSH key or token)
Git Repository
  ↓ (Signed commits)
Remote (GitHub/GitLab)
```

### 8.5 Secret Management

**Never in Specs:**
```yaml
# ❌ BAD - Secrets in spec
database:
  password: "mypassword123"

# ✅ GOOD - Reference to secret
database:
  password: "${DB_PASSWORD}"  # From environment or vault
```

**Agent Access:**
```python
# Agents never see actual secrets
# MCP server handles authentication
mcp_client.query_database(
    query="SELECT * FROM users",
    # No credentials needed - MCP handles it
)
```

---

## 9. Deployment Models

### 9.1 Local Development (Developer Machine)

```
Developer Machine:
├── Code Editor (VS Code, etc.)
├── Claude Agent SDK (local)
├── Specifications (git checkout)
├── MCP Servers (Docker containers)
└── Test Framework (local)

Cost: ~$100/month API costs
```

### 9.2 Team Server (Shared Infrastructure)

```
Shared Server:
├── LangGraph Orchestrator (Docker)
├── MCP Server Cluster (Kubernetes)
├── Redis (State Management)
├── PostgreSQL (Persistence)
└── Monitoring (LangSmith)

Cost: ~$500-1000/month infrastructure + API
```

### 9.3 Enterprise Deployment

```
┌─────────────────────────────────────────┐
│         Load Balancer                    │
└────────────┬────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
┌─────▼─────┐ ┌────▼──────┐
│ Agent     │ │ Agent     │
│ Cluster 1 │ │ Cluster 2 │
└─────┬─────┘ └────┬──────┘
      │            │
      └──────┬─────┘
             │
    ┌────────▼────────┐
    │ State & Cache   │
    │ (Redis Cluster) │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │   Database      │
    │ (PostgreSQL HA) │
    └─────────────────┘

Cost: ~$5000/month for 50-100 engineers
```

### 9.4 Infrastructure as Code

**Kubernetes Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: specmas-orchestrator
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: langgraph
        image: specmas/langgraph:v3
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: specmas-secrets
              key: anthropic-key
        resources:
          limits:
            memory: "8Gi"
            cpu: "4"
```

---

## 10. Integration Architecture

### 10.1 CI/CD Integration

**GitHub Actions Example:**
```yaml
name: Spec-MAS Validation

on:
  pull_request:
    paths:
      - 'specs/**'
      - 'src/**'

jobs:
  validate-specs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Validate Specifications
        run: |
          specmas validate specs/ \
            --gates G1,G2,G3 \
            --report validation-report.json
      
      - name: Run Adversarial Review
        if: success()
        run: |
          specmas adversarial review specs/ \
            --report adversarial-report.json
      
      - name: Check for Critical Findings
        run: |
          # Fail if any CRITICAL findings
          if jq -e '.findings[] | select(.severity=="CRITICAL")' \
             adversarial-report.json; then
            echo "Critical findings detected"
            exit 1
          fi
      
      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: validation-reports
          path: |
            validation-report.json
            adversarial-report.json
```

### 10.2 IDE Integration

**VS Code Extension:**
```json
{
  "specmas.validateOnSave": true,
  "specmas.showInlineFindings": true,
  "specmas.autoGenerateTests": true,
  "specmas.agentMode": "local"
}
```

**Features:**
- Real-time spec validation
- Inline warnings/errors
- One-click agent invocation
- Test generation shortcuts

### 10.3 Chat Integration (Slack/Teams)

**Slash Commands:**
```
/specmas validate [spec-path]
/specmas status [feature-name]
/specmas approve [run-id]
/specmas deploy [feature-name]
```

**Bot Notifications:**
```
✅ Spec validation passed for feature/auth-system
   - Gates: G1, G2, G3, G4
   - Findings: 2 warnings, 0 errors
   - Ready for implementation
   [View Report] [Start Development]
```

---

## 11. Quality Attributes

### 11.1 Performance Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Spec validation (G1-G4) | <30s | p95 |
| Adversarial review | 2-5 min | p95 |
| Agent task completion | <10 min | p95 per task |
| State synchronization | <10s | p99 |
| Test execution | <5 min | p95 full suite |

### 11.2 Reliability

- **Availability**: 99.9% for orchestration layer
- **MTTR**: <15 minutes for agent failures
- **Data Durability**: 99.999999999% (git + backup)
- **Graceful Degradation**: Continue without orchestration if needed

### 11.3 Scalability

| Dimension | Local Pattern | Distributed Pattern |
|-----------|---------------|---------------------|
| Concurrent Agents | 1 | 50+ |
| Specifications | 100 | 10,000+ |
| Daily Validations | 50 | 1,000+ |
| Team Size | 1-5 | 5-1000+ |

### 11.4 Maintainability

- **Code Coverage**: >80% for core framework
- **Documentation**: Every public API documented
- **Upgrade Path**: Automated migration tools
- **Backwards Compatibility**: N-1 version support

### 11.5 Security

- **Authentication**: OAuth 2.0 or SAML
- **Authorization**: RBAC with least privilege
- **Encryption**: TLS 1.3 in transit, AES-256 at rest
- **Audit**: All actions logged with retention
- **Compliance**: Assist with SOC2, not certified

---

## 12. Decision Log

### 12.1 Approved Architecture Decisions

**ADR-001: Local vs Distributed Patterns**
- Decision: Treat as distinct use cases, not upgrade path
- Rationale: Fundamentally different architectures
- Impact: Teams must choose upfront

**ADR-002: Specifications as Source of Truth**
- Decision: Git-based, human-approved only
- Rationale: Governance and audit requirements
- Impact: Agent suggestions require human merge

**ADR-003: MCP for Tool Access Only**
- Decision: MCP not for orchestration
- Rationale: Separation of concerns
- Impact: Use LangGraph for coordination

**ADR-004: Hybrid Test Strategy**
- Decision: Constraint + generated tests
- Rationale: Balance automation with precision
- Impact: Requires multi-model approach

**ADR-005: Eventually Consistent State**
- Decision: Accept temporary inconsistencies
- Rationale: Simplicity over strict consistency
- Impact: Conflicts resolved by last writer

**ADR-006: Git-Based Audit Trail**
- Decision: Commits + templates for compliance
- Rationale: Leverage existing infrastructure
- Impact: Not suitable for all regulated industries

**ADR-007: Error Escalation Heuristics**
- Decision: Retry → Alternate LLM → Human
- Rationale: Maximize autonomy, ensure recovery
- Impact: Adds latency but improves reliability

**ADR-008: Git + Reports for Communication**
- Decision: Agents write reports to git
- Rationale: Auditable, human-inspectable
- Impact: Simple but requires discipline

**ADR-009: Multi-Model Approach**
- Decision: Different LLMs for different tasks
- Rationale: Reduce correlated hallucinations
- Impact: Higher cost, better quality

### 12.2 Deferred Decisions

**DEF-001: Local to Distributed Migration**
- Deferred until: Post v1 adoption
- Reason: Pattern compatibility unknown

**DEF-002: Token Accounting**
- Deferred until: Cost becomes constraint
- Reason: Premature optimization

**DEF-003: Regulated Industry Compliance**
- Deferred until: Market demand clear
- Reason: Complex certification process

**DEF-004: Specification Complexity Limits**
- Deferred until: User feedback collected
- Reason: Need empirical data

---

## Appendix A: Glossary

**Acceptance Criteria**: Testable conditions that must be met for a feature to be considered complete

**Agent**: An AI system (typically LLM-based) that executes specific tasks autonomously

**Adversarial Review**: Systematic examination of specifications by specialized agents looking for specific types of issues

**Complexity**: Categorization of feature difficulty (EASY, MODERATE, HIGH) based on technical requirements

**Constraint Test**: Pre-written test from specification that defines mandatory behavior

**Distributed Pattern**: Implementation approach for large teams with parallel agent execution

**Gate**: Validation checkpoint that specifications must pass

**Invariant**: Hard rule that must always be true (e.g., "PII must be encrypted")

**LangGraph**: Framework for orchestrating multiple LLM-based agents with stateful workflows

**Local Pattern**: Implementation approach for small teams with sequential execution

**Maturity Level**: Measure of specification completeness (1-5)

**MCP**: Model Context Protocol - standardized way for agents to access tools/data

**Orchestration**: Coordination of multiple agents working on related tasks

**Specification**: Markdown document defining what to build, serving as source of truth

**Validation**: Process of checking specifications and implementations against requirements

---

## Appendix B: Reference Implementation Checklist

### Phase 0: Foundation (Week 1)
- [ ] Git repository structure created
- [ ] Spec Kit installed and configured
- [ ] Claude Agent SDK installed
- [ ] First specification template created
- [ ] Basic validation working

### Phase 1: Local Pattern (Weeks 2-4)
- [ ] 3-5 feature specs written at appropriate maturity
- [ ] Test generation from specs working
- [ ] Agent successfully implements from spec
- [ ] Human review process established
- [ ] Metrics collection started

### Phase 2: Validation Framework (Weeks 5-6)
- [ ] All four gates (G1-G4) implemented
- [ ] Adversarial review system functional
- [ ] Invariant library defined
- [ ] SARIF report generation working
- [ ] CI/CD integration complete

### Phase 3: Distributed Pattern (Weeks 7-10)
- [ ] LangGraph workflows defined
- [ ] State management implemented
- [ ] Parallel agent execution working
- [ ] Agent communication via reports
- [ ] Observability dashboard deployed

### Phase 4: Production Readiness (Weeks 11-12)
- [ ] Performance targets met
- [ ] Security audit completed
- [ ] Documentation comprehensive
- [ ] Training materials created
- [ ] Production deployment plan approved

---

**Document Status**: Complete  
**Next Review**: After v3.0 implementation  
**Maintained By**: Architecture Team  
**Questions**: architecture@specmas.dev
