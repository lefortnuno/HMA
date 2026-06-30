# 🤖 KeepAliveBot — Bot Windows local

Petit bot qui tourne sur **ton PC Windows** et ping le backend Render toutes les
**10 min** pour l'empêcher de s'endormir (plan gratuit Render = veille après 15 min).

Il s'appuie sur le **Planificateur de tâches Windows** (Task Scheduler) — plus
robuste qu'une boucle infinie : il survit aux reboots et se relance après un plantage.

---

## ⚠️ À LIRE D'ABORD : la grosse limite

> Ce bot ne ping **QUE quand ton PC est allumé et connecté à internet**.
> Dès que tu éteins ou mets en veille ton PC → Render se rendort.

➡️ Pour un vrai 24/7 **indépendant de ton PC**, utilise plutôt **UptimeRobot**
(voir le dossier `../UptimeRobot/`) ou le workflow **GitHub Actions**
(`../.github/workflows/keep-alive.yml`). Ce bot local est un **complément**, pas un
remplaçant.

---

## 📦 Contenu

| Fichier | Rôle |
|---|---|
| `ping-render.ps1` | Ping l'URL une fois et écrit dans `ping.log` |
| `install-task.ps1` | Installe la tâche planifiée (ping toutes les 10 min) |
| `uninstall-task.ps1` | Supprime la tâche planifiée |
| `ping.log` | Historique des pings (créé automatiquement) |

---

## ▶️ Installation (1 min)

1. Ouvre l'explorateur dans ce dossier `KeepAliveBot`.
2. **Clic droit** sur `install-task.ps1` → **Exécuter avec PowerShell**.
   - Si Windows bloque les scripts, ouvre un PowerShell ici et lance :
     ```powershell
     powershell -ExecutionPolicy Bypass -File install-task.ps1
     ```
3. Message vert `Tache 'HMA-KeepAlive' installee` → c'est bon. ✅

La tâche démarre **immédiatement**, puis se répète toutes les 10 min, et se
relance automatiquement à chaque ouverture de session Windows.

## ✅ Vérifier que ça marche

- Ouvre `ping.log` dans ce dossier → tu dois voir des lignes `OK HTTP 200`.
- Ou ouvre le **Planificateur de tâches** Windows → cherche la tâche **HMA-KeepAlive**.

## 🗑️ Désinstaller

**Clic droit** sur `uninstall-task.ps1` → **Exécuter avec PowerShell**.

---

## 🔧 Changer l'URL ou l'intervalle

- **URL** : modifie la variable `$Url` en haut de `ping-render.ps1`.
- **Intervalle** : modifie `-Minutes 10` dans `install-task.ps1`, puis relance
  `install-task.ps1` (il remplace l'ancienne tâche).

---

_Note : `ping.log` est ignoré par git (fichier local uniquement)._
