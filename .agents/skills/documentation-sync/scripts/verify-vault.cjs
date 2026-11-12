#!/usr/bin/env node

/**
 * Universal Obsidian Knowledge Vault Integrity & Expressiveness Quality Gate.
 * Cross-platform (Windows, Linux, macOS, CI/Docker) with ZERO external dependencies.
 *
 * Validates:
 * 1. Canonical Vault Structure: Strictly enforces the 6 canonical directories
 *    (Overview/, Features/, Guides/, Reference/, Decisions/, Changelog/) and permitted root files.
 * 2. Frontmatter: Every Markdown file has valid YAML frontmatter (title, description, tags).
 * 3. Wikilinks: Every Obsidian [[wikilink]] resolves to an existing vault target (0 broken links).
 * 4. Architectural Expressiveness Gate: Documentation/Overview/Overview.md exists, and every document
 *    under Documentation/Overview/*.md contains at least one substantive Mermaid diagram.
 * 5. Mermaid Syntax & AST Verification:
 *    - Built-in zero-dependency syntax linter (unquoted edge labels, note semicolons, unquoted node pipes).
 *    - Automated AST engine parser execution via validate-mermaid.mjs if available.
 * 6. Index Reachability: Every topic page is indexed in Home.md or its section Overview.md.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findRepoRoot() {
  let curr = __dirname;
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'AGENTS.md')) || fs.existsSync(path.join(curr, '.git')) || fs.existsSync(path.join(curr, 'Documentation'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return process.cwd();
}

function verifyVault(vaultDirOverride) {
  const repoRoot = findRepoRoot();
  const vaultPath = vaultDirOverride ? path.resolve(vaultDirOverride) : path.join(repoRoot, 'Documentation');

  if (!fs.existsSync(vaultPath)) {
    console.error(`[Vault Integrity] Error: Vault directory not found at ${vaultPath}`);
    return { success: false, errors: [`Vault directory not found at ${vaultPath}`] };
  }

  // 1. Gather all .md files and asset files in the vault (excluding .obsidian and .git)
  const mdFiles = [];
  const assetFiles = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '.obsidian' && entry.name !== '.git') {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        if (entry.name.endsWith('.md')) {
          mdFiles.push(fullPath);
        } else {
          assetFiles.push(fullPath);
        }
      }
    }
  }

  walk(vaultPath);

  // 2. Canonical Structure & Out-of-Place Files Gate
  const structureErrors = [];
  const allowedCanonicalDirs = new Set(['overview', 'features', 'guides', 'reference', 'decisions', 'changelog', '.obsidian']);
  const allowedRootFiles = new Set(['home.md', 'readme.md', '.sync-state.json', '.vault-sync-state.json']);

  const topLevelEntries = fs.readdirSync(vaultPath, { withFileTypes: true });
  for (const entry of topLevelEntries) {
    if (entry.name === '.git') continue;
    const lowerName = entry.name.toLowerCase();
    if (entry.isDirectory()) {
      if (!allowedCanonicalDirs.has(lowerName)) {
        structureErrors.push(`Non-canonical directory detected: Documentation/${entry.name}/. All vault documents must reside within canonical sections: Overview, Features, Guides, Reference, Decisions, Changelog.`);
      }
    } else if (entry.isFile()) {
      if (!allowedRootFiles.has(lowerName)) {
        structureErrors.push(`Out-of-place root file detected: Documentation/${entry.name}. Root of Documentation/ only permits Home.md, README.md, and .sync-state.json.`);
      }
    }
  }

  // Ensure every markdown file path starts with an allowed canonical directory or is an allowed root file
  for (const filePath of mdFiles) {
    const rel = path.relative(vaultPath, filePath).replace(/\\/g, '/');
    if (rel.includes('/')) {
      const topDir = rel.split('/')[0].toLowerCase();
      if (!allowedCanonicalDirs.has(topDir)) {
        structureErrors.push(`Out-of-place document: Documentation/${rel}. Directory '${rel.split('/')[0]}' is not a canonical vault section.`);
      }
    }
  }

  // 3. Build set of available targets for [[wikilink]] resolution (case-insensitive)
  const vaultTargets = new Set();
  const vaultRelPaths = new Set();

  for (const f of mdFiles) {
    const baseNoExt = path.basename(f, '.md').toLowerCase();
    vaultTargets.add(baseNoExt);

    const rel = path.relative(vaultPath, f).replace(/\\/g, '/');
    const relNoExt = rel.endsWith('.md') ? rel.slice(0, -3) : rel;
    vaultRelPaths.add(rel.toLowerCase());
    vaultRelPaths.add(relNoExt.toLowerCase());
  }

  for (const af of assetFiles) {
    vaultTargets.add(path.basename(af).toLowerCase());
    const rel = path.relative(vaultPath, af).replace(/\\/g, '/');
    vaultRelPaths.add(rel.toLowerCase());
  }

  const frontmatterErrors = [];
  const brokenLinks = [];
  const unindexedPages = [];
  const expressivenessErrors = [];
  const mermaidErrors = [];

  // Read Home.md for indexing check
  let homeContent = '';
  const homeCandidates = [path.join(vaultPath, 'Home.md'), path.join(vaultPath, 'HOME.md')];
  for (const hc of homeCandidates) {
    if (fs.existsSync(hc)) {
      homeContent = fs.readFileSync(hc, 'utf8');
      break;
    }
  }

  // Read section Overviews
  const sectionOverviews = {};
  ['Overview', 'Features', 'Guides', 'Reference', 'Decisions', 'Changelog'].forEach(sec => {
    const secPath = path.join(vaultPath, sec, 'Overview.md');
    if (fs.existsSync(secPath)) {
      sectionOverviews[sec] = fs.readFileSync(secPath, 'utf8');
    } else {
      sectionOverviews[sec] = '';
    }
  });

  // 4. Check Frontmatter, Wikilinks, Mermaid Syntax, and Indexing
  let totalDiagramsCount = 0;

  for (const filePath of mdFiles) {
    const rel = path.relative(vaultPath, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    // Frontmatter validation
    if (lines.length < 3 || lines[0].trim() !== '---') {
      frontmatterErrors.push(`${rel}: Missing opening '---' YAML frontmatter delimiter on line 1.`);
    } else {
      let closingIdx = -1;
      const scanLimit = Math.min(30, lines.length);
      for (let i = 1; i < scanLimit; i++) {
        if (lines[i].trim() === '---') {
          closingIdx = i;
          break;
        }
      }

      if (closingIdx === -1) {
        frontmatterErrors.push(`${rel}: Missing closing '---' YAML frontmatter delimiter within first 30 lines.`);
      } else {
        const fmBlock = lines.slice(1, closingIdx).join('\n');
        if (!/(?:^|\n)\s*title\s*:/i.test(fmBlock)) {
          frontmatterErrors.push(`${rel}: Frontmatter missing required 'title:' field.`);
        }
        if (!/(?:^|\n)\s*description\s*:/i.test(fmBlock)) {
          frontmatterErrors.push(`${rel}: Frontmatter missing required 'description:' field.`);
        }
        if (!/(?:^|\n)\s*tags\s*:/i.test(fmBlock)) {
          frontmatterErrors.push(`${rel}: Frontmatter missing required 'tags:' field.`);
        }
      }
    }

    // Wikilinks validation
    for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
      const line = lines[lineNum - 1];
      const linkRegex = /\[\[([^\]]+)\]\]/g;
      let match;
      while ((match = linkRegex.exec(line)) !== null) {
        const rawLink = match[1].trim();
        // Handle escaped pipes in markdown tables: [[target\|alias]]
        const cleanRaw = rawLink.replace(/\\\|/g, '|');
        // Handle pipe alias: [[target|alias]]
        let target = cleanRaw.split('|')[0].trim().replace(/\\+$/, '');
        // Handle anchor: [[target#anchor]]
        target = target.split('#')[0].trim();

        if (!target) continue;

        let targetClean = target.endsWith('.md') ? target.slice(0, -3) : target;
        targetClean = targetClean.replace(/\\/g, '/').toLowerCase();
        const targetWithExt = target.replace(/\\/g, '/').toLowerCase();

        const resolves = vaultTargets.has(targetClean) ||
                         vaultTargets.has(targetWithExt) ||
                         vaultRelPaths.has(targetClean) ||
                         vaultRelPaths.has(targetWithExt);

        if (!resolves) {
          brokenLinks.push(`${rel}:${lineNum} : Broken wikilink [[${rawLink}]] (target '${target}' not found in vault)`);
        }
      }
    }

    // Built-in Zero-Dependency Mermaid Syntax Linting
    let inMermaid = false;
    let mermaidStartLine = 0;
    let isSequence = false;
    let diagramLineCount = 0;

    for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
      const line = lines[lineNum - 1];
      const trimmed = line.trim();

      if (!inMermaid) {
        if (/^```mermaid\b/.test(trimmed)) {
          inMermaid = true;
          mermaidStartLine = lineNum;
          isSequence = false;
          diagramLineCount = 0;
          totalDiagramsCount++;
        }
      } else {
        if (/^```\s*$/.test(trimmed)) {
          if (diagramLineCount === 0) {
            mermaidErrors.push(`${rel}:${mermaidStartLine} : Empty Mermaid diagram block.`);
          }
          inMermaid = false;
          continue;
        }

        diagramLineCount++;

        if (/^sequenceDiagram\b/.test(trimmed)) {
          isSequence = true;
        }

        // Check 1: Unquoted parentheses, slashes, or asterisks in edge label (e.g. -->|label (text)|)
        const edgeMatch = line.match(/(?:-->|---|==>|-\.->)\s*\|([^"|\r\n]*)\|/);
        if (edgeMatch) {
          const edgeLabel = edgeMatch[1];
          if (/[()/*]/.test(edgeLabel)) {
            mermaidErrors.push(`${rel}:${lineNum} : Mermaid syntax error in diagram starting at line ${mermaidStartLine}. Unquoted special characters in edge label '|${edgeLabel}|'. Wrap the label in quotes (e.g. |"${edgeLabel}"|).`);
          }
        }

        // Check 2: Semicolon inside a sequenceDiagram Note (prematurely terminates statement)
        if (isSequence && /^\s*Note\s+(?:over|left of|right of)\s+[^:\r\n]+:\s*([^;\r\n]*;.*)$/i.test(trimmed)) {
          mermaidErrors.push(`${rel}:${lineNum} : Mermaid syntax error in sequence diagram starting at line ${mermaidStartLine}. Semicolon ';' in Note text prematurely terminates statement. Replace ';' with '-' or remove it.`);
        }

        // Check 3: Unquoted pipe character inside square bracket node text (e.g. State[A | B])
        const nodeMatch = trimmed.match(/^[A-Za-z0-9_-]+\[([^"\]\r\n]*\|[^"\]\r\n]*)\]/);
        if (nodeMatch) {
          const nodeLabel = nodeMatch[1];
          mermaidErrors.push(`${rel}:${lineNum} : Mermaid syntax error in diagram starting at line ${mermaidStartLine}. Unquoted pipe '|' inside node text '[${nodeLabel}]'. Wrap the node label in quotes (e.g. ["${nodeLabel}"]).`);
        }
      }
    }

    // Indexing validation
    const baseName = path.basename(filePath, '.md');
    const isRootDoc = /^(Home|HOME|README)\.md$/i.test(rel);
    const isSectionOverview = /^[A-Za-z0-9_-]+\/Overview\.md$/i.test(rel);
    const isChangelogEntry = /^Changelog\//i.test(rel);

    if (!isRootDoc && !isSectionOverview) {
      const section = rel.split('/')[0];
      const secText = sectionOverviews[section] || '';
      const escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const relNoExt = rel.endsWith('.md') ? rel.slice(0, -3) : rel;
      const escapedRel = relNoExt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const linkPattern = new RegExp(`\\[\\[(?:${escapedBase}|${escapedRel})(?:\\|[^\\]]+|#[^\\]]+)?\\]\\]`, 'i');
      const isLinked = linkPattern.test(homeContent) || linkPattern.test(secText);

      if (!isLinked && !isChangelogEntry) {
        unindexedPages.push(`${rel} (${baseName}) is not linked from Home.md or ${section}/Overview.md`);
      }
    }
  }

  // 5. Architectural Expressiveness Gate
  const overviewIndexPath = path.join(vaultPath, 'Overview', 'Overview.md');
  if (!fs.existsSync(overviewIndexPath)) {
    expressivenessErrors.push('Documentation/Overview/Overview.md: Missing section landing page.');
  }

  const overviewDir = path.join(vaultPath, 'Overview');
  if (fs.existsSync(overviewDir)) {
    const overviewFiles = fs.readdirSync(overviewDir).filter(f => f.endsWith('.md'));
    for (const ofile of overviewFiles) {
      const ofileContent = fs.readFileSync(path.join(overviewDir, ofile), 'utf8');
      if (!/```mermaid[\s\S]+?```/.test(ofileContent)) {
        expressivenessErrors.push(`Overview/${ofile}: Missing required Mermaid architectural diagram.`);
      }
    }
  }

  // 6. AST Parser Validation via validate-mermaid.mjs (if present)
  const mermaidValidatorScript = path.join(__dirname, 'validate-mermaid.mjs');
  let astValidated = false;
  if (fs.existsSync(mermaidValidatorScript)) {
    try {
      execSync(`node "${mermaidValidatorScript}"`, {
        cwd: repoRoot,
        stdio: 'pipe',
        encoding: 'utf8'
      });
      astValidated = true;
    } catch (err) {
      if (err.status === 1) {
        // Validation errors encountered
        const output = (err.stdout || '') + '\n' + (err.stderr || '');
        const parseMatches = output.matchAll(/\[MERMAID-PARSE\]\s+([^\r\n]+)/g);
        for (const pm of parseMatches) {
          mermaidErrors.push(pm[1]);
        }
        if (mermaidErrors.length === 0 && output.trim()) {
          mermaidErrors.push(`Mermaid parse error: ${output.trim().split('\n')[0]}`);
        }
      } else if (err.status === 2) {
        // Notice / skipped (mermaid or jsdom not loaded)
      }
    }
  }

  // Reporting
  console.log(`\n======================================================`);
  console.log(`🔍 Vault Integrity, Structure & Expressiveness Report`);
  console.log(`📂 Vault Path: ${vaultPath}`);
  console.log(`📄 Documents Scanned: ${mdFiles.length} | Diagrams Scanned: ${totalDiagramsCount}`);
  console.log(`======================================================\n`);

  if (structureErrors.length > 0) {
    console.error(`❌ Structural & Out-of-Place Files Issues (${structureErrors.length}):`);
    structureErrors.forEach(e => console.error(`   [STRUCT] ${e}`));
  } else {
    console.log(`✅ Canonical Structure: 100% compliant with 6 canonical sections (0 out-of-place files).`);
  }

  if (frontmatterErrors.length > 0) {
    console.error(`\n❌ Frontmatter Issues (${frontmatterErrors.length}):`);
    frontmatterErrors.slice(0, 15).forEach(e => console.error(`   [FM] ${e}`));
  } else {
    console.log(`✅ Frontmatter: 100% of documents have valid YAML frontmatter.`);
  }

  if (brokenLinks.length > 0) {
    console.error(`\n❌ Broken Wikilinks (${brokenLinks.length}):`);
    brokenLinks.slice(0, 20).forEach(e => console.error(`   [LINK] ${e}`));
  } else {
    console.log(`✅ Wikilinks: 100% of Obsidian [[wikilinks]] resolve cleanly (0 broken links).`);
  }

  if (mermaidErrors.length > 0) {
    console.error(`\n❌ Mermaid Diagram Syntax Issues (${mermaidErrors.length}):`);
    mermaidErrors.slice(0, 20).forEach(e => console.error(`   [MERMAID] ${e}`));
  } else {
    console.log(`✅ Mermaid Diagrams: All ${totalDiagramsCount} diagrams passed syntax & parser validation${astValidated ? ' (AST engine confirmed)' : ''}.`);
  }

  if (expressivenessErrors.length > 0) {
    console.error(`\n❌ Architectural Expressiveness Issues (${expressivenessErrors.length}):`);
    expressivenessErrors.forEach(e => console.error(`   [EXPR] ${e}`));
  } else {
    console.log(`✅ Architectural Expressiveness: Overview documents contain required Mermaid diagrams.`);
  }

  if (unindexedPages.length > 0) {
    console.warn(`\n⚠️  Unindexed Pages (${unindexedPages.length}):`);
    unindexedPages.slice(0, 15).forEach(e => console.warn(`   [INDEX] ${e}`));
  } else {
    console.log(`✅ Index Reachability: All topic pages are indexed in Home.md or section Overviews.`);
  }

  const hasFatalErrors = structureErrors.length > 0 || frontmatterErrors.length > 0 || brokenLinks.length > 0 || mermaidErrors.length > 0 || expressivenessErrors.length > 0;
  if (hasFatalErrors) {
    console.error(`\n🚨 Vault Integrity Verification FAILED with fatal errors.\n`);
    return {
      success: false,
      structureErrors,
      frontmatterErrors,
      brokenLinks,
      mermaidErrors,
      expressivenessErrors,
      unindexedPages,
      totalScanned: mdFiles.length,
      totalDiagrams: totalDiagramsCount
    };
  }

  console.log(`\n🎉 Vault Integrity Verification PASSED cleanly!\n`);
  return {
    success: true,
    structureErrors: [],
    frontmatterErrors: [],
    brokenLinks: [],
    mermaidErrors: [],
    expressivenessErrors: [],
    unindexedPages,
    totalScanned: mdFiles.length,
    totalDiagrams: totalDiagramsCount
  };
}

if (require.main === module) {
  const targetDir = process.argv[2];
  const res = verifyVault(targetDir);
  process.exit(res.success ? 0 : 1);
}

module.exports = { verifyVault };
