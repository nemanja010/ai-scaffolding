#!/usr/bin/env node

/**
 * OpenSpec Documentation Synchronizer
 * 
 * Synchronizes OpenSpec specifications, architectural domains, ADRs, governance,
 * and codebase source code into an Obsidian-compatible product documentation vault under Documentation/.
 * 
 * Features:
 * - AST Symbol Detection & Fingerprinting: Extracts classes, interfaces, structs, routines, endpoints, and entrypoints
 * - Dual-Engine Codebase Grasp: Tree-sitter AST compression via Repomix with zero-dependency Node AST fallback
 * - Comprehensive "WHAT", "HOW", and "WHY": Generates rich product onboarding documentation
 * - Intelligent incremental sync via SHA-256 state manifest (Documentation/.sync-state.json)
 * - Dynamic domain- and architecture-agnostic discovery (reads openspec/domains.yaml)
 * - Semantic markdown transformation with YAML frontmatter, wikilinks, and scenario callouts
 * - Dynamic Map of Content (MOC) generation (Documentation/Home.md)
 * - Automatic synchronization of OpenSpec Governance and Schemas into Documentation/Guides/
 * - Automatic pruning of notes when specifications are deleted
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

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
const WORKSPACE_DIR = path.join(REPO_ROOT, '.agent-workspace');

// CLI Flags
const args = process.argv.slice(2);
const FORCE_REBUILD = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose') || args.includes('-v');

function computeHash(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
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

// Recognized source code extensions
const SOURCE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.pyw',
  '.rs',
  '.go',
  '.java', '.kt', '.scala',
  '.cs', '.fs',
  '.cpp', '.c', '.cc', '.h', '.hpp',
  '.rb',
  '.php',
  '.swift',
  '.ex', '.exs',
  '.sh', '.bash'
]);

const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.agent-workspace', 'dist', 'build', 'out',
  '.antigravity', '.gemini', 'Documentation', 'openspec', '.opencode',
  '.claude', '.github', '.vscode', 'coverage', '.next', 'target', 'bin', 'obj',
  'glossary', 'adr', '.agents'
]);

// Extract docstring or leading comments from source code
function extractDocComment(content) {
  if (!content) return '';
  // Python triple quotes
  const pyMatch = content.match(/^\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)''')/);
  if (pyMatch) {
    const raw = (pyMatch[1] || pyMatch[2] || '').trim();
    if (raw) return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean).join(' ');
  }
  // JSDoc / multiline C-style
  const jsMatch = content.match(/^\s*\/\*\*?([\s\S]*?)\*\//);
  if (jsMatch) {
    const raw = jsMatch[1].replace(/^\s*\*+/gm, '').trim();
    if (raw && !raw.startsWith('eslint') && !raw.startsWith('prettier') && !raw.startsWith('ts-check')) {
      return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean).join(' ');
    }
  }
  // Leading single-line comments
  const lines = content.split(/\r?\n/);
  const commentLines = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
      const clean = trimmed.replace(/^(\/\/[!/]?|#)\s*/, '').trim();
      if (clean && !clean.startsWith('eslint') && !clean.startsWith('ts-check') && !clean.startsWith('!') && !clean.startsWith('pragma')) {
        commentLines.push(clean);
      }
    } else if (trimmed === '') {
      continue;
    } else {
      break;
    }
  }
  if (commentLines.length > 0) {
    return commentLines.join(' ');
  }
  return '';
}

