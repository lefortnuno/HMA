# ping-render.ps1
# Ping le backend Render pour l'empecher de s'endormir.
# Appele automatiquement toutes les 10 min par le Planificateur de taches Windows.

$Url     = "https://hmaos.onrender.com/ping"
$LogFile = Join-Path $PSScriptRoot "ping.log"
$Stamp   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

try {
    $resp = Invoke-WebRequest -Uri $Url -TimeoutSec 60 -UseBasicParsing
    $line = "$Stamp  OK   HTTP $($resp.StatusCode)"
}
catch {
    # Render etait peut-etre en plein cold start : ce n'est pas grave,
    # le prochain ping le reveillera.
    $line = "$Stamp  WARN $($_.Exception.Message)"
}

Add-Content -Path $LogFile -Value $line -Encoding utf8

# Garde le log leger : on ne conserve que les 500 dernieres lignes.
$content = Get-Content -Path $LogFile -ErrorAction SilentlyContinue
if ($content.Count -gt 500) {
    $content | Select-Object -Last 500 | Set-Content -Path $LogFile -Encoding utf8
}
