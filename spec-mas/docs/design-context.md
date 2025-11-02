Spec-MAS: Quick Reference for Future Sessions
Core Concept
Specification-Guided Multi-Agent System (Spec-MAS) - A development pattern where living specifications are the source of truth, specialized AI agents implement features, and continuous validation ensures quality.
Key Principle: Specifications define WHAT → Agents determine HOW → Tests validate THAT
Architecture Layers


Layer 1: SPECIFICATION (Spec Kit)
         └─ Living docs defining requirements, architecture, acceptance criteria

Layer 2: ORCHESTRATION (LangGraph - parallel agents only)
         └─ Coordinates multiple specialized agents working in parallel

Layer 3: AGENT EXECUTION (Claude Agent SDK / Cursor / other similar tools)
         └─ Individual agents executing tasks with tools/context

Layer 4: TOOL ACCESS (MCP)
         └─ Standardized access to databases, APIs, file systems

Layer 5: VALIDATION (TDD/TDG)
         └─ Continuous testing against spec requirements
```

## Two Implementation Patterns

### Local Pattern (1-5 developers, <10k LOC)
- **Tools:** Spec Kit + Claude Agent SDK + TDD
- **Flow:** Write spec → Generate tests → Agent implements → Human reviews
- **Characteristics:** Single agent at a time, sequential execution, CLI-driven
- **Setup Time:** 2-3 weeks
- **No infrastructure needed**

### Distributed Pattern (5+ developers, >10k LOC)
- **Tools:** Spec Kit + LangGraph + Claude Agent SDK + MCP + TDD
- **Flow:** Collaborative spec → AI planning → Parallel agent execution → Integration review
- **Characteristics:** Multiple specialized agents, parallel tracks, centralized orchestration
- **Setup Time:** 2-3 months
- **Requires:** Agent orchestration server, MCP servers, state management

## Essential Tools

| Tool | Purpose | Required For | Alternative |
|------|---------|--------------|-------------|
| **Spec Kit** | Specification management | Both patterns | Custom markdown + validation |
| **Claude Agent SDK** | Individual agent runtime | Both patterns | Cursor Agent, custom |
| **LangGraph** | Multi-agent orchestration | Distributed only | Can skip for local |
| **MCP** | Standardized tool access | Distributed, optional local | Direct API calls |
| **Test Framework** | Validation layer | Both patterns | Any test framework |

## Agent Workflow (Standard Loop)
```
1. GATHER CONTEXT
   - Read specification
   - Search codebase for relevant patterns
   - Load project conventions (CLAUDE.md)

2. TAKE ACTION
   - Generate/modify code
   - Run commands (bash, npm, etc.)
   - Use tools via MCP

3. VERIFY WORK
   - Run tests automatically
   - Check against acceptance criteria
   - Lint and type check

4. REPEAT OR COMPLETE
   - If tests fail: analyze, refine, repeat
   - If tests pass: yield control to human
```

## LangGraph's Unique Value

**Why LangGraph vs. just Claude Agent SDK:**
- **Multi-agent coordination** - Multiple agents working simultaneously on different tasks
- **Stateful workflows** - Conditional routing, shared state, complex branching
- **Parallel execution** - Dev Agent + Test Agent + QA Agent running concurrently
- **Model flexibility** - Different agents can use different LLMs
- **Observable execution** - Trace which agent made which decision

**Skip LangGraph if:** Solo dev, simple projects, sequential workflow sufficient

## Quick Decision Framework
```
Choose LOCAL pattern if:
✓ Team ≤5 people
✓ Monolithic or simple architecture
✓ Sequential development OK
✓ Want fast setup
→ Use: Spec Kit + Claude Agent SDK

