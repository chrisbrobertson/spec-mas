# Migration Guide: Claude CLI Integration

This guide explains the changes made to migrate Spec-MAS from using the Anthropic SDK to the Claude CLI.

## What Changed?

### Summary

- **Removed**: Direct dependency on `@anthropic-ai/sdk`
- **Added**: Claude CLI integration via `scripts/ai-helper.js`
- **Added**: OpenAI API support as alternative/fallback
- **Updated**: All AI-calling scripts to use unified interface

### Benefits

1. **Simpler Setup**: No API key management in environment variables for Claude
2. **Flexibility**: Easy switching between Claude CLI and OpenAI API
3. **Better Auth**: Claude CLI handles authentication automatically
4. **Fallback Support**: Optional automatic fallback to OpenAI if Claude fails
5. **Local Config**: Uses your existing `claude` CLI configuration

## Files Modified

### Created

- `/Users/chrisrobertson/repos/Spec-MAS/scripts/ai-helper.js` - Unified AI interface

### Updated

- `/Users/chrisrobertson/repos/Spec-MAS/scripts/implement-spec.js` - Now uses Claude CLI
- `/Users/chrisrobertson/repos/Spec-MAS/scripts/review-spec.js` - Now uses Claude CLI
- `/Users/chrisrobertson/repos/Spec-MAS/scripts/ai-enhance-tests.js` - Now uses Claude CLI
- `/Users/chrisrobertson/repos/Spec-MAS/scripts/config-manager.js` - Added AI provider config
- `/Users/chrisrobertson/repos/Spec-MAS/.env.example` - Updated with new variables
- `/Users/chrisrobertson/repos/Spec-MAS/package.json` - Removed @anthropic-ai/sdk

## Migration Steps

### For Existing Users

#### Option 1: Use Claude CLI (Recommended)

1. **Install Claude CLI** (if not already installed):
   ```bash
   npm install -g @anthropic-ai/cli
   ```

2. **Configure Claude CLI** (one-time setup):
   ```bash
   claude config set api-key YOUR_ANTHROPIC_API_KEY
   ```

3. **Update your .env file**:
   ```bash
   # Remove or comment out (no longer needed for Claude CLI):
   # ANTHROPIC_API_KEY=sk-ant-api03-...

   # Add (optional, defaults to 'claude'):
   AI_PROVIDER=claude
   AI_MODEL_CLAUDE=claude-3-5-sonnet-20241022
   ```

4. **Remove old dependency and install new ones**:
   ```bash
   npm install
   ```

5. **Test the setup**:
   ```bash
   # Verify Claude CLI is working
   echo "Say hello" | claude

   # Test with a dry run
   npm run implement-spec specs/your-spec.md --dry-run
   ```

#### Option 2: Use OpenAI API

1. **Get OpenAI API Key** from https://platform.openai.com/api-keys

2. **Update your .env file**:
   ```bash
   AI_PROVIDER=openai
   AI_MODEL_OPENAI=gpt-4
   OPENAI_API_KEY=sk-...
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

#### Option 3: Use Both with Fallback

1. **Setup both providers** (follow steps above)

2. **Enable fallback in .env**:
   ```bash
   AI_PROVIDER=claude
   AI_FALLBACK_ENABLED=true
   OPENAI_API_KEY=sk-...
   ```

   Now if Claude CLI fails, it will automatically try OpenAI.

### For New Users

1. **Clone the repository**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup Claude CLI**:
   ```bash
   npm install -g @anthropic-ai/cli
   claude config set api-key YOUR_KEY
   ```

4. **Copy .env.example**:
   ```bash
   cp .env.example .env
   ```

5. **You're ready to go!**

## Environment Variables Reference

### New Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `claude` | AI provider: `claude` or `openai` |
| `AI_MODEL_CLAUDE` | `claude-3-5-sonnet-20241022` | Claude model to use |
| `AI_MODEL_OPENAI` | `gpt-4` | OpenAI model to use |
| `AI_FALLBACK_ENABLED` | `false` | Enable fallback to OpenAI if Claude fails |
| `OPENAI_API_KEY` | - | OpenAI API key (required if using OpenAI) |

### Legacy Variables (Still Supported)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Only used if manually configuring SDK usage |
| `SPECMAS_REVIEWER_MODEL` | Legacy model selection (now use AI_MODEL_CLAUDE) |
| `SPECMAS_MAX_TOKENS` | Still used for max tokens per request |

## Code Examples

### Using the AI Helper

If you're extending Spec-MAS with custom scripts:

```javascript
const { callAI, calculateCost } = require('./scripts/ai-helper');

// Basic usage - uses default provider from AI_PROVIDER
async function myFunction() {
  const result = await callAI(
    'You are a helpful assistant.',  // system prompt
    'What is 2+2?',                   // user prompt
    {
      provider: 'claude',  // optional, defaults to AI_PROVIDER
      model: 'claude-3-5-sonnet-20241022',  // optional
      maxTokens: 1000,     // optional
      fallback: true       // optional, enable fallback
    }
  );

  console.log(result.content);
  console.log(`Used ${result.tokens.input} input tokens`);
  console.log(`Used ${result.tokens.output} output tokens`);

  // Calculate cost
  const cost = calculateCost(
    result.tokens.input,
    result.tokens.output,
    result.provider,
    result.model
  );
  console.log(`Cost: $${cost.toFixed(4)}`);
}
```

### Direct Provider Calls

```javascript
const { callClaudeCLI, callChatGPT } = require('./scripts/ai-helper');

