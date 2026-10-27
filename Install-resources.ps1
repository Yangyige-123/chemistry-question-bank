$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
$cache=Join-Path $PSScriptRoot 'resources'
New-Item -ItemType Directory -Path $cache -Force | Out-Null
$gh=Get-Command gh -ErrorAction SilentlyContinue
if($gh){
 & $gh.Source release download 'resources-2026-10-27' --repo 'Yangyige-123/chemistry-question-bank' --pattern 'resources-*.zip' --pattern 'resource-packs.json' --dir $cache --clobber
 if($LASTEXITCODE -ne 0){throw 'Download failed. Sign in with gh auth login or manually download release assets into resources/.'}
}
$manifestFile=Join-Path $cache 'resource-packs.json'
if(-not (Test-Path -LiteralPath $manifestFile)){throw 'Download resource-packs.json and all resource ZIPs from the private GitHub release into resources/, then run this script again.'}
$manifest=Get-Content -LiteralPath $manifestFile -Raw | ConvertFrom-Json
foreach($pack in $manifest.packs){
 $file=Join-Path $cache $pack.name
 if(-not (Test-Path -LiteralPath $file)){throw "Missing pack: $($pack.name)"}
 if((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() -ne $pack.sha256){throw "Checksum mismatch: $($pack.name)"}
}
foreach($pack in $manifest.packs){Expand-Archive -LiteralPath (Join-Path $cache $pack.name) -DestinationPath $PSScriptRoot -Force}
node tools/check-resources.mjs
if($LASTEXITCODE -ne 0){throw 'Resource verification failed.'}
