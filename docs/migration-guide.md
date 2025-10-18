# Migration Guide: Spec-MAS v1 to v2

## Overview

Spec-MAS v2.0 introduces security-first enhancements that require changes to existing specifications and workflows. This guide helps teams migrate from v1 to v2 with minimal disruption.

## Key Changes

### 1. Specification Format Changes

#### v1 Format (Markdown)
```markdown
# Feature: User Authentication

## User Stories
- As a user, I want to log in

## Requirements
- System should authenticate users
- Passwords should be secure
```

#### v2 Format (Structured YAML)
```yaml
apiVersion: specmas/v2
kind: SecurityCriticalSpec  # or BusinessLogicSpec, SimpleSpec
metadata:
  name: user-authentication
  level: 4  # Complexity level 1-5
  security_classification: HIGH

specification:
  formal_requirements:  # NEW in v2
    invariants:
      preconditions:
        - "User MUST be registered"
      postconditions:
        - "Session token MUST be created"
```

### 2. New Required Sections

#### Security-Critical Specs (Level 5)
- `formal_requirements` section is MANDATORY
- `deterministic_tests` with checksums required
- `forbidden_operations` must be explicitly listed
- `security_requirements` section required

#### Business Logic Specs (Level 3-4)
- `invariants` section recommended
- `error_handling` section required
- `rollback_procedures` for complex operations

### 3. Workflow Changes

#### Old Workflow (v1)
1. Write spec
2. Generate tests
3. Implement
4. Review

#### New Workflow (v2)
1. Write spec
2. **Progressive validation gates (NEW)**
3. **Adversarial review (NEW)**
4. Generate tests
5. Implement with checkpoints
6. Review

## Step-by-Step Migration

### Step 1: Assess Your Specs

Run the migration analyzer:
```bash
python scripts/analyze_v1_specs.py specs/
```

This will generate a report:
```
Migration Analysis Report
========================
Total specs: 45
Simple (Level 1-2): 20 specs - No changes needed
Business Logic (Level 3-4): 20 specs - Minor updates required  
Security-Critical (Level 5): 5 specs - Full migration required
```

### Step 2: Migrate Specs by Level

#### Level 1-2 (Simple Specs)
No migration required. These can remain as markdown files.

#### Level 3-4 (Business Logic)
Use the semi-automated migration:
```bash
python scripts/migrate_to_v2.py --level 3 specs/my-feature.md
```

Manual additions needed:
- Add `invariants` section
- Define error handling explicitly
- Add performance requirements

#### Level 5 (Security-Critical)
Requires manual migration using the template:
```bash
cp .specmas/templates/security-critical-template.yaml specs/new-feature.yaml
# Manually populate the template
```

### Step 3: Update CI/CD Pipeline

Replace old validation:
```yaml
# OLD (v1)
- name: Validate spec
  run: specify validate specs/
```

With new validation gates:
```yaml
# NEW (v2)
- uses: ./.github/workflows/validation-pipeline.yml
  with:
    spec_path: specs/
```

### Step 4: Configure Adversarial Review

Add to your PR workflow:
```yaml
# .github/workflows/pr-review.yml
on:
  pull_request:
    types: [labeled]

jobs:
  adversarial-review:
    if: contains(github.event.label.name, 'ready-for-adversarial-review')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: python specmas/adversarial/review.py ${{ github.event.pull_request.files }}
```

### Step 5: Update Team Processes

#### Training Required
- 2-hour workshop on formal requirements
- 1-hour session on adversarial review process
- Hands-on practice with validation gates

#### New Roles
- **Spec Reviewer**: Reviews validation gate results
- **Security Champion**: Reviews adversarial findings
- **Migration Lead**: Coordinates v1 to v2 transition

## Migration Timeline

### Week 1-2: Preparation
- Install v2 tools
- Run migration analyzer
- Train team on new features

### Week 3-4: Pilot Migration
- Migrate 2-3 simple specs
- Test validation gates
- Run first adversarial reviews