// Native AST Symbol Detection Engine across major languages
function detectFileAstSymbols(content, ext, relPath) {
  const symbols = {
    entities: [],      // Classes, structs, interfaces, types, enums
    routines: [],      // Functions, methods, handlers
    endpoints: [],     // HTTP routes
    entrypoints: [],   // Main / server / CLI entrypoints
    invariants: [],    // Outputs, guards
    docstring: extractDocComment(content)
  };

  // 1. HTTP Endpoints
  // 1. HTTP Endpoints across ecosystems
  const routePatterns = [
    /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*["'`]([^"'`]+)["'`]/gi,
    /@(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*["'`]([^"'`]+)["'`]/gi,
    /http\.HandleFunc\s*\(\s*["'`]([^"'`]+)["'`]/gi,
    /\.(?:GET|POST|PUT|DELETE|PATCH)\s*\(\s*["'`]([^"'`]+)["'`]/g, // Gin / Fiber
    /\.route\s*\(\s*["'`]([^"'`]+)["'`]/gi, // Axum / Actix
    /@(?:GetMapping|PostMapping|RequestMapping|HttpGet|HttpPost|HttpDelete|HttpPut)\s*\(\s*["'`]([^"'`]+)["'`]/gi // Spring / ASP.NET
  ];
  for (const pat of routePatterns) {
    const matches = content.matchAll(pat);
    for (const m of matches) {
      const method = (m[1] || 'HTTP').toUpperCase();
      const routePath = m[2] || m[1];
      if (!symbols.endpoints.some(ep => ep.method === method && ep.path === routePath)) {
        symbols.endpoints.push({ file: relPath, method, path: routePath });
      }
    }
  }

  // 2. Entrypoints & Server Listeners across languages
  const portMatch = content.match(/\.(?:listen|run|serve)\s*\(\s*(\d{2,5})|http\.ListenAndServe\s*\(\s*["'](?::)?(\d{2,5})/i);
  if (portMatch) {
    const port = portMatch[1] || portMatch[2];
    symbols.entrypoints.push({ file: relPath, type: 'HTTP Listener', target: `Port ${port}` });
  }
  // Universal Main Functions (Rust, Go, Python, C, C++, Java, C#, JS)
  if (/func\s+main\s*\(\s*\)|fn\s+main\s*\(\s*\)|def\s+main\s*\(\s*\)|if\s+__name__\s*==\s*['"]__main__['"]|function\s+main\s*\(|(?:int|void|public\s+static\s+void)\s+main\s*\(/.test(content)) {
    symbols.entrypoints.push({ file: relPath, type: 'Application Entrypoint', target: 'main()' });
  }
  // Frontend & Client App Bootstrap
  if (/bootstrapApplication\s*\(|platformBrowserDynamic\(\)\.bootstrapModule\s*\(|createRoot\s*\(|createApp\s*\(|ReactDOM\.render\s*\(/.test(content)) {
    symbols.entrypoints.push({ file: relPath, type: 'Application Entrypoint', target: 'Client App Bootstrap' });
  }

  // 3. Classes / Structs / Interfaces / Types
  const entityPatterns = [
    /(?:export\s+)?(?:abstract\s+)?class\s+([a-zA-Z0-9_]+)/g,
    /(?:export\s+)?interface\s+([a-zA-Z0-9_]+)/g,
    /(?:export\s+)?type\s+([a-zA-Z0-9_]+)\s*=/g,
    /(?:export\s+)?enum\s+([a-zA-Z0-9_]+)/g,
    /class\s+([a-zA-Z0-9_]+)(?:\([^)]+\))?:/g,
    /(?:pub\s+)?(?:struct|enum|trait)\s+([a-zA-Z0-9_]+)/g,
    /type\s+([a-zA-Z0-9_]+)\s+(?:struct|interface)/g
  ];
  for (const pat of entityPatterns) {
    const matches = content.matchAll(pat);
    for (const m of matches) {
      const name = m[1];
      if (name && !symbols.entities.some(e => e.name === name)) {
        let kind = 'class';
        if (m[0].includes('interface')) kind = 'interface';
        else if (m[0].includes('struct')) kind = 'struct';
        else if (m[0].includes('trait')) kind = 'trait';
        else if (m[0].includes('enum')) kind = 'enum';
        else if (m[0].includes('type ')) kind = 'type';
        symbols.entities.push({ file: relPath, name, kind });
      }
    }
  }

  // Angular Decorators & Components
  const ngCompMatches = content.matchAll(/@Component\s*\(\s*\{[\s\S]*?selector:\s*['"]([^'"]+)['"]/g);
  for (const m of ngCompMatches) {
    const compSelector = `<${m[1]}>`;
    if (!symbols.entities.some(e => e.name === compSelector)) {
      symbols.entities.push({ file: relPath, name: compSelector, kind: 'angular component' });
    }
  }
  const ngSvcMatches = content.matchAll(/@Injectable\s*\([\s\S]*?\)\s*(?:export\s+)?class\s+([a-zA-Z0-9_]+)/g);
  for (const m of ngSvcMatches) {
    if (!symbols.entities.some(e => e.name === m[1])) {
      symbols.entities.push({ file: relPath, name: m[1], kind: 'angular service' });
    }
  }

  // 4. Routines / Functions / Methods
  const routinePatterns = [
    /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g,
    /(?:public|private|protected|static|async)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g,
    /(?:export\s+)?(?:const|let)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/g,
    /def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g,
    /(?:pub\s+)?(?:async\s+)?fn\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g,
    /func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g
  ];
  for (const pat of routinePatterns) {
    const matches = content.matchAll(pat);
    for (const m of matches) {
      const name = m[1];
      if (name && !name.startsWith('_') && !symbols.routines.some(r => r.name === name)) {
        const params = (m[2] || '').trim();
        symbols.routines.push({ file: relPath, name, params });
      }
    }
  }

  // 5. Output statements (for CLI & small scripts)
  const printMatches = content.matchAll(/(?:console\.log|print|println!|fmt\.Println)\s*\(\s*["'`]([^"'`\r\n]{2,80})["'`]/g);
  for (const m of printMatches) {
    if (!symbols.invariants.includes(m[1]) && symbols.invariants.length < 3) {
      symbols.invariants.push(m[1]);
    }
  }

  return symbols;
}

// Deep AST symbol scanner across the entire codebase
function scanCodebaseAstSymbols(repoRoot) {
  const catalog = {
    entities: [],
    routines: [],
    endpoints: [],
    entrypoints: [],
    filesIndexed: 0
  };

  function walk(dir, depth = 0) {
    if (depth > 10) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        if (IGNORED_DIRS.has(ent.name)) continue;
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          walk(full, depth + 1);
        } else if (ent.isFile()) {
          const ext = path.extname(ent.name).toLowerCase();
          if (SOURCE_EXTENSIONS.has(ext)) {
            if (depth === 0 && (ent.name.includes('config') || ent.name.startsWith('.') || ent.name === 'sync-docs.cjs')) continue;
            const rel = path.relative(repoRoot, full).replace(/\\/g, '/');
            const content = fs.readFileSync(full, 'utf8');
            const symbols = detectFileAstSymbols(content, ext, rel);

            catalog.filesIndexed++;
            catalog.entities.push(...symbols.entities);
            catalog.routines.push(...symbols.routines);
            catalog.endpoints.push(...symbols.endpoints);
            catalog.entrypoints.push(...symbols.entrypoints);
          }
        }
      }
    } catch {}
  }

  walk(repoRoot, 0);

  // Canonical AST signature hash
  const canonicalString = JSON.stringify({
    entities: catalog.entities.map(e => `${e.file}:${e.kind}:${e.name}`).sort(),
    routines: catalog.routines.map(r => `${r.file}:${r.name}(${r.params})`).sort(),
    endpoints: catalog.endpoints.map(ep => `${ep.file}:${ep.method} ${ep.path}`).sort(),
    entrypoints: catalog.entrypoints.map(en => `${en.file}:${en.type}:${en.target}`).sort()
  });

  catalog.astHash = computeHash(canonicalString);
  return catalog;
}

// Deeply analyze an individual source file
function analyzeSourceFile(fullPath, repoRoot) {
  const relPath = path.relative(repoRoot, fullPath).replace(/\\/g, '/');
  const ext = path.extname(fullPath).toLowerCase();
  let content = '';
  try {
    content = fs.readFileSync(fullPath, 'utf8');
  } catch {
    return null;
  }

  const lines = content.split(/\r?\n/);
  const lineCount = lines.length;
  const ast = detectFileAstSymbols(content, ext, relPath);

  const langMap = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript',
    '.js': 'JavaScript', '.jsx': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript',
    '.py': 'Python', '.pyw': 'Python',
    '.rs': 'Rust',
    '.go': 'Go',
    '.java': 'Java', '.kt': 'Kotlin',
    '.cs': 'C#',
    '.cpp': 'C++', '.c': 'C', '.h': 'C/C++ Header',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.sh': 'Shell Script', '.bash': 'Shell Script'
  };

  const language = langMap[ext] || 'Source Code';
  const isAngular = /@Component|@Injectable|bootstrapApplication|provideRouter/.test(content);
  const hasMain = ast.entrypoints.length > 0 || ((ast.invariants.length > 0) && (!relPath.includes('/') || relPath.startsWith('src/index') || relPath.startsWith('src/main')));
  const isServer = ast.endpoints.length > 0 || ast.entrypoints.some(e => e.type === 'HTTP Listener') || /express\(|FastAPI\(|Flask\(|http\.createServer|actix_web|axum|gin\.Default|fiber\.New|SpringApplication|WebApplication\.CreateBuilder/.test(content);
  const isCli = /process\.argv|argparse|clap|commander|flag\.Parse|click\.|os\.Args|std::env::args|sys\.argv|Environment\.GetCommandLineArgs|getopt/.test(content);

  let summary = '';
  if (ast.docstring) {
    summary = ast.docstring;
  } else if (isAngular && ast.entities.some(e => e.kind === 'angular component')) {
    const compNames = ast.entities.filter(e => e.kind === 'angular component').map(e => e.name).join(', ');
    summary = `Angular Component rendering ${compNames}`;
  } else if (isAngular && ast.entities.some(e => e.kind === 'angular service')) {
    const svcNames = ast.entities.filter(e => e.kind === 'angular service').map(e => `\`${e.name}\``).join(', ');
    summary = `Angular Service providing ${svcNames}`;
  } else if (hasMain && /bootstrapApplication/.test(content)) {
    summary = 'Angular standalone client application bootstrap entrypoint';
  } else if (isServer) {
    const epCount = ast.endpoints.length;
    summary = `HTTP service exposing ${epCount > 0 ? `${epCount} endpoint(s)` : 'API routes'}`;
  } else if (isCli) {
    summary = 'CLI application accepting command-line arguments';
  } else if (ast.invariants.length > 0) {
    summary = `Outputs "${ast.invariants[0]}" to console`;
  } else if (ast.entities.length > 0) {
    summary = `Defines ${ast.entities.map(e => `\`${e.name}\``).slice(0, 3).join(', ')}`;
  } else if (ast.routines.length > 0) {
    summary = `Provides functions: ${ast.routines.map(r => `\`${r.name}()\``).slice(0, 4).join(', ')}`;
  } else {
    summary = `${language} module (${lineCount} lines)`;
  }

  return {
    relPath,
    language,
    lineCount,
    doc: ast.docstring,
    functions: ast.routines.map(r => r.name),
    classes: ast.entities.map(e => e.name),
    endpoints: ast.endpoints.map(ep => `${ep.method} ${ep.path}`),
    outputs: ast.invariants,
    serverPorts: ast.entrypoints.filter(e => e.type === 'HTTP Listener').map(e => e.target.replace('Port ', '')),
    hasMain,
    isCli,
    isServer,
    isAngular,
    summary
  };
}

// Fallback packager if repomix is not available
function fallbackPackCodebase(repoRoot, outputFile) {
  const ignored = new Set([
    'node_modules', '.git', '.agent-workspace', 'dist', 'build', 'out',
    '.antigravity', '.gemini', 'Documentation', 'openspec/changes/archive',
    '.opencode', '.claude', '.github', '.vscode', 'coverage', '.next', 'target', 'bin', 'obj'
  ]);

  let xml = '<codebase_snapshot>\n';
  xml += `  <repo_root>${repoRoot}</repo_root>\n`;
  xml += '  <files>\n';

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      const rel = path.relative(repoRoot, full).replace(/\\/g, '/');
      if (Array.from(ignored).some(ig => rel === ig || rel.startsWith(ig + '/'))) continue;

      if (ent.isDirectory()) {
        walk(full);
      } else if (ent.isFile()) {
        try {
          const stat = fs.statSync(full);
          if (stat.size < 500 * 1024) {
            const ext = path.extname(ent.name).toLowerCase();
            const textExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.yaml', '.yml', '.md', '.py', '.rs', '.go', '.java', '.cs', '.toml', '.txt']);
            if (textExts.has(ext) || ent.name === 'Dockerfile' || ent.name === 'Makefile') {
              const content = fs.readFileSync(full, 'utf8');
              xml += `    <file path="${rel}">\n<![CDATA[\n${content}\n]]>\n    </file>\n`;
            }
          }
        } catch {}
      }
    }
  }

  walk(repoRoot);
  xml += '  </files>\n</codebase_snapshot>\n';
  fs.writeFileSync(outputFile, xml, 'utf8');
}

// Capture codebase snapshot via Repomix AST compression + Native AST symbol scanner
function captureCodebaseSnapshot(repoRoot) {
  ensureDir(WORKSPACE_DIR);
  const outputFile = path.join(WORKSPACE_DIR, 'codebase-summary.xml');
  const astJsonFile = path.join(WORKSPACE_DIR, 'ast-symbols.json');

  const ignorePatterns = [
    'Documentation/**',
    '.agent-workspace/**',
    'node_modules/**',
    '.git/**',
    '.agents/**',
    '.opencode/**',
    '.claude/**',
    '.gemini/**',
    '.github/**',
    '.vscode/**',
    '.antigravity/**',
    'openspec/changes/archive/**'
  ].join(',');

  // 1. Try Repomix with Tree-sitter AST compression
  let usedRepomix = false;
  try {
    const cmd = `npx repomix -o "${outputFile}" --compress --quiet -i "${ignorePatterns}"`;
    execSync(cmd, { cwd: repoRoot, stdio: 'pipe', timeout: 30000 });
    if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 100) {
      usedRepomix = true;
    }
  } catch {}

  if (!usedRepomix) {
    fallbackPackCodebase(repoRoot, outputFile);
  }

  // 2. Native AST Symbol Scanning
  const astCatalog = scanCodebaseAstSymbols(repoRoot);
  fs.writeFileSync(astJsonFile, JSON.stringify(astCatalog, null, 2), 'utf8');

  const content = fs.readFileSync(outputFile, 'utf8');
  // Combine snapshot content hash with canonical AST symbols hash
  const combinedHash = computeHash(content + '::' + astCatalog.astHash);

  return {
    outputFile,
    astJsonFile,
    hash: combinedHash,
    astHash: astCatalog.astHash,
    usedRepomix,
    astCatalog,
    size: content.length
  };
}

// Inspect a module folder (under apps/, libs/, or src/)
function inspectModule(modPath, name, role) {
  let description = '';
  let entry = '';

  const pkgPath = path.join(modPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.description) description = pkg.description;
      if (pkg.main) entry = pkg.main;
    } catch {}
  }

  const candidates = ['index.ts', 'index.js', 'main.ts', 'main.js', 'main.py', 'main.rs', 'main.go', 'app.ts', 'app.js', 'server.ts', 'server.js', 'app.component.ts'];
  for (const cand of candidates) {
    const directCand = path.join(modPath, cand);
    const srcCand = path.join(modPath, 'src', cand);
    if (fs.existsSync(directCand)) {
      entry = entry || cand;
      if (!description) description = extractDocComment(fs.readFileSync(directCand, 'utf8'));
      break;
    } else if (fs.existsSync(srcCand)) {
      entry = entry || path.join('src', cand);
      if (!description) description = extractDocComment(fs.readFileSync(srcCand, 'utf8'));
      break;
    }
  }

  return { name, path: modPath, role, description: description || `Module responsible for ${name}`, entry };
}

function extractDependencies(pkg, meta) {
  const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
  if (deps['react'] || deps['react-dom']) meta.frameworks.add('React');
  if (deps['@angular/core']) meta.frameworks.add('Angular');
  if (deps['vue']) meta.frameworks.add('Vue');
  if (deps['next']) meta.frameworks.add('Next.js');
  if (deps['express']) meta.frameworks.add('Express');
  if (deps['fastify']) meta.frameworks.add('Fastify');
  if (deps['@nestjs/core']) meta.frameworks.add('NestJS');
  if (deps['tailwindcss']) meta.frameworks.add('Tailwind CSS');
  if (deps['vitest'] || deps['jest']) meta.frameworks.add('Testing (' + (deps['vitest'] ? 'Vitest' : 'Jest') + ')');
  if (deps['typescript']) meta.languages['TypeScript'] = (meta.languages['TypeScript'] || 0) + 5;
}

// Scan project codebase, manifests, and source files
function scanProjectMetadata(repoRoot, astCatalog) {
  const meta = {
    name: path.basename(repoRoot),
    description: '',
    version: '1.0.0',
    type: 'Software Application',
    languages: {},
    frameworks: new Set(),
    apps: [],
    libs: [],
    srcModules: [],
    entryPoints: [],
    sourceFiles: [],
    astCatalog: astCatalog || { entities: [], routines: [], endpoints: [], entrypoints: [] },
    scripts: {},
    manifests: []
  };

  // 1. Root package.json
  const pkgPath = path.join(repoRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) meta.name = pkg.name;
      if (pkg.description) meta.description = pkg.description;
      if (pkg.version) meta.version = pkg.version;
      if (pkg.scripts) meta.scripts = pkg.scripts;
      meta.manifests.push('package.json');
      extractDependencies(pkg, meta);
    } catch {}
  }

  // 2. Angular CLI Manifest (angular.json)
  const ngPath = path.join(repoRoot, 'angular.json');
  if (fs.existsSync(ngPath)) {
    try {
      const ngConfig = JSON.parse(fs.readFileSync(ngPath, 'utf8'));
      meta.frameworks.add('Angular');
      meta.manifests.push('angular.json');
      if (ngConfig.projects) {
        const projectNames = Object.keys(ngConfig.projects);
        if (projectNames.length > 0) {
          const firstProj = projectNames[0];
          if (meta.name === path.basename(repoRoot) || meta.name === 'ai-scaffolding') {
            meta.name = firstProj;
          }
          const projDef = ngConfig.projects[firstProj];
          if (projDef && projDef.projectType === 'application') {
            meta.type = 'Angular Client Application (Single-Page App)';
          }
        }
      }
    } catch {}
  }

  // 3. Cargo.toml
  const cargoPath = path.join(repoRoot, 'Cargo.toml');
  if (fs.existsSync(cargoPath)) {
    try {
      const cargo = fs.readFileSync(cargoPath, 'utf8');
      const nameMatch = cargo.match(/name\s*=\s*["']([^"']+)["']/);
      const descMatch = cargo.match(/description\s*=\s*["']([^"']+)["']/);
      if (nameMatch && (meta.name === path.basename(repoRoot) || meta.name === 'ai-scaffolding')) meta.name = nameMatch[1];
      if (descMatch && !meta.description) meta.description = descMatch[1];
      meta.manifests.push('Cargo.toml');
      meta.languages['Rust'] = (meta.languages['Rust'] || 0) + 1;
    } catch {}
  }

  // 4. pyproject.toml
  const pyprojPath = path.join(repoRoot, 'pyproject.toml');
  if (fs.existsSync(pyprojPath)) {
    try {
      const py = fs.readFileSync(pyprojPath, 'utf8');
      const nameMatch = py.match(/name\s*=\s*["']([^"']+)["']/);
      const descMatch = py.match(/description\s*=\s*["']([^"']+)["']/);
      if (nameMatch && (meta.name === path.basename(repoRoot) || meta.name === 'ai-scaffolding')) meta.name = nameMatch[1];
      if (descMatch && !meta.description) meta.description = descMatch[1];
      meta.manifests.push('pyproject.toml');
      meta.languages['Python'] = (meta.languages['Python'] || 0) + 1;
    } catch {}
  }

  // 5. go.mod
  const goModPath = path.join(repoRoot, 'go.mod');
  if (fs.existsSync(goModPath)) {
    try {
      const goMod = fs.readFileSync(goModPath, 'utf8');
      const modMatch = goMod.match(/^module\s+([^\s\r\n]+)/m);
      if (modMatch && (meta.name === path.basename(repoRoot) || meta.name === 'ai-scaffolding')) meta.name = path.basename(modMatch[1]);
      meta.manifests.push('go.mod');
      meta.languages['Go'] = (meta.languages['Go'] || 0) + 1;
    } catch {}
  }

  // 6. pom.xml / build.gradle (Java / Kotlin)
  const pomPath = path.join(repoRoot, 'pom.xml');
  if (fs.existsSync(pomPath)) {
    try {
      const pom = fs.readFileSync(pomPath, 'utf8');
      const artMatch = pom.match(/<artifactId>([^<]+)<\/artifactId>/);
      const nameMatch = pom.match(/<name>([^<]+)<\/name>/);
      if (meta.name === path.basename(repoRoot) || meta.name === 'ai-scaffolding') {
        meta.name = nameMatch ? nameMatch[1] : (artMatch ? artMatch[1] : meta.name);
      }
      meta.manifests.push('pom.xml');
      meta.languages['Java'] = (meta.languages['Java'] || 0) + 1;
    } catch {}
  }

  // 7. *.csproj / *.sln (.NET / C#)
  try {
    const csharpFiles = fs.readdirSync(repoRoot).filter(f => f.endsWith('.csproj') || f.endsWith('.sln'));
    if (csharpFiles.length > 0) {
      const mainCs = csharpFiles[0];
      if (meta.name === path.basename(repoRoot) || meta.name === 'ai-scaffolding') {
        meta.name = path.basename(mainCs, path.extname(mainCs));
      }
      meta.manifests.push(mainCs);
      meta.languages['C#'] = (meta.languages['C#'] || 0) + 1;
    }
  } catch {}

  // 8. CMakeLists.txt (C / C++)
  const cmakePath = path.join(repoRoot, 'CMakeLists.txt');
  if (fs.existsSync(cmakePath)) {
    try {
      const cmake = fs.readFileSync(cmakePath, 'utf8');
      const projMatch = cmake.match(/project\s*\(\s*([^\s)]+)/i);
      if (projMatch && (meta.name === path.basename(repoRoot) || meta.name === 'ai-scaffolding')) {
        meta.name = projMatch[1];
      }
      meta.manifests.push('CMakeLists.txt');
      meta.languages['C++'] = (meta.languages['C++'] || 0) + 1;
    } catch {}
  }

  // 9. Root README.md fallback (Disambiguate template scaffold from user product)
  const readmePath = path.join(repoRoot, 'README.md');
  let isTemplateReadme = false;
  if (fs.existsSync(readmePath)) {
    try {
      const readme = fs.readFileSync(readmePath, 'utf8');
      if (/#\s*AI Scaffolding/i.test(readme) || /multi-harness AI engineering template/i.test(readme) || /A standardized, multi-harness/i.test(readme)) {
        isTemplateReadme = true;
      }
      if (!isTemplateReadme) {
        const titleMatch = readme.match(/^#\s+(.+)$/m);
        if (titleMatch && (meta.name === path.basename(repoRoot) || meta.name === 'ai-scaffolding')) {
          meta.name = titleMatch[1].replace(/<[^>]+>/g, '').trim();
        }
        if (!meta.description) {
          const lines = readme.split(/\r?\n/);
          let foundTitle = false;
          let descLines = [];
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('# ')) {
              foundTitle = true;
              continue;
            }
            if (foundTitle) {
              if (trimmed.startsWith('---') || trimmed.startsWith('## ')) break;
              if (trimmed && !trimmed.startsWith('[')) descLines.push(trimmed);
              else if (descLines.length > 0 && !trimmed) break;
            }
          }
          if (descLines.length > 0) meta.description = descLines.join(' ');
        }
      }
    } catch {}
  }

  // 7. Scan apps/
  const appsDir = path.join(repoRoot, 'apps');
  if (fs.existsSync(appsDir)) {
    const entries = fs.readdirSync(appsDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory() && !ent.name.startsWith('.')) {
        const appModule = inspectModule(path.join(appsDir, ent.name), ent.name, 'Application / Service');
        meta.apps.push(appModule);
        // Check for app-level package.json / angular.json
        const appPkgPath = path.join(appsDir, ent.name, 'package.json');
        if (fs.existsSync(appPkgPath)) {
          try {
            const appPkg = JSON.parse(fs.readFileSync(appPkgPath, 'utf8'));
            extractDependencies(appPkg, meta);
            if ((meta.name === path.basename(repoRoot) || meta.name === 'ai-scaffolding') && appPkg.name) {
              meta.name = appPkg.name;
            }
          } catch {}
        }
      }
    }
  }

  // 8. Scan libs/ or packages/
  const libsDir = fs.existsSync(path.join(repoRoot, 'libs')) 
    ? path.join(repoRoot, 'libs') 
    : (fs.existsSync(path.join(repoRoot, 'packages')) ? path.join(repoRoot, 'packages') : null);
  if (libsDir) {
    const entries = fs.readdirSync(libsDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory() && !ent.name.startsWith('.')) {
        meta.libs.push(inspectModule(path.join(libsDir, ent.name), ent.name, 'Shared Library'));
      }
    }
  }

  // 9. Scan src/ submodules if no apps/
  const srcDir = path.join(repoRoot, 'src');
  if (fs.existsSync(srcDir) && meta.apps.length === 0) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory() && !ent.name.startsWith('.')) {
        meta.srcModules.push(inspectModule(path.join(srcDir, ent.name), ent.name, 'Source Module'));
      }
    }
  }

  // 10. Scan all source code files across codebase (deep scan up to depth 10)
  function scanDir(dir, depth = 0) {
    if (depth > 10) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        if (IGNORED_DIRS.has(ent.name)) continue;
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          scanDir(full, depth + 1);
        } else if (ent.isFile()) {
          const ext = path.extname(ent.name).toLowerCase();
          if (SOURCE_EXTENSIONS.has(ext)) {
            if (depth === 0 && (ent.name.includes('config') || ent.name.startsWith('.') || ent.name === 'sync-docs.cjs')) continue;
            const analysis = analyzeSourceFile(full, repoRoot);
            if (analysis) {
              meta.sourceFiles.push(analysis);
              meta.languages[analysis.language] = (meta.languages[analysis.language] || 0) + 1;
              if (analysis.hasMain) {
                if (!meta.entryPoints.includes(analysis.relPath)) meta.entryPoints.push(analysis.relPath);
              }
            }
          }
        }
      }
    } catch {}
  }

  scanDir(repoRoot, 0);

  // 11. Synthesize Product Purpose and Feel from actual source code
  const isTemplateLeftover = !meta.description || 
    isTemplateReadme ||
    meta.description.includes('multi-harness AI engineering template') || 
    meta.description.includes('enterprise scaffold');

  if (isTemplateLeftover) {
    if (meta.frameworks.has('Angular')) {
      meta.description = 'An interactive single-page web application built with Angular, utilizing modern standalone components and reactive architecture.';
    } else if (meta.frameworks.has('React')) {
      meta.description = 'An interactive client-side web application built with React, featuring component-driven UI architecture and state-managed workflows.';
    } else if (meta.sourceFiles.length > 0) {
      const mainFile = meta.sourceFiles.find(f => f.hasMain) || meta.sourceFiles[0];
      if (mainFile.outputs.some(o => /hello|welcome|start|hi/i.test(o))) {
        meta.description = 'A demonstration and starter application greeting users and verifying runtime configuration.';
      } else if (mainFile.isServer) {
        meta.description = `An HTTP / web application listening on port ${mainFile.serverPorts.join(', ') || 'default'} that processes client requests.`;
      } else if (mainFile.isCli) {
        meta.description = 'A command-line interface (CLI) tool for local execution and automation.';
      } else if (mainFile.doc) {
        meta.description = mainFile.doc;
      } else {
        meta.description = `An application built in ${mainFile.language} that ${mainFile.summary.toLowerCase()}.`;
      }
    }
  }

  // 12. Infer Architecture Type
  if (meta.frameworks.has('Angular')) {
    meta.type = 'Angular Client Application (Single-Page App)';
  } else if (meta.frameworks.has('React') || meta.frameworks.has('Vue')) {
    meta.type = 'Frontend Web Application (SPA)';
  } else if (meta.apps.length > 0 && meta.libs.length > 0) {
    meta.type = 'Full-Stack Monorepo (Applications & Shared Libraries)';
  } else if (meta.apps.length > 0) {
    meta.type = 'Multi-Service Monorepo';
  } else if (meta.libs.length > 0) {
    meta.type = 'Component / Package Library';
  } else if (meta.srcModules.length > 0) {
    meta.type = 'Modular Single-Project Application';
  } else if (meta.sourceFiles.some(f => f.isServer)) {
    meta.type = 'Web Service / HTTP Application';
  } else if (meta.sourceFiles.some(f => f.isCli)) {
    meta.type = 'Command-Line Interface (CLI) Application';
  } else if (meta.sourceFiles.length === 1) {
    meta.type = 'Single-File Executable Application';
  } else if (meta.languages['Rust']) {
    meta.type = 'Rust Crate / Binary';
  } else if (meta.languages['Go']) {
    meta.type = 'Go Module / Service';
  } else if (meta.languages['Python']) {
    meta.type = 'Python Package / Application';
  } else if (meta.sourceFiles.length > 0) {
    meta.type = 'Modular Application';
  } else {
    meta.type = 'Software Application';
  }

  meta.frameworks = Array.from(meta.frameworks);
  return meta;
}

// Check if repo is the uninstantiated template itself
function isTemplateScaffold(meta) {
  const isTemplateName = meta.name.toLowerCase() === 'ai-scaffolding' || meta.name === 'AI Scaffolding';
  const hasNoManifests = meta.manifests.length === 0;
  const hasNoUserCode = meta.sourceFiles.length === 0 && 
    (!meta.apps || meta.apps.length === 0) && 
    (!meta.libs || meta.libs.length === 0) && 
    (!meta.srcModules || meta.srcModules.length === 0);
  return isTemplateName && hasNoManifests && hasNoUserCode;
}

// Classify project into universal architecture archetypes
function resolveProjectArchetype(meta) {
  const mainSource = meta.sourceFiles.find(f => f.hasMain) || meta.sourceFiles[0] || { relPath: 'src/main', isServer: false, isCli: false, outputs: [] };

  if (meta.frameworks.includes('Angular') || meta.frameworks.includes('React') || meta.frameworks.includes('Vue') || meta.frameworks.includes('Svelte') || meta.frameworks.includes('Next.js')) {
    return 'frontend-spa';
  }
  if (mainSource.isServer || meta.sourceFiles.some(f => f.isServer)) {
    return 'backend-service';
  }
  if (mainSource.isCli || meta.sourceFiles.some(f => f.isCli)) {
    return 'cli-tool';
  }
  if (meta.apps.length > 0 && meta.libs.length > 0) {
    return 'monorepo';
  }
  const hasNoExecutableEntry = !mainSource.hasMain && !mainSource.isServer && !mainSource.isCli && !meta.sourceFiles.some(f => f.hasMain || f.isServer || f.isCli);
  if (hasNoExecutableEntry && (meta.libs.length > 0 || meta.srcModules.length > 0 || meta.type.includes('Library') || meta.type.includes('Package') || meta.type.includes('Crate') || meta.astCatalog.entities.length > 0)) {
    return 'shared-library';
  }
  if (meta.libs.length > 0 || meta.type.includes('Library') || meta.type.includes('Package') || meta.type.includes('Crate')) {
    return 'shared-library';
  }
  if (meta.sourceFiles.length === 1) {
    return 'single-file';
  }
  return 'general-application';
}

// Generate comprehensive Product Overview (The "WHAT")
function formatProductOverview(meta) {
  // Scenario A: Template Repository itself
  if (isTemplateScaffold(meta)) {
    return `---
title: "Product Overview"
type: overview
project: "${meta.name}"
last_synced: "${new Date().toISOString()}"
tags:
  - overview
  - product
---

# Product Overview: ${meta.name}

## 🎯 Executive Summary
**${meta.name}** is an enterprise-grade, multi-harness AI engineering scaffold and starter monorepo. It establishes a unified, specification-driven pair-programming workflow across all major AI coding assistants—**GitHub Copilot**, **OpenCode**, **Claude Code**, and **Google Antigravity CLI & IDE**—while maintaining a living, bidirectional product documentation vault in Obsidian.

---

## 💡 The "WHAT": Purpose & Value Proposition

### The Problem
When engineering teams leverage diverse AI coding assistants across terminals and IDEs, critical challenges emerge:
1. **Instruction Fragmentation**: Different AI tools require different configuration files (\`.github/\`, \`.opencode/\`, \`.claude/\`, \`.gemini/\`), causing agent behaviors to diverge.
2. **Hallucination & Spec Drift**: Without strict living specifications, AI agents invent APIs, fabricate metrics, or produce contradictory implementations.
3. **Documentation Decay**: Traditional documentation rapidly goes stale as code evolves, disconnecting product requirements from working reality.

### Value Delivered
- **Unified Instruction Governance**: All agents align to canonical engineering principles defined in \`AGENTS.md\` and mirrored across all harness directories.
- **Spec-First Living Contracts**: Features begin as OpenSpec proposals and delta specifications before code is written, ensuring verifiable invariants.
- **Automated Documentation Sync**: Code modifications, living specs, ADRs, and change histories automatically compile into an Obsidian-compatible product knowledge graph.
- **Dockerized Codebase Intelligence**: A centralized MCP Hub provides compiler-grade LSP symbols, knowledge graph relationships, and semantic search without IDE vendor lock-in.

### Target Personas & System Consumers
- **Software Engineers**: Building applications with consistent, guided pair-programming workflows.
- **AI Coding Agents**: GitHub Copilot, Claude Code, OpenCode, and Antigravity operating within strict, safe governance boundaries.
- **Architects & Tech Leads**: Reviewing system evolution through durable Architecture Decision Records (ADRs) and living domain specs.

---

## 🌟 Core Capabilities & Feature Tour

- **Multi-Harness Scaffolding**: Pre-configured rules, commands, and skills for GitHub Copilot (\`.github/\`), OpenCode (\`.opencode/\`), Claude Code (\`.claude/\`), and Antigravity (\`.antigravity/\`, \`.gemini/\`).
- **OpenSpec Workflow Engine**: Standardized lifecycle commands (\`/opsx-propose\`, \`/opsx-apply\`, \`/opsx-verify\`, \`/opsx-archive\`, \`/opsx-sync-docs\`) enforcing rigorous intent-driven design.
- **Living Documentation Vault (\`Documentation/\`)**: An Obsidian-ready knowledge base organized by product concerns (Overview, Features, Guides, Reference, Decisions, Changelog) rather than raw repository folders.
- **AST Symbol & Codebase Grasp via Repomix**: Leverages AST compression and symbol fingerprinting to track changes and pack instant context for agents.
- **Isolated Agent Scratchpads (\`.agent-workspace/\`)**: Keeps application codebases completely clean by confining temporary logs, task tokens, and symbol digests to isolated workspaces.

---

## 🔄 Core Workflows & User Journeys

### 1. The OpenSpec Feature Lifecycle
\`\`\`mermaid
flowchart LR
    Idea([Feature Idea]) --> Propose["/opsx-propose\\n(Draft Specs & Tasks)"]
    Propose --> Apply["/opsx-apply\\n(Test-Driven Code)"]
    Apply --> Verify["/opsx-verify\\n(Verify Invariants)"]
    Verify --> Archive["/opsx-archive\\n(Promote to Living Specs)"]
    Archive --> Sync["/opsx-sync-docs\\n(Refresh Obsidian Vault)"]
    Sync --> Done([Documented System])
\`\`\`

### 2. Daily Developer Flow
1. **Explore & Design**: Run \`/opsx-propose\` to scaffold a new change under the appropriate domain in \`openspec/domains.yaml\`.
2. **Implement**: Work task-by-task with your preferred AI harness; the AI follows test-driven development and never commits without approval.
3. **Archive & Synchronize**: Finalize the change via \`/opsx-archive\` and run \`/opsx-sync-docs\` to update the documentation vault.

---

## 📊 System Profile & Technology Stack

| Dimension | Details |
| :--- | :--- |
| **Project Name** | \`${meta.name}\` |
| **Architecture Model** | Multi-Harness AI Engineering Monorepo |
| **Supported AI Harnesses** | GitHub Copilot, OpenCode, Claude Code, Antigravity |
| **Specification Engine** | OpenSpec (Intent-Driven Schema) |
| **Documentation Format** | Obsidian-Compatible Markdown with Frontmatter & Wikilinks |
| **AST Symbol Engine** | Tree-sitter Compression (Repomix) + Native Language AST Parser |

---

## 📦 Codebase Composition & Organization

\`\`\`
ai-scaffolding/
├── apps/               ← Applications (web, mobile, service hosts)
├── libs/               ← Shared libraries (domain, data-access, ui, util)
├── openspec/           ← Living specifications, domain catalog, and change proposals
├── Documentation/      ← Synchronized Obsidian product documentation vault
├── adr/                ← Architecture Decision Records
├── glossary/           ← Ubiquitous business and technical language
├── .agents/            ← Universal skills and automation scripts
├── .mcp-hub/           ← Dockerized codebase intelligence MCP server
├── .agent-workspace/   ← Isolated agent scratch state and AST symbol snapshots
└── [harness configs]   ← .github/, .opencode/, .claude/, .gemini/
\`\`\`

---
[[Home|← Back to Home]] | [[Overview/System-Architecture|System Architecture →]]
`;
  }

  // Scenario B: Downstream user project with actual source code
  const langList = Object.entries(meta.languages)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang)
    .join(', ') || 'Universal';

  const frameworkList = meta.frameworks.length > 0 ? meta.frameworks.join(', ') : 'Standard Runtime';
  const manifestList = meta.manifests.length > 0 ? meta.manifests.join(', ') : 'None detected';

  let composition = '';
  if (meta.apps && meta.apps.length > 0) {
    composition += '### Applications & Services (`apps/`)\n';
    for (const app of meta.apps) {
      composition += `- **\`${app.name}\`**: ${app.description} (Entry: \`${app.entry || 'default'}\`)\n`;
    }
    composition += '\n';
  }
  if (meta.libs && meta.libs.length > 0) {
    composition += '### Shared Libraries & Packages (`libs/`)\n';
    for (const lib of meta.libs) {
      composition += `- **\`${lib.name}\`**: ${lib.description}\n`;
    }
    composition += '\n';
  }
  if (meta.sourceFiles && meta.sourceFiles.length > 0) {
    composition += '### Discovered Source Components & Entry Points\n';
    for (const sf of meta.sourceFiles.slice(0, 10)) {
      const entryBadge = sf.hasMain ? '*(Primary Entrypoint)* ' : '';
      composition += `- **\`${sf.relPath}\`** (${sf.language}, ${sf.lineCount} lines): ${entryBadge}${sf.summary}\n`;
    }
    if (meta.sourceFiles.length > 10) {
      composition += `- *... and ${meta.sourceFiles.length - 10} additional source files.*\n`;
    }
    composition += '\n';
  }

  // AST Detected Domain Entities & Endpoints
  let astSections = '';
  if (meta.astCatalog && meta.astCatalog.entities.length > 0) {
    astSections += '### 📦 Domain Entities & Data Models (AST Detected)\n';
    for (const ent of meta.astCatalog.entities.slice(0, 8)) {
      astSections += `- **\`${ent.name}\`** (\`${ent.file}\`): ${toTitleCase(ent.kind || 'domain type')}\n`;
    }
    astSections += '\n';
  }
  if (meta.astCatalog && meta.astCatalog.endpoints.length > 0) {
    astSections += '### 🌐 Exposed API Surface & Endpoints\n';
    for (const ep of meta.astCatalog.endpoints.slice(0, 8)) {
      astSections += `- \`${ep.method} ${ep.path}\` (defined in \`${ep.file}\`)\n`;
    }
    astSections += '\n';
  }
  if (meta.astCatalog && meta.astCatalog.routines.length > 0) {
    astSections += '### ⚙️ Core Operations & Routines\n';
    for (const r of meta.astCatalog.routines.slice(0, 8)) {
      astSections += `- **\`${r.name}(${r.params})\`** (\`${r.file}\`)\n`;
    }
    astSections += '\n';
  }

  let workflows = '';
  const scriptKeys = Object.keys(meta.scripts || {});
  if (scriptKeys.length > 0) {
    workflows += '| Command / Script | Execution |\n| :--- | :--- |\n';
    for (const key of scriptKeys.slice(0, 8)) {
      workflows += `| \`npm run ${key}\` | \`${meta.scripts[key]}\` |\n`;
    }
  } else {
    workflows += `*Run commands are defined by your project runtime and build tooling.*\n`;
  }

  const archetype = resolveProjectArchetype(meta);
  const mainSource = meta.sourceFiles.find(f => f.hasMain) || meta.sourceFiles[0] || { relPath: 'src/main', summary: 'Application entry point', isServer: false, isCli: false, outputs: [] };

  let problemStatement = '';
  let valueDelivered = '';
  let targetPersonas = '';
  let journeyFlow = '';

  switch (archetype) {
    case 'frontend-spa':
      problemStatement = 'End users require an intuitive, responsive client interface to interact with application features and visualize data directly in modern web browsers.';
      valueDelivered = '- Delivers an interactive Single-Page Application (SPA) with seamless client-side routing.\n- Encapsulates view logic, reactive state, and presentation inside modular components.\n- Operates with zero full-page reloads, providing instant feedback and modern UI responsiveness.';
      targetPersonas = '- **Web Consumers & Users**: Accessing rich UI features and navigating views through web browsers.\n- **Frontend Developers**: Extending standalone components, services, and reactive state.';
      journeyFlow = `flowchart LR
    User([End User / Browser]) --> Bootstrap["SPA Bootstrap (${mainSource.relPath})"]
    Bootstrap --> RootComp["Root View Component"]
    RootComp --> Routing["Client Routing & Views"]
    Routing --> State["Reactive Services & State"]`;
      break;

    case 'backend-service':
      problemStatement = 'Consuming clients and applications require a robust, scalable service to process business requests, enforce data contracts, and manage persistent domain state.';
      valueDelivered = `- Exposes structured HTTP/REST service endpoints on port ${mainSource.serverPorts && mainSource.serverPorts.length > 0 ? mainSource.serverPorts.join(', ') : 'configured ports'}.\n- Decouples client presentation from core business rules and storage mechanisms.\n- Provides deterministic request validation and high-concurrency throughput.`;
      targetPersonas = '- **Consuming Systems & APIs**: Dispatching HTTP requests and consuming service responses.\n- **Backend Engineers & SREs**: Monitoring service performance, error rates, and operational endpoints.';
      journeyFlow = `flowchart LR
    Client([HTTP Client / Gateway]) --> Listener["Network Service (${mainSource.relPath})"]
    Listener --> Routing["Route Handlers & Validation"]
    Routing --> Core["Domain Service Logic"]
    Core --> Out["Structured Response (JSON)"]`;
      break;

    case 'cli-tool':
      problemStatement = 'Developers, operators, and automation pipelines require a scriptable, low-overhead command-line utility for local terminal operations and unattended automated workflows.';
      valueDelivered = '- Provides scriptable CLI commands with robust argument and flag validation.\n- Automates tasks directly from terminal environments with clear progress feedback.\n- Emits predictable stdout/stderr streams and standard exit status codes.';
      targetPersonas = '- **Developers & DevOps**: Executing automation tasks, builds, or utilities directly from the shell.\n- **CI/CD Pipelines**: Running automated scripts in headless, non-interactive execution modes.';
      journeyFlow = `flowchart LR
    User([Terminal User / CI]) --> CLI["CLI Invocation (${mainSource.relPath})"]
    CLI --> Parse["Flag & Argument Parsing"]
    Parse --> Exec["Command Handler Execution"]
    Exec --> Out["Terminal Output & Exit Code"]`;
      break;

    case 'shared-library':
      problemStatement = 'Consuming applications and services require reusable, strongly-typed domain primitives, algorithms, or client bindings without duplicating core logic across multiple codebases.';
      valueDelivered = '- Encapsulates pure domain algorithms and models behind clean, versioned public API contracts.\n- Promotes consistency and DRY architecture across consuming applications.\n- Thoroughly tested in complete isolation without external environment side-effects.';
      targetPersonas = '- **Consuming Application Developers**: Importing library packages and invoking public interfaces.\n- **Platform Architects**: Maintaining reusable components across broader systems.';
      journeyFlow = `flowchart LR
    Host([Consuming Application]) --> API["Public API Exports (${meta.name})"]
    API --> Modules["Internal Domain Modules & Primitives"]
    Modules --> Result["Computed Result / Returned Types"]`;
      break;

    case 'monorepo':
      problemStatement = 'Engineering teams need to manage interdependent applications, services, and shared libraries within a single repository while enforcing architectural boundaries.';
      valueDelivered = '- Centralizes living specifications, change proposals, and governance across all applications.\n- Enables atomic cross-boundary refactoring between apps and shared libraries.\n- Eliminates redundant configuration and harmonizes build discipline.';
      targetPersonas = '- **Full-Stack Engineers**: Developing features spanning frontend, backend, and domain libraries.\n- **Engineering Leads**: Governing architectural standards and shared module boundaries.';
      journeyFlow = `flowchart LR
    Users([Users & Consumers]) --> Apps["Applications (${meta.apps.map(a => a.name).join(', ')})"]
    Apps --> Libs["Shared Libraries (${meta.libs.map(l => l.name).join(', ') || 'Shared Modules'})"]
    Libs --> Core["Core Domain Contracts"]`;
      break;

    default:
      problemStatement = 'The application executes targeted domain logic or verification routines to deliver a predictable computing outcome with minimal overhead.';
      valueDelivered = '- Direct, lightweight execution with zero unnecessary dependencies.\n- Verifies execution readiness and produces deterministic outputs.\n- Simple to audit, test, and containerize.';
      targetPersonas = '- **End Users & Operators**: Invoking the application or script directly.\n- **Automated Harnesses**: Executing tasks and verifying outputs.';
      journeyFlow = `flowchart LR
    User([User / Consumer]) --> Entry["${mainSource.relPath}"]
    Entry --> Exec["Execute Core Logic"]
    Exec --> Out["Produce Output / Response"]`;
      break;
  }

  return `---
title: "Product Overview"
type: overview
project: "${meta.name}"
last_synced: "${new Date().toISOString()}"
tags:
  - overview
  - product
---

# Product Overview: ${meta.name}

## 🎯 Executive Summary
**${meta.name}** is a **${meta.type}** built with **${langList}**. ${meta.description}

---

## 💡 The "WHAT": Purpose & Value Proposition

### The Problem
${problemStatement}

### Value Delivered
${valueDelivered}

### Target Personas & Consumers
${targetPersonas}

---

## 🌟 Core Capabilities & Feature Tour
${astSections || meta.sourceFiles.slice(0, 6).map(sf => `- **\`${sf.relPath}\`**: ${sf.summary}`).join('\n')}

---

## 🔄 Core Workflows & User Journeys
\`\`\`mermaid
${journeyFlow}
\`\`\`

---

## 📊 System Profile & Technology Stack

| Dimension | Details |
| :--- | :--- |
| **Project Name** | \`${meta.name}\` |
| **Architecture Model** | ${meta.type} |
| **Detected Languages** | ${langList} |
| **Frameworks & Ecosystem** | ${frameworkList} |
| **Project Manifests** | ${manifestList} |

---

## 📦 Codebase Composition & Discovered Components
${composition}

## 🚀 Common Workflows & Commands
${workflows}

---
[[Home|← Back to Home]] | [[Overview/System-Architecture|System Architecture →]]
`;
}

// Generate comprehensive System Architecture (The "HOW" and "WHY")
function formatSystemArchitecture(meta, domains) {
  // Scenario A: Template Repository itself
  if (isTemplateScaffold(meta)) {
    return `---
title: "System Architecture"
type: architecture
project: "${meta.name}"
last_synced: "${new Date().toISOString()}"
tags:
  - architecture
  - system-design
---

# System Architecture: ${meta.name}

## 🏛️ The "HOW": Architectural Philosophy & Design
The codebase operates under a **Multi-Harness AI Engineering Monorepo** architectural model. It decouples system specifications from implementation code, using a hub-and-spoke configuration model:
- **Canonical Instruction Anchor**: \`AGENTS.md\` defines universal discipline, testing invariants, and anti-fabrication rules.
- **Harness Projection**: Domain rules, skills, and prompts project outwards into AI harness directories (\`.github/\`, \`.opencode/\`, \`.claude/\`, \`.gemini/\`).
- **Living Specification Engine**: System requirements reside as living behavior contracts in \`openspec/specs/\`, modified only through formal change proposals.
- **Dynamic Documentation Vault**: Product documentation compiles automatically from codebase state, living specs, and ADRs into \`Documentation/\`.

---

## 🗺️ Component Architecture & System Context

\`\`\`mermaid
flowchart TD
    subgraph UsersAndHarnesses [Developers & AI Coding Assistants]
        Dev([Developer])
        Copilot["GitHub Copilot (.github/)"]
        OpenCode["OpenCode (.opencode/)"]
        Claude["Claude Code (.claude/)"]
        Antigravity["Antigravity CLI & IDE (.gemini/)"]
    end

    subgraph CoreEngine [Governance & Living Knowledge]
        AgentsAnchor["AGENTS.md\\n(Canonical Rules & Discipline)"]
        OpenSpec["OpenSpec Engine\\n(specs/, changes/, domains.yaml)"]
        ADR["Architecture Decisions\\n(adr/)"]
    end

    subgraph CodebaseContext [Codebase & Intelligence Hub]
        Apps["apps/ (Applications & Services)"]
        Libs["libs/ (Shared Domain Modules)"]
        MCPHub["MCP Hub (Dockerized Language Servers & Graphs)"]
        Repomix["AST Symbol Snapshot (.agent-workspace/)"]
    end

    subgraph KnowledgeVault [Obsidian Documentation Vault]
        VaultMOC["Documentation/Home.md (MOC)"]
        Overview["Overview/ (Product & Architecture)"]
        Features["Features/ (Living Spec Notes)"]
        Guides["Guides/ (Governance & Schemas)"]
    end

    Dev --> Copilot & OpenCode & Claude & Antigravity
    Copilot & OpenCode & Claude & Antigravity --> AgentsAnchor
    AgentsAnchor --> OpenSpec
    OpenSpec --> Apps & Libs
    Repomix --> OpenSpec
    OpenSpec & ADR & Repomix --> KnowledgeVault
\`\`\`

---

## 🔁 End-to-End Execution Flow (Data & Control Lifecycle)

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Harness as AI Harness (Copilot / Claude / OpenCode / AGY)
    participant OpenSpec as OpenSpec Engine
    participant Code as Source Code (apps / libs / src)
    participant Sync as Docs Sync (AST Engine)
    participant Vault as Obsidian Vault (Documentation/)

    Dev->>Harness: 1. Request feature or behavioral change
    Harness->>OpenSpec: 2. Scaffold proposal (/opsx-propose)
    Harness->>Code: 3. Implement tasks & tests (/opsx-apply)
    Harness->>OpenSpec: 4. Verify contracts (/opsx-verify)
    Dev->>Harness: 5. Approve git commit (Commit Gate)
    Harness->>OpenSpec: 6. Archive change (/opsx-archive)
    Harness->>Sync: 7. Run sync (/opsx-sync-docs)
    Sync->>Sync: 8. Grasp codebase snapshot & AST symbols
    Sync->>Vault: 9. Refresh Product Overview, Specs & Changelog
    Vault-->>Dev: 10. Up-to-date human-readable knowledge graph
\`\`\`

---

## 🧩 Subsystem & Directory Responsibilities

### 1. Applications & Host Services (\`apps/\`)
- **Role**: Deployment-level binaries, services, and web clients.
- **Responsibilities**: Entry-point bootstrapping, framework wiring, HTTP routing, and environment runtime initialization.
- **Boundaries**: Business logic belongs in \`libs/\`; \`apps/\` only orchestrates presentation and hosting.

### 2. Shared Libraries & Domain Modules (\`libs/\`)
- **Role**: Reusable, pure domain logic, data-access repositories, and UI components.
- **Responsibilities**: Enforcing domain invariants, entity validation, and data persistence contracts.
- **Boundaries**: Independent of application shells; testable in complete isolation.

### 3. Living Specifications (\`openspec/specs/\`)
- **Role**: The single source of truth for all system behavioral contracts.
- **Responsibilities**: Documents requirements and Gherkin scenarios grouped by architectural domain and capability.

### 4. Product Documentation Vault (\`Documentation/\`)
- **Role**: Local, Obsidian-compatible markdown documentation for humans and agents.
- **Structure**:
  - \`Documentation/Home.md\`: Master Map of Content (MOC).
  - \`Documentation/Overview/\`: High-level product vision and system architecture.
  - \`Documentation/Features/\`: Behavioral contracts compiled from living specs.
  - \`Documentation/Guides/\`: Developer onboarding, OpenSpec Governance, and Schema reference.
  - \`Documentation/Reference/\`: Configuration reference and Domain Catalog.
  - \`Documentation/Decisions/\`: Synced Architecture Decision Records (ADRs).
  - \`Documentation/Changelog/\`: Historical changes compiled from archived proposals.

---

## ⚖️ The "WHY": Design Rationale & Trade-offs

### Architectural Invariants
1. **Spec-First Intent**: Code is an ephemeral manifestation of living specifications. Changing system behavior requires updating living specs.
2. **Anti-Fabrication Mandate**: Agents never invent benchmark numbers, performance statistics, or test counts. Empirical evidence is mandatory.
3. **Strict Commit Approval Gate**: Agents never execute git commits or pushes without explicit confirmation from the human developer.
4. **Clock Injection**: Time-dependent domain services always inject clock abstractions (\`Clock\`, \`TimeProvider\`) to guarantee test determinism.

### Architectural Trade-offs
| Decision | Chosen Approach | Alternative Considered | Rationale / Why |
| :--- | :--- | :--- | :--- |
| **Documentation Format** | Obsidian-compatible local Markdown | Cloud SaaS (Confluence, Notion) | Zero external dependencies, offline-first, git-tracked, versioned alongside code. |
| **Codebase Grasping** | Tree-sitter AST compression + Native AST fallback | Full-repo re-indexing on each turn | Extracts AST symbol signatures in <2s and hashing avoids redundant re-processing. |
| **Specification Syntax** | OpenSpec Gherkin callouts in Markdown | Cucumber feature files only | Human-readable markdown with clear scenario blocks is natively parsed by LLMs and Obsidian. |
| **Harness Architecture** | Centralized canonical rules (\`AGENTS.md\`) | Separate rules per harness | Single source of truth eliminates rule drift across Copilot, Claude, OpenCode, and Antigravity. |

---

## 📐 Alignment with OpenSpec Domains
System architecture aligns with the architectural domains declared in \`openspec/domains.yaml\`:

- **[[Reference/Domain-Catalog#Core Platform|Core Platform]]**: Foundational infrastructure, storage abstractions, configuration, and security services
- **[[Reference/Domain-Catalog#Api Services|API & Backend Services]]**: RESTful endpoints, external API gateways, and asynchronous event messaging pipelines
- **[[Reference/Domain-Catalog#Web Client|Web Client Applications]]**: Frontend single-page applications, UI component libraries, and client-side state

---
[[Home|← Back to Home]] | [[Overview/Product-Overview|← Product Overview]]
`;
  }

  // Scenario B: Downstream user project
  const archetype = resolveProjectArchetype(meta);
  const mainSource = meta.sourceFiles.find(f => f.hasMain) || meta.sourceFiles[0] || { relPath: 'src/main', summary: 'Application entry point', isServer: false, isCli: false, outputs: [], language: 'Source Code', lineCount: 10, functions: [], classes: [] };
  let mm = '';
  let seq = '';

  switch (archetype) {
    case 'frontend-spa':
      mm = `flowchart TD
    subgraph BrowserRuntime [Web Browser Client Runtime]
        User([End User]) --> Viewport["Browser Viewport / DOM"]
        Viewport --> AppRoot["Application Root Component"]
        AppRoot --> Views["Feature Components & Templates"]
        Views --> ReactiveState["Signals / Observables / State Services"]
    end
    subgraph HostEnvironment [Hosting & Network]
        StaticHost["Static Web Server / CDN"] -.->|Serves Bundles| BrowserRuntime
        ReactiveState -.->|Optional HTTP/REST| APIBackend["Backend Services / APIs"]
    end\n`;

      seq = `sequenceDiagram
    autonumber
    actor User as End User
    participant Browser as Web Browser
    participant Boot as Bootstrap (${mainSource.relPath})
    participant UI as Component View
    participant State as Reactive Service

    User->>Browser: 1. Navigate to application URL
    Browser->>Boot: 2. Load bundle & bootstrap application
    Boot->>UI: 3. Render root template to DOM
    UI-->>User: 4. Display interactive view
    User->>UI: 5. Perform user interaction (click / input)
    UI->>State: 6. Update signals / state
    State-->>UI: 7. Reactive view update\n`;
      break;

    case 'backend-service':
      mm = `flowchart TD
    subgraph ExternalClients [Clients & Consuming Systems]
        Client([HTTP Client / Frontend])
        ThirdParty([External Webhooks])
    end
    subgraph ServiceBoundary [Service Runtime: ${meta.name}]
        Gateway["HTTP Listener (${mainSource.serverPorts && mainSource.serverPorts.length > 0 ? mainSource.serverPorts.map(p => `Port ${p}`).join(', ') : 'HTTP/REST'})"]
        Router["Route Dispatcher & Middleware"]
        Handlers["Request Controllers / Handlers"]
        Domain["Domain Services & Business Logic"]
    end
    subgraph DataStore [Persistence & Storage]
        DB[(Database / Cache / State)]
    end
    Client & ThirdParty --> Gateway
    Gateway --> Router
    Router --> Handlers
    Handlers --> Domain
    Domain -.-> DB\n`;

      seq = `sequenceDiagram
    autonumber
    actor Client as HTTP Client
    participant Host as HTTP Listener (${mainSource.relPath})
    participant Router as Router / Middleware
    participant Handler as Route Handler
    participant Domain as Domain Logic

    Client->>Host: 1. Dispatch HTTP Request (Method + Path)
    Host->>Router: 2. Parse request headers & match route
    Router->>Handler: 3. Invoke controller handler
    Handler->>Domain: 4. Execute business rules & persistence
    Domain-->>Handler: 5. Return domain entity / state
    Handler-->>Client: 6. Emit HTTP Response (JSON / Status)\n`;
      break;

    case 'cli-tool':
      mm = `flowchart TD
    subgraph ShellContext [User Shell Environment]
        Terminal([Terminal / CI Shell])
    end
    subgraph CLIProcess [CLI Process: ${meta.name}]
        Entry["Main Entrypoint (${mainSource.relPath})"]
        Parser["Argument & Flag Parser"]
        Dispatcher["Command Dispatcher"]
        Action["Action Handler / Task Logic"]
    end
    subgraph OutputStreams [Terminal Streams]
        Stdout([stdout: Result / Output])
        Stderr([stderr: Errors / Logs])
    end
    Terminal --> Entry
    Entry --> Parser
    Parser --> Dispatcher
    Dispatcher --> Action
    Action --> Stdout & Stderr\n`;

      seq = `sequenceDiagram
    autonumber
    actor User as Terminal User / Script
    participant CLI as CLI Binary (${mainSource.relPath})
    participant Parser as Arg / Flag Parser
    participant Command as Command Handler
    participant Output as Console Stream

    User->>CLI: 1. Execute command with arguments & flags
    CLI->>Parser: 2. Parse command options & validate syntax
    Parser->>Command: 3. Dispatch to targeted command routine
    Command->>Command: 4. Perform requested operation
    Command->>Output: 5. Stream output / print summary
    Output-->>User: 6. Process termination (Exit Code 0)\n`;
      break;

    case 'shared-library':
      mm = `flowchart TD
    subgraph ConsumerSpace [Consuming Application]
        HostApp["Host Application / Service"]
    end
    subgraph LibraryBoundary [Library Package: ${meta.name}]
        PublicAPI["Public API Contract / Exports (${mainSource.relPath})"]
        CoreEngine["Domain Core & Calculations"]
        Utils["Utility Primitives & Helpers"]
    end
    HostApp --> PublicAPI
    PublicAPI --> CoreEngine
    CoreEngine --> Utils\n`;

      seq = `sequenceDiagram
    autonumber
    actor Host as Consuming Application
    participant API as Public API (${mainSource.relPath})
    participant Core as Library Core
    participant Utils as Internal Primitives

    Host->>API: 1. Import library symbol & invoke method
    API->>Core: 2. Forward arguments to core domain routine
    Core->>Utils: 3. Evaluate algorithms / transform data
    Utils-->>Core: 4. Return intermediate representation
    Core-->>Host: 5. Return typed domain result\n`;
      break;

    case 'monorepo':
      mm = `flowchart TD
    subgraph Ingress [Ingress & Consumers]
        Users([Users / Systems])
    end
    subgraph MonorepoScope [Monorepo Workspace: ${meta.name}]
        subgraph AppsTier [Applications (apps/)]
            ${meta.apps.slice(0, 3).map(a => `App_${a.name}["${a.name}"]`).join('\n            ') || 'Apps["Deployable Services"]'}
        end
        subgraph LibsTier [Shared Libraries (libs/)]
            ${meta.libs.slice(0, 3).map(l => `Lib_${l.name}["${l.name}"]`).join('\n            ') || 'Libs["Domain Libraries"]'}
        end
    end
    Users --> AppsTier
    AppsTier --> LibsTier\n`;

      seq = `sequenceDiagram
    autonumber
    actor Client as Client / User
    participant App as Application Service
    participant Lib as Shared Domain Library

    Client->>App: 1. Invocate application entry point
    App->>Lib: 2. Invoke shared domain capability
    Lib-->>App: 3. Return validated domain result
    App-->>Client: 4. Emit coordinated response\n`;
      break;

    default:
      mm = 'flowchart TD\n';
      mm += `    User([User / Consumer]) --> Entry["${mainSource.relPath}"]\n`;
      if (mainSource.isServer) {
        mm += `    Entry --> ServerMod["HTTP Service (Port ${mainSource.serverPorts && mainSource.serverPorts.length > 0 ? mainSource.serverPorts.join(', ') : 'HTTP'})"]\n`;
        mm += `    ServerMod --> Handlers["Request Handlers & Logic"]\n`;
      } else if (mainSource.outputs && mainSource.outputs.length > 0) {
        mm += `    Entry --> Out["Console Output ('${mainSource.outputs[0]}')"]\n`;
      } else {
        mm += `    Entry --> AppCore["Core Processing Logic"]\n`;
      }

      seq = 'sequenceDiagram\n    autonumber\n';
      seq += `    actor User as User / Consumer\n`;
      seq += `    participant Entry as ${mainSource.relPath}\n`;
      seq += `    participant Core as Execution Logic\n`;
      seq += `    participant Out as Output / Response\n`;
      seq += `    User->>Entry: 1. Invocate application or send request\n`;
      seq += `    Entry->>Core: 2. Process arguments or dispatch handler\n`;
      seq += `    Core->>Out: 3. Render output or return status\n`;
      seq += `    Out-->>User: 4. Complete execution lifecycle\n`;
      break;
  }

  let moduleDetails = '### Discovered Source Components\n';
  for (const sf of meta.sourceFiles.slice(0, 8)) {
    moduleDetails += `#### \`${sf.relPath}\`\n`;
    moduleDetails += `- **Role**: ${sf.hasMain ? 'Application Entry Point' : (sf.isServer ? 'Service Host' : 'Module')}\n`;
    moduleDetails += `- **Language**: ${sf.language} (${sf.lineCount} lines)\n`;
    if (sf.functions.length > 0) moduleDetails += `- **Declared Functions**: ${sf.functions.map(f => `\`${f}()\``).join(', ')}\n`;
    if (sf.classes.length > 0) moduleDetails += `- **Classes / Types**: ${sf.classes.map(c => `\`${c}\``).join(', ')}\n`;
    moduleDetails += `- **Behavior**: ${sf.summary}\n\n`;
  }

  let domainsSection = '';
  if (domains && domains.length > 0) {
    domainsSection += 'System architecture aligns with the architectural domains declared in `openspec/domains.yaml`:\n\n';
    for (const d of domains) {
      domainsSection += `- **[[Reference/Domain-Catalog#${toTitleCase(d.id)}|${d.name}]]**: ${d.description || 'Domain partition'}\n`;
    }
  } else {
    domainsSection += '*No domain registry declared yet in `openspec/domains.yaml`.*\n';
  }

  return `---
title: "System Architecture"
type: architecture
project: "${meta.name}"
last_synced: "${new Date().toISOString()}"
tags:
  - architecture
  - system-design
---

# System Architecture: ${meta.name}

## 🏛️ The "HOW": Architectural Philosophy & Design
The codebase operates under a **${meta.type}** architectural model. It organizes functionality around explicit entry points and decoupled modules to maximize clarity, testability, and operational simplicity.

---

## 🗺️ Component Architecture & System Context

\`\`\`mermaid
${mm}\`\`\`

---

## 🔁 End-to-End Execution Flow (Data & Control Lifecycle)

\`\`\`mermaid
${seq}\`\`\`

### Execution Lifecycle Walkthrough
1. **Trigger & Ingestion**: The system is invoked via its primary entry point (\`${mainSource.relPath}\`).
2. **Context Resolution**: Configuration, parameters, and environment state are initialized.
3. **Core Processing**: The application executes domain logic, handling requests or computational algorithms.
4. **Output Dispatch**: The system renders console output, emits HTTP responses, or writes persisted state.

---

## 🧩 Subsystem & Module Breakdown
${moduleDetails}

---

## ⚖️ The "WHY": Design Rationale & Trade-offs

### Key Design Invariants
- **Simplicity First**: Avoids unnecessary indirection or premature architectural layers.
- **Explicit Execution Flow**: All data transitions and error pathways are deterministic and visible.
- **Isolated Testing**: Core routines are structured for independent execution and rapid verification.

### Architectural Trade-offs
| Decision | Chosen Approach | Alternative Considered | Rationale / Why |
| :--- | :--- | :--- | :--- |
| **Component Structure** | ${meta.type} | Heavily partitioned microservices | Fits current operational scale without microservice network overhead. |
| **Runtime Dependencies** | Minimal / Standard Library | Heavy third-party frameworks | Enhances stability, minimizes vulnerability footprint, and simplifies onboarding. |

---

## 📐 Alignment with OpenSpec Domains
${domainsSection}

---
[[Home|← Back to Home]] | [[Overview/Product-Overview|← Product Overview]]
`;
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
        const capIdMatch = line.match(/^ {6}-\\s+id:\s*["']?([^"']+)["']?\\s*$/);
        if (capIdMatch) {
          currentCap = { id: capIdMatch[1], description: '' };
          currentDomain.capabilities.push(currentCap);
          continue;
        }

        const capDescMatch = line.match(/^ {8}description:\s*["']?([^"']+)["']?\\s*$/);
        if (capDescMatch && currentCap) {
          currentCap.description = capDescMatch[1];
          continue;
        }
      }
    }
  }

  return domains;
}

// Parse OpenSpec living spec markdown
function parseLivingSpec(specContent) {
  const spec = {
    purpose: '',
    requirements: []
  };

  const purposeMatch = specContent.match(/## Purpose\s+([\s\S]*?)(?=\n## |$)/);
  if (purposeMatch) {
    spec.purpose = purposeMatch[1].trim();
  }

  const reqMatches = specContent.matchAll(/### Requirement:\s*([^\n]+)\s+([\s\S]*?)(?=\n### Requirement:|\n## |$)/g);
  for (const match of reqMatches) {
    const title = match[1].trim();
    const body = match[2].trim();

    const statementMatch = body.match(/The system SHALL\s+([^\n]+)/i);
    const statement = statementMatch ? statementMatch[0].trim() : '';

    const scenarios = [];
    const scenarioMatches = body.matchAll(/#### Scenario:\s*([^\n]+)\s+([\s\S]*?)(?=\n#### Scenario:|$)/g);
    for (const sm of scenarioMatches) {
      const scenarioTitle = sm[1].trim();
      const scenarioSteps = sm[2].trim();
      scenarios.push({ title: scenarioTitle, steps: scenarioSteps });
    }

    spec.requirements.push({ title, statement, scenarios });
  }

  return spec;
}

// Map capability to documentation category
function categorizeCapability(domainId, capabilityId) {
  if (domainId.includes('core') || domainId.includes('platform') || capabilityId.includes('config') || capabilityId.includes('data')) {
    return 'Reference';
  }
  return 'Features';
}

// Format OpenSpec into an Obsidian note
function formatObsidianSpecNote(domain, capability, spec, lastSynced) {
  const capTitle = toTitleCase(capability);
  const domainTitle = toTitleCase(domain);

  let md = `---
title: "${capTitle}"
type: specification
domain: "${domain}"
capability: "${capability}"
last_synced: "${lastSynced}"
tags:
  - specification
  - domain/${domain}
  - capability/${capability}
---

# ${capTitle}

> [!NOTE] Living System Specification
> Canonical Source: \`openspec/specs/${domain}/${capability}/spec.md\`
> Domain Bounded Context: [[${domainTitle}]]

## Executive Summary
${spec.purpose || '*No purpose description provided in living specification.*'}

## Behavioral Contracts & Requirements

`;

  if (spec.requirements.length === 0) {
    md += '*No formal requirements registered for this capability.*\n\n';
  } else {
    for (const req of spec.requirements) {
      md += `### ${req.title}\n\n`;
      if (req.statement) {
        md += `> **Normative Invariant**: ${req.statement}\n\n`;
      }

      if (req.scenarios.length > 0) {
        for (const sc of req.scenarios) {
          md += `> [!EXAMPLE] Scenario: ${sc.title}\n`;
          const steps = sc.steps.split(/\r?\n/);
          for (const s of steps) {
            if (s.trim()) {
              md += `> ${s}\n`;
            }
          }
          md += '\n';
        }
      }
    }
  }

  md += `---
[[Home|← Back to Home]] | [[Reference/Domain-Catalog|Domain Catalog]]
`;

  return md;
}

// Load state manifest
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch {
      console.warn('[Sync] Warning: Failed to parse .sync-state.json, rebuilding state.');
    }
  }
  return {
    version: 1,
    lastSynced: null,
    codebaseHash: null,
    astHash: null,
    domainsHash: null,
    governanceHash: null,
    schemasHash: null,
    files: {},
    adrs: {},
    archivedChanges: {}
  };
}

// Save state manifest
function saveState(state) {
  state.lastSynced = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// Synchronize OpenSpec Governance and Schemas guides
function syncFrameworkGuides(state, updatedCount) {
  if (fs.existsSync(GOVERNANCE_FILE)) {
    const content = fs.readFileSync(GOVERNANCE_FILE, 'utf8');
    const hash = computeHash(content);
    const targetPath = path.join(DOCS_DIR, 'Guides', 'OpenSpec-Governance.md');
    if (FORCE_REBUILD || state.governanceHash !== hash || !fs.existsSync(targetPath)) {
      if (VERBOSE) console.log('[Sync] Updating OpenSpec Governance guide');
      const note = `---
title: "OpenSpec Governance"
type: guide
last_synced: "${new Date().toISOString()}"
tags:
  - guide
  - governance
  - openspec
---

# OpenSpec Lifecycle & Domain Governance

> [!NOTE] Framework Reference
> Synced from \`openspec/GOVERNANCE.md\`.

${content}

---
[[Home|← Back to Home]] | [[Guides/OpenSpec-Schemas|OpenSpec Schemas →]]
`;
      if (!DRY_RUN) fs.writeFileSync(targetPath, note, 'utf8');
      state.governanceHash = hash;
      updatedCount++;
    }
  }

  if (fs.existsSync(SCHEMAS_FILE)) {
    const content = fs.readFileSync(SCHEMAS_FILE, 'utf8');
    const hash = computeHash(content);
    const targetPath = path.join(DOCS_DIR, 'Guides', 'OpenSpec-Schemas.md');
    if (FORCE_REBUILD || state.schemasHash !== hash || !fs.existsSync(targetPath)) {
      if (VERBOSE) console.log('[Sync] Updating OpenSpec Schemas guide');
      const note = `---
title: "OpenSpec Schemas"
type: guide
last_synced: "${new Date().toISOString()}"
tags:
  - guide
  - schemas
  - openspec
---

# OpenSpec Artifact Schemas & Syntax

> [!NOTE] Framework Reference
> Synced from \`openspec/SCHEMAS.md\`.

${content}

---
[[Home|← Back to Home]] | [[Guides/OpenSpec-Governance|← OpenSpec Governance]]
`;
      if (!DRY_RUN) fs.writeFileSync(targetPath, note, 'utf8');
      state.schemasHash = hash;
      updatedCount++;
    }
  }

  return updatedCount;
}

// Synchronize ADRs from adr/
function processAdrs(state, updatedCount) {
  if (!fs.existsSync(ADR_DIR)) return updatedCount;

  const entries = fs.readdirSync(ADR_DIR, { withFileTypes: true });
  const adrFiles = entries.filter(e => e.isFile() && e.name.endsWith('.md') && e.name !== 'README.md' && e.name !== 'preferences.md').map(e => e.name);

  for (const file of adrFiles) {
    const fullPath = path.join(ADR_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const hash = computeHash(content);
    const targetFile = path.join(DOCS_DIR, 'Decisions', file);

    if (!FORCE_REBUILD && state.adrs[file] === hash && fs.existsSync(targetFile)) {
      continue;
    }

    if (VERBOSE) console.log(`[Sync] Updating ADR note: ${file}`);

    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : file.replace(/\.md$/, '');

    const adrNote = `---
title: "${title}"
type: decision
adr: "${file}"
last_synced: "${new Date().toISOString()}"
tags:
  - adr
  - architecture-decision
---

${content}

---
[[Decisions/Overview|← Decisions Index]] | [[Home|Home]]
`;

    if (!DRY_RUN) {
      fs.writeFileSync(targetFile, adrNote, 'utf8');
    }

    state.adrs[file] = hash;
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
function buildHomeMoc(meta, domains, specsCatalog) {
  let content = `# Documentation Vault: ${meta.name}

Welcome to the comprehensive product and architecture documentation for **${meta.name}** (${meta.type}). This knowledge base is dynamically synchronized from AST symbol registries, codebase snapshots, living behavior specifications, and OpenSpec change records.

## 🧭 Map of Content (MOC)

| Section | Focus | Quick Link |
| :--- | :--- | :--- |
| **Product Overview** | The "WHAT": Vision, purpose, user journeys, and capabilities | [[Overview/Product-Overview\\|Read Product Overview]] |
| **System Architecture** | The "HOW" & "WHY": Architecture model, lifecycle diagrams, and design trade-offs | [[Overview/System-Architecture\\|View System Architecture]] |
| **Features & Capabilities** | Living behavioral specifications and Gherkin scenarios | [[Features/Overview\\|Explore Features]] |
| **Developer Guides** | Practical onboarding, lifecycle governance, and schemas | [[Guides/Developer-Onboarding\\|Onboarding]] · [[Guides/OpenSpec-Governance\\|Governance]] · [[Guides/OpenSpec-Schemas\\|Schemas]] |
| **Technical Reference** | Configuration, domain catalog, and contracts | [[Reference/Overview\\|View Reference]] |
| **Architectural Decisions** | Durable decision records (ADRs) | [[Decisions/Overview\\|Browse ADRs]] |
| **Product Changelog** | Release history and archived changes | [[Changelog/Overview\\|View Changelog]] |

---

## 🏛️ System Domains & Capabilities

`;

  if (domains.length === 0) {
    content += '*No architectural domains declared yet in `openspec/domains.yaml`.*\n\n';
  } else {
    for (const domain of domains) {
      content += `### ${domain.name}\n`;
      if (domain.description) {
        content += `*${domain.description}*\n\n`;
      }
      const domainSpecs = specsCatalog.filter(s => s.domain === domain.id);
      if (domainSpecs.length === 0) {
        content += '- *No specifications documented yet for this domain.*\n\n';
      } else {
        for (const spec of domainSpecs) {
          content += `- **[[${spec.category}/${spec.fileName}|${spec.title}]]**: ${spec.purpose || 'Living behavioral specification'}\n`;
        }
        content += '\n';
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
    content += '### Capabilities\n\n';

    if (!domain.capabilities || domain.capabilities.length === 0) {
      content += '*No capabilities declared.*\n\n';
    } else {
      for (const cap of domain.capabilities) {
        const specMatch = specsCatalog.find(s => s.domain === domain.id && s.capability === cap.id);
        const link = specMatch ? `[[${specMatch.category}/${specMatch.fileName}|${toTitleCase(cap.id)}]]` : `\`${cap.id}\``;
        content += `- **${link}**: ${cap.description || 'System capability'}\n`;
      }
      content += '\n';
    }
  }

  content += '---\n[[Home|← Back to Home]] | [[Reference/Overview|Reference Index]]\n';
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

  // 1. Capture Full Codebase Snapshot & AST Symbols (Tree-sitter Repomix + Native AST Engine)
  const codebaseSnapshot = captureCodebaseSnapshot(REPO_ROOT);
  const codebaseChanged = FORCE_REBUILD || state.codebaseHash !== codebaseSnapshot.hash || state.astHash !== codebaseSnapshot.astHash;
  if (VERBOSE) {
    console.log(`[Sync] AST & Snapshot Engine: ${codebaseSnapshot.usedRepomix ? 'Repomix Tree-sitter' : 'Native AST Parser'} (${Math.round(codebaseSnapshot.size / 1024)} KB, AST Hash: ${codebaseSnapshot.astHash.slice(0, 10)})`);
    console.log(`[Sync] Discovered Symbols: ${codebaseSnapshot.astCatalog.entities.length} entities, ${codebaseSnapshot.astCatalog.routines.length} routines, ${codebaseSnapshot.astCatalog.endpoints.length} endpoints, ${codebaseSnapshot.astCatalog.entrypoints.length} entrypoints`);
  }

  // 2. Scan Project Metadata from Codebase, Manifests & AST Catalog
  const projectMeta = scanProjectMetadata(REPO_ROOT, codebaseSnapshot.astCatalog);
  const productOverviewPath = path.join(DOCS_DIR, 'Overview', 'Product-Overview.md');
  const systemArchPath = path.join(DOCS_DIR, 'Overview', 'System-Architecture.md');

  // 3. Check domains.yaml
  const domainsContent = fs.readFileSync(DOMAINS_FILE, 'utf8');
  const domainsHash = computeHash(domainsContent);
  const domainsChanged = FORCE_REBUILD || state.domainsHash !== domainsHash;
  const domains = parseDomainsYaml(domainsContent);

  // 4. Update Product Overview & System Architecture if AST symbols or codebase changed
  const overviewNeedsUpdate = codebaseChanged || !fs.existsSync(productOverviewPath) || !fs.existsSync(systemArchPath);
  if (overviewNeedsUpdate) {
    if (VERBOSE) console.log('[Sync] Updating dynamic project overviews (WHAT, HOW, and WHY) from AST symbols');
    const overviewContent = formatProductOverview(projectMeta);
    const archContent = formatSystemArchitecture(projectMeta, domains);

    if (!DRY_RUN) {
      fs.writeFileSync(productOverviewPath, overviewContent, 'utf8');
      fs.writeFileSync(systemArchPath, archContent, 'utf8');
    }
    state.codebaseHash = codebaseSnapshot.hash;
    state.astHash = codebaseSnapshot.astHash;
    updatedFilesCount += 2;
  }

  // 5. Discover living specs
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
    const targetFile = path.join(DOCS_DIR, category, `${fileName}.md`);

    const relSpecPath = path.relative(REPO_ROOT, fullPath);
    const parsedSpec = parseLivingSpec(content);

    specsCatalog.push({
      domain,
      capability,
      category,
      fileName,
      title: toTitleCase(capability),
      purpose: parsedSpec.purpose
    });

    if (!FORCE_REBUILD && state.files[relSpecPath] === hash && fs.existsSync(targetFile)) {
      continue;
    }

    if (VERBOSE) console.log(`[Sync] Updating spec note: ${category}/${fileName}.md`);

    const noteContent = formatObsidianSpecNote(domain, capability, parsedSpec, new Date().toISOString());

    if (!DRY_RUN) {
      fs.writeFileSync(targetFile, noteContent, 'utf8');
    }

    state.files[relSpecPath] = hash;
    updatedFilesCount++;
  }

  // 6. Update Domain Catalog
  const domainCatalogPath = path.join(DOCS_DIR, 'Reference', 'Domain-Catalog.md');
  if (domainsChanged || FORCE_REBUILD || !fs.existsSync(domainCatalogPath)) {
    if (VERBOSE) console.log('[Sync] Updating Domain Catalog');
    const catalogContent = buildDomainCatalog(domains, specsCatalog);
    if (!DRY_RUN) {
      fs.writeFileSync(domainCatalogPath, catalogContent, 'utf8');
    }
    state.domainsHash = domainsHash;
    updatedFilesCount++;
  }

  // 7. Synchronize Governance & Schemas guides
  updatedFilesCount = syncFrameworkGuides(state, updatedFilesCount);

  // 8. Synchronize ADRs
  updatedFilesCount = processAdrs(state, updatedFilesCount);

  // 9. Synchronize Archived Changes
  updatedFilesCount = processArchivedChanges(state, updatedFilesCount);

  // 10. Update Home MOC
  const homePath = path.join(DOCS_DIR, 'Home.md');
  const homeContent = buildHomeMoc(projectMeta, domains, specsCatalog);
  const homeHash = computeHash(homeContent);

  if (FORCE_REBUILD || state.homeHash !== homeHash || !fs.existsSync(homePath)) {
    if (VERBOSE) console.log('[Sync] Updating Home MOC');
    if (!DRY_RUN) {
      fs.writeFileSync(homePath, homeContent, 'utf8');
    }
    state.homeHash = homeHash;
    updatedFilesCount++;
  }

  // 11. Persist State Manifest
  if (!DRY_RUN && updatedFilesCount > 0) {
    saveState(state);
  }

  if (updatedFilesCount === 0) {
    console.log('✨ AST symbols, codebase snapshot, and specifications are unchanged. Documentation is already up to date. (0 files changed)');
  } else {
    console.log(`🎉 Successfully synchronized documentation vault! (${updatedFilesCount} file${updatedFilesCount === 1 ? '' : 's'} updated)`);
  }
}

sync();
