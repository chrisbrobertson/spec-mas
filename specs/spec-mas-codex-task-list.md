# Spec-MAS “Ready for Use” — Codex Unattended Implementation Task List

This task list is designed for **unattended implementation by Codex**: small, discrete, testable tasks with clear inputs/outputs and minimal ambiguity.

---

## Ground rules for Codex (put at top of the TODO issue)
1. Every task must include a **test** (unit/integration) or a **CI-verified command** that proves it works.
2. No task should change more than **~5 files** unless unavoidable.
3. No refactors without a safety net: **add tests first**.
4. Every CLI change must update `--help` output and docs.
5. Keep changes backwards compatible unless a task explicitly says otherwise.

---

## Milestone 1 — CI baseline & minimal quality gates (10 tasks)

### M1-01 Add GitHub Actions CI skeleton
- **Do:** Create `.github/workflows/ci.yml` running `npm ci` then `npm test`
- **DoD:** CI passes on main

### M1-02 Add `npm test` script if missing
- **Do:** Ensure `package.json` includes a working `"test": ...`
- **DoD:** `npm test` exits 0 locally

### M1-03 Add `npm run lint` stub (even if no lint yet)
- **Do:** Add `"lint": "node -e \"console.log('lint not configured')\""` temporarily
- **DoD:** CI runs `npm run lint` and passes

### M1-04 Add `npm run format:check` stub
- **Do:** Add `"format:check": "node -e \"console.log('format not configured')\""` temporarily
- **DoD:** CI runs `npm run format:check` and passes

### M1-05 Add smoke spec file
- **Do:** Create `specs/examples/smoke-feature.md` from template, minimal but valid
- **DoD:** `npm run validate-spec specs/examples/smoke-feature.md` passes

### M1-06 Add CI step: validate smoke spec
- **DoD:** CI runs validator on smoke spec

### M1-07 Add CI step: pipeline dry-run (even if noop)
- **Do:** Add CI step `npm run pipeline -- --dry-run specs/examples/smoke-feature.md`
- **DoD:** CI runs without failing (even if it prints “not supported”)

### M1-08 Add `.env.example` sanity
- **Do:** Ensure `.env.example` exists and includes required keys used by scripts
- **DoD:** Fresh clone + setup docs reference it

### M1-09 Add `STRICT_MODE` plumbing placeholder
- **Do:** Read env var and print it in pipeline startup log
- **DoD:** Run shows `STRICT_MODE=true/false`

### M1-10 Document “How CI works” in README
- **DoD:** README has a short section describing CI steps

---

## Milestone 2 — Run artifacts + resumable pipeline (16 tasks)

### A) Run directory + `run.json`

#### M2-01 Create `runs/` folder convention doc
- **DoD:** `runs/README.md` explains structure

#### M2-02 Implement `createRunDir()` helper
- **Do:** New module `spec-mas/src/run-state/run-dir.js`
- **DoD:** Unit test ensures directory is created and returns `{ runId, path }`

#### M2-03 Implement `run.json` schema (v1)
- **Do:** New `spec-mas/src/run-state/schema.js` with a versioned schema
- **DoD:** Unit test validates minimal object matches schema

#### M2-04 Write `initRunState(specPath)` to `runs/<id>/run.json`
- **DoD:** Unit test creates run state and asserts required keys exist

#### M2-05 Add `--run-id` option
- **DoD:** If provided, uses that directory; otherwise generates a new run ID

#### M2-06 Record spec hash in `run.json`
- **DoD:** Unit test: same spec → stable hash; modified spec → different hash

### B) Step interface + step state

#### M2-07 Introduce Step interface contract (minimal)
- **Do:** `name`, `run(ctx)`, `outputs`
- **DoD:** Runtime checks + unit test

#### M2-08 Add `steps/` folder with one real step wrapper
- **Do:** Wrap existing spec validation into `ValidateSpecStep`
- **DoD:** Integration test runs orchestrator with just this step

#### M2-09 Orchestrator executes steps sequentially + records status
- **DoD:** After run, `run.json` contains step statuses

#### M2-10 Write JSONL logger utility
- **Do:** `runs/<id>/logs.jsonl`
- **DoD:** Unit test appends two lines and parses them back

#### M2-11 Add “checkpoint” file per step
- **Do:** `runs/<id>/artifacts/<step>/done.json`
- **DoD:** Integration test verifies file exists after step completes

### C) Resume and partial runs

#### M2-12 Implement `--resume <runId>`
- **DoD:** If step 1 done, rerun skips it

#### M2-13 Implement `--from-step <name>`
- **DoD:** Steps before are marked “skipped” and re-run begins from given step

#### M2-14 Implement `--stop-after <name>`
- **DoD:** Orchestrator stops after step and exits 0

#### M2-15 Add `--list-steps`
- **DoD:** Prints available step names

#### M2-16 Add docs: Resume usage example
- **DoD:** README shows 3 example commands