// Direct Claude CLI call
const claudeResult = await callClaudeCLI(
  'System prompt',
  'User prompt',
  { model: 'claude-3-5-sonnet-20241022' }
);

// Direct OpenAI call
const openaiResult = await callChatGPT(
  'System prompt',
  'User prompt',
  { model: 'gpt-4', temperature: 0.7 }
);
```

## Troubleshooting

### "Claude CLI not found"

**Solution**: Install the Claude CLI:
```bash
npm install -g @anthropic-ai/cli
```

### "Claude CLI authentication error"

**Solution**: Configure your API key:
```bash
claude config set api-key YOUR_KEY
```

### "OPENAI_API_KEY not set"

**Solution**: Either:
1. Add to .env: `OPENAI_API_KEY=sk-...`
2. Or switch to Claude: `AI_PROVIDER=claude`

### "fetch is not defined"

**Solution**: Upgrade to Node.js v18 or higher:
```bash
node --version  # Should be >= 18.0.0
```

### Scripts still looking for ANTHROPIC_API_KEY

**Solution**: You may have cached environment variables. Try:
```bash
# Clear and restart
unset ANTHROPIC_API_KEY
source .env
```

## Testing

### Test Claude CLI

```bash
# Simple test
echo "Say hello" | claude

# Test with system prompt
claude --system "You are a helpful assistant" "What is 2+2?"
```

### Test Spec-MAS Integration

```bash
# Test implementation (dry-run, no API calls)
npm run implement-spec specs/example.md --dry-run

# Test review system
npm run review-spec specs/example.md --summary
```

### Verify Provider

The scripts will now show which provider they're using:
```
AI Provider: Claude CLI
(Ensure Claude CLI is configured: claude config set api-key YOUR_KEY)
```

or

```
AI Provider: OpenAI (ChatGPT)
```

## Rollback

If you need to rollback to the old SDK approach:

1. **Restore package.json**:
   ```bash
   git checkout HEAD -- package.json
   npm install
   ```

2. **Restore modified scripts**:
   ```bash
   git checkout HEAD -- scripts/implement-spec.js
   git checkout HEAD -- scripts/review-spec.js
   git checkout HEAD -- scripts/ai-enhance-tests.js
   ```

3. **Set ANTHROPIC_API_KEY**:
   ```bash
   export ANTHROPIC_API_KEY=your-key
   ```

## FAQ

### Q: Do I need to keep ANTHROPIC_API_KEY in .env?

**A**: No, if you're using Claude CLI, it handles authentication. You only need OPENAI_API_KEY if using OpenAI.

### Q: Can I use both providers simultaneously?

**A**: Not simultaneously, but you can switch between them by changing `AI_PROVIDER` in .env, or enable fallback with `AI_FALLBACK_ENABLED=true`.

### Q: Will this affect cost tracking?

**A**: Claude CLI doesn't return token counts, so token-based cost tracking won't work. However, all your requests are still tracked in your Claude dashboard at console.anthropic.com.

### Q: Which provider should I use?

**A**:
- **Claude CLI**: Simpler setup, better for local development
- **OpenAI**: Good for production, includes token counts
- **Both with fallback**: Maximum reliability

### Q: Do I need to change my existing specs?

**A**: No! All specs remain compatible. Only the underlying AI integration changed.

## Support

If you encounter issues:

1. Check this migration guide
2. Review the updated `.env.example`
3. Test your AI provider independently
4. Check the console output for provider confirmation
5. Open an issue on GitHub with details

## Changes by File

### /Users/chrisrobertson/repos/Spec-MAS/scripts/ai-helper.js (NEW)

Unified AI interface supporting:
- Claude CLI integration
- OpenAI API integration
- Automatic fallback
- Cost calculation
- Provider testing

### /Users/chrisrobertson/repos/Spec-MAS/scripts/implement-spec.js

**Before**:
```javascript
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const message = await client.messages.create({...});
```

**After**:
```javascript
const { callAI } = require('./ai-helper');
const result = await callAI(systemPrompt, userPrompt, { provider, model });
```

### /Users/chrisrobertson/repos/Spec-MAS/scripts/review-spec.js

**Before**:
```javascript
const client = new Anthropic({ apiKey });
const message = await client.messages.create({...});
```

**After**:
```javascript
const { callAI, calculateCost } = require('./ai-helper');
const result = await callAI('', fullPrompt, options);
```

### /Users/chrisrobertson/repos/Spec-MAS/scripts/ai-enhance-tests.js

**Before**:
```javascript
const client = new Anthropic({ apiKey });
const response = await client.messages.create({...});
```

**After**:
```javascript
const { callAI } = require('./ai-helper');
const response = await callAI(systemPrompt, userPrompt, config);
```

## Next Steps

1. Test your existing workflows
2. Consider enabling OpenAI fallback for production
3. Update any custom scripts to use `ai-helper.js`
4. Remove old environment variables from your .env
5. Update your team's documentation

---

**Migration Date**: 2025-10-25
**Version**: Spec-MAS v3.0 with Claude CLI Integration
