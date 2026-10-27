$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
& node (Join-Path $PSScriptRoot 'tools/install-resources.mjs')
if($LASTEXITCODE -ne 0){throw 'Resource installation failed. Please review the message above.'}
