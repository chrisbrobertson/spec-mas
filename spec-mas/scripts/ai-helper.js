/**
 * Spec-MAS AI Helper
 *
 * Unified interface for AI API calls supporting:
 * - Claude CLI (local claude command)
 * - OpenAI API (ChatGPT)
 *
 * This abstraction allows easy switching between AI providers
 * and provides a consistent interface across the codebase.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  gray: '\x1b[90m'
};

/**
 * Call Claude using local CLI
 * Requires: claude CLI installed and configured
 *
 * @param {string} systemPrompt - System instructions for Claude
 * @param {string} userPrompt - User message/request
 * @param {object} options - Additional options (model, maxTokens, etc.)
 * @returns {Promise<object>} Response with content and token info
 */
async function callClaudeCLI(systemPrompt, userPrompt, options = {}) {
  try {
    // Create temp directory for prompts
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specmas-'));
    const promptFile = path.join(tempDir, 'prompt.txt');

    try {
      // Combine system prompt and user prompt into a single message
      // Claude CLI doesn't support --system flag, so we structure the prompt clearly
      let combinedPrompt;
      if (systemPrompt && systemPrompt.trim()) {
        combinedPrompt = `<SYSTEM_INSTRUCTIONS>
${systemPrompt}
</SYSTEM_INSTRUCTIONS>

<USER_PROMPT>
${userPrompt}
</USER_PROMPT>`;
      } else {
        combinedPrompt = userPrompt;
      }

      // Write combined prompt to temp file
      fs.writeFileSync(promptFile, combinedPrompt, 'utf8');

      // Build Claude CLI command
      // --print flag: required for non-interactive output (pipe-friendly)
      // --model flag: specify which Claude model to use
      const modelFlag = options.model ? `--model ${options.model}` : '';
      const maxBuffer = 50 * 1024 * 1024; // 50MB buffer for large responses

      // Execute Claude CLI with combined prompt via stdin
      // Use child_process spawn instead of execSync for better control
      const { spawnSync } = require('child_process');

      const npxResult = spawnSync('npx', ['claude', '--print', ...(modelFlag ? ['--model', options.model] : [])], {
        input: combinedPrompt,
        encoding: 'utf8',
        maxBuffer,
        stdio: ['pipe', 'pipe', 'pipe'] // stdin, stdout, stderr - capture all
      });

      if (npxResult.error) {
        throw npxResult.error;
      }

      // Check for actual errors (not just npm verbose output)
      if (npxResult.status !== 0) {
        // Parse stderr to find actual error (not npm verbose)
        const stderr = npxResult.stderr || '';
        const stdout = npxResult.stdout || '';
        const errorLines = stderr.split('\n').filter(line =>
          !line.includes('npm verbose') &&
          !line.includes('npm info') &&
          !line.includes('npm http') &&
          line.trim().length > 0
        );

        // Also check stdout for errors
        const stdoutErrorLines = stdout.split('\n').filter(line =>
          line.toLowerCase().includes('error') ||
          line.toLowerCase().includes('failed')
        );

        let actualError = 'Unknown error';
        if (errorLines.length > 0) {
          actualError = errorLines.slice(0, 5).join('\n'); // First 5 non-verbose error lines
        } else if (stdoutErrorLines.length > 0) {
          actualError = stdoutErrorLines.slice(0, 5).join('\n');
        }

        throw new Error(`Claude CLI exited with code ${npxResult.status}: ${actualError}`);
      }

      const result = npxResult.stdout;

      return {
        content: result.trim(),
        tokens: {
          input: 0,  // CLI doesn't provide token counts
          output: 0
        },
        provider: 'claude-cli',
        model: options.model || 'sonnet'
      };

    } finally {
      // Clean up temp files
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

  } catch (error) {
    // Check if it's a Claude CLI error
    if (error.message.includes('claude: command not found') ||
        error.message.includes('claude: not found')) {
      throw new Error(
        'Claude CLI not found. Install it with: npm install -g @anthropic-ai/cli\n' +
        'Then configure: claude config set api-key YOUR_KEY'
      );
    }

    // Include stderr if available for better debugging
    const errorMessage = error.stderr ?
      `${error.message}\nStderr: ${error.stderr}` :
      error.message;

    throw new Error(`Claude CLI error: ${errorMessage}`);
  }
}

/**
 * Call OpenAI ChatGPT API
 * Requires: OPENAI_API_KEY environment variable
 *
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - User message/request
 * @param {object} options - Additional options (model, temperature, etc.)
 * @returns {Promise<object>} Response with content and token info
 */
async function callChatGPT(systemPrompt, userPrompt, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY environment variable not set.\n' +
      'Add it to your .env file or export OPENAI_API_KEY=your-key'
    );
  }

  const model = options.model || 'gpt-4';
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens || 8192;

  try {
    const messages = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: userPrompt });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error (${response.status}): ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      tokens: {
        input: data.usage.prompt_tokens,
        output: data.usage.completion_tokens
      },
      provider: 'openai',
      model: data.model
    };

  } catch (error) {
    if (error.message.includes('fetch is not defined')) {
      throw new Error(
        'fetch is not available. Please use Node.js v18+ or install node-fetch.\n' +
        'Original error: ' + error.message
      );
    }
    throw error;
  }
}

