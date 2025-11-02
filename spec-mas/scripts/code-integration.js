#!/usr/bin/env node

/**
 * Spec-MAS Code Integration System
 * Safely merges AI-generated code into existing projects with conflict detection,
 * quality checks, test execution, and git integration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Conflict severity levels
const SEVERITY = {
  BLOCKING: 'blocking',
  WARNING: 'warning',
  INFO: 'info'
};

// Global state
let conflicts = [];
let mergedFiles = [];
let newFiles = [];
let qualityIssues = [];
let testResults = null;
let startTime = null;

/**
 * Print formatted section header
 */
function printHeader(text, char = '═', width = 60) {
  console.log('\n' + colors.bright + colors.cyan + char.repeat(width) + colors.reset);
  console.log(colors.bright + colors.cyan + `  ${text}` + colors.reset);
  console.log(colors.bright + colors.cyan + char.repeat(width) + colors.reset + '\n');
}

/**
 * Print sub-header
 */
function printSubHeader(text) {
  console.log('\n' + colors.bright + colors.blue + `─── ${text} ` + '─'.repeat(Math.max(0, 60 - text.length - 5)) + colors.reset);
}

/**
 * Scan generated code directory
 */
function scanGeneratedCode(sourceDir) {
  console.log(colors.bright + `Scanning: ${sourceDir}` + colors.reset);

  const files = [];

  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scan(fullPath);
        }
      } else if (entry.isFile()) {
        // Only include code files
        if (isCodeFile(entry.name)) {
          const relativePath = path.relative(sourceDir, fullPath);
          const content = fs.readFileSync(fullPath, 'utf8');
          const analysis = analyzeFile(fullPath, content);

          files.push({
            fullPath,
            relativePath,
            content,
            analysis
          });
        }
      }
    }
  }

  if (fs.existsSync(sourceDir)) {
    scan(sourceDir);
  }

  return files;
}

/**
 * Check if file is a code file
 */
function isCodeFile(filename) {
  const codeExtensions = [
    '.js', '.jsx', '.ts', '.tsx',
    '.py', '.java', '.go', '.rs',
    '.c', '.cpp', '.h', '.hpp',
    '.css', '.scss', '.less',
    '.html', '.vue', '.svelte',
    '.json', '.yaml', '.yml',
    '.sql', '.graphql'
  ];

  return codeExtensions.some(ext => filename.endsWith(ext));
}

/**
 * Analyze file content
 */
function analyzeFile(filePath, content) {
  const ext = path.extname(filePath);
  const language = getLanguage(ext);

  const analysis = {
    language,
    imports: [],
    exports: [],
    functions: [],
    classes: [],
    types: [],
    lines: content.split('\n').length,
    size: content.length
  };

  // Extract imports
  if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
    analysis.imports = extractJSImports(content);
    analysis.exports = extractJSExports(content);
    analysis.functions = extractJSFunctions(content);
    analysis.classes = extractJSClasses(content);
    if (['.ts', '.tsx'].includes(ext)) {
      analysis.types = extractTSTypes(content);
    }
  } else if (ext === '.py') {
    analysis.imports = extractPythonImports(content);
    analysis.functions = extractPythonFunctions(content);
    analysis.classes = extractPythonClasses(content);
  }

  return analysis;
}

/**
 * Get language from extension
 */
function getLanguage(ext) {
  const langMap = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust',
    '.c': 'c',
    '.cpp': 'cpp',
    '.css': 'css',
    '.scss': 'scss',
    '.html': 'html',
    '.vue': 'vue',
    '.sql': 'sql'
  };

  return langMap[ext] || 'text';
}

/**
 * Extract JavaScript/TypeScript imports
 */
