# install-task.ps1
# Enregistre une tache planifiee Windows qui ping Render toutes les 10 min,
# au demarrage de la session, en arriere-plan (fenetre cachee).
#
# === UTILISATION ===
# 1. Clic droit sur ce fichier > "Executer avec PowerShell"
#    (ou dans un terminal : powershell -ExecutionPolicy Bypass -File install-task.ps1)
# 2. C'est tout. La tache "HMA-KeepAlive" tourne ensuite toute seule.

$TaskName   = "HMA-KeepAlive"
$ScriptPath = Join-Path $PSScriptRoot "ping-render.ps1"

if (-not (Test-Path $ScriptPath)) {
    Write-Host "ERREUR: ping-render.ps1 introuvable a cote de ce script." -ForegroundColor Red
    exit 1
}

# Action : lancer PowerShell en cache sur notre script de ping.
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""

# Declencheurs : au demarrage de la session + repetition toutes les 10 min, indefiniment.
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn
$triggerNow   = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 10) `
    -RepetitionDuration ([TimeSpan]::MaxValue)

# Reglages : tourne aussi sur batterie, redemarre si echec.
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# Supprime une eventuelle ancienne version puis (re)cree la tache.
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask -TaskName $TaskName `
    -Action $action `
    -Trigger $triggerLogon, $triggerNow `
    -Settings $settings `
    -Description "Ping le backend HMA sur Render toutes les 10 min pour l'empecher de s'endormir." | Out-Null

Write-Host "Tache '$TaskName' installee. Elle ping Render toutes les 10 min." -ForegroundColor Green
Write-Host "Verifie les pings dans : $(Join-Path $PSScriptRoot 'ping.log')" -ForegroundColor Cyan
Write-Host "Pour la desinstaller : executer uninstall-task.ps1" -ForegroundColor Cyan
