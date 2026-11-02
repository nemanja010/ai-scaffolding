#!/usr/bin/env node

/**
 * OpenSpec Documentation Synchronizer
 * 
 * Synchronizes OpenSpec specifications, architectural domains, ADRs, governance,
 * and archived changes into an Obsidian-compatible product documentation vault under Documentation/.
 * 
 * Features:
 * - Dynamic domain- and architecture-agnostic discovery (reads openspec/domains.yaml)
 * - Intelligent incremental sync via SHA-256 state manifest (Documentation/.sync-state.json)
 * - Semantic markdown transformation with YAML frontmatter, wikilinks, and scenario callouts
 * - Dynamic Map of Content (MOC) generation (Documentation/Home.md)
 * - Automatic synchronization of OpenSpec Governance and Schemas into Documentation/Guides/
 * - Automatic pruning of notes when specifications are deleted
 * - Zero npm dependencies; 100% portable pure Node.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Resolve repository root
function findRepoRoot(startDir = process.cwd()) {
  let current = startDir;
  while (current) {
    if (fs.existsSync(path.join(current, 'openspec', 'domains.yaml')) || fs.existsSync(path.join(current, 'openspec', 'config.yaml'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return startDir;
}

const REPO_ROOT = findRepoRoot();
const OPENSPEC_DIR = path.join(REPO_ROOT, 'openspec');
const DOMAINS_FILE = path.join(OPENSPEC_DIR, 'domains.yaml');
const GOVERNANCE_FILE = path.join(OPENSPEC_DIR, 'GOVERNANCE.md');
const SCHEMAS_FILE = path.join(OPENSPEC_DIR, 'SCHEMAS.md');
const SPECS_DIR = path.join(OPENSPEC_DIR, 'specs');
const ARCHIVE_DIR = path.join(OPENSPEC_DIR, 'changes', 'archive');
const ADR_DIR = path.join(REPO_ROOT, 'adr');
const DOCS_DIR = path.join(REPO_ROOT, 'Documentation');
const STATE_FILE = path.join(DOCS_DIR, '.sync-state.json');

// CLI Flags
const args = process.argv.slice(2);
const FORCE_REBUILD = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose') || args.includes('-v');

function computeHash(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function computeFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  return computeHash(content);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Convert kebab-case or id to Title Case
function toTitleCase(str) {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Simple YAML parser for domains.yaml
function parseDomainsYaml(content) {
  const domains = [];
  let currentDomain = null;
  let inCapabilities = false;
  let currentCap = null;

  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const domainMatch = line.match(/^ {2}([a-zA-Z0-9_-]+):\s*$/);
    if (domainMatch) {
      currentDomain = { id: domainMatch[1], name: domainMatch[1], description: '', capabilities: [] };
      domains.push(currentDomain);
      inCapabilities = false;
      currentCap = null;
      continue;
    }

    if (currentDomain) {
      const nameMatch = line.match(/^ {4}name:\s*["']?([^"']+)["']?\s*$/);
      if (nameMatch) {
        currentDomain.name = nameMatch[1];
        continue;
      }

      const descMatch = line.match(/^ {4}description:\s*["']?([^"']+)["']?\s*$/);
      if (descMatch) {
        currentDomain.description = descMatch[1];
        continue;
      }

      if (line.match(/^ {4}capabilities:\s*$/)) {
        inCapabilities = true;
        continue;
      }

      if (inCapabilities) {
        const capIdMatch = line.match(/^ {6}-\s*id:\s*["']?([^"']+)["']?\s*$/);
        if (capIdMatch) {
          currentCap = { id: capIdMatch[1], description: '' };
          currentDomain.capabilities.push(currentCap);
          continue;
        }

        const capDescMatch = line.match(/^ {8}description:\s*["']?([^"']+)["']?\s*$/);
        if (capDescMatch && currentCap) {
          currentCap.description = capDescMatch[1];
          continue;
        }
      }
    }
  }

  return domains;
}

// Read or initialize sync state
function loadState() {
  if (!FORCE_REBUILD && fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch {
      return { version: '1.0', files: {}, archivedChanges: {}, adrs: {} };
    }
  }
  return { version: '1.0', files: {}, archivedChanges: {}, adrs: {} };
}

function saveState(state) {
  if (DRY_RUN) return;
  state.lastSync = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// Categorize capability: features vs reference
function categorizeCapability(domainId, capId) {
  const refKeywords = ['config', 'persistence', 'data', 'storage', 'infra', 'platform', 'schema', 'contract', 'protocol'];
  const isRef = refKeywords.some(kw => capId.toLowerCase().includes(kw) || domainId.toLowerCase().includes(kw));
  return isRef ? 'Reference' : 'Features';
}

// Parse OpenSpec Markdown spec
function parseSpecContent(content) {
  const lines = content.split(/\r?\n/);
  let title = '';
  let purpose = '';
  const requirements = [];
  let currentReq = null;
  let currentScenario = null;
  let inPurpose = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('# ') && !title) {
      title = trimmed.replace('# ', '').trim();
      continue;
    }

    if (trimmed.startsWith('## Purpose')) {
      inPurpose = true;
      continue;
    }

    if (trimmed.startsWith('## Requirements')) {
      inPurpose = false;
      continue;
    }

    if (inPurpose) {
      if (trimmed && !trimmed.startsWith('#')) {
        purpose += (purpose ? ' ' : '') + trimmed;
      }
      continue;
    }

    if (trimmed.startsWith('### Requirement:')) {
      const reqName = trimmed.replace('### Requirement:', '').trim();
      currentReq = { name: reqName, description: '', scenarios: [] };
      requirements.push(currentReq);
      currentScenario = null;
      continue;
    }

    if (trimmed.startsWith('#### Scenario:')) {
      const scenName = trimmed.replace('#### Scenario:', '').trim();
      currentScenario = { name: scenName, steps: [] };
      if (currentReq) {
        currentReq.scenarios.push(currentScenario);
      }
      continue;
    }

    if (currentScenario && (trimmed.startsWith('- **GIVEN**') || trimmed.startsWith('- **WHEN**') || trimmed.startsWith('- **THEN**') || trimmed.startsWith('- **AND**') || trimmed.startsWith('- **BUT**'))) {
      currentScenario.steps.push(trimmed);
      continue;
    }

    if (currentReq && !currentScenario && trimmed && !trimmed.startsWith('---') && !trimmed.startsWith('#')) {
      currentReq.description += (currentReq.description ? '\n' : '') + trimmed;
    }
  }

  return { title, purpose, requirements };
}

// Format transformed documentation note
function formatDocNote({ title, category, domain, capability, specPath, purpose, requirements }) {
  const docTitle = title || toTitleCase(capability);
  let out = `---
title: "${docTitle}"
category: "${category.toLowerCase()}"
domain: "${domain}"
capability: "${capability}"
source_spec: "${specPath.replace(/\\/g, '/')}"
last_synced: "${new Date().toISOString()}"
tags:
  - "${category.toLowerCase()}"
  - "domain/${domain}"
  - "capability/${capability}"
---

# ${docTitle}

> [!NOTE] Specification Provenance
> Sourced from living specification: \`${specPath.replace(/\\/g, '/')}\`  
> Parent Domain: **[[Reference/Domain-Catalog#${toTitleCase(domain)}|${toTitleCase(domain)}]]**

## Overview
${purpose || 'Living behavioral specification for ' + capability + ' in the ' + domain + ' domain.'}

## Behavioral Acceptance Criteria
`;

  if (requirements.length === 0) {
    out += `\n*No requirements formally defined yet.*\n`;
  } else {
    for (const req of requirements) {
      out += `\n### ${req.name}\n\n`;
      if (req.description) {
        out += `${req.description}\n\n`;
      }
      if (req.scenarios && req.scenarios.length > 0) {
        for (const sc of req.scenarios) {
          out += `> [!EXAMPLE] Scenario: ${sc.name}\n`;
          for (const step of sc.steps) {
            out += `> ${step}\n`;
          }
          out += `\n`;
        }
      }
    }
  }

  out += `\n---\n[[Home|← Back to Home]] | [[${category}/Overview|${category} Index]]\n`;
  return out;
}

// Sync OpenSpec framework documents (Governance & Schemas) into Documentation/Guides/
function syncFrameworkGuides(state, updatedCount) {
  const guides = [
    {
      source: GOVERNANCE_FILE,
      targetName: 'OpenSpec-Governance.md',
      title: 'OpenSpec Domain & Capability Governance',
      tags: ['guides', 'openspec', 'governance']
    },
    {
      source: SCHEMAS_FILE,
      targetName: 'OpenSpec-Schemas.md',
      title: 'OpenSpec Schema Mechanics & Workflows',
      tags: ['guides', 'openspec', 'schemas']
    }
  ];

  for (const guide of guides) {
    if (!fs.existsSync(guide.source)) continue;
    const content = fs.readFileSync(guide.source, 'utf8');
    const hash = computeHash(content);
    const targetPath = path.join(DOCS_DIR, 'Guides', guide.targetName);
    const relSource = path.relative(REPO_ROOT, guide.source);

    if (!FORCE_REBUILD && state.files[relSource] === hash && fs.existsSync(targetPath)) {
      continue;
    }

    if (VERBOSE) console.log(`[Sync] Updating framework guide: Guides/${guide.targetName}`);

    const frontmatter = `---
title: "${guide.title}"
type: guide
source: "${relSource.replace(/\\/g, '/')}"
last_synced: "${new Date().toISOString()}"
tags:
${guide.tags.map(t => `  - ${t}`).join('\n')}
---

`;

    const formatted = frontmatter + content + `\n\n---\n[[Home|← Back to Home]] | [[Guides/Developer-Onboarding|Onboarding Guide]]\n`;

    if (!DRY_RUN) {
      fs.writeFileSync(targetPath, formatted, 'utf8');
    }

    state.files[relSource] = hash;
    updatedCount++;
  }

  return updatedCount;
}

// Transform archived changes into changelog notes
function processArchivedChanges(state, updatedCount) {
  if (!fs.existsSync(ARCHIVE_DIR)) return updatedCount;

  const entries = fs.readdirSync(ARCHIVE_DIR, { withFileTypes: true });
  const archiveDirs = entries.filter(e => e.isDirectory() && e.name !== '.gitkeep').map(e => e.name);

  for (const archiveName of archiveDirs) {
    const archivePath = path.join(ARCHIVE_DIR, archiveName);
    const proposalPath = path.join(archivePath, 'proposal.md');
    if (!fs.existsSync(proposalPath)) continue;

    const proposalContent = fs.readFileSync(proposalPath, 'utf8');
    const hash = computeHash(proposalContent);
    const targetFile = path.join(DOCS_DIR, 'Changelog', `${archiveName}.md`);

    if (!FORCE_REBUILD && state.archivedChanges[archiveName] === hash && fs.existsSync(targetFile)) {
      continue;
    }

    if (VERBOSE) console.log(`[Sync] Updating changelog note: ${archiveName}`);

    const whyMatch = proposalContent.match(/## Why\s+([\s\S]*?)(?=\n## |$)/);
    const whatMatch = proposalContent.match(/## What Changes\s+([\s\S]*?)(?=\n## |$)/);
    const whyText = whyMatch ? whyMatch[1].trim() : 'Change archived.';
    const whatText = whatMatch ? whatMatch[1].trim() : '';

    const changelogNote = `---
title: "Change: ${archiveName}"
type: changelog
change: "${archiveName}"
last_synced: "${new Date().toISOString()}"
tags:
  - changelog
  - openspec-archive
---

# Change Summary: ${archiveName}

> [!INFO] OpenSpec Change Archive
> Archived Record: \`openspec/changes/archive/${archiveName}\`

## Problem & Motivation
${whyText}

## Changes Delivered
${whatText || '*Details preserved in archived delta specs.*'}

---
[[Changelog/Overview|← Changelog Index]] | [[Home|Home]]
`;

    if (!DRY_RUN) {
      fs.writeFileSync(targetFile, changelogNote, 'utf8');
    }

    state.archivedChanges[archiveName] = hash;
    updatedCount++;
  }

  return updatedCount;
}

// Build Dynamic Map of Content (Home.md)
function buildHomeMoc(domains, specsCatalog) {
  let content = `# Documentation Vault

Welcome to the product and architecture documentation. This knowledge base is dynamically synchronized from living specifications, architectural models, and OpenSpec change records.

## 🧭 Map of Content (MOC)

| Section | Focus | Quick Link |
| :--- | :--- | :--- |
| **Product Overview** | System vision, actors, and principles | [[Overview/Product-Overview\\|Read Overview]] |
| **System Architecture** | Architecture context and component structure | [[Overview/System-Architecture\\|View Architecture]] |
| **Features & Capabilities** | Functional capabilities and acceptance scenarios | [[Features/Overview\\|Explore Features]] |
| **Developer Guides** | Setup, onboarding, governance, and schemas | [[Guides/Developer-Onboarding\\|Onboarding]] · [[Guides/OpenSpec-Governance\\|Governance]] · [[Guides/OpenSpec-Schemas\\|Schemas]] |
| **Technical Reference** | Configuration, domain catalog, and contracts | [[Reference/Overview\\|View Reference]] |
| **Architectural Decisions** | Durable decision records (ADRs) | [[Decisions/Overview\\|Browse ADRs]] |
| **Product Changelog** | Release history and archived changes | [[Changelog/Overview\\|View Changelog]] |

---

## 🏛️ System Domains & Capabilities

`;

  if (domains.length === 0) {
    content += `*No architectural domains declared yet in \`openspec/domains.yaml\`.*\n\n`;
  } else {
    for (const domain of domains) {
      content += `### ${domain.name}\n`;
      if (domain.description) {
        content += `*${domain.description}*\n\n`;
      }
      const domainSpecs = specsCatalog.filter(s => s.domain === domain.id);
      if (domainSpecs.length === 0) {
        content += `- *No specifications documented yet for this domain.*\n\n`;
      } else {
        for (const spec of domainSpecs) {
          content += `- **[[${spec.category}/${spec.fileName}|${spec.title}]]**: ${spec.purpose || 'Living behavioral specification'}\n`;
        }
        content += `\n`;
      }
    }
  }

  content += `---
*Dynamically maintained by OpenSpec Documentation Sync. Run \`/opsx-sync-docs\` (or \`/opsx:sync-docs\`) to refresh.*
`;

  return content;
}

// Build Domain Catalog Reference
function buildDomainCatalog(domains, specsCatalog) {
  let content = `---
title: "Domain Catalog"
type: reference
last_synced: "${new Date().toISOString()}"
tags:
  - reference
  - architecture
  - domains
---

# Architectural Domain Catalog

Canonical architectural boundaries registered in \`openspec/domains.yaml\`.

`;

  for (const domain of domains) {
    content += `## ${domain.name} (\`${domain.id}\`)\n\n`;
    content += `${domain.description}\n\n`;
    content += `### Capabilities\n\n`;

    if (!domain.capabilities || domain.capabilities.length === 0) {
      content += `*No capabilities declared.*\n\n`;
    } else {
      for (const cap of domain.capabilities) {
        const specMatch = specsCatalog.find(s => s.domain === domain.id && s.capability === cap.id);
        const link = specMatch ? `[[${specMatch.category}/${specMatch.fileName}|${toTitleCase(cap.id)}]]` : `\`${cap.id}\``;
        content += `- **${link}**: ${cap.description || 'System capability'}\n`;
      }
      content += `\n`;
    }
  }

  content += `---\n[[Home|← Back to Home]] | [[Reference/Overview|Reference Index]]\n`;
  return content;
}

// Main execution
function sync() {
  console.log(`[OpenSpec Docs Sync] Starting documentation sync (Repo: ${REPO_ROOT})`);

  if (!fs.existsSync(DOMAINS_FILE)) {
    console.error(`Error: openspec/domains.yaml not found at ${DOMAINS_FILE}`);
    process.exit(1);
  }

  // Ensure vault directories
  ['Overview', 'Features', 'Guides', 'Reference', 'Decisions', 'Changelog'].forEach(sub => {
    ensureDir(path.join(DOCS_DIR, sub));
  });

  const state = loadState();
  let updatedFilesCount = 0;

  // 1. Check domains.yaml
  const domainsContent = fs.readFileSync(DOMAINS_FILE, 'utf8');
  const domainsHash = computeHash(domainsContent);
  const domainsChanged = FORCE_REBUILD || state.domainsHash !== domainsHash;
  const domains = parseDomainsYaml(domainsContent);

  // 2. Discover living specs
  const specsCatalog = [];
  const specFiles = [];

  function walkSpecs(dir, currentDomain = '') {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkSpecs(fullPath, currentDomain ? `${currentDomain}/${entry.name}` : entry.name);
      } else if (entry.name === 'spec.md') {
        const relDir = path.dirname(path.relative(SPECS_DIR, fullPath));
        const parts = relDir.split(/[\\/]/);
        const domain = parts[0];
        const capability = parts.slice(1).join('-') || parts[0];
        specFiles.push({ fullPath, domain, capability });
      }
    }
  }

  walkSpecs(SPECS_DIR);

  // Prune removed specs from state and disk
  for (const storedSpecPath of Object.keys(state.files)) {
    if (storedSpecPath.startsWith('openspec\\specs\\') || storedSpecPath.startsWith('openspec/specs/')) {
      const fullStoredPath = path.join(REPO_ROOT, storedSpecPath);
      if (!fs.existsSync(fullStoredPath)) {
        if (VERBOSE) console.log(`[Sync] Pruning deleted spec from tracking: ${storedSpecPath}`);
        delete state.files[storedSpecPath];
        updatedFilesCount++;
      }
    }
  }

  for (const { fullPath, domain, capability } of specFiles) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hash = computeHash(content);
    const category = categorizeCapability(domain, capability);
    const fileName = `${toTitleCase(capability).replace(/\s+/g, '-')}`;
    const targetPath = path.join(DOCS_DIR, category, `${fileName}.md`);
    const relSpecPath = path.relative(REPO_ROOT, fullPath);

    const parsed = parseSpecContent(content);
    const docTitle = parsed.title || toTitleCase(capability);

    specsCatalog.push({
      domain,
      capability,
      category,
      fileName,
      title: docTitle,
      purpose: parsed.purpose,
      targetPath
    });

    const isModified = FORCE_REBUILD || state.files[relSpecPath] !== hash || !fs.existsSync(targetPath);
    if (isModified) {
      if (VERBOSE) console.log(`[Sync] Updating spec note: ${category}/${fileName}.md`);
      const formatted = formatDocNote({
        title: docTitle,
        category,
        domain,
        capability,
        specPath: relSpecPath,
        purpose: parsed.purpose,
        requirements: parsed.requirements
      });

      if (!DRY_RUN) {
        fs.writeFileSync(targetPath, formatted, 'utf8');
      }

      state.files[relSpecPath] = hash;
      updatedFilesCount++;
    }
  }

  // 3. Sync framework guides (Governance & Schemas)
  updatedFilesCount = syncFrameworkGuides(state, updatedFilesCount);

  // 4. Process archived changes
  updatedFilesCount = processArchivedChanges(state, updatedFilesCount);

  // 5. Regenerate Catalog and MOC if specs or domains changed or files missing
  const homePath = path.join(DOCS_DIR, 'Home.md');
  const catalogPath = path.join(DOCS_DIR, 'Reference', 'Domain-Catalog.md');

  if (domainsChanged || updatedFilesCount > 0 || !fs.existsSync(homePath) || !fs.existsSync(catalogPath)) {
    if (VERBOSE) console.log(`[Sync] Refreshing Map of Content and Domain Catalog`);

    const homeMoc = buildHomeMoc(domains, specsCatalog);
    const domainCatalog = buildDomainCatalog(domains, specsCatalog);

    if (!DRY_RUN) {
      fs.writeFileSync(homePath, homeMoc, 'utf8');
      fs.writeFileSync(catalogPath, domainCatalog, 'utf8');
    }

    state.domainsHash = domainsHash;
    updatedFilesCount += 2;
  }

  // 6. Persist state
  saveState(state);

  if (updatedFilesCount === 0) {
    console.log(`✨ Documentation is already up to date. (0 files changed)`);
  } else {
    console.log(`✓ Documentation synchronization complete: ${updatedFilesCount} files updated.`);
  }
}

sync();