---

## Milestone 3 — Test generation hardening (12 tasks)

### M3-01 Add “no placeholder assertion” checker script
- **Do:** `spec-mas/scripts/check-tests.js`
- **Rules:** fail if `expect(true).toBe(true)` or `TODO: Replace with actual assertions`
- **DoD:** Unit tests cover pass/fail cases

### M3-02 Wire checker into CI
- **DoD:** CI runs `npm run check-tests`

### M3-03 Add `check-tests` npm script
- **DoD:** Works locally

### M3-04 Make generator avoid absolute paths
- **Do:** Remove `/Users/...` style paths from generated comments
- **DoD:** Unit test asserts no `/Users/` in output

### M3-05 Ensure test templates generate unique test names
- **Problem:** duplicates exist in sample output
- **DoD:** Unit test: dedupe function ensures unique names

### M3-06 Deterministic Tests parsing function
- **Do:** Parse DT-* blocks from spec markdown
- **DoD:** Unit test: given spec string, extracts DT objects

### M3-07 Generate fixtures for DT tests
- **DoD:** Unit test: fixture file created with expected JSON

### M3-08 Generate assertions from DT expected output
- **DoD:** Unit test: test file contains deep equality assertion

### M3-09 Add a minimal “example app” harness
- **Do:** `examples/min-app/` with jest config
- **DoD:** `npm test` runs in the example folder

### M3-10 Add integration test: spec → tests → pass
- **DoD:** One deterministic DT test passes end-to-end

### M3-11 Wire `GenerateTestsStep` into pipeline
- **DoD:** Orchestrator run produces tests artifact path

### M3-12 Add docs: how DT tests map to code
- **DoD:** Short doc in `docs/`

---

## Milestone 4 — Agentic loop: run tests, patch, rerun (10 tasks)

### M4-01 Implement `RunTestsStep` (command runner wrapper)
- **DoD:** Integration test executes a sample `npm test` and captures output

### M4-02 Capture test failure summary
- **Do:** Parse jest output for failed test names + stack snippet
- **DoD:** Unit test: parser returns structured failures

### M4-03 Add `FixFailingTestsStep` skeleton (no AI yet)
- **Do:** If failures exist, writes “fix request” artifact and fails with clear message
- **DoD:** Integration test triggers failure and artifact created

### M4-04 Add “max fix iterations” config and plumbing
- **DoD:** `run.json` records iteration count

### M4-05 Add AI patch function contract (mockable)
- **Do:** `requestPatch({ failures, files }) -> patch plan`
- **DoD:** Unit test uses stub implementation

### M4-06 Implement patch application utility
- **Do:** Apply unified diffs safely; reject if file mismatch
- **DoD:** Unit tests: apply patch success + failure

### M4-07 Add fix loop in orchestrator
- **Do:** Run tests; if fail, patch; rerun; repeat
- **DoD:** Integration test: intentionally failing test gets fixed (using mocked patch)

### M4-08 Add “dry-run fix loop”
- **DoD:** Shows what it *would* patch without modifying files

### M4-09 Record each patch attempt as artifact
- **DoD:** `runs/<id>/artifacts/fix-attempt-001/...` exists

### M4-10 Docs: how to interpret fix loop outputs
- **DoD:** Short doc with paths and examples

---

## Milestone 5 — Multi-provider routing + budgets (7 tasks)

### M5-01 Centralize AI provider selection into `src/ai/client.js`
- **DoD:** All scripts import this instead of direct calls

### M5-02 Add routing map config file support
- **Do:** Optional `spec-mas.config.json`
- **DoD:** Unit test loads config and merges env defaults

### M5-03 Per-step model assignment
- **DoD:** `run.json` includes provider/model used per step

### M5-04 Retry/backoff wrapper
- **DoD:** Unit test confirms retries on transient errors

### M5-05 Provider fallback behavior
- **DoD:** Unit test simulates primary failure → uses secondary

### M5-06 Budget tracking: per run estimate
- **DoD:** `run.json` shows `estimated_cost_usd` (even if approximate)

### M5-07 Budget stop condition
- **DoD:** Over-budget run stops with clear exit code and message

---

## “Ready for Use” final tasks (3 tasks)

### R-01 Add `specmas` CLI entrypoint (thin wrapper)
- **DoD:** `npx specmas validate <spec>` works

### R-02 Add `PILOT-READINESS.md`
- **DoD:** Includes install, run, resume, artifacts, trust boundaries

### R-03 One-click “pilot demo” command
- **Do:** `npm run demo` runs smoke pipeline end-to-end
- **DoD:** Demo exits 0 and produces a run folder

---

## Important corrections / risk notes for Codex
- Don’t attempt a huge rewrite of orchestrator/scripts. Convert step-by-step into the new step interface.
- Make the “fix loop” use **mock AI** in tests (deterministic).
- Treat cost tracking as “best effort” until provider APIs return actual usage numbers.
