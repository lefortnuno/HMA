# 🚀 Déploiement & Sécurité — checklist

## ⚠️ URGENT — Variables d'environnement Render (backend)

Le fichier `hmas/config/.env` (mots de passe DB, secret JWT) **a été retiré du repo GitHub**
car il exposait tes secrets publiquement. Conséquence : **Render ne le verra plus**
au prochain déploiement. Tu DOIS définir ces variables dans Render **avant** que le
prochain deploy ne se termine, sinon le backend ne démarrera plus :

1. Va sur https://dashboard.render.com → ton service backend (`hmaos`)
2. Onglet **Environment** → **Add Environment Variable**, ajoute :

| Clé | Valeur |
|---|---|
| `TOKEN_SECRET` | une longue chaîne aléatoire (copie celle de ton `hmas/config/.env` local) |
| `SUN_DB_HOST` | `mysql-trofel.alwaysdata.net` |
| `SUN_DB_NAME` | `trofel_hma` |
| `SUN_DB_USER` | `trofel` |
| `SUN_DB_MDP` | ton mot de passe DB (⚠️ à changer sur alwaysdata, voir plus bas) |
| `xADMIN` | `1` |
| `xUSER` | `0` |
| `CORS_ORIGINS` | `https://TON-APP.vercel.app` (ton vrai domaine Vercel, séparé par des virgules si plusieurs) |

3. **Save Changes** → Render redéploie automatiquement.

> En local, le backend continue de lire `hmas/config/.env` (le fichier existe
> toujours sur ton PC, il n'est juste plus versionné). Modèle : `config/.env.example`.

## 🔑 Mots de passe à changer (fuites passées)

Ces secrets ont circulé (repo public / conversations) — change-les :

1. **Mot de passe MySQL alwaysdata** : admin.alwaysdata.com → Bases de données →
   change le mot de passe → mets à jour `SUN_DB_MDP` sur Render ET dans ton
   `hmas/config/.env` local.
2. **Mot de passe GitHub** + active la **2FA**.
3. **Mot de passe Gmail** + active la **2FA**.
4. Le `TOKEN_SECRET` a déjà été renouvelé (dans ton `.env` local) — reporte-le sur Render.

## 📸 Photos vitrine → Cloudinary (3 min, à faire toi-même)

**Problème** : les photos uploadées vont sur le disque de Render, qui est **effacé
à chaque redéploiement**. Tes photos disparaîtront.

**Solution gratuite** (25 Go) — je ne peux pas créer le compte à ta place
(vérification email + CAPTCHA), mais c'est rapide :

1. https://cloudinary.com → **Sign up free** (avec ton email).
2. Dashboard → note ton **Cloud name**.
3. Settings → **Upload** → **Upload presets** → **Add upload preset** :
   - Signing mode : **Unsigned**
   - note le nom du preset (ex: `hma_biens`)
4. Dis-moi ton **cloud name** + **preset**, et j'adapte l'upload du frontend
   pour envoyer les photos directement chez Cloudinary (les URLs renvoyées
   seront stockées en base comme aujourd'hui — aucune migration nécessaire).

## 💾 Sauvegarde mensuelle de la base

- Manuel : `cd hmas && npm run backup` → fichier dans `hmas/backups/`
- Automatique (Windows) : clic droit sur `hmas/scripts/install-backup-task.ps1`
  → *Exécuter avec PowerShell* → sauvegarde le 1er de chaque mois à 09h00.
- Rotation automatique : garde les 12 dernières sauvegardes.

## 🧪 Tests

```bash
cd hmas && npm test   # 15 tests sur les calculs JIRAMA/bénéfices/validations
```
