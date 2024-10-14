cd C:\Users\~Trofel~\Desktop\HMA

git add *

set /p commitMessage="Titre du commit : "

git commit -m "%commitMessage%"
git push 