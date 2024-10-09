cd C:\Users\~Trofel~\Desktop\HMA

git add *

REM Obtenir la date et l'heure actuelles
FOR /F "tokens=2 delims==" %%I IN ('"wmic os get localdatetime /value"') DO SET datetime=%%I

REM Extraire les composants de la date et l'heure
SET year=%datetime:~0,4%
SET month=%datetime:~4,2%
SET day=%datetime:~6,2%
SET hour=%datetime:~8,2%
SET minute=%datetime:~10,2%

REM Créer le message de commit avec la date et l'heure au format dd/mm/yyyy - hh:min
SET commitMessage=Auto Online Env by Trofel - %day%/%month%/%year% - %hour%:%minute%

git commit -m "%commitMessage%"
git push
pause