Choose DISTRIBUTED pattern if:
✓ Team >5 people
✓ Multiple microservices
✓ Need parallel development
✓ Cross-team coordination required
→ Use: Full stack with LangGraph
```

## Critical Success Factors

1. **Spec Quality** - Clear, testable, complete specifications
2. **Test First** - Generate tests from spec before implementation
3. **Human Review** - Always review AI-generated code
4. **Incremental Adoption** - Start small, expand gradually
5. **Observable Agents** - Monitor and trace agent decisions

## Common Questions

**Q: Do I need LangGraph?**  
A: Only for distributed pattern with multiple parallel agents. Local pattern works great with just Claude Agent SDK.

**Q: Can I use different AI models?**  
A: Yes - LangGraph is model-agnostic. Can use Claude, GPT-4, Gemini, etc. per agent.

**Q: What about existing codebases?**  
A: Start by creating specs for new features. Gradually retrofit existing code. Specs become living documentation.

**Q: How do I handle agent errors?**  
A: Specs provide persistent context. Can restart from checkpoints. Break complex tasks into smaller specs.

## Typical Costs

- **Solo dev:** ~$100/month (API costs)
- **Small team (5):** ~$500/month
- **Enterprise (50):** ~$5,000/month
- **ROI:** Usually 50-100x through time savings

## File Structure Reference
```
project/
├── specs/                  # Human-written specifications
│   ├── features/
│   └── architecture.md
├── .claude/               # Agent configuration
│   ├── settings.json
│   └── CLAUDE.md          # Project memory/context
├── .langgraph/            # Orchestration (distributed only)
│   └── workflows/
├── tests/                 # Generated + maintained
└── src/                   # AI-generated implementation
Next Steps When Implementing
1. Install Spec Kit + Claude Agent SDK
2. Write first spec for small feature
3. Generate tests from spec
4. Run agent to implement
5. Review and refine
6. Scale up gradually

Context for Claude: I'm working with the Spec-MAS pattern. Use this reference to help me implement, debug, or extend the pattern. Ask clarifying questions about which pattern (local vs distributed) and what specific aspect I need help with.

Excellent! Now I have a comprehensive view of the landscape. Let me propose several high-level approaches that merge the "what" (Spec Kit) and "who" (BMAD) patterns while incorporating other complementary patterns and tools.
Approach 1: "Specification-Guided Multi-Agent System" (Spec-MAS)
Core Concept
Combine Spec Kit's document-centric approach with BMAD's agent orchestration, using specifications as the coordination mechanism between specialized agents.
Architecture
Layer 1: Specification Layer (from Spec Kit)
* Living specification documents serve as the "constitution"
* Specs become the shared source of truth - when something doesn't make sense, you go back to the spec; when a project grows complex, you refine it Spec-driven development with AI: Get started with a new open source toolkit - The GitHub Blog
Layer 2: Agent Orchestration (from BMAD + LangGraph)
* Specialized agents (Analyst, PM, Architect, Scrum Master, Dev, QA) defined as self-contained markdown files with embedded YAML configurations BMad Code | AI Agent Framework [BMad Method]
* Use LangGraph's state machine and graph architecture to orchestrate agent workflows, where each agent is a node and their connections are edges, enabling orchestrator-worker patterns LangChainLangChain
Layer 3: Context Protocol (MCP Integration)
* MCP provides a universal, open standard for connecting AI systems with data sources, replacing fragmented integrations with a single protocol Introducing the Model Context Protocol \ Anthropic
* Agents access tools, databases, and APIs through standardized MCP servers
Layer 4: Continuous Validation (TDD Layer)
* Test-Driven Generation incorporates test cases before code generation, ensuring AI-generated code is validated against tests. Your pre-written tests act as a continuous validation layer, immediately flagging any AI-generated code that doesn't meet specified criteria arXivSubstack
Workflow


1. SPECIFICATION PHASE
   └─> Human + Analyst Agent create spec using Spec Kit
   └─> PM Agent validates against business requirements
   └─> Architect Agent creates technical plan

2. TEST GENERATION PHASE (TDG)
   └─> QA Agent generates comprehensive test suite from spec
   └─> Tests define acceptance criteria for each component

3. ORCHESTRATED DEVELOPMENT (LangGraph)
   ┌─> Scrum Master breaks spec into story nodes (graph)
   ├─> Dev Agents work in parallel on independent stories
   ├─> Each agent uses MCP to access tools/data
   └─> Continuous validation against test suite

4. INTEGRATION & REFINEMENT
   └─> QA Agent reviews merged work against spec
   └─> Spec updated if requirements evolved
   └─> Loop back through affected components
