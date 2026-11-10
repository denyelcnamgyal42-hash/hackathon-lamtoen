# Creates one admin account from ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD.
# This is the only admin provisioning path. It is not exposed as an HTTP route.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
& cmd.exe /c "npm run provision:admin"
exit $LASTEXITCODE
