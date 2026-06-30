# 🟢 UptimeRobot — Garder le backend Render en vie 24/7

Ce dossier documente la configuration du **keep-alive** du backend HMA hébergé sur
Render (plan gratuit), via le service externe **UptimeRobot**.

---

## 🎯 Le problème

Sur le **plan gratuit Render**, un *Web Service* se met en **veille après 15 min
sans requête**. Le réveil (cold start) prend ensuite **30 à 60 secondes**, ce qui
donne l'impression que le site est lent ou cassé.

## 💡 La solution

UptimeRobot appelle l'URL de ton backend **toutes les 5 minutes** (gratuit).
Comme c'est < 15 min, le serveur **ne s'endort jamais**.
Bonus : tu reçois un **mail d'alerte** si le serveur tombe vraiment.

> Une route légère **`/ping`** a été ajoutée au backend (`hmas/index.js`).
> Elle répond instantanément `{"status":"ok"}` **sans toucher à la base MySQL**,
> donc chaque ping est ultra-léger.

---

## 🔗 URL à surveiller

```
https://hmaos.onrender.com/ping
```

Test rapide dans le navigateur → tu dois voir :
```json
{"status":"ok","uptime":123.45}
```

---

## ⚙️ Configuration pas-à-pas (≈ 3 min)

1. Va sur **https://uptimerobot.com** → **Sign Up** (gratuit, juste un email).
2. Confirme ton email puis connecte-toi.
3. Clique sur **+ New monitor** (ou **Add New Monitor**).
4. Remplis :
   | Champ | Valeur |
   |---|---|
   | **Monitor Type** | `HTTP(s)` |
   | **Friendly Name** | `HMA Backend Render` |
   | **URL (or IP)** | `https://hmaos.onrender.com/ping` |
   | **Monitoring Interval** | `5 minutes` |
5. (Optionnel) Dans **Alert Contacts**, coche ton email pour recevoir les alertes.
6. Clique sur **Create Monitor**. ✅

C'est tout. UptimeRobot va maintenant pinger ton backend toutes les 5 min,
en continu, gratuitement.

---

## ✅ Vérifier que ça marche

- Dans le dashboard UptimeRobot, le monitor doit passer **vert (Up)** au bout de
  quelques minutes.
- L'onglet du monitor affiche un **% d'uptime** et l'historique des réponses.
- Si le serveur est en plein cold start lors d'un ping, UptimeRobot réessaie ;
  une réponse `200` finit par arriver.

---

## ⚠️ À garder en tête

1. **Quota Render 750 h/mois** par compte gratuit, partagé entre tes *Web Services*.
   - 1 service tournant 24/7 ≈ **730 h** → ça rentre tout juste.
   - ➜ Vérifie que le **frontend `hmac` est déployé en _Static Site_** (qui ne
     consomme pas ce quota et ne dort jamais), et **pas** en *Web Service*.
2. **Plan gratuit UptimeRobot** : intervalle minimum **5 min**, jusqu'à 50 monitors.
   Largement suffisant ici (5 min < 15 min).
3. Si un jour tu changes l'URL Render, **mets à jour l'URL du monitor**.

---

## 🔁 Alternative / backup

Un workflow **GitHub Actions** (`.github/workflows/keep-alive.yml`) avait aussi été
préparé en option (ping toutes les 10 min depuis le repo). Tu peux :
- **soit le supprimer** si tu pars uniquement sur UptimeRobot,
- **soit le garder en redondance** (ceinture + bretelles) — les deux peuvent
  cohabiter sans problème.

---

_Dernière mise à jour : 2026-06-30_
