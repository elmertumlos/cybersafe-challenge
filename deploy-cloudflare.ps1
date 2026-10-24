[CmdletBinding()]
param(
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$assetDirectory = Join-Path $projectRoot 'cloudflare-upload'
$requiredFiles = @(
    'index.html',
    'styles.css',
    'app.js',
    'question-bank.js'
)

Write-Host 'Preparing CyberSafe Challenge for Cloudflare Workers...'

foreach ($fileName in $requiredFiles) {
    $sourcePath = Join-Path $projectRoot $fileName
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
        throw "Required file is missing: $sourcePath"
    }
}

if (-not (Test-Path -LiteralPath $assetDirectory -PathType Container)) {
    New-Item -ItemType Directory -Path $assetDirectory | Out-Null
}

foreach ($fileName in $requiredFiles) {
    Copy-Item `
        -LiteralPath (Join-Path $projectRoot $fileName) `
        -Destination (Join-Path $assetDirectory $fileName) `
        -Force
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$npxCommand = Get-Command npx.cmd -ErrorAction SilentlyContinue
if (-not $npxCommand) {
    $npxCommand = Get-Command npx -ErrorAction SilentlyContinue
}

if (-not $nodeCommand -or -not $npxCommand) {
    throw 'Node.js and npm are required. Install Node.js LTS, then run this script again.'
}

Push-Location -LiteralPath $projectRoot
try {
    if ($DryRun) {
        Write-Host 'Running a local Wrangler deployment check...'
        & $npxCommand.Source --yes wrangler@latest deploy --dry-run
        if ($LASTEXITCODE -ne 0) {
            throw "Wrangler dry run failed with exit code $LASTEXITCODE."
        }

        Write-Host 'Dry run passed. No Cloudflare changes were made.'
        exit 0
    }

    Write-Host 'Checking Cloudflare authentication...'
    & $npxCommand.Source --yes wrangler@latest whoami
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Opening Cloudflare login in your browser...'
        & $npxCommand.Source --yes wrangler@latest login
        if ($LASTEXITCODE -ne 0) {
            throw "Cloudflare login failed with exit code $LASTEXITCODE."
        }
    }

    Write-Host 'Deploying the CyberSafe Worker...'
    & $npxCommand.Source --yes wrangler@latest deploy
    if ($LASTEXITCODE -ne 0) {
        throw "Cloudflare deployment failed with exit code $LASTEXITCODE."
    }

    Write-Host ''
    Write-Host 'Deployment completed successfully.'
    Write-Host 'The Wrangler output above contains the generated workers.dev URL.'
    Write-Host 'To attach your own domain, follow the Custom domain section in README.md.'
}
finally {
    Pop-Location
}
