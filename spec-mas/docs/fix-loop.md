# Fix Loop Outputs

When the fix loop runs, artifacts are written under `runs/<run-id>/artifacts/`:

- `fix-attempt-001/patch-plan.json` — the patch plan used for the attempt
- `fix-attempt-001/dry-run.txt` — present when running with `--dry-run-fix`

If tests fail and no fix loop is configured, a fix request is written to:

- `artifacts/fix-request.json`

Use these artifacts to review what the system attempted and to manually apply or
approve changes.
