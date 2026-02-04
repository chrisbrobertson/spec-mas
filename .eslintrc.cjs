module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  extends: ['eslint:recommended'],
  rules: {
    'no-unused-vars': 'warn',
    'no-constant-condition': 'off'
  },
  ignorePatterns: [
    'node_modules/',
    'implementation-output/',
    'runs/',
    'tests/',
    'tests-auth/',
    'examples/',
    'specs/',
    'spec-mas/scripts/',
    'spec-mas/templates/',
    'spec-mas/tests/',
    'spec-mas/docs/',
    'spec-mas/agents/',
    'spec-mas/src/architecture/',
    'test-architecture-analyzer.js'
  ]
};
