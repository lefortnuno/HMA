# ping-render.ps1
# Ping le backend Render pour l'empecher de s'endormir.
#
# Le script tourne en continu et gere lui-meme sa cadence : le Planificateur
# de taches Windows n'accepte pas d'intervalle de repetition sous la minute,
# une cadence de 58 s ne peut donc pas venir de lui. La tache se contente de
# lancer ce script a l'ouverture de session, et de le relancer s'il s'arrete.
#
# Sortie console : chaque ping affiche une ligne (verte = OK, jaune = WARN)
# avec le code HTTP, le temps de reponse et un petit recapitulatif. En tache
# planifiee (fenetre cachee) cette sortie est simplement ignoree.

$Url             = "https://hmaos.onrender.com/ping"
$IntervalleSec   = 58
$LogFile         = Join-Path $PSScriptRoot "ping.log"
$MaxLignesLog    = 2000   # ~32 h d'historique a cette cadence
$PingsAvantPurge = 50     # on ne reecrit pas tout le log a chaque ping

$total     = 0    # nombre total de pings
$okCount   = 0    # pings reussis
$warnCount = 0    # pings en echec / avertissement
$compteur  = 0    # pings depuis la derniere purge du log

# --- Banniere de demarrage ---------------------------------------------------
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  HMA KeepAlive - bot de ping" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ("  Cible      : {0}" -f $Url)
Write-Host ("  Intervalle : {0} s" -f $IntervalleSec)
Write-Host ("  Log        : {0}" -f $LogFile)
Write-Host ("  PID        : {0}" -f $PID)
Write-Host ("  Demarre    : {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-Host "  (Ctrl+C pour arreter)" -ForegroundColor DarkGray
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

while ($true) {
    $Stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $total++

    try {
        $sw   = [System.Diagnostics.Stopwatch]::StartNew()
        $resp = Invoke-WebRequest -Uri $Url -TimeoutSec 60 -UseBasicParsing
        $sw.Stop()
        $ms = [math]::Round($sw.Elapsed.TotalMilliseconds)
        $okCount++
        $line = "$Stamp  OK   HTTP $($resp.StatusCode)  ${ms}ms"
        Write-Host ("[#{0}] {1}  OK   HTTP {2}  {3} ms" -f $total, $Stamp, $resp.StatusCode, $ms) -ForegroundColor Green
    }
    catch {
        # Render etait peut-etre en plein cold start : ce n'est pas grave,
        # le prochain ping le reveillera.
        $warnCount++
        $msg  = $_.Exception.Message
        $line = "$Stamp  WARN $msg"
        Write-Host ("[#{0}] {1}  WARN {2}" -f $total, $Stamp, $msg) -ForegroundColor Yellow
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

    # Ligne de debug : stats cumulees + heure du prochain ping.
    $prochain = (Get-Date).AddSeconds($IntervalleSec).ToString("HH:mm:ss")
    Write-Host ("      total {0} | OK {1} | WARN {2} | prochain ping ~ {3}" -f `
        $total, $okCount, $warnCount, $prochain) -ForegroundColor DarkGray

    Start-Sleep -Seconds $IntervalleSec
}
