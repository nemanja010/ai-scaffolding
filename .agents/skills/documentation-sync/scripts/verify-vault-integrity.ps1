<#
.SYNOPSIS
    Universal Obsidian Knowledge Vault Integrity & Expressiveness Quality Gate.

.DESCRIPTION
    Validates:
    1. Every Markdown file in Documentation/ has valid YAML frontmatter (title, description, tags).
    2. Every Obsidian [[wikilink]] resolves to an existing vault target (0 broken links).
    3. Every topic page is indexed in Home.md or its section Overview.md.
    4. Architectural Expressiveness Gate: Documentation/Overview/Overview.md exists, and every document
       under Documentation/Overview/*.md contains at least one substantive Mermaid diagram.

.PARAMETER VaultPath
    Path to documentation directory relative to repo root. Defaults to 'Documentation'.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$VaultPath = "Documentation"
)

$ErrorActionPreference = 'Stop'

$repoRoot = git rev-parse --show-toplevel 2>$null
if (-not $repoRoot) {
    $repoRoot = (Get-Location).Path
}

$verifierScript = Join-Path $repoRoot ".agents\skills\documentation-sync\scripts\verify-vault.cjs"
$targetVault = Join-Path $repoRoot $VaultPath

if (Get-Command node -ErrorAction SilentlyContinue) {
    & node $verifierScript $targetVault
    exit $LASTEXITCODE
} else {
    Write-Warning "Node.js not found in PATH. Please run in an environment with Node.js installed."
    exit 1
}
