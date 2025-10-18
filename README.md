# Spec-MAS v2.0: Security-First Update Package

## Overview

This package contains the complete Spec-MAS v2.0 update that introduces:
- Formal Verification Templates for complex specifications
- Defense-in-Depth Validation Gates with progressive validation
- Adversarial Spec Review system for pre-implementation security

## Quick Start

1. **Install the update:**
   ```bash
   pip install -r requirements.txt
   npm install
   ```

2. **Run the migration script:**
   ```bash
   python scripts/migrate_to_v2.py
   ```

3. **Initialize a new v2 spec:**
   ```bash
   specmas spec create my-feature --level 3 --template business-logic
   ```

4. **Validate with gates:**
   ```bash
   specmas validate specs/my-feature.yaml --gates all
   ```

5. **Run adversarial review:**
   ```bash
   specmas adversarial review specs/my-feature.yaml
   ```

## Directory Structure

```
specmas-v2-update/
├── README.md                      # This file
├── CHANGELOG.md                   # What's new in v2.0
├── requirements.txt               # Python dependencies
├── package.json                   # Node dependencies
├── .specmas/                      # Configuration directory
│   ├── config.yaml               # Main configuration
│   └── templates/                # Spec templates
├── specmas/                      # Core Python implementation
│   ├── validation/               # Validation gates
│   ├── adversarial/              # Adversarial review system
│   └── cli/                      # CLI commands
├── workflows/                    # CI/CD workflows
├── examples/                     # Example specifications
└── docs/                        # Extended documentation
```

## Key Features

### 1. Formal Verification Templates
- Structured YAML templates for security-critical specs
- Enforced invariants and forbidden operations
- Deterministic test cases with checksums

### 2. Defense-in-Depth Validation
- 4-level progressive validation gates
- Automated CI/CD integration
- Comprehensive coverage analysis

### 3. Adversarial Review System
- 5 specialized adversary agents
- Human review interface
- Automated finding incorporation

## Migration Guide

For existing Spec-MAS users, see [docs/migration-guide.md](docs/migration-guide.md)

## License

Apache 2.0 - See LICENSE file
