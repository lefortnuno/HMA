# Contexte du projet — HMA

## Vue d'ensemble

**HMA** est une application web full-stack de gestion immobilière développée pour TROFEL.
Le repo contient deux modules principaux à construire par-dessus un système d'authentification existant (à conserver tel quel) :

1. **Gestion de loyer** — tableau Excel-like + suivi JIRAMA + dépenses + bénéfices
2. **Site vitrine** public — publication de chambres et villas (style chic-immo.com)

> Repo local : `C:\Users\AC2I\Desktop\TROFEL\HMA`
> Branch git : `main` (clean)
> API distante (future) : `hmaos.onrender.com` — pour l'instant on travaille en local.

---

## Structure du repo

```
HMA/
├── CLAUDE.md                  ← cahier des charges complet (source de vérité)
├── README.md
├── gestion loyer.xlsx         ← format de référence pour le tableau loyer
├── power.bat
├── hmac/                      ← FRONTEND React
│   ├── package.json
│   ├── public/
│   ├── build/
│   └── src/
│       ├── App.js             ← routes (auth + loyer + vitrine déjà câblées)
│       ├── index.js
│       ├── assets/{images,styles}/
│       ├── components/        ← filters, footer, loading, modals, pagination, template
│       ├── contexts/
│       │   ├── api/udata.js
│       │   └── ptotections/   ← SignInProtection / LogOutProtection
│       └── pages/
│           ├── login/, signin/, 404/
│           ├── home/, about/
│           ├── users/, services/, boutiques/
│           ├── inComing/, outGoing/
│           ├── loyer/         ← module gestion de loyer
│           └── vitrine/       ← site vitrine
└── hmas/                      ← BACKEND Node.js / Express
    ├── package.json
    ├── index.js               ← bootstrap Express + montage des routes
    ├── config/
    │   ├── db.js              ← connexion MySQL
    │   └── hma.sql            ← schéma BDD complet
    ├── controllers/           ← utilisateur, service, histo, boutique, loyer, vitrine
    ├── models/                ← utilisateur, service, histo, boutique, locataire,
    │                            facture, paiement, depense, bien
    ├── routes/                ← idem controllers
    └── middlewares/           ← admin, auth, user
```

---

## Stack technique

### Frontend (`hmac/`)
- React 18 + React Router 6
- Bootstrap 5 + React-Bootstrap + Reactstrap
- Axios (HTTP)
- React-Toastify (notifications)
- React-Icons
- À ajouter : `recharts` (graphes bénéfices), `xlsx` (export Excel), `swiper` (galerie vitrine)

### Backend (`hmas/`)
- Node.js + Express 4
- MySQL (`mysql` driver)
- bcrypt + jsonwebtoken (auth)
- nodemon (dev)
- `dotenv` — config dans `hmas/config/.env`

### Base de données
- MySQL — base `hma`
- Schéma complet dans `hmas/config/hma.sql`

---

## Système d'authentification (à PRÉSERVER)

- **Backend** : table `mpampiasa` (utilisateurs) avec champ `karazana` (0 = USAGER, 1 = ADMIN)
  - Mots de passe bcrypt
  - Middlewares : `auth.middleware.js`, `admin.middleware.js`, `user.middleware.js`
- **Frontend** : composants `SignInProtection` (route protégée) et `LogOutProtection` (route auth-only)
  - Pages : `/login`, `/signin`
- **Comptes par défaut seedés** dans `hma.sql` (LEFORT admin, TROFEL usager)

> **Règle absolue** : ne pas toucher à la logique d'auth ni au design des pages login/signin.

---

## Module 1 — Gestion de loyer (protégé)

### Règles métier
- **Loyer RDC** (chambres `1`–`10`) → **150 000 Ar / mois** fixe
- **Loyer 1er étage** (chambres `I`–`X`) → **200 000 Ar / mois** fixe
- **JIRAMA** (eau & électricité) facturé par locataire = `consommation (kWh) × prixUnitaire`
- **Bénéfice mensuel** = `Σ loyers perçus + Σ JIRAMA perçus − Σ dépenses`
- **Vérification** : la somme des JIRAMA payée par les locataires doit être égale au montant total facturé par la compagnie pour le mois

### Routes frontend (déjà câblées dans `App.js`)
| Route | Page |
|---|---|
| `/loyer/` | Tableau principal double entrée (locataires × mois) |
| `/loyer/locataires/` | Liste des locataires |
| `/loyer/locataires/new` | Ajout locataire |
| `/loyer/locataires/edit/:id` | Édition locataire |
| `/loyer/factures/` | Saisie facture JIRAMA mensuelle |
| `/loyer/depenses/` | Saisie dépenses |
| `/loyer/benefices/` | Dashboard bénéfices |

