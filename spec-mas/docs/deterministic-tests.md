# Deterministic Tests (DT) Mapping

Deterministic tests in specs (DT-* blocks) map to generated test cases and fixtures:

1. Each `DT-<n>` block becomes a fixture in `tests/deterministic/fixtures/DT-<n>.json`.
2. The generated test file (`tests/deterministic/<feature>.deterministic.test.js`) loads fixtures and
   asserts deep equality against `expected` or `output` when provided.
3. If neither `expected` nor `output` are present, the generator falls back to snapshots.

Example DT block:

```json
DT-1
{
  "input": { "value": 1 },
  "expected": { "value": 1 }
}
```

Generated test behavior:
- loads `fixtures/DT-1.json`
- runs the system under test with `input`
- asserts `result` deep-equals `expected`
