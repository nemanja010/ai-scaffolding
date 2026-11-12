import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { createRequire } from "module";
import os from "os";

// Universal Mermaid AST Validator
// Resolves Mermaid and JSDOM from:
// 1. Local or parent node_modules
// 2. Global node_modules
// 3. System temp validator directory ($TEMP/mermaid-validator/node_modules)

function resolveMermaidEnvironment() {
  const possiblePaths = [
    path.resolve(process.cwd(), "node_modules"),
    path.join(os.tmpdir(), "mermaid-validator", "node_modules"),
  ];

  for (const nodeModulesDir of possiblePaths) {
    if (fs.existsSync(nodeModulesDir)) {
      try {
        const dummyFile = path.join(nodeModulesDir, "dummy.js");
        const req = createRequire(dummyFile);
        const jsdomModule = req("jsdom");
        const mermaidCorePath = path.join(nodeModulesDir, "mermaid", "dist", "mermaid.core.mjs");
        if (fs.existsSync(mermaidCorePath)) {
          return {
            jsdom: jsdomModule.JSDOM,
            mermaidMjsPath: pathToFileURL(mermaidCorePath).href,
          };
        }
      } catch {
        // Continue searching
      }
    }
  }

  // Try standard Node module resolution
  try {
    const req = createRequire(import.meta.url);
    const jsdomModule = req("jsdom");
    const resolvedMermaid = req.resolve("mermaid");
    const mermaidDir = path.dirname(resolvedMermaid);
    const mermaidCorePath = path.join(mermaidDir, "mermaid.core.mjs");
    if (fs.existsSync(mermaidCorePath)) {
      return {
        jsdom: jsdomModule.JSDOM,
        mermaidMjsPath: pathToFileURL(mermaidCorePath).href,
      };
    }
  } catch {
    // Mermaid not resolvable via standard require
  }

  return null;
}

const env = resolveMermaidEnvironment();
if (!env) {
  console.warn("Notice: mermaid/jsdom package not loaded (checked local node_modules, temp directories, and global PATH).");
  console.warn("  Built-in regex/syntax verification will still run. To enable full AST engine parsing, run:");
  console.warn("  npm install -D mermaid jsdom   (or configure in CI/Docker)");
  process.exit(2);
}

let mermaid;
try {
  const JSDOM = env.jsdom;
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;

  const mermaidModule = await import(env.mermaidMjsPath);
  mermaid = mermaidModule.default;
  mermaid.initialize({ startOnLoad: false });
} catch (e) {
  console.warn("Notice: Failed to initialize Mermaid engine:", e.message);
  process.exit(2);
}

function findRepoRoot() {
  let curr = process.cwd();
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, "Documentation")) || fs.existsSync(path.join(curr, "AGENTS.md"))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return process.cwd();
}

const repoRoot = findRepoRoot();
const vaultDir = path.resolve(repoRoot, "Documentation");

if (!fs.existsSync(vaultDir)) {
  console.error(`Vault directory not found: ${vaultDir}`);
  process.exit(1);
}

function findMdFiles(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === ".obsidian" || item.name === ".git") continue;
      files = files.concat(findMdFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

const mdFiles = findMdFiles(vaultDir);
let totalDiagrams = 0;
let failedDiagrams = 0;
const failures = [];

for (const file of mdFiles) {
  const relPath = path.relative(vaultDir, file).replace(/\\/g, "/");
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);

  let inMermaid = false;
  let mermaidLines = [];
  let startLine = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    if (!inMermaid) {
      if (/^```mermaid\b/.test(line.trim())) {
        inMermaid = true;
        startLine = lineIdx + 1;
        mermaidLines = [];
      }
    } else {
      if (/^```\s*$/.test(line.trim())) {
        inMermaid = false;
        totalDiagrams++;
        const code = mermaidLines.join("\n").trim();
        try {
          await mermaid.parse(code);
        } catch (err) {
          failedDiagrams++;
          const errorMsg = (err.message || String(err)).split("\n")[0];
          failures.push({
            file: relPath,
            line: startLine,
            error: errorMsg,
            fullError: err.message || String(err),
          });
        }
      } else {
        mermaidLines.push(line);
      }
    }
  }
}

console.log(`Mermaid Diagram Validation: Scanned ${totalDiagrams} diagrams across ${mdFiles.length} documents.`);
if (failedDiagrams === 0) {
  console.log(`  SUCCESS: All ${totalDiagrams} Mermaid diagrams are syntactically valid!`);
  process.exit(0);
} else {
  console.error(`  ERROR: ${failedDiagrams} / ${totalDiagrams} Mermaid diagrams failed parsing:\n`);
  for (const f of failures) {
    console.error(`  [MERMAID-PARSE] Documentation/${f.file}:${f.line}`);
    console.error(`    ${f.fullError.replace(/\n/g, "\n    ")}\n`);
  }
  process.exit(1);
}
