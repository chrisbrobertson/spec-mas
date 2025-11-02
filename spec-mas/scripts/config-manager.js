/**
 * Spec-MAS Configuration Manager
 * Manages hierarchical configuration: defaults → global → project → env → CLI
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Default configuration
const DEFAULT_CONFIG = {
  api: {
    anthropic_key: null,
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8192,
    temperature: 0.7
  },
  ai: {
    provider: 'claude',  // 'claude' or 'openai'
    claude_model: 'claude-3-5-sonnet-20241022',
    openai_model: 'gpt-4',
    fallback_to_openai: false  // If Claude CLI fails, try OpenAI
  },
  costs: {
    budget_warning: 10.00,
    budget_limit: 50.00,
    input_token_cost: 3.00,  // per 1M tokens
    output_token_cost: 15.00  // per 1M tokens
  },
  output: {
    directory: 'implementation-output',
    tests_directory: 'tests/generated',
    reports_directory: '.'
  },
  validation: {
    strict_mode: false,
    coverage_threshold: 80,
    security_threshold: 7
  },
  git: {
    auto_commit: true,
    auto_branch: true,
    branch_prefix: 'feat/spec-'
  },
  pipeline: {
    parallel_execution: false,
    auto_resume: true,
    checkpoint_enabled: true
  },
  review: {
    default_reviewers: ['security-red-team', 'architecture', 'qa'],
    parallel_reviews: false
  }
};

/**
 * Configuration Manager Class
 */
class ConfigManager {
  constructor() {
    this.globalConfigPath = path.join(os.homedir(), '.specmas', 'config.json');
    this.projectConfigPath = path.join(process.cwd(), '.specmas', 'config.json');
  }

  /**
   * Get configuration with hierarchy: defaults → global → project → env → CLI
   */
  getConfig() {
    let config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)); // Deep clone

    // Merge global config
    const globalConfig = this.loadGlobalConfig();
    if (globalConfig) {
      config = this.deepMerge(config, globalConfig);
    }

    // Merge project config
    const projectConfig = this.loadProjectConfig();
    if (projectConfig) {
      config = this.deepMerge(config, projectConfig);
    }

    // Override with environment variables
    config = this.applyEnvOverrides(config);

    return config;
  }

  /**
   * Load global config from ~/.specmas/config.json
   */
  loadGlobalConfig() {
    if (fs.existsSync(this.globalConfigPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.globalConfigPath, 'utf8'));
      } catch (error) {
        console.warn('Warning: Could not parse global config file');
      }
    }
    return null;
  }

  /**
   * Load project config from .specmas/config.json
   */
  loadProjectConfig() {
    if (fs.existsSync(this.projectConfigPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.projectConfigPath, 'utf8'));
      } catch (error) {
        console.warn('Warning: Could not parse project config file');
      }
    }
    return null;
  }

  /**
   * Apply environment variable overrides
   */
  applyEnvOverrides(config) {
    // API key from environment
    if (process.env.ANTHROPIC_API_KEY) {
      config.api.anthropic_key = process.env.ANTHROPIC_API_KEY;
    }

    // Model from environment
    if (process.env.ANTHROPIC_MODEL) {
      config.api.model = process.env.ANTHROPIC_MODEL;
    }

    // Budget from environment
    if (process.env.SPECMAS_BUDGET) {
      config.costs.budget_limit = parseFloat(process.env.SPECMAS_BUDGET);
    }

    return config;
  }

  /**
   * Get a specific config value by dot notation path
   * Example: get('api.model') returns 'claude-3-5-sonnet-20241022'
   */
  get(key) {
    const config = this.getConfig();
    return this.getNestedValue(config, key);
  }

  /**
   * Set a config value by dot notation path
   * Example: set('api.model', 'claude-3-opus-20240229')
   */
  set(key, value, global = false) {
    const configPath = global ? this.globalConfigPath : this.projectConfigPath;
    const configDir = path.dirname(configPath);

    // Ensure directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Load existing config
    let config = {};
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (error) {
        console.warn('Warning: Could not parse existing config file, creating new one');
      }
    }

    // Set nested value
    this.setNestedValue(config, key, value);

    // Save config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Reset config to defaults
   */
  reset(global = false) {
    const configPath = global ? this.globalConfigPath : this.projectConfigPath;

    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  /**
   * Set nested value in object using dot notation
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Deep merge two objects
   */
  deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  /**
   * Check if value is an object
   */
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Validate configuration
   */
  validate(config) {
    const errors = [];

    // Check required fields
    if (!config.api.model) {
      errors.push('api.model is required');
    }

    // Validate budget values
    if (config.costs.budget_limit < 0) {
      errors.push('costs.budget_limit must be positive');
    }

    // Validate thresholds
    if (config.validation.coverage_threshold < 0 || config.validation.coverage_threshold > 100) {
      errors.push('validation.coverage_threshold must be between 0 and 100');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Export config to file
   */
  export(outputPath) {
    const config = this.getConfig();
    fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
  }

  /**
   * Import config from file
   */
  import(inputPath, global = false) {
    const config = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const configPath = global ? this.globalConfigPath : this.projectConfigPath;
    const configDir = path.dirname(configPath);

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Initialize project config with defaults
   */
  initProject(options = {}) {
    const configDir = path.join(process.cwd(), '.specmas');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

    // Apply options
    if (options.model) config.api.model = options.model;
    if (options.budget) config.costs.budget_limit = options.budget;
    if (options.outputDir) config.output.directory = options.outputDir;

    fs.writeFileSync(
      this.projectConfigPath,
      JSON.stringify(config, null, 2)
    );

    return this.projectConfigPath;
  }
}

module.exports = { ConfigManager, DEFAULT_CONFIG };
