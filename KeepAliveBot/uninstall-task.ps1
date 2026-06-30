# uninstall-task.ps1
# Supprime la tache planifiee "HMA-KeepAlive".
# Clic droit > "Executer avec PowerShell".

$TaskName = "HMA-KeepAlive"

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($null -eq $task) {
    Write-Host "Aucune tache '$TaskName' trouvee (deja supprimee ?)." -ForegroundColor Yellow
    exit 0
}

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Host "Tache '$TaskName' supprimee." -ForegroundColor Green