### Tables BDD
- `locataire` (id, nom, prenom, chambre, etage `RDC`/`1ER`, loyer, tel, email, dateEntree, actif)
- `facture_jirama` (id, mois, annee, prixUnitaire, montantTotal, dateFacture) — UNIQUE(mois, annee)
- `consommation_locataire` (id, locataireId, factureId, indexPrev, indexCurr, consommation, montantJIRAMA)
- `paiement_loyer` (id, locataireId, mois, annee, montantLoyer, montantJIRAMA, statut `PAYE`/`PARTIEL`/`IMPAYE`, datePaiement)
- `depense_immo` (id, description, montant, mois, annee, categorie, date)

### UI tableau double entrée
- Lignes = locataires (n° chambre + nom)
- Colonnes = mois (Jan–Déc) + Total
- Cellules colorées selon statut (vert/orange/rouge)
- Filtres : année, étage, statut
- Bouton **Export Excel** au format `gestion_loyer.xlsx`

### Endpoints API (montés sous `/api/loyer`)
```
GET|POST|PUT|DELETE  /api/loyer/locataires[/:id]
GET|POST|PUT         /api/loyer/factures[/:id]?mois=&annee=
GET|POST             /api/loyer/consommations?factureId=
GET|POST|PUT         /api/loyer/paiements[/:id]?mois=&annee=
GET|POST|PUT|DELETE  /api/loyer/depenses[/:id]?mois=&annee=
GET                  /api/loyer/benefices?mois=&annee=
```

---

## Module 2 — Site vitrine (public, sans auth)

### Routes frontend
**Pages publiques**
| Route | Page |
|---|---|
| `/vitrine/` | Accueil — liste des biens + filtres |
| `/vitrine/bien/:id` | Détail d'un bien |

**Pages admin (protégées)**
| Route | Page |
|---|---|
| `/vitrine/admin/` | Dashboard admin biens |
| `/vitrine/admin/new` | Ajout bien |
| `/vitrine/admin/edit/:id` | Édition bien |

### Table BDD
- `bien_immo` (id, type `CHAMBRE`/`VILLA`, titre, description, prix, surface, localisation, disponible, nbChambres, nbPieces, photos, caracteristiques, createdAt)

### UI vitrine (inspiration : chic-immo.com)
- Header avec logo + slogan + bouton contact
- Cards : photo principale, titre, prix, surface, badge dispo/indispo
- Filtres : type, prix min/max, disponibilité
- Page détail : galerie Swiper, description, tableau caractéristiques, bouton WhatsApp/contact
- Design : neutre/pro (blanc, gris, or), 100 % responsive (mobile-first)

### Endpoints API (montés sous `/api/vitrine`)
```
GET     /api/vitrine/biens?type=&disponible=&prixMin=&prixMax=
GET     /api/vitrine/biens/:id
POST    /api/vitrine/biens                (admin)
PUT     /api/vitrine/biens/:id            (admin)
DELETE  /api/vitrine/biens/:id            (admin)
POST    /api/vitrine/biens/:id/photos     (admin)
```

---

## État d'avancement actuel

- Auth backend + frontend : **OK** (à préserver)
- Schéma SQL des deux modules : **créé** (`hmas/config/hma.sql`)
- Modèles backend (locataire, facture, paiement, depense, bien) : **fichiers présents**
- Controllers + routes loyer & vitrine : **fichiers présents**
- Routes frontend `App.js` loyer + vitrine : **câblées**
- Pages frontend loyer (`loyer/`, `locataires/...`, `factures/`, `depenses/`, `benefices/`) : **fichiers présents**
- Pages frontend vitrine (`vitrine/`, `bien/:id`, `admin/...`) : **fichiers présents**
- Refonte design global (header, sidebar, thème pro/responsive) : **à faire**
- Packages npm `recharts`, `xlsx`, `swiper` : **à installer**

---

## Ordre d'implémentation validé

1. **Refonte design global** (header, sidebar, thème) — base commune
2. **Module Gestion Loyer** — locataires → factures JIRAMA → tableau paiements → bénéfices
3. **Module Vitrine** — pages publiques → admin biens → galerie photos

> Validation utilisateur attendue avant de démarrer chaque étape.

---

## Conventions et préférences

- Langue de travail : **français**
- Préfixe routes API : `/api/<module>`
- Préfixe routes frontend : `/<module>/...`
- Authentification : préserver `SignInProtection` / `LogOutProtection`
- Format Excel cible : identique à `gestion loyer.xlsx`
- Pas d'authentification pour les visiteurs de la vitrine
- Bascule API distante (`hmaos.onrender.com`) **après** finalisation locale
