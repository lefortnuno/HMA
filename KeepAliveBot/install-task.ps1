# install-task.ps1
# Enregistre une tache planifiee Windows qui lance le bot de ping en
# arriere-plan (fenetre cachee), a l'ouverture de session.
#
# La cadence (58 s) est geree par ping-render.ps1 lui-meme : le Planificateur
# de taches n'accepte pas d'intervalle de repetition sous la minute. La tache
# ne fait donc que demarrer le script et le relancer s'il s'arrete.
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

# Declencheurs : a l'ouverture de session, et tout de suite a l'installation.
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn
$triggerNow   = New-ScheduledTaskTrigger -Once -At (Get-Date)

# Reglages : tourne aussi sur batterie et redemarre si le script s'arrete.
#  - ExecutionTimeLimit 0 : sans cela le Planificateur tue la tache au bout
#    de 3 jours, alors qu'elle est justement faite pour ne jamais s'arreter.
#  - MultipleInstances IgnoreNew : une reconnexion ne doit pas lancer un
#    second bot en parallele du premier.
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -MultipleInstances IgnoreNew

# Supprime une eventuelle ancienne version puis (re)cree la tache.
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask -TaskName $TaskName `
    -Action $action `
    -Trigger $triggerLogon, $triggerNow `
    -Settings $settings `
    -Description "Ping le backend HMA sur Render toutes les 58 s pour l'empecher de s'endormir." | Out-Null

Write-Host "Tache '$TaskName' installee. Le bot ping Render toutes les 58 s." -ForegroundColor Green
Write-Host "Verifie les pings dans : $(Join-Path $PSScriptRoot 'ping.log')" -ForegroundColor Cyan
Write-Host "Pour la desinstaller : executer uninstall-task.ps1" -ForegroundColor Cyan
