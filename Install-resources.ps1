$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
$cache=Join-Path $PSScriptRoot 'resources'
New-Item -ItemType Directory -Path $cache -Force | Out-Null
$base='https://github.com/Yangyige-123/chemistry-question-bank/releases/download/resources-2026-10-27/'
$manifestFile=Join-Path $cache 'resource-packs.json'
Invoke-WebRequest -Uri ($base+'resource-packs.json') -OutFile ($manifestFile+'.tmp')
Move-Item -LiteralPath ($manifestFile+'.tmp') -Destination $manifestFile -Force
$manifest=Get-Content -LiteralPath $manifestFile -Raw | ConvertFrom-Json
foreach($pack in $manifest.packs){
 if($pack.name -notmatch '^resources-[0-9]{2}\.zip$'){throw 'Invalid resource package name.'}
 $file=Join-Path $cache $pack.name
 $ready=(Test-Path -LiteralPath $file) -and ((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() -eq $pack.sha256)
 if(-not $ready){
  Write-Host "Downloading $($pack.name)..."
  Invoke-WebRequest -Uri ($base+$pack.name) -OutFile ($file+'.tmp')
  if((Get-FileHash -LiteralPath ($file+'.tmp') -Algorithm SHA256).Hash.ToLowerInvariant() -ne $pack.sha256){throw "Checksum mismatch: $($pack.name)"}
  Move-Item -LiteralPath ($file+'.tmp') -Destination $file -Force
 }
}
foreach($pack in $manifest.packs){Write-Host "Installing $($pack.name)...";Expand-Archive -LiteralPath (Join-Path $cache $pack.name) -DestinationPath $PSScriptRoot -Force}
node tools/check-resources.mjs
if($LASTEXITCODE -ne 0){throw 'Resource verification failed.'}