# Spec-MAS Specification Assistant Package

## Overview
This package contains everything needed to deploy the Spec-MAS Specification Assistant across multiple platforms:
- Claude Project (primary interface)
- Slack Bot integration
- Web UI implementation

## Package Contents

### Core Files
- `system-prompt.md` - Main Claude system prompt and behavior instructions
- `maturity-model.md` - Specification maturity level definitions
- `complexity-assessment.md` - Rules for determining feature complexity
- `validation-rules.md` - Automated validation criteria

### Templates
- `templates/` - Interaction templates and response formats
- `examples/` - Example specifications at each maturity level

### Implementation
- `slack-bot/` - Slack bot implementation
- `web-ui/` - Basic web interface
- `api/` - Backend API for web UI

## Quick Start

### 1. Claude Project Setup
1. Create new Claude Project
2. Add all files from `/claude-project/` to project knowledge
3. Set `system-prompt.md` as the primary instruction

### 2. Slack Bot Deployment
1. Create Slack app at api.slack.com
2. Configure environment variables (see `slack-bot/.env.example`)
3. Deploy `slack-bot/handler.js` to your server
4. Add bot to workspace

### 3. Web UI Deployment
1. Configure API endpoint in `web-ui/config.js`
2. Deploy backend from `api/`
3. Host `web-ui/index.html` on your web server

## Key Concepts

### Maturity Levels
- **Level 1**: Basic user stories + acceptance criteria
- **Level 2**: Technical constraints + integrations
- **Level 3**: Error handling + performance (minimum for easy features)
- **Level 4**: Architecture + compliance (required for moderate)
- **Level 5**: Examples + edge cases (required for complex)

### Complexity Assessment
- **Easy**: CRUD operations, basic UI → Level 3 required
- **Moderate**: Integrations, workflows → Level 4 required
- **High**: Architecture, security, compliance → Level 5 required

## Support
For questions or issues, consult the Spec-MAS documentation or the implementation guides in each subdirectory.