```

### Key Benefits
- Specs provide clarity (Spec Kit strength)
- Agents provide specialization (BMAD strength)
- Graph orchestration provides flexibility (LangGraph strength)
- MCP provides tool connectivity (standardization)
- TDD provides validation (quality assurance)

---

## **Approach 2: "Agentic Spec Evolution" (ASE)**

### Core Concept
Treat the specification itself as a living artifact co-authored and maintained by both humans and agents, with agents responsible for both spec evolution and implementation.

### Architecture

**Specification as Executable Code**
- The spec becomes the primary artifact that developers change. It's not a document that decorates code - it's the document that code is derived from at all times. If an enhancement or bug fix comes in, the spec is updated to reflect the change 

**Agent Responsibilities Matrix**
```
Spec Layer Agents:
- Requirements Agent: Maintains functional requirements
- Architecture Agent: Maintains technical architecture
- Test Spec Agent: Maintains acceptance criteria

Implementation Layer Agents:  
- Code Generator Agents: Generate code from spec
- Validator Agents: Verify against test spec
- Optimizer Agents: Improve performance while maintaining spec compliance
```

**Integration Pattern (CrewAI + MCP)**
- Use CrewAI's role-based structure with intuitive abstractions to focus on task design. CrewAI operates in a linear, procedure-driven manner, iterating through tasks in sequence with a replay mechanism 
- MCP servers expose tools and data sources through standardized interfaces, enabling agents to discover and use tools at runtime 

### Workflow
```
CONTINUOUS SPEC-CODE LOOP:

┌──────────────────────────────────────┐
│  SPEC EVOLUTION                      │
│  ├─ Human proposes change            │
│  ├─ Requirements Agent analyzes      │
│  ├─ Architecture Agent validates     │
│  └─ Test Spec Agent updates tests    │
└──────────┬───────────────────────────┘
           │
           v
┌──────────────────────────────────────┐
│  PARALLEL GENERATION                 │
│  ├─ Multiple Code Gen Agents         │
│  ├─ Each generates different impl    │
│  └─ All validate against same spec   │
└──────────┬───────────────────────────┘
           │
           v
┌──────────────────────────────────────┐
│  AUTONOMOUS OPTIMIZATION             │
│  ├─ Optimizer Agents run in parallel │
│  ├─ Performance, Security, Cost      │
│  └─ Always validate against spec     │
└──────────────────────────────────────┘
```

### Unique Features
- Enables autonomous software where framework updates or security issues that don't require specification changes can be autonomously handled by regenerating code from the spec. Also enables self-optimizing software using production telemetry 
- Multiple implementations per spec for A/B testing
- Continuous optimization without human intervention

---

## **Approach 3: "Federated Agent Networks" (FAN)**

### Core Concept
MCP complements agent orchestration frameworks like LangChain, LangGraph, CrewAI - it doesn't replace them. MCP provides a standardized integration layer for agents accessing tools . Build a federation where different agent teams (using different frameworks) collaborate on the same spec.

### Architecture

**Multi-Framework Integration**
```
Spec Kit Foundation (Shared Source of Truth)
        │
        ├──────────────┬──────────────┬──────────────┐
        │              │              │              │
   BMAD Team      LangGraph Team  CrewAI Team   Custom Agents
   (Planning)     (Development)   (QA/Testing)  (Specialized)
        │              │              │              │
        └──────────────┴──────────────┴──────────────┘
                       │
                  MCP Protocol
                       │
        ┌──────────────┴──────────────┬──────────────┐
    Tools/APIs      Data Sources    External Systems
```

**Communication Protocol**
- All agents communicate through shared spec + MCP
- Agent As Code - each team's agents defined as version-controlled configuration files with complete audit trails through Git workflows 
- Workflow patterns from "Building Effective Agents" implemented in composable ways, allowing chains of patterns 

### Workflow
```
1. SPECIFICATION CONSENSUS
   └─> Multiple agent teams contribute to spec
   └─> Version controlled, reviewable changes
   
2. SPECIALIZED TEAM FORMATION
   ├─> BMAD agents: Planning & architecture
   ├─> LangGraph agents: Complex stateful workflows
   ├─> CrewAI agents: Sequential task execution
   └─> Custom agents: Domain-specific needs

