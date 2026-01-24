/**
 * Spec discovery and ordering (patterned after ai-coord)
 */

const fs = require('fs');
const path = require('path');
const { parseSpec } = require('./spec-parser');

function loadSpecs(specsDir) {
  if (!fs.existsSync(specsDir)) return [];
  const files = fs.readdirSync(specsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(specsDir, f));

  return files.map(file => {
    const spec = parseSpec(file);
    return {
      file: path.basename(file),
      path: file,
      meta: spec.metadata,
      raw: spec.raw
    };
  });
}

function orderSpecs(specs) {
  const systemSpecs = [];
  const featureSpecs = [];

  for (const spec of specs) {
    if (spec.file.startsWith('system-')) {
      systemSpecs.push(spec);
    } else {
      featureSpecs.push(spec);
    }
  }

  const byId = new Map(featureSpecs.map(spec => [spec.meta?.id, spec]));

  const resolved = [];
  const seen = new Set();

  function visit(spec) {
    if (!spec || seen.has(spec.path)) return;
    seen.add(spec.path);
    const depends = spec.meta?.depends_on || spec.meta?.dependsOn || [];
    for (const dep of depends) {
      const depSpec = byId.get(dep);
      if (depSpec) visit(depSpec);
    }
    resolved.push(spec);
  }

  featureSpecs
    .slice()
    .sort((a, b) => a.file.localeCompare(b.file))
    .forEach(visit);

  return [...systemSpecs, ...resolved];
}

module.exports = {
  loadSpecs,
  orderSpecs
};
