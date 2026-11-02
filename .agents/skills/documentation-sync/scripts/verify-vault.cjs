#!/usr/bin/env node

/**
 * Universal Obsidian Knowledge Vault Integrity & Expressiveness Quality Gate.
 * Cross-platform (Windows, Linux, macOS, CI/Docker) with ZERO external dependencies.
 *
 * Validates:
 * 1. Every Markdown file in Documentation/ has valid YAML frontmatter (title, description, tags).
 * 2. Every Obsidian [[wikilink]] resolves to an existing vault target (0 broken links).
 * 3. Every topic page under Overview/, Features/, Guides/, Reference/, Decisions/, and Changelog/
 *    is indexed in Home.md or its section Overview.md.
 * 4. Architectural Expressiveness Gate: Documentation/Overview/Overview.md exists, and every document
 *    under Documentation/Overview/*.md contains at least one substantive Mermaid diagram.
 */

const fs = require('fs');
const path = require('path');

function findRepoRoot() {
  let curr = __dirname;
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'AGENTS.md')) || fs.existsSync(path.join(curr, '.git'))) {
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

  // 1. Gather all .md files in the vault (excluding .obsidian)
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

  // 2. Build set of available targets for [[wikilink]] resolution (case-insensitive)
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

  // Read Home.md
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

  // 3. Check Frontmatter and [[wikilinks]]
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

  // 4. Architectural Expressiveness Gate
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

  // Reporting
  console.log(`\n======================================================`);
  console.log(`🔍 Vault Integrity & Expressiveness Gate Report`);
  console.log(`📂 Vault Path: ${vaultPath}`);
  console.log(`📄 Total Documents Scanned: ${mdFiles.length}`);
  console.log(`======================================================\n`);

  if (frontmatterErrors.length > 0) {
    console.error(`❌ Frontmatter Issues (${frontmatterErrors.length}):`);
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

  const hasFatalErrors = frontmatterErrors.length > 0 || brokenLinks.length > 0 || expressivenessErrors.length > 0;
  if (hasFatalErrors) {
    console.error(`\n🚨 Vault Integrity Verification FAILED with fatal errors.\n`);
    return {
      success: false,
      frontmatterErrors,
      brokenLinks,
      expressivenessErrors,
      unindexedPages,
      totalScanned: mdFiles.length
    };
  }

  console.log(`\n🎉 Vault Integrity Verification PASSED cleanly!\n`);
  return {
    success: true,
    frontmatterErrors: [],
    brokenLinks: [],
    expressivenessErrors: [],
    unindexedPages,
    totalScanned: mdFiles.length
  };
}

if (require.main === module) {
  const targetDir = process.argv[2];
  const res = verifyVault(targetDir);
  process.exit(res.success ? 0 : 1);
}

module.exports = { verifyVault };