3. COORDINATED EXECUTION
   └─> Each team operates independently
   └─> MCP provides shared context
   └─> Spec provides coordination contract
   
4. CROSS-TEAM VALIDATION
   └─> Results validated against unified spec
   └─> Test suite runs across all implementations
```

### Key Benefits
- Best-of-breed: Use each framework's strengths
- Resilience: Teams can fail independently
- Scalability: Add new agent teams without disruption
- Flexibility: Different tools for different problems

---

## **Approach 4: "Test-Spec-Agent Trinity" (TSA)**

### Core Concept
Elevate tests to the same level as specs and agents - creating a three-way contract where all three must remain in sync.

### Architecture

**The Trinity**
```
        SPECIFICATION
       (What to build)
              ↓
    ┌─────────┼─────────┐
    ↓                   ↓
TESTS                AGENTS
(How to verify)    (How to build)
    ↓                   ↓
    └─────────┬─────────┘
              ↓
       IMPLEMENTATION
```

**Enforcement Mechanisms**
- Test-Driven Generation (TDG) workflow: developer adds specs, AI generates tests first, then generates code that passes tests. Process iterates until program is complete 
- Spec changes require test updates
- Test changes trigger spec review
- Agent changes validated by both spec and tests

### Workflow
```
TRINITY SYNCHRONIZATION LOOP:

Human Input → Spec Update
                ↓
Test Agent generates/updates tests from spec
                ↓
      ┌────────┴────────┐
      ↓                 ↓
Spec Agent         Code Gen Agents
validates tests    (multiple approaches)
      ↓                 ↓
      └────────┬────────┘
               ↓
    Validation Runner (continuous)
               ↓
        ┌──────┴──────┐
        ↓             ↓
    All Pass      Some Fail
        ↓             ↓
    Deploy      Auto-refine loop
                      ↓
              Human review if stuck
```

### Integration Points
- TGen framework operates in continuous feedback loop where developers detail requirements through prompts and test cases, which serve as definitive guide for expected behavior 
- Each task should be implementable and testable in isolation, giving the coding agent a way to validate its work and stay on track, almost like a test-driven development process for your AI agent 
- MCP provides tool access for test execution
- BMAD-style agents for specialized roles

---

## **Recommended Hybrid: "Spec-MAS with TDG" (Approach 1 + TDD)**

For most teams, I recommend **Approach 1 (Specification-Guided Multi-Agent System)** enhanced with **Test-Driven Generation** because:

1. **Clear separation of concerns**: Specs (what), Agents (who), Tests (validation)
2. **Proven patterns**: Leverages established tools (Spec Kit, BMAD, LangGraph, MCP)
3. **Gradual adoption**: Can start with Spec Kit alone, add agents incrementally
4. **Quality assurance**: TDG ensures continuous validation
5. **Standards-based**: MCP ensures tool interoperability

### Quick Start Path
```
Week 1: Adopt Spec Kit for documentation
Week 2-3: Add Test-Driven Generation
Week 4-5: Introduce first specialized agent (Dev Agent)
Week 6+: Expand agent team, add LangGraph orchestration
Month 3+: Integrate MCP for tool standardization