/**
 * Unified AI call interface
 * Automatically selects provider based on configuration
 *
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - User message/request
 * @param {object} options - Options including provider selection
 * @returns {Promise<object>} Response with content and token info
 */
async function callAI(systemPrompt, userPrompt, options = {}) {
  const provider = options.provider || process.env.AI_PROVIDER || 'claude';
  const fallbackEnabled = options.fallback ?? (process.env.AI_FALLBACK_ENABLED === 'true');

  // Normalize provider name
  const normalizedProvider = provider.toLowerCase();

  try {
    if (normalizedProvider === 'claude' || normalizedProvider === 'claude-cli') {
      return await callClaudeCLI(systemPrompt, userPrompt, options);
    } else if (normalizedProvider === 'openai' || normalizedProvider === 'chatgpt' || normalizedProvider === 'gpt') {
      return await callChatGPT(systemPrompt, userPrompt, options);
    } else {
      throw new Error(
        `Unknown AI provider: ${provider}\n` +
        'Valid providers: claude, openai'
      );
    }
  } catch (error) {
    // Try fallback if enabled and primary provider failed
    if (fallbackEnabled && normalizedProvider === 'claude') {
      console.warn(
        colors.yellow +
        `Warning: Claude CLI failed (${error.message}), attempting OpenAI fallback...` +
        colors.reset
      );

      try {
        return await callChatGPT(systemPrompt, userPrompt, options);
      } catch (fallbackError) {
        throw new Error(
          `Both providers failed:\n` +
          `  Claude: ${error.message}\n` +
          `  OpenAI: ${fallbackError.message}`
        );
      }
    }

    throw error;
  }
}

/**
 * Calculate cost from token usage
 *
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @param {string} provider - Provider name ('claude' or 'openai')
 * @param {string} model - Model name
 * @returns {number} Estimated cost in USD
 */
function calculateCost(inputTokens, outputTokens, provider = 'claude', model = null) {
  // Pricing as of 2024 (per million tokens)
  const pricing = {
    'claude': {
      'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
      'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
      'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
      'default': { input: 3.00, output: 15.00 }
    },
    'openai': {
      'gpt-4': { input: 30.00, output: 60.00 },
      'gpt-4-turbo': { input: 10.00, output: 30.00 },
      'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
      'default': { input: 30.00, output: 60.00 }
    }
  };

  const providerPricing = pricing[provider.toLowerCase()] || pricing.claude;
  const modelPricing = providerPricing[model] || providerPricing.default;

  const inputCost = (inputTokens / 1000000) * modelPricing.input;
  const outputCost = (outputTokens / 1000000) * modelPricing.output;

  return inputCost + outputCost;
}

/**
 * Test AI provider availability
 *
 * @param {string} provider - Provider to test ('claude' or 'openai')
 * @returns {Promise<object>} Test result with success status and message
 */
async function testProvider(provider = 'claude') {
  try {
    const testPrompt = 'Reply with just the word "OK" if you can read this.';
    const result = await callAI('You are a test assistant.', testPrompt, {
      provider,
      fallback: false,
      maxTokens: 10
    });

    return {
      success: true,
      provider: result.provider,
      model: result.model,
      message: 'Provider is available and responding'
    };
  } catch (error) {
    return {
      success: false,
      provider,
      error: error.message,
      message: `Provider test failed: ${error.message}`
    };
  }
}

/**
 * Get current AI configuration
 *
 * @returns {object} Current configuration including provider, model, etc.
 */
function getAIConfig() {
  return {
    provider: process.env.AI_PROVIDER || 'claude',
    model: {
      claude: process.env.AI_MODEL_CLAUDE || 'sonnet',
      openai: process.env.AI_MODEL_OPENAI || 'gpt-4'
    },
    fallbackEnabled: process.env.AI_FALLBACK_ENABLED === 'true',
    apiKeys: {
      openai: !!process.env.OPENAI_API_KEY
    }
  };
}

module.exports = {
  callAI,
  callClaudeCLI,
  callChatGPT,
  calculateCost,
  testProvider,
  getAIConfig
};
