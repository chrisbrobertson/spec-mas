# Spec-MAS Runs Directory

Each pipeline execution creates a run folder: `runs/<run-id>/`.

Structure:

- `run.json` — run metadata, spec hash, step status (schema v1)
- `logs.jsonl` — JSONL event log for the run
- `artifacts/<step>/done.json` — checkpoint marker per completed step

Run IDs are generated as timestamps with a short random suffix unless explicitly
provided via `--run-id`.