Core Architectural Differences
Claude Agent SDK - Single Agent Runtime
The Claude Agent SDK is built on the agent harness that powers Claude Code. It provides context management, a rich tool ecosystem (file operations, code execution, web search, MCP extensibility), advanced permissions, and automatic prompt caching. The SDK makes it easier to build autonomous agents by giving Claude access to a computer where it can write files, run commands, and iterate on its work. ClaudeAnthropic
Architecture: The Claude Agent SDK outlines a structured agent loop involving four key steps: gathering context, taking action, verifying work, and repeating. Claude Agent SDK Tutorial: Create Agents Using Claude Sonnet 4.5 | DataCamp
What it is: A single-agent execution environment optimized for Claude to work autonomously on tasks.
Cursor Agent - IDE-Integrated Single Agent
Cursor Agent operates through three layers: Understanding (analyzes project architecture), Execution (breaks down complex requests into manageable steps), and Integration (manages AI agents and presents code diffs for review). Agent mode analyzes your request and the context of the codebase to fully comprehend the task requirements and goals. Analytics VidhyaCursor
IDEs like Cursor are complex wrappers around LLMs with a chat UI, good model selection, and optimized internal prompts. The hard part is designing prompts and tools to work consistently. How Cursor (AI IDE) Works - by Shrivu Shankar
What it is: An IDE-native single agent with deep editor integration and automated tool access.
LangGraph - Multi-Agent Orchestration Framework
LangGraph enables creation of LLM workflows containing cycles using graph representations. Each agent is a node in the graph, and their connections are edges. The control flow is managed by edges, and agents communicate by adding to the graph's state. LangGraph supports orchestrator-worker patterns where a central LLM dynamically breaks down tasks, delegates them to worker LLMs, and synthesizes their results. LangChainLangChain
What it is: A multi-agent coordination system for complex workflows requiring specialized agents working together.

What LangGraph Provides That Claude Agent SDK and Cursor Don't
1. Multi-Agent Coordination
Claude Agent SDK / Cursor:
* Single Claude instance working on a task
* Can use subagents (specialized agents stored as Markdown files), but these are sequential delegations, not parallel coordination Agent SDK overview - Claude Docs
LangGraph:
* Multiple independent agents working in parallel with different specializations, models, and capabilities. Supports orchestrator-worker designs where an orchestrator dynamically breaks down tasks and Send API lets you create worker nodes dynamically, each with its own state Workflows and Agents
* Critical for Spec-MAS: You can have simultaneous agents working on different parts of the spec (e.g., one agent validating requirements, another checking architecture consistency, another generating tests)
2. Stateful Workflow Management
Claude Agent SDK / Cursor:
* Linear execution loop (gather → act → verify → repeat)
* Context maintained in a single session
* The SDK's compact feature automatically summarizes previous messages when context limit approaches Agent SDK overview - Claude Docs
LangGraph:
* Graph-based state machines with conditional edges where the LLM-powered agent makes decisions on where to go next. Each node can maintain independent state, and all worker outputs are written to shared state keys accessible to the orchestrator nuviAmplework
* Critical for Spec-MAS: The specification can live in the graph state, with different agents reading/writing different parts based on their role
3. Conditional Branching & Cycles
Claude Agent SDK / Cursor:
* Primarily linear flow with retry loops
* Agent decides next action based on current context
LangGraph:
* Workflows containing cycles are a critical component of agent runtimes. LangGraph enables complex reasoning paths, branching logic, and persistent memory flows between agents LangGraph: Multi-Agent Workflows
* Critical for Spec-MAS: If spec validation fails, route to Requirements Agent; if tests fail, route back to Dev Agent; if architecture conflicts, route to Architect Agent
4. Framework-Agnostic Integration
Claude Agent SDK:
* Tightly coupled to Claude/Anthropic models
* Optimized Claude integration with automatic prompt caching Agent SDK overview - Claude Docs
Cursor:
* You can use claude-3.5-sonnet, gpt-4o and o3-mini with Agent today Cursor – Agent, but architecture is Cursor-specific
LangGraph:
* LangGraph is model-agnostic and can work with any LLM provider. Different nodes can use different models based on task requirements Choosing the Right AI Agent Framework: LangGraph vs CrewAI vs OpenAI Swarm | nuvi Blog
* Critical for Spec-MAS: BMAD Planning Agents might use Claude Opus for deep reasoning, Dev Agents use GPT-4o for speed, QA Agents use Sonnet for balance
5. Observable, Debuggable Workflows
Claude Agent SDK / Cursor:
* Session-based logging
* Built-in error handling, session management, and monitoring Agent SDK overview - Claude Docs
LangGraph:
* LangGraph's graph-based architecture enables modular, observable graphs, making debugging easier. Each node's execution can be monitored independently Autogen vs LangChain vs CrewAI: Our AI Engineers’ Ultimate Comparison Guide
* LangGraph is fully integrated into the LangChain ecosystem, meaning you can take full advantage of LangSmith observability LangGraph: Multi-Agent Workflows
* Critical for Spec-MAS: You can see exactly which agent made which decision, trace spec changes through the workflow, and replay failed branches

