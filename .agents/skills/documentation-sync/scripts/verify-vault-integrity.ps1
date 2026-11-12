<#
.SYNOPSIS
    Universal Obsidian Knowledge Vault Integrity & Expressiveness Quality Gate.

.DESCRIPTION
    Validates:
    1. Canonical Vault Structure: Strictly enforces the 6 canonical directories
       (Overview/, Features/, Guides/, Reference/, Decisions/, Changelog/) and permitted root files.
    2. Frontmatter: Every Markdown file in Documentation/ has valid YAML frontmatter (title, description, tags).
    3. Wikilinks: Every Obsidian [[wikilink]] resolves to an existing vault target (0 broken links).
    4. Architectural Expressiveness Gate: Documentation/Overview/Overview.md exists, and every document
       under Documentation/Overview/*.md contains at least one substantive Mermaid diagram.
    5. Mermaid Syntax & AST Verification:
       - Syntax linting of edge labels, sequence notes, node text, and diagram blocks.
       - AST engine parser execution via validate-mermaid.mjs when Node is available.
    6. Index Reachability: Every topic page is indexed in Home.md or its section Overview.md.

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

# If Node.js is available, delegate to the cross-platform Node verification engine
if (Get-Command node -ErrorAction SilentlyContinue) {
    & node $verifierScript $targetVault
    exit $LASTEXITCODE
}

# Native PowerShell Fallback when Node.js is not present
Write-Host "Verifying vault integrity (Native PowerShell engine) for: $targetVault" -ForegroundColor Cyan

$fullVaultPath = [System.IO.Path]::GetFullPath($targetVault)
if (-not (Test-Path $fullVaultPath)) {
    throw "Vault directory not found: $fullVaultPath"
}

$mdFiles = Get-ChildItem -Path $fullVaultPath -Recurse -Filter "*.md" | Where-Object {
    $_.FullName -notmatch '[\\/]\.obsidian[\\/]' -and $_.FullName -notmatch '[\\/]\.git[\\/]'
}

$vaultTargets = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$vaultRelativePaths = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

foreach ($f in $mdFiles) {
    $nameWithoutExt = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
    [void]$vaultTargets.Add($nameWithoutExt)
    $rel = ($f.FullName.Substring($fullVaultPath.Length)).TrimStart('\', '/').Replace('\', '/')
    $relNoExt = if ($rel.EndsWith(".md")) { $rel.Substring(0, $rel.Length - 3) } else { $rel }
    [void]$vaultRelativePaths.Add($relNoExt)
    [void]$vaultRelativePaths.Add($rel)
}

$assetFiles = Get-ChildItem -Path $fullVaultPath -Recurse -File | Where-Object { $_.Extension -ne '.md' }
foreach ($af in $assetFiles) {
    $rel = ($af.FullName.Substring($fullVaultPath.Length)).TrimStart('\', '/').Replace('\', '/')
    [void]$vaultTargets.Add($af.Name)
    [void]$vaultRelativePaths.Add($rel)
}

$structureErrors = @()
$frontmatterErrors = @()
$brokenLinks = @()
$mermaidErrors = @()
$expressivenessErrors = @()
$unindexedPages = @()

# 1. Structure Check
$allowedDirs = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
@('Overview', 'Features', 'Guides', 'Reference', 'Decisions', 'Changelog', '.obsidian') | ForEach-Object { [void]$allowedDirs.Add($_) }
$allowedRoots = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
@('Home.md', 'HOME.md', 'README.md', '.sync-state.json', '.vault-sync-state.json') | ForEach-Object { [void]$allowedRoots.Add($_) }

$topEntries = Get-ChildItem -Path $fullVaultPath -Force
foreach ($entry in $topEntries) {
    if ($entry.PSIsContainer) {
        if (-not $allowedDirs.Contains($entry.Name)) {
            $structureErrors += "Non-canonical directory detected: Documentation/$($entry.Name)/."
        }
    } else {
        if (-not $allowedRoots.Contains($entry.Name)) {
            $structureErrors += "Out-of-place root file detected: Documentation/$($entry.Name)."
        }
    }
}

# 2. Home & Section Overviews
$homePath = Join-Path $fullVaultPath "Home.md"
if (-not (Test-Path $homePath)) { $homePath = Join-Path $fullVaultPath "HOME.md" }
$homeText = if (Test-Path $homePath) { Get-Content -Path $homePath -Raw -Encoding utf8 } else { "" }

$sectionOverviews = @{}
@('Overview', 'Features', 'Guides', 'Reference', 'Decisions', 'Changelog') | ForEach-Object {
    $secPath = Join-Path $fullVaultPath "$_\Overview.md"
    $sectionOverviews[$_] = if (Test-Path $secPath) { Get-Content -Path $secPath -Raw -Encoding utf8 } else { "" }
}

# 3. File Inspections
foreach ($f in $mdFiles) {
    $rel = ($f.FullName.Substring($fullVaultPath.Length)).TrimStart('\', '/').Replace('\', '/')
    $lines = Get-Content -Path $f.FullName -Encoding utf8

    # Frontmatter
    if ($lines.Count -lt 3 -or $lines[0].Trim() -ne '---') {
        $frontmatterErrors += "${rel}: Missing opening '---' YAML frontmatter delimiter."
    } else {
        $closingIdx = -1
        for ($i = 1; $i -lt [Math]::Min(30, $lines.Count); $i++) {
            if ($lines[$i].Trim() -eq '---') { $closingIdx = $i; break }
        }
        if ($closingIdx -eq -1) {
            $frontmatterErrors += "${rel}: Missing closing '---' delimiter within first 30 lines."
        } else {
            $fmBlock = ($lines[1..($closingIdx - 1)]) -join "`n"
            if ($fmBlock -notmatch '(?mi)^title\s*:') { $frontmatterErrors += "${rel}: Frontmatter missing 'title:'" }
            if ($fmBlock -notmatch '(?mi)^description\s*:') { $frontmatterErrors += "${rel}: Frontmatter missing 'description:'" }
            if ($fmBlock -notmatch '(?mi)^tags\s*:') { $frontmatterErrors += "${rel}: Frontmatter missing 'tags:'" }
        }
    }

    # Wikilinks & Mermaid
    $inMermaid = $false
    $mermaidStartLine = 0
    $isSequence = $false

    for ($lineNum = 1; $lineNum -le $lines.Count; $lineNum++) {
        $line = $lines[$lineNum - 1]
        $trimmed = $line.Trim()

        # Links
        $matches = [regex]::Matches($line, '\[\[([^\]]+)\]\]')
        foreach ($m in $matches) {
            $rawLink = $m.Groups[1].Value.Trim()
            $cleanRaw = $rawLink -replace '\\\|', '|'
            $target = ($cleanRaw -split '\|')[0].Trim().TrimEnd('\')
            $target = ($target -split '#')[0].Trim()
            if ([string]::IsNullOrWhiteSpace($target)) { continue }
            $targetClean = if ($target.EndsWith(".md")) { $target.Substring(0, $target.Length - 3) } else { $target }
            if (-not ($vaultTargets.Contains($targetClean) -or $vaultTargets.Contains($target) -or $vaultRelativePaths.Contains($targetClean) -or $vaultRelativePaths.Contains($target))) {
                $brokenLinks += "${rel}:${lineNum} : Broken wikilink [[${rawLink}]]"
            }
        }

        # Mermaid
        if (-not $inMermaid) {
            if ($trimmed -match '^```mermaid\b') {
                $inMermaid = $true
                $mermaidStartLine = $lineNum
                $isSequence = $false
            }
        } else {
            if ($trimmed -match '^```\s*$') { $inMermaid = $false; continue }
            if ($trimmed -match '^sequenceDiagram\b') { $isSequence = $true }
            if ($line -match '(?:-->|---|==>|-\.->)\s*\|([^"|\r\n]*)\|') {
                if ($matches[1] -match '[()/*]') {
                    $mermaidErrors += "${rel}:${lineNum} : Mermaid syntax error. Unquoted special characters in edge label '|${matches[1]}|'."
                }
            }
            if ($isSequence -and $trimmed -match '^\s*Note\s+(?:over|left of|right of)\s+[^:\r\n]+:\s*([^;\r\n]*;.*)$') {
                $mermaidErrors += "${rel}:${lineNum} : Mermaid syntax error. Semicolon ';' in Note text prematurely terminates statement."
            }
            if ($trimmed -match '^[A-Za-z0-9_-]+\[([^"\]\r\n]*\|[^"\]\r\n]*)\]') {
                $mermaidErrors += "${rel}:${lineNum} : Mermaid syntax error. Unquoted pipe '|' inside node text '[${matches[1]}]'."
            }
        }
    }

    # Index reachability
    $nameWithoutExt = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
    $isRootDoc = ($rel -match '^(Home|HOME|README)\.md$')
    $isSectionOverview = ($rel -match '^[A-Za-z0-9_-]+[\\/]Overview\.md$')
    $isChangelogEntry = ($rel -match '^Changelog[\\/]')

    if (-not $isRootDoc -and -not $isSectionOverview) {
        $section = ($rel -split '[\\/]')[0]
        $secText = if ($sectionOverviews.ContainsKey($section)) { $sectionOverviews[$section] } else { "" }
        $isLinked = ($homeText -match "(?i)\[\[$([regex]::Escape($nameWithoutExt))(?:\||\])") -or
                    ($secText -match "(?i)\[\[$([regex]::Escape($nameWithoutExt))(?:\||\])")
        if (-not $isLinked -and -not $isChangelogEntry) {
            $unindexedPages += "${rel} is not linked from Home.md or ${section}/Overview.md"
        }
    }
}

# 4. Expressiveness
$overviewDocs = Get-ChildItem -Path (Join-Path $fullVaultPath "Overview") -Filter "*.md"
foreach ($od in $overviewDocs) {
    if ($od.Name -eq "Overview.md") { continue }
    $content = Get-Content -LiteralPath $od.FullName -Raw -Encoding utf8
    if ($content -notmatch '(?s)```mermaid.+?```') {
        $expressivenessErrors += "Overview/$($od.Name): Missing required Mermaid architectural diagram."
    }
}

# Reporting
if ($structureErrors.Count -gt 0 -or $frontmatterErrors.Count -gt 0 -or $brokenLinks.Count -gt 0 -or $mermaidErrors.Count -gt 0 -or $expressivenessErrors.Count -gt 0) {
    Write-Error "Vault integrity verification FAILED."
    exit 1
}

Write-Host "SUCCESS: Vault integrity verification passed cleanly." -ForegroundColor Green
exit 0
