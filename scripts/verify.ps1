# Runs the Phase 1 checks from the repository root.
# npm is invoked through cmd so a failing script sets a real exit code in PowerShell.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

function Invoke-Npm {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$NpmArgs)
  & cmd.exe /c "npm $($NpmArgs -join ' ')"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Invoke-Npm run typecheck
Invoke-Npm run lint
Invoke-Npm run test
Invoke-Npm run build