In the Spec-MAS Pattern, Here's the Division of Labor:


┌─────────────────────────────────────────────────┐
│ SPECIFICATION LAYER (Spec Kit)                 │
│ - Single source of truth                        │
│ - Version controlled                             │
└──────────────────┬──────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────┐
│ ORCHESTRATION LAYER (LangGraph)                │
│                                                  │
│  ┌──────────────┐      ┌──────────────┐        │
│  │Requirements  │──────│Architecture  │        │
│  │Agent (Opus)  │      │Agent (GPT-4) │        │
│  └───────┬──────┘      └──────┬───────┘        │
│          │                    │                 │
│          └────────┬───────────┘                 │
│                   │                              │
│          ┌────────v─────────┐                   │
│          │  Orchestrator    │                   │
│          │  (Routes Work)   │                   │
│          └────────┬─────────┘                   │
│                   │                              │
│      ┌────────────┼────────────┐                │
│      │            │            │                │
│  ┌───v────┐  ┌───v────┐  ┌───v────┐           │
│  │Dev     │  │Dev     │  │Dev     │           │
│  │Agent 1 │  │Agent 2 │  │Agent 3 │           │
│  └───┬────┘  └───┬────┘  └───┬────┘           │
│      │           │           │                  │
│      └───────────┴───────────┘                  │
│                  │                               │
│          ┌───────v────────┐                     │
│          │  QA Agent      │                     │
│          │  (Validates)   │                     │
│          └────────────────┘                     │
└─────────────────────────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────┐
│ EXECUTION LAYER                                 │
│ (Claude Agent SDK or Cursor per agent)          │
│                                                  │
│ Each agent uses Claude SDK/Cursor for:          │
│ - File operations                                │
│ - Code execution                                 │
│ - Terminal commands                              │
│ - MCP tool access                                │
└─────────────────────────────────────────────────┘
```

## **Concrete Example: Adding a New Feature**

### **With Just Claude Agent SDK:**
```
1. Single Claude instance reads entire spec
2. Tries to implement all aspects sequentially
3. Context window fills up with irrelevant details
4. No parallelization
5. Hard to maintain separation of concerns
```

### **With Spec-MAS + LangGraph:**
```
1. LangGraph orchestrator reads spec update
2. Routes to Requirements Agent → validates against existing requirements
3. Parallel dispatch:
   ├─> Dev Agent 1: Backend (uses Claude Agent SDK)
   ├─> Dev Agent 2: Frontend (uses Cursor in headless mode)
   └─> Test Agent: Generate tests (uses Claude Agent SDK)
4. QA Agent (using Claude SDK) validates all outputs against spec
5. If any fail: conditional routing back to appropriate agent
6. All agents share spec state but have isolated workspaces
When You Don't Need LangGraph
You don't need LangGraph if:
* Single developer working on small projects
* Linear, simple workflows
* Just need Claude to grep, edit files, and run tests in sequence Building Agents with Claude Code's SDK
* Happy with single-agent approach
Use Claude Agent SDK or Cursor alone for:
* Personal coding assistants
* Simple automation scripts
* Single-purpose agents
When LangGraph is Essential
You need LangGraph when:
* Multiple specialized agents with different expertise
* Complex workflows with branching logic
* Parallel execution of independent tasks
* Different models for different subtasks
* Need to maintain shared state across agents
* Implementing patterns like Spec-MAS, BMAD, or any multi-agent architecture
Bottom Line for Spec-MAS
MCP is not an agent framework, but a standardized integration layer for agents accessing tools. It complements agent orchestration frameworks like LangGraph What is Model Context Protocol (MCP)? | IBM.
In Spec-MAS:
* Spec Kit = What to build
* LangGraph = Who does what, when, and how they coordinate
* Claude Agent SDK/Cursor = How each individual agent executes its tasks
* MCP = How agents access tools and data
LangGraph is the conductor of the orchestra, while Claude Agent SDK and Cursor are the instruments. You could have an orchestra with only one instrument, but for complex symphonies (like Spec-MAS), you need the conductor to coordinate multiple instruments playing different parts in harmony.