### Week 5-8: Gradual Migration
- Migrate Level 3-4 specs (5 per week)
- Update CI/CD pipelines
- Monitor validation results

### Week 9-12: Security-Critical Migration
- Carefully migrate Level 5 specs
- Full security review
- Compliance validation

### Week 13+: Full v2 Operation
- All new specs use v2
- Legacy specs migrated
- Retrospective and optimization

## Common Migration Issues

### Issue 1: Validation Gate Failures
**Problem**: Specs that passed v1 validation fail v2 gates.

**Solution**: 
```bash
# Run diagnostic mode
python specmas/validation/gates.py specs/my-spec.yaml --diagnostic

# This shows exactly what's missing
Missing: security_requirements section
Missing: performance bounds
Ambiguous: "should" in requirement FR-3
```

### Issue 2: Adversarial Review Overload
**Problem**: Too many findings from adversarial review.

**Solution**: Start with lower-sensitivity settings:
```yaml
# .specmas/config.yaml
adversarial_review:
  sensitivity: low  # Start here
  # sensitivity: medium
  # sensitivity: high
```

### Issue 3: Checksum Mismatches
**Problem**: Deterministic tests fail checksum validation.

**Solution**: Regenerate checksums after migration:
```bash
python scripts/regenerate_checksums.py specs/my-spec.yaml
```

## Rollback Plan

If migration issues occur:

### Partial Rollback
Keep v2 for new specs, maintain v1 for existing:
```yaml
# .specmas/config.yaml
version: 2.0
compatibility_mode: true  # Allows v1 specs
v1_paths:
  - specs/legacy/
v2_paths:
  - specs/new/
```

### Full Rollback
```bash
# Revert to v1
git checkout v1-stable
pip install -r requirements-v1.txt

# Restore v1 CI/CD
git checkout v1-stable -- .github/workflows/
```

## Migration Validation Checklist

### Pre-Migration
- [ ] All v1 specs passing current validation
- [ ] Team trained on v2 features
- [ ] Backup of all specifications
- [ ] CI/CD pipeline documented

### During Migration
- [ ] Migration analyzer run successfully
- [ ] Level 1-2 specs identified (no change)
- [ ] Level 3-4 specs migrated with script
- [ ] Level 5 specs manually migrated
- [ ] Validation gates configured
- [ ] Adversarial review tested

### Post-Migration
- [ ] All specs pass v2 validation
- [ ] CI/CD pipeline updated
- [ ] Team using new workflow
- [ ] Metrics dashboard updated
- [ ] Retrospective completed

## Getting Help

### Resources
- [Full v2 Documentation](docs/v2-features.md)
- [Template Reference](docs/templates.md)
- [Validation Gate Guide](docs/validation-gates.md)
- [Adversarial Review Guide](docs/adversarial-review.md)

### Support Channels
- Slack: #specmas-v2-migration
- Email: specmas-support@company.com
- Office Hours: Tuesdays 2-3pm

### FAQ

**Q: Can v1 and v2 specs coexist?**
A: Yes, use compatibility_mode in config.yaml.

**Q: How long does migration take?**
A: 2-3 months for typical teams (50-100 specs).

**Q: Are v2 features optional?**
A: Validation gates are mandatory. Adversarial review is required for Level 4-5 specs only.

**Q: Can we automate more of the migration?**
A: Level 1-4 specs can be 70% automated. Level 5 requires manual review for security.

## Success Metrics

Track these metrics during migration:
- Specs migrated per week
- Validation gate pass rate
- Adversarial findings per spec
- Time to migrate per spec
- Team satisfaction score

Target metrics:
- Migration rate: 10+ specs/week
- First-pass validation: >80%
- Adversarial findings: <5 per spec
- Migration time: <2 hours per spec

## Conclusion

Spec-MAS v2 migration requires investment but delivers:
- 50% fewer security vulnerabilities
- 40% faster spec approval
- 60% better spec quality
- 30% reduced implementation errors

Start with simple specs, gradually increase complexity, and leverage automation where possible.