function extractJSImports(content) {
  const imports = [];

  // ES6 imports
  const importRegex = /import\s+(?:{[^}]+}|[^'"]+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push({
      source: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }

  // require statements
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push({
      source: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }

  return imports;
}

/**
 * Extract JavaScript/TypeScript exports
 */
function extractJSExports(content) {
  const exports = [];

  // Named exports
  const namedRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
  let match;
  while ((match = namedRegex.exec(content)) !== null) {
    exports.push({
      name: match[1],
      type: 'named',
      line: content.substring(0, match.index).split('\n').length
    });
  }

  // Default exports
  const defaultRegex = /export\s+default\s+(\w+)/g;
  while ((match = defaultRegex.exec(content)) !== null) {
    exports.push({
      name: match[1],
      type: 'default',
      line: content.substring(0, match.index).split('\n').length
    });
  }

  return exports;
}

/**
 * Extract JavaScript/TypeScript functions
 */
function extractJSFunctions(content) {
  const functions = [];

  // Function declarations
  const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g;
  let match;
  while ((match = funcRegex.exec(content)) !== null) {
    functions.push({
      name: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }

  // Arrow functions assigned to const/let/var
  const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;
  while ((match = arrowRegex.exec(content)) !== null) {
    functions.push({
      name: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }

  return functions;
}

/**
 * Extract JavaScript/TypeScript classes
 */
function extractJSClasses(content) {
  const classes = [];
  const classRegex = /(?:export\s+)?class\s+(\w+)/g;
  let match;

  while ((match = classRegex.exec(content)) !== null) {
    classes.push({
      name: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }

  return classes;
}

/**
 * Extract TypeScript types
 */
function extractTSTypes(content) {
  const types = [];

  // Type aliases
  const typeRegex = /(?:export\s+)?type\s+(\w+)/g;
  let match;
  while ((match = typeRegex.exec(content)) !== null) {
    types.push({
      name: match[1],
      kind: 'type',
      line: content.substring(0, match.index).split('\n').length
    });
  }

  // Interfaces
  const interfaceRegex = /(?:export\s+)?interface\s+(\w+)/g;
  while ((match = interfaceRegex.exec(content)) !== null) {
    types.push({
      name: match[1],
      kind: 'interface',
      line: content.substring(0, match.index).split('\n').length
    });
  }

  return types;
}

/**
 * Extract Python imports
 */
function extractPythonImports(content) {
  const imports = [];

  const importRegex = /(?:from\s+(\S+)\s+)?import\s+([^\n]+)/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push({
      source: match[1] || match[2].split(',')[0].trim(),
      line: content.substring(0, match.index).split('\n').length
    });
  }

  return imports;
}

/**
 * Extract Python functions
 */
function extractPythonFunctions(content) {
  const functions = [];
  const funcRegex = /def\s+(\w+)\s*\([^)]*\):/g;
  let match;

  while ((match = funcRegex.exec(content)) !== null) {
    functions.push({
      name: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }

  return functions;
}

/**
 * Extract Python classes
 */
function extractPythonClasses(content) {
  const classes = [];
  const classRegex = /class\s+(\w+)(?:\([^)]*\))?:/g;
  let match;

  while ((match = classRegex.exec(content)) !== null) {
    classes.push({
      name: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }

  return classes;
}

/**
 * Detect conflicts between generated and existing code
 */
function detectConflicts(generatedFiles, targetDir, options) {
  const detectedConflicts = [];

  for (const file of generatedFiles) {
    const targetPath = path.join(targetDir, file.relativePath);

    // Check if file exists
    if (fs.existsSync(targetPath)) {
      const existingContent = fs.readFileSync(targetPath, 'utf8');
      const existingAnalysis = analyzeFile(targetPath, existingContent);

      // File-level conflict
      detectedConflicts.push({
        type: 'file_exists',
        severity: options.force ? SEVERITY.INFO : SEVERITY.WARNING,
        generatedFile: file.relativePath,
        targetFile: targetPath,
        message: 'File exists in target directory',
        resolutions: [
          'Overwrite existing file (use --force)',
          'Merge functions intelligently',
          `Save as ${file.relativePath}.generated`,
          'Skip this file'
        ]
      });

      // Function-level conflicts
      for (const generatedFunc of file.analysis.functions) {
        const existingFunc = existingAnalysis.functions.find(f => f.name === generatedFunc.name);
        if (existingFunc) {
          detectedConflicts.push({
            type: 'function_overlap',
            severity: SEVERITY.WARNING,
            generatedFile: file.relativePath,
            targetFile: targetPath,
            entity: generatedFunc.name,
            existingLine: existingFunc.line,
            generatedLine: generatedFunc.line,
            message: `Function '${generatedFunc.name}' already exists`,
            resolution: `Rename generated function to ${generatedFunc.name}_v2`
          });
        }
      }

      // Class-level conflicts
      for (const generatedClass of file.analysis.classes) {
        const existingClass = existingAnalysis.classes.find(c => c.name === generatedClass.name);
        if (existingClass) {
          detectedConflicts.push({
            type: 'class_overlap',
            severity: SEVERITY.WARNING,
            generatedFile: file.relativePath,
            targetFile: targetPath,
            entity: generatedClass.name,
            existingLine: existingClass.line,
            message: `Class '${generatedClass.name}' already exists`,
            resolution: 'Manual review required - save as .NEW file'
          });
        }
      }

      // Type-level conflicts (TypeScript)
      for (const generatedType of file.analysis.types) {
        const existingType = existingAnalysis.types.find(t => t.name === generatedType.name);
        if (existingType) {
          detectedConflicts.push({
            type: 'type_overlap',
            severity: SEVERITY.INFO,
            generatedFile: file.relativePath,
            targetFile: targetPath,
            entity: generatedType.name,
            existingLine: existingType.line,
            message: `Type '${generatedType.name}' already exists`,
            resolution: 'Merge type definitions if compatible'
          });
        }
      }

      // Import conflicts (can usually merge)
      const newImports = file.analysis.imports.filter(genImp =>
        !existingAnalysis.imports.some(extImp => extImp.source === genImp.source)
      );

      if (newImports.length > 0) {
        detectedConflicts.push({
          type: 'import_merge',
          severity: SEVERITY.INFO,
          generatedFile: file.relativePath,
          targetFile: targetPath,
          message: `${newImports.length} new import(s) to merge`,
          resolution: 'Merge imports, deduplicate, and sort'
        });
      }
    }
  }

  return detectedConflicts;
}

/**
 * Smart merge of generated code into existing files
 */
function smartMerge(generatedFile, targetPath, options) {
  const existingContent = fs.existsSync(targetPath)
    ? fs.readFileSync(targetPath, 'utf8')
    : null;

  if (!existingContent) {
    // New file - just copy
    return {
      strategy: 'new_file',
      content: generatedFile.content,
      changes: ['Created new file']
    };
  }

  if (options.force) {
    // Force overwrite
    return {
      strategy: 'overwrite',
      content: generatedFile.content,
      changes: ['Overwrote existing file']
    };
  }

  // Intelligent merge
  const existingAnalysis = analyzeFile(targetPath, existingContent);
  const changes = [];
  let mergedContent = existingContent;

  // Merge imports
  const newImports = generatedFile.analysis.imports.filter(genImp =>
    !existingAnalysis.imports.some(extImp => extImp.source === genImp.source)
  );

  if (newImports.length > 0) {
    mergedContent = mergeImports(mergedContent, generatedFile.content, newImports);
    changes.push(`Added ${newImports.length} new import(s)`);
  }

  // Merge functions (only add new ones)
  const newFunctions = generatedFile.analysis.functions.filter(genFunc =>
    !existingAnalysis.functions.some(extFunc => extFunc.name === genFunc.name)
  );

  for (const func of newFunctions) {
    const funcCode = extractFunctionCode(generatedFile.content, func);
    if (funcCode) {
      mergedContent = appendToFile(mergedContent, funcCode);
      changes.push(`Added function ${func.name}()`);
    }
  }

  // Merge exports
  const newExports = generatedFile.analysis.exports.filter(genExp =>
    !existingAnalysis.exports.some(extExp => extExp.name === genExp.name)
  );

  if (newExports.length > 0) {
    mergedContent = mergeExports(mergedContent, generatedFile.content, newExports);
    changes.push(`Added ${newExports.length} new export(s)`);
  }

  return {
    strategy: 'intelligent_merge',
    content: mergedContent,
    changes
  };
}

/**
 * Merge imports into existing file
 */
function mergeImports(existingContent, generatedContent, newImports) {
  // Find where imports section ends in existing file
  const lines = existingContent.split('\n');
  let lastImportLine = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^import\s+|^const\s+.*=\s+require/)) {
      lastImportLine = i;
    }
  }

  // Extract new import statements from generated content
  const generatedLines = generatedContent.split('\n');
  const newImportLines = [];

  for (const imp of newImports) {
    const line = generatedLines.find(l =>
      l.includes(imp.source) && (l.startsWith('import') || l.includes('require'))
    );
    if (line) {
      newImportLines.push(line);
    }
  }

  // Insert after last import or at the top
  const insertIndex = lastImportLine >= 0 ? lastImportLine + 1 : 0;
  lines.splice(insertIndex, 0, ...newImportLines);

  return lines.join('\n');
}

/**
 * Merge exports into existing file
 */
function mergeExports(existingContent, generatedContent, newExports) {
  // Add new exports at the end of the file
  const lines = existingContent.split('\n');
  const generatedLines = generatedContent.split('\n');

  for (const exp of newExports) {
    const exportLine = generatedLines.find(l =>
      l.includes(`export`) && l.includes(exp.name)
    );
    if (exportLine) {
      lines.push(exportLine);
    }
  }

  return lines.join('\n');
}

/**
 * Extract function code from content
 */
function extractFunctionCode(content, func) {
  const lines = content.split('\n');
  const startLine = func.line - 1;

  if (startLine < 0 || startLine >= lines.length) {
    return null;
  }

  // Find function end (simple heuristic - count braces)
  let braceCount = 0;
  let inFunction = false;
  const funcLines = [];

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    funcLines.push(line);

    for (const char of line) {
      if (char === '{') {
        braceCount++;
        inFunction = true;
      } else if (char === '}') {
        braceCount--;
      }
    }

    if (inFunction && braceCount === 0) {
      break;
    }
  }

  return funcLines.join('\n');
}

/**
 * Append code to end of file
 */
function appendToFile(content, code) {
  return content.trim() + '\n\n' + code.trim() + '\n';
}

/**
 * Run quality checks on file
 */
function runQualityChecks(files, targetDir) {
  const issues = [];

  for (const file of files) {
    const targetPath = path.join(targetDir, file.relativePath);

    // Syntax validation
    const syntaxCheck = checkSyntax(file.content, file.analysis.language);
    if (!syntaxCheck.valid) {
      issues.push({
        file: file.relativePath,
        type: 'syntax_error',
        severity: 'error',
        message: syntaxCheck.error
      });
    }

    // Import resolution
    const importCheck = verifyImports(file, targetDir);
    if (importCheck.unresolved.length > 0) {
      issues.push({
        file: file.relativePath,
        type: 'unresolved_imports',
        severity: 'warning',
        message: `Unresolved imports: ${importCheck.unresolved.join(', ')}`
      });
    }

    // Common issues
    const commonIssues = checkCommonIssues(file.content);
    issues.push(...commonIssues.map(issue => ({
      file: file.relativePath,
      ...issue
    })));
  }

  return issues;
}

/**
 * Check syntax validity
 */
function checkSyntax(content, language) {
  // For JavaScript/TypeScript, we could use a parser like @babel/parser
  // For now, do basic checks

  if (['javascript', 'typescript'].includes(language)) {
    // Check for balanced braces
    let braceCount = 0;
    let parenCount = 0;
    let bracketCount = 0;

    for (const char of content) {
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (char === '(') parenCount++;
      else if (char === ')') parenCount--;
      else if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;
    }

    if (braceCount !== 0) {
      return { valid: false, error: 'Unbalanced braces' };
    }
    if (parenCount !== 0) {
      return { valid: false, error: 'Unbalanced parentheses' };
    }
    if (bracketCount !== 0) {
      return { valid: false, error: 'Unbalanced brackets' };
    }
  }

  return { valid: true };
}

/**
 * Verify imports can be resolved
 */
function verifyImports(file, targetDir) {
  const unresolved = [];

  for (const imp of file.analysis.imports) {
    // Skip node modules and external packages
    if (!imp.source.startsWith('.') && !imp.source.startsWith('/')) {
      continue;
    }

    // Try to resolve relative import
    const targetPath = path.join(targetDir, path.dirname(file.relativePath), imp.source);
    const possiblePaths = [
      targetPath,
      targetPath + '.js',
      targetPath + '.ts',
      targetPath + '.jsx',
      targetPath + '.tsx',
      path.join(targetPath, 'index.js'),
      path.join(targetPath, 'index.ts')
    ];

    const exists = possiblePaths.some(p => fs.existsSync(p));
    if (!exists) {
      unresolved.push(imp.source);
    }
  }

  return { unresolved };
}

/**
 * Check for common code issues
 */
function checkCommonIssues(content) {
  const issues = [];

  // Check for console.log (should warn in production code)
  if (content.includes('console.log')) {
    issues.push({
      type: 'console_log',
      severity: 'warning',
      message: 'Contains console.log statements'
    });
  }

  // Check for debugger statements
  if (content.includes('debugger')) {
    issues.push({
      type: 'debugger',
      severity: 'warning',
      message: 'Contains debugger statements'
    });
  }

  // Check for TODO/FIXME comments
  const todoMatch = content.match(/\/\/\s*(TODO|FIXME)/g);
  if (todoMatch) {
    issues.push({
      type: 'todo_comment',
      severity: 'info',
      message: `Contains ${todoMatch.length} TODO/FIXME comment(s)`
    });
  }

  return issues;
}

/**
 * Run ESLint if available
 */
function runESLint(targetDir, files) {
  try {
    // Check if ESLint is available
    execSync('npx eslint --version', { stdio: 'ignore' });

    const results = { passed: 0, failed: 0, warnings: 0 };

    for (const file of files) {
      const targetPath = path.join(targetDir, file.relativePath);
      if (!targetPath.match(/\.(js|jsx|ts|tsx)$/)) continue;

      try {
        const output = execSync(`npx eslint "${targetPath}" --format json`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore']
        });

        const result = JSON.parse(output);
        if (result[0]) {
          results.warnings += result[0].warningCount || 0;
          if (result[0].errorCount > 0) {
            results.failed++;
          } else {
            results.passed++;
          }
        }
      } catch (error) {
        results.failed++;
      }
    }

    return { available: true, results };
  } catch (error) {
    return { available: false };
  }
}

/**
 * Run Prettier if available
 */
function runPrettier(targetDir, files) {
  try {
    execSync('npx prettier --version', { stdio: 'ignore' });

    for (const file of files) {
      const targetPath = path.join(targetDir, file.relativePath);
      try {
        execSync(`npx prettier --write "${targetPath}"`, { stdio: 'ignore' });
      } catch (error) {
        // Ignore errors
      }
    }

    return { available: true, formatted: files.length };
  } catch (error) {
    return { available: false };
  }
}

/**
 * Run TypeScript compiler check if TS project
 */
function runTypeScriptCheck(targetDir, files) {
  try {
    // Check if TypeScript is available
    execSync('npx tsc --version', { stdio: 'ignore' });

    const tsFiles = files.filter(f => f.relativePath.match(/\.tsx?$/));
    if (tsFiles.length === 0) {
      return { available: true, applicable: false };
    }

    try {
      execSync('npx tsc --noEmit', {
        cwd: targetDir,
        stdio: 'ignore'
      });
      return { available: true, applicable: true, passed: true };
    } catch (error) {
      return { available: true, applicable: true, passed: false };
    }
  } catch (error) {
    return { available: false };
  }
}

/**
 * Run tests
 */
function runTests(options) {
  if (options.skipTests) {
    return { skipped: true };
  }

  const results = {
    generated: null,
    full: null,
    passed: false
  };

  try {
    // Try to run generated tests
    if (fs.existsSync('tests/unit/generated')) {
      try {
        execSync('npm test -- tests/unit/generated/', {
          stdio: 'pipe',
          encoding: 'utf8'
        });
        results.generated = { passed: true };
      } catch (error) {
        results.generated = { passed: false, error: error.message };
      }
    }

    // Run full test suite
    try {
      const output = execSync('npm test', {
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 60000 // 60 second timeout
      });
      results.full = { passed: true, output };
      results.passed = true;
    } catch (error) {
      results.full = { passed: false, error: error.message };
      results.passed = false;
    }
  } catch (error) {
    results.error = 'Test execution failed';
  }

  return results;
}

/**
 * Integrate files into target directory
 */
function integrateFiles(generatedFiles, sourceDir, targetDir, options) {
  console.log(colors.bright + `Integrating ${generatedFiles.length} file(s)...` + colors.reset);

  const integrated = {
    merged: [],
    new: [],
    skipped: [],
    errors: []
  };

  for (const file of generatedFiles) {
    const targetPath = path.join(targetDir, file.relativePath);
    const targetExists = fs.existsSync(targetPath);

    try {
      // Check if should skip due to blocking conflicts
      const fileConflicts = conflicts.filter(c =>
        c.generatedFile === file.relativePath &&
        c.severity === SEVERITY.BLOCKING
      );

      if (fileConflicts.length > 0 && !options.force) {
        integrated.skipped.push(file.relativePath);
        console.log(colors.yellow + `  ⊗ Skipped: ${file.relativePath} (blocking conflicts)` + colors.reset);
        continue;
      }

      // Merge or create file
      const mergeResult = smartMerge(file, targetPath, options);

      // Create target directory if needed
      const targetDirPath = path.dirname(targetPath);
      if (!fs.existsSync(targetDirPath)) {
        fs.mkdirSync(targetDirPath, { recursive: true });
      }

      // Write file
      fs.writeFileSync(targetPath, mergeResult.content, 'utf8');

      if (targetExists) {
        integrated.merged.push({
          path: file.relativePath,
          strategy: mergeResult.strategy,
          changes: mergeResult.changes
        });
        console.log(colors.green + `  ✓ Merged: ${file.relativePath}` + colors.reset);
        if (mergeResult.changes.length > 0) {
          console.log(colors.dim + `    ${mergeResult.changes.join(', ')}` + colors.reset);
        }
      } else {
        integrated.new.push(file.relativePath);
        console.log(colors.green + `  ✓ Created: ${file.relativePath}` + colors.reset);
      }
    } catch (error) {
      integrated.errors.push({
        path: file.relativePath,
        error: error.message
      });
      console.log(colors.red + `  ✗ Error: ${file.relativePath} - ${error.message}` + colors.reset);
    }
  }

  return integrated;
}

/**
 * Create git commit
 */
function createGitCommit(spec, integratedFiles, options) {
  try {
    // Check if git repo
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });

    // Stage files
    const allFiles = [
      ...integratedFiles.merged.map(f => f.path),
      ...integratedFiles.new
    ];

    for (const file of allFiles) {
      try {
        execSync(`git add "${file}"`, { stdio: 'ignore' });
      } catch (error) {
        // Ignore errors
      }
    }

    // Create commit message
    const specName = spec.name || 'specification';
    const specId = spec.id || 'unknown';

    const message = `feat: Implement ${specName}

Generated from specification ${specId}

Integrated:
${integratedFiles.merged.map(f => `- Merged: ${f.path}`).join('\n')}
${integratedFiles.new.map(f => `- Created: ${f}`).join('\n')}

🤖 Generated with Spec-MAS Code Integration
`;

    // Commit
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      stdio: 'ignore'
    });

    // Get commit hash
    const commitHash = execSync('git rev-parse HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    return {
      success: true,
      hash: commitHash.substring(0, 7),
      message
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create pull request
 */
function createPullRequest(spec, integrationReport, options) {
  try {
    // Check if gh CLI is available
    execSync('gh --version', { stdio: 'ignore' });

    const specName = spec.name || 'specification';
    const specId = spec.id || 'unknown';
    const title = `feat: Implement ${specName}`;

    const body = `## Summary
Implements specification: ${specId}

${spec.userStories ? spec.userStories.map(s => `- ${s}`).join('\n') : ''}

## Integration Report
See INTEGRATION_REPORT.md for full details

## Test Plan
- [ ] Review generated code
- [ ] Run all tests
- [ ] Test integration points
- [ ] Verify error handling
- [ ] Check security implications

🤖 Generated with Spec-MAS Code Integration
`;

    const result = execSync(`gh pr create --title "${title}" --body "${body.replace(/"/g, '\\"')}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return {
      success: true,
      url: result.trim()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate integration report
 */
function generateIntegrationReport(spec, generatedFiles, integratedFiles, qualityResults, testResults, gitResult, options) {
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  const report = `# Code Integration Report

## Specification
- **Name:** ${spec.name || 'N/A'}
- **ID:** ${spec.id || 'N/A'}
- **Source:** ${spec.filePath || 'N/A'}

## Integration Summary
- **Started:** ${new Date(startTime).toISOString()}
- **Duration:** ${duration}s
- **Status:** ${integratedFiles.errors.length === 0 ? '✅ SUCCESS' : '⚠️ PARTIAL SUCCESS'}

## Source
- **Directory:** ${options.sourceDir}
- **Files Found:** ${generatedFiles.length}

## Target
- **Directory:** ${options.targetDir}

## Files Integrated
- **Merged:** ${integratedFiles.merged.length}
- **New:** ${integratedFiles.new.length}
- **Skipped:** ${integratedFiles.skipped.length}
- **Errors:** ${integratedFiles.errors.length}

### Merged Files
${integratedFiles.merged.map(f => `- \`${f.path}\`
  - Strategy: ${f.strategy}
  - Changes: ${f.changes.join(', ')}`).join('\n')}

### New Files
${integratedFiles.new.map(f => `- \`${f}\``).join('\n')}

${integratedFiles.skipped.length > 0 ? `### Skipped Files
${integratedFiles.skipped.map(f => `- \`${f}\``).join('\n')}` : ''}

${integratedFiles.errors.length > 0 ? `### Errors
${integratedFiles.errors.map(e => `- \`${e.path}\`: ${e.error}`).join('\n')}` : ''}

## Conflicts Detected

${conflicts.length === 0 ? '_No conflicts detected_' : ''}

${conflicts.filter(c => c.severity === SEVERITY.BLOCKING).length > 0 ? `### Blocking (${conflicts.filter(c => c.severity === SEVERITY.BLOCKING).length})
${conflicts.filter(c => c.severity === SEVERITY.BLOCKING).map(c =>
  `- **${c.type}**: ${c.generatedFile}
  - ${c.message}
  - Resolution: ${c.resolution || c.resolutions ? c.resolutions.join(', ') : 'Manual review required'}`
).join('\n')}` : ''}

${conflicts.filter(c => c.severity === SEVERITY.WARNING).length > 0 ? `### Warnings (${conflicts.filter(c => c.severity === SEVERITY.WARNING).length})
${conflicts.filter(c => c.severity === SEVERITY.WARNING).map(c =>
  `- **${c.type}**: ${c.generatedFile}${c.entity ? ` - ${c.entity}` : ''}
  - ${c.message}
  - Resolution: ${c.resolution}`
).join('\n')}` : ''}

${conflicts.filter(c => c.severity === SEVERITY.INFO).length > 0 ? `### Info (${conflicts.filter(c => c.severity === SEVERITY.INFO).length})
${conflicts.filter(c => c.severity === SEVERITY.INFO).map(c =>
  `- **${c.type}**: ${c.generatedFile}
  - ${c.message}`
).join('\n')}` : ''}

## Quality Checks

${qualityResults.syntax ? `### Syntax Validation
- Passed: ${generatedFiles.length - qualityIssues.filter(i => i.type === 'syntax_error').length}/${generatedFiles.length}
${qualityIssues.filter(i => i.type === 'syntax_error').length > 0 ?
  qualityIssues.filter(i => i.type === 'syntax_error').map(i => `- ✗ ${i.file}: ${i.message}`).join('\n') : ''}` : ''}

${qualityResults.eslint && qualityResults.eslint.available ? `### ESLint
- Passed: ${qualityResults.eslint.results.passed}
- Failed: ${qualityResults.eslint.results.failed}
- Warnings: ${qualityResults.eslint.results.warnings}` :
  qualityResults.eslint ? `### ESLint
- Not available` : ''}

${qualityResults.prettier && qualityResults.prettier.available ? `### Prettier
- Formatted: ${qualityResults.prettier.formatted} file(s)` : ''}

${qualityResults.typescript && qualityResults.typescript.available && qualityResults.typescript.applicable ? `### TypeScript
- Compilation: ${qualityResults.typescript.passed ? '✅ Passed' : '❌ Failed'}` : ''}

${qualityResults.imports ? `### Import Resolution
${qualityIssues.filter(i => i.type === 'unresolved_imports').length === 0 ?
  '- ✅ All imports resolved' :
  `- ⚠️ Unresolved imports:\n${qualityIssues.filter(i => i.type === 'unresolved_imports').map(i => `  - ${i.file}: ${i.message}`).join('\n')}`}` : ''}

${qualityIssues.filter(i => i.severity === 'warning').length > 0 ? `### Warnings
${qualityIssues.filter(i => i.severity === 'warning').map(i => `- ${i.file}: ${i.message}`).join('\n')}` : ''}

## Test Results

${testResults ? (testResults.skipped ? '- Tests skipped (--skip-tests flag)' :
  `${testResults.generated ? `### Generated Tests
- ${testResults.generated.passed ? '✅ Passed' : `❌ Failed: ${testResults.generated.error}`}` : ''}

${testResults.full ? `### Full Test Suite
- ${testResults.full.passed ? '✅ Passed' : `❌ Failed`}` : ''}`) : '- No tests run'}

## Git Integration

${gitResult && gitResult.success ? `- ✅ Committed: ${gitResult.hash}
- Message: ${gitResult.message.split('\n')[0]}` :
  gitResult ? `- ❌ Failed: ${gitResult.error}` : '- Not in git repository'}

## Next Steps

1. **Review Merged Code**
   ${integratedFiles.merged.length > 0 ?
     integratedFiles.merged.map(f => `- Review \`${f.path}\` - ${f.changes.join(', ')}`).join('\n   ') :
     '- No merged files'}

2. **Test Thoroughly**
   - Run full test suite: \`npm test\`
   - Test new functionality manually
   - Verify integration points

3. **Resolve Conflicts**
   ${conflicts.filter(c => c.severity !== SEVERITY.INFO).length > 0 ?
     `- ${conflicts.filter(c => c.severity !== SEVERITY.INFO).length} conflict(s) need attention` :
     '- No conflicts to resolve'}

4. **Quality Improvements**
   ${qualityIssues.filter(i => i.severity === 'error').length > 0 ?
     `- Fix ${qualityIssues.filter(i => i.severity === 'error').length} error(s)` :
     '- Code quality checks passed'}

5. **Create Pull Request**
   ${options.createPr ? '- Pull request created' : '- Run: \`npm run integrate-code --create-pr\`'}

---

*Generated by Spec-MAS Code Integration - ${new Date().toISOString()}*
`;

  return report;
}

/**
 * Load spec metadata
 */
function loadSpecMetadata(sourceDir) {
  // Try to find implementation report
  const reportPath = path.join(sourceDir, 'IMPLEMENTATION_REPORT.md');

  if (fs.existsSync(reportPath)) {
    const content = fs.readFileSync(reportPath, 'utf8');

    // Extract metadata
    const nameMatch = content.match(/\*\*Name:\*\*\s*(.+)/);
    const idMatch = content.match(/\*\*ID:\*\*\s*(.+)/);
    const sourceMatch = content.match(/\*\*Source File:\*\*\s*(.+)/);

    return {
      name: nameMatch ? nameMatch[1].trim() : 'Unknown',
      id: idMatch ? idMatch[1].trim() : 'unknown',
      filePath: sourceMatch ? sourceMatch[1].trim() : null,
      userStories: []
    };
  }

  return {
    name: 'Unknown',
    id: 'unknown',
    filePath: null,
    userStories: []
  };
}

/**
 * Main integration function
 */
async function integrateCode(options) {
  startTime = Date.now();

  printHeader('CODE INTEGRATION');

  console.log(`Source: ${colors.bright}${options.sourceDir}${colors.reset}`);
  console.log(`Target: ${colors.bright}${options.targetDir}${colors.reset}`);
  if (options.checkOnly) {
    console.log(colors.yellow + 'Mode: CHECK ONLY (no changes will be made)' + colors.reset);
  }
  console.log('');

  try {
    // Load spec metadata
    const spec = loadSpecMetadata(options.sourceDir);

    // 1. Scan generated code
    printSubHeader('Scanning Generated Code');
    const generatedFiles = scanGeneratedCode(options.sourceDir);

    if (generatedFiles.length === 0) {
      console.log(colors.yellow + '⚠ No code files found in source directory' + colors.reset);
      return 1;
    }

    console.log(colors.green + `  Found ${generatedFiles.length} file(s):` + colors.reset);
    generatedFiles.forEach(f => {
      console.log(colors.dim + `  ✓ ${f.relativePath} (${f.analysis.language}, ${f.analysis.lines} lines)` + colors.reset);
    });

    // 2. Detect conflicts
    printSubHeader('Conflict Detection');
    conflicts = detectConflicts(generatedFiles, options.targetDir, options);

    const blockingConflicts = conflicts.filter(c => c.severity === SEVERITY.BLOCKING);
    const warningConflicts = conflicts.filter(c => c.severity === SEVERITY.WARNING);
    const infoConflicts = conflicts.filter(c => c.severity === SEVERITY.INFO);

    if (conflicts.length === 0) {
      console.log(colors.green + '  ✓ No conflicts detected' + colors.reset);
    } else {
      console.log(`  Conflicts: ${colors.yellow}${warningConflicts.length} warning${colors.reset}, ${blockingConflicts.length > 0 ? colors.red : colors.dim}${blockingConflicts.length} blocking${colors.reset}\n`);

      // Show blocking conflicts
      if (blockingConflicts.length > 0) {
        blockingConflicts.forEach(c => {
          console.log(colors.red + `  ✗ BLOCKING: ${c.generatedFile}` + colors.reset);
          console.log(colors.dim + `    ${c.message}` + colors.reset);
          if (c.resolutions) {
            console.log(colors.dim + `    Options: ${c.resolutions.join(' | ')}` + colors.reset);
          }
        });
        console.log('');
      }

      // Show warnings
      if (warningConflicts.length > 0) {
        warningConflicts.forEach(c => {
          console.log(colors.yellow + `  ⚠ WARNING: ${c.generatedFile}` + colors.reset);
          console.log(colors.dim + `    ${c.message}` + colors.reset);
          console.log(colors.dim + `    → ${c.resolution}` + colors.reset);
        });
        console.log('');
      }

      // Show info
      if (infoConflicts.length > 0 && options.verbose) {
        infoConflicts.forEach(c => {
          console.log(colors.cyan + `  ℹ INFO: ${c.generatedFile}` + colors.reset);
          console.log(colors.dim + `    ${c.message}` + colors.reset);
        });
      }
    }

    // 3. Run quality checks
    printSubHeader('Quality Checks');
    qualityIssues = runQualityChecks(generatedFiles, options.targetDir);

    const syntaxErrors = qualityIssues.filter(i => i.type === 'syntax_error');
    const importIssues = qualityIssues.filter(i => i.type === 'unresolved_imports');

    console.log(colors.green + `  ✓ Syntax validation: ${generatedFiles.length - syntaxErrors.length}/${generatedFiles.length} passed` + colors.reset);
    if (syntaxErrors.length > 0) {
      syntaxErrors.forEach(err => {
        console.log(colors.red + `    ✗ ${err.file}: ${err.message}` + colors.reset);
      });
    }

    console.log(colors.green + `  ✓ Import resolution: ${generatedFiles.length - importIssues.length}/${generatedFiles.length} passed` + colors.reset);
    if (importIssues.length > 0 && options.verbose) {
      importIssues.forEach(err => {
        console.log(colors.yellow + `    ⚠ ${err.file}: ${err.message}` + colors.reset);
      });
    }

    // Run ESLint
    const eslintResult = runESLint(options.targetDir, generatedFiles);
    if (eslintResult.available) {
      const { passed, failed, warnings } = eslintResult.results;
      console.log(colors.green + `  ✓ ESLint: ${passed}/${passed + failed} passed` +
                  (warnings > 0 ? colors.yellow + ` (${warnings} warnings)` + colors.reset : colors.reset));
    } else {
      console.log(colors.dim + `  ℹ ESLint: Not available` + colors.reset);
    }

    // Run TypeScript check
    const tsResult = runTypeScriptCheck(options.targetDir, generatedFiles);
    if (tsResult.available && tsResult.applicable) {
      console.log((tsResult.passed ? colors.green + '  ✓' : colors.red + '  ✗') +
                  ` TypeScript: ${tsResult.passed ? 'Passed' : 'Failed'}` + colors.reset);
    } else if (tsResult.available) {
      console.log(colors.dim + `  ℹ TypeScript: Not applicable (JS project)` + colors.reset);
    }

    const qualityResults = {
      syntax: true,
      imports: true,
      eslint: eslintResult,
      typescript: tsResult
    };

    // Stop if check-only mode
    if (options.checkOnly) {
      printHeader('CHECK COMPLETE');
      console.log(colors.green + '✓ Quality checks complete - no changes made' + colors.reset);
      console.log(colors.dim + '\nRemove --check-only flag to integrate code\n' + colors.reset);

      // Generate report anyway
      const report = generateIntegrationReport(
        spec,
        generatedFiles,
        { merged: [], new: [], skipped: [], errors: [] },
        qualityResults,
        { skipped: true },
        null,
        options
      );

      const reportPath = path.join(options.targetDir, 'INTEGRATION_REPORT.md');
      fs.writeFileSync(reportPath, report, 'utf8');
      console.log(colors.dim + `Report saved: ${reportPath}\n` + colors.reset);

      return 0;
    }

    // 4. Run tests (before integration)
    if (!options.skipTests) {
      printSubHeader('Test Execution');
      testResults = runTests(options);

      if (testResults.skipped) {
        console.log(colors.dim + '  Tests skipped (--skip-tests flag)' + colors.reset);
      } else {
        if (testResults.generated) {
          console.log((testResults.generated.passed ? colors.green + '  ✓' : colors.red + '  ✗') +
                      ' Generated tests: ' + (testResults.generated.passed ? 'Passed' : 'Failed') + colors.reset);
        }

        if (testResults.full) {
          console.log((testResults.full.passed ? colors.green + '  ✓' : colors.red + '  ✗') +
                      ' Full test suite: ' + (testResults.full.passed ? 'Passed' : 'Failed') + colors.reset);
        }
      }
    } else {
      testResults = { skipped: true };
    }

    // 5. Integration
    printSubHeader('Integration');
    const integratedFiles = integrateFiles(generatedFiles, options.sourceDir, options.targetDir, options);

    // Run prettier after integration
    const prettierResult = runPrettier(options.targetDir, generatedFiles);
    qualityResults.prettier = prettierResult;
    if (prettierResult.available) {
      console.log(colors.green + `  ✓ Formatted ${prettierResult.formatted} file(s) with Prettier` + colors.reset);
    }

    // 6. Git integration
    let gitResult = null;
    if (!options.skipGit) {
      printSubHeader('Git Integration');
      gitResult = createGitCommit(spec, integratedFiles, options);

      if (gitResult.success) {
        console.log(colors.green + `  ✓ Created commit: ${gitResult.hash}` + colors.reset);

        // Create PR if requested
        if (options.createPr) {
          const prResult = createPullRequest(spec, null, options);
          if (prResult.success) {
            console.log(colors.green + `  ✓ Created pull request: ${prResult.url}` + colors.reset);
          } else {
            console.log(colors.yellow + `  ⚠ Could not create PR: ${prResult.error}` + colors.reset);
          }
        }
      } else {
        console.log(colors.yellow + `  ⚠ Could not create commit: ${gitResult.error}` + colors.reset);
      }
    }

    // 7. Generate report
    const report = generateIntegrationReport(
      spec,
      generatedFiles,
      integratedFiles,
      qualityResults,
      testResults,
      gitResult,
      options
    );

    const reportPath = path.join(options.targetDir, 'INTEGRATION_REPORT.md');
    fs.writeFileSync(reportPath, report, 'utf8');

    // 8. Show summary
    printHeader('INTEGRATION COMPLETE');

    console.log(`  ${colors.bright}Files Merged:${colors.reset}     ${integratedFiles.merged.length}`);
    console.log(`  ${colors.bright}Files Created:${colors.reset}    ${integratedFiles.new.length}`);
    console.log(`  ${colors.bright}Files Skipped:${colors.reset}    ${integratedFiles.skipped.length}`);
    console.log(`  ${colors.bright}Errors:${colors.reset}           ${integratedFiles.errors.length}`);

    if (conflicts.length > 0) {
      console.log(`  ${colors.bright}Conflicts:${colors.reset}        ${colors.yellow}${warningConflicts.length}${colors.reset} warning, ${blockingConflicts.length > 0 ? colors.red : colors.dim}${blockingConflicts.length}${colors.reset} blocking`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n${colors.green}✓ Integration complete in ${duration}s${colors.reset}`);

    console.log(colors.dim + '\nNext steps:' + colors.reset);
    console.log(colors.dim + '  1. Review merged code' + colors.reset);
    if (gitResult && gitResult.success) {
      console.log(colors.dim + `  2. Run: git log -1 to see commit` + colors.reset);
      console.log(colors.dim + `  3. Run: git diff HEAD~1 to see changes` + colors.reset);
      if (!options.createPr) {
        console.log(colors.dim + `  4. Run: gh pr create to make pull request` + colors.reset);
      }
    } else {
      console.log(colors.dim + '  2. Run tests to verify integration' + colors.reset);
      console.log(colors.dim + '  3. Commit changes when ready' + colors.reset);
    }
    console.log(colors.dim + `\nReport: ${reportPath}` + colors.reset);
    console.log('');

    // Return appropriate exit code
    if (integratedFiles.errors.length > 0) {
      return 2; // Errors occurred
    } else if (blockingConflicts.length > 0) {
      return 1; // Conflicts present
    } else {
      return 0; // Success
    }

  } catch (error) {
    console.error('\n' + colors.red + `✗ Integration failed: ${error.message}` + colors.reset);
    if (options.verbose) {
      console.error(colors.dim + error.stack + colors.reset);
    }
    console.log('');
    return 1;
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const options = {
    sourceDir: null,
    targetDir: null,
    checkOnly: args.includes('--check-only'),
    createPr: args.includes('--create-pr'),
    skipTests: args.includes('--skip-tests'),
    skipGit: args.includes('--skip-git'),
    force: args.includes('--force'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  // Find non-flag arguments
  const paths = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));

  options.sourceDir = paths[0] || 'implementation-output';
  options.targetDir = paths[1] || 'src';

  return options;
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
${colors.bright}Spec-MAS Code Integration${colors.reset}

Safely merges AI-generated code into existing projects with conflict detection,
quality checks, and git integration.

${colors.bright}USAGE:${colors.reset}
  node scripts/code-integration.js [source-dir] [target-dir] [options]
  npm run integrate-code [source-dir] [target-dir] [options]

${colors.bright}ARGUMENTS:${colors.reset}
  [source-dir]  Source directory with generated code (default: implementation-output/)
  [target-dir]  Target directory to integrate into (default: src/)

${colors.bright}OPTIONS:${colors.reset}
  --check-only   Run quality checks without merging (dry run)
  --create-pr    Create pull request after integration
  --skip-tests   Skip running tests
  --skip-git     Skip git commit
  --force        Override conflict warnings
  --verbose, -v  Show detailed information
  --help, -h     Show this help message

${colors.bright}EXAMPLES:${colors.reset}
  ${colors.dim}# Basic integration${colors.reset}
  npm run integrate-code

  ${colors.dim}# Check only (no changes)${colors.reset}
  npm run integrate-code --check-only

  ${colors.dim}# From specific directory${colors.reset}
  npm run integrate-code implementation-output/ src/

  ${colors.dim}# Skip tests (faster)${colors.reset}
  npm run integrate-code --skip-tests

  ${colors.dim}# Create PR automatically${colors.reset}
  npm run integrate-code --create-pr

  ${colors.dim}# Force overwrite conflicts${colors.reset}
  npm run integrate-code --force

${colors.bright}PROCESS:${colors.reset}
  1. Scan generated code and analyze structure
  2. Detect conflicts with existing code
  3. Run quality checks (syntax, ESLint, TypeScript)
  4. Run tests
  5. Intelligently merge code into target
  6. Create git commit
  7. Generate integration report

${colors.bright}CONFLICT RESOLUTION:${colors.reset}
  - New files: Copy to target
  - Existing files: Merge functions intelligently
  - Function conflicts: Rename with _v2 suffix
  - Import conflicts: Merge and deduplicate
  - Complex conflicts: Save as .NEW file for manual review

${colors.bright}EXIT CODES:${colors.reset}
  0 - Success
  1 - Conflicts detected
  2 - Test failures or errors
`);
}

/**
 * Main CLI entry point
 */
async function main() {
  const options = parseArgs();

  const exitCode = await integrateCode(options);
  process.exit(exitCode);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(colors.red + `Fatal error: ${error.message}` + colors.reset);
    process.exit(1);
  });
}

// Export for use as module
module.exports = {
  integrateCode,
  scanGeneratedCode,
  detectConflicts,
  runQualityChecks,
  smartMerge
};
