#!/usr/bin/env node
/**
 * OrbTap UI consistency gate: flag hardcoded colors, spacing, and radius
 * in app/ and components/ (excluding token files and component library).
 *
 * Usage: node scripts/scan-ui-consistency.js [--fix]
 * Exit code: 0 if no violations (or only allowlisted), 1 if violations found.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT, 'app');
const COMPONENTS_DIR = path.join(ROOT, 'components');

const ALLOWLIST = [
  'constants/Colors.ts',
  'constants/Theme.ts',
  'constants/DesignTokens.ts',
  'constants/UIConfig.ts',
  'constants/OrbIconography.ts',
  'components/ui/',
];

const SPACING_SET = new Set([2, 4, 8, 12, 16, 20, 24, 32, 40]);
const RADIUS_SET = new Set([6, 10, 12, 16, 20, 24, 28, 9999]);

function isAllowlisted(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  return ALLOWLIST.some((a) => normalized.includes(a));
}

function* walk(dir, ext) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    if (e.isDirectory()) {
      if (e.name !== 'node_modules' && e.name !== '.git') yield* walk(full, ext);
    } else if (e.isFile() && (ext ? e.name.endsWith(ext) : true)) yield rel;
  }
}

function scanFile(filePath) {
  const full = path.join(ROOT, filePath);
  if (!fs.existsSync(full)) return [];
  const content = fs.readFileSync(full, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  const hexOrRgba = /#'[^']*'|#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g;
  const paddingMargin = /(padding|margin)(Horizontal|Vertical|Top|Bottom|Left|Right)?\s*:\s*(\d+)/g;
  const borderRadius = /borderRadius\s*:\s*(\d+)/g;

  lines.forEach((line, i) => {
    let m;
    while ((m = hexOrRgba.exec(line)) !== null) {
      issues.push({ file: filePath, line: i + 1, type: 'color', value: m[0] });
    }
    hexOrRgba.lastIndex = 0;
    while ((m = paddingMargin.exec(line)) !== null) {
      if (!SPACING_SET.has(parseInt(m[3], 10))) {
        issues.push({ file: filePath, line: i + 1, type: 'spacing', value: m[0] });
      }
    }
    paddingMargin.lastIndex = 0;
    while ((m = borderRadius.exec(line)) !== null) {
      if (!RADIUS_SET.has(parseInt(m[1], 10))) {
        issues.push({ file: filePath, line: i + 1, type: 'radius', value: m[0] });
      }
    }
    borderRadius.lastIndex = 0;
  });
  return issues;
}

const appFiles = [...walk(APP_DIR, '.tsx'), ...walk(APP_DIR, '.ts')];
const componentFiles = [...walk(COMPONENTS_DIR, '.tsx'), ...walk(COMPONENTS_DIR, '.ts')];
const toScan = [...appFiles, ...componentFiles].filter((f) => !isAllowlisted(f));

const allIssues = [];
toScan.forEach((f) => {
  const issues = scanFile(f);
  issues.forEach((i) => allIssues.push(i));
});

if (allIssues.length > 0) {
  console.log('UI consistency scan: potential violations (use tokens instead)\n');
  const byFile = {};
  allIssues.forEach((i) => {
    if (!byFile[i.file]) byFile[i.file] = [];
    byFile[i.file].push(i);
  });
  Object.keys(byFile).sort().forEach((file) => {
    console.log(file);
    byFile[file].slice(0, 15).forEach((i) => console.log(`  L${i.line} [${i.type}] ${i.value}`));
    if (byFile[file].length > 15) console.log(`  ... and ${byFile[file].length - 15} more`);
    console.log('');
  });
  console.log('Allowlisted paths (no report):', ALLOWLIST.join(', '));
  console.log('\nRun with tokens from useTheme() / constants/Theme.ts / DesignTokens.');
  process.exit(1);
}
console.log('UI consistency scan: no violations in scanned paths.');
process.exit(0);
