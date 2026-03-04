$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "backend-java")

function Try-Run($cmdPath) {
  if ($cmdPath -and (Test-Path $cmdPath)) {
    Write-Host "[ChronosBR] Usando Maven: $cmdPath"
    & $cmdPath "spring-boot:run"
    return $true
  }
  return $false
}

# 1) PATH
$fromPath = (Get-Command mvn -ErrorAction SilentlyContinue)
if ($fromPath) {
  Write-Host "[ChronosBR] Usando Maven do PATH..."
  mvn spring-boot:run
  exit 0
}

# 2) MAVEN_HOME
if ($env:MAVEN_HOME) {
  $mvnHome = Join-Path $env:MAVEN_HOME "bin\mvn.cmd"
  if (Try-Run $mvnHome) { exit 0 }
}

# 3) C:\Maven\*
$roots = Get-ChildItem -Path "C:\Maven" -Directory -ErrorAction SilentlyContinue
foreach ($r in $roots) {
  if (Try-Run (Join-Path $r.FullName "bin\mvn.cmd")) { exit 0 }
  $subs = Get-ChildItem -Path $r.FullName -Directory -ErrorAction SilentlyContinue
  foreach ($s in $subs) {
    if (Try-Run (Join-Path $s.FullName "bin\mvn.cmd")) { exit 0 }
  }
}

Write-Host ""
Write-Host "[ChronosBR] ERRO: Nao encontrei o Maven (mvn)."
Write-Host "Instale o Maven ou defina MAVEN_HOME. Depois rode este script novamente."
Pause
exit 1
