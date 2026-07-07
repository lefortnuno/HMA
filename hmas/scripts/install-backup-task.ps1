# install-backup-task.ps1
# Tache planifiee Windows : sauvegarde MENSUELLE de la base prod (le 1er du mois a 09h00).
# Clic droit > "Executer avec PowerShell" (ou: powershell -ExecutionPolicy Bypass -File install-backup-task.ps1)

$TaskName = "HMA-BackupDB"
$HmasDir  = Split-Path $PSScriptRoot -Parent
$NodeExe  = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $NodeExe) { Write-Host "ERREUR: node introuvable dans le PATH." -ForegroundColor Red; exit 1 }

# PowerShell 5.1 n'a pas de declencheur mensuel natif -> on passe par schtasks.
$cmd = "`"$NodeExe`" `"$HmasDir\scripts\backup_db.js`" prod"
schtasks /Create /F /TN $TaskName /SC MONTHLY /D 1 /ST 09:00 /TR $cmd | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Tache '$TaskName' installee : sauvegarde le 1er de chaque mois a 09h00." -ForegroundColor Green
    Write-Host "Les fichiers .sql arrivent dans : $HmasDir\backups\" -ForegroundColor Cyan
    Write-Host "Test immediat : npm run backup (dans hmas/)" -ForegroundColor Cyan
} else {
    Write-Host "Echec de creation de la tache (code $LASTEXITCODE)." -ForegroundColor Red
}
