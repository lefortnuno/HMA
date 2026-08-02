# ping-render.ps1
# Ping le backend Render pour l'empecher de s'endormir.
#
# Le script tourne en continu et gere lui-meme sa cadence : le Planificateur
# de taches Windows n'accepte pas d'intervalle de repetition sous la minute,
# une cadence de 58 s ne peut donc pas venir de lui. La tache se contente de
# lancer ce script a l'ouverture de session, et de le relancer s'il s'arrete.

$Url             = "https://hmaos.onrender.com/ping"
$IntervalleSec   = 58
$LogFile         = Join-Path $PSScriptRoot "ping.log"
$MaxLignesLog    = 2000   # ~32 h d'historique a cette cadence
$PingsAvantPurge = 50     # on ne reecrit pas tout le log a chaque ping

$compteur = 0

while ($true) {
    $Stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

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

    # Purge periodique : relire et reecrire le fichier a chaque ping serait
    # inutilement lourd a cette frequence.
    $compteur++
    if ($compteur -ge $PingsAvantPurge) {
        $compteur = 0
        $content = Get-Content -Path $LogFile -ErrorAction SilentlyContinue
        if ($content.Count -gt $MaxLignesLog) {
            $content | Select-Object -Last $MaxLignesLog |
                Set-Content -Path $LogFile -Encoding utf8
        }
    }

    Start-Sleep -Seconds $IntervalleSec
}
