# Spec-MAS Pilot Readiness

## Install

```
npm install
```

## Run

```
specmas run specs/examples/smoke-feature.md
```

## Resume

```
specmas run specs/examples/smoke-feature.md --resume <run-id>
```

## Artifacts

- Runs: `runs/<run-id>/run.json`
- Logs: `runs/<run-id>/logs.jsonl`
- Checkpoints: `runs/<run-id>/artifacts/<step>/done.json`
- Fix attempts: `runs/<run-id>/artifacts/fix-attempt-001/`

## Trust Boundaries

- Spec-MAS executes local scripts and writes files under the repo.
- AI-generated outputs should be reviewed before merging or deploying.
- Fix-loop patches are applied only when enabled; use `--dry-run-fix` to inspect first.
