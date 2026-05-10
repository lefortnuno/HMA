# pre-requis

active skip dangerious permission

# CONTEXT

garde le system d'auth dans ce projet (que ce soit le backend ou le design dans le frontend) et change tt le reste, ameliorer le desgin pour uq'elle soit plus professionnelle et reponsive(autre de l'auth).
jeux veux 2 grand choses dans ce repo.

## format de gestion de loyer

cree un gestion de loyer avec les facture d'eau&Electricite(JIRAMA), loyer des rez de chausse (1-10) = 150.000Ar et les 1er etage (I-X)=200.000Ar. et le jirama des locataire payent en fonction de ce que chq'un consomme(watt fois prix unitaire). 
je gere mes locataire sur un tableau a double entree comme dans l'excel gestion_loyer.xlsx et je veux garde le meme format. mais creer un autre fonctionnalite qui va calculer mes benef de chq mois en cours donc je vais y entree mes depense aussi.

## vitrine

Cree moi un site comme dans le liens suivant :
https://chic-immo.com/property/villa-neuve-f5-a-ambohimangakely/

le site creer sera un page ou je vais publier mes chambres dispo et mes villa.
pour le site vitrine pas besoin d'authtification.

### note 

---

# PROPOSITIONS D'ARCHITECTURE
 

## Stack technique actuelle

- **Frontend** : React 18 + React Router 6 + Bootstrap 5 + Axios + React-Toastify + React-Icons
- **Backend** : API REST externe sur `hmaos.onrender.com` (Node.js/Express, hors ce repo) mais on va utiliser celui en interne pd'abord et on va changer quand je vais uploder le projet
- **Auth** : SignInProtection / LogOutProtection (a conserver tel quel)

## Packages npm a ajouter

| Package | Usage |
|---|---|
| `recharts` | Graphiques benefices mensuels |
| `xlsx` | Export Excel gestion loyer |
| `swiper` | Galerie photos vitrine |

---

## MODULE 1 — Gestion de Loyer (protege, auth requise)

### Routes frontend

| Route | Page |
|---|---|
| `/loyer/` | Tableau principal double entree (locataires x mois) |
| `/loyer/locataires/` | Liste des locataires |
| `/loyer/locataires/new` | Ajouter un locataire |
| `/loyer/locataires/:id` | Detail / editer un locataire |
| `/loyer/factures/` | Saisie facture JIRAMA du mois (prix unitaire + conso par locataire) |
| `/loyer/depenses/` | Saisie des depenses mensuelles |
| `/loyer/benefices/` | Dashboard benefices du mois en cours |

### Modeles de donnees (API backend)

**Locataire**
```
id, nom, prenom, chambre (ex: "3" ou "IV"), etage (RDC | 1ER),
loyer (150000 | 200000), tel, email, dateEntree, actif
```

**FactureJIRAMA** 
```
id, mois, annee, prixUnitaire (Ar/kWh), dateFacture, montantTotal
```

**ConsommationLocataire**
```
id, locataireId, factureJIRAMAId, consommation (kWh),
montantJIRAMA (= consommation x prixUnitaire)
```

**PaiementLoyer**
```
id, locataireId, mois, annee,
montantLoyer, montantJIRAMA, montantTotal,
statut (PAYE | PARTIEL | IMPAYE), datePaiement
```

**Depense**
```
id, description, montant, mois, annee, categorie (reparation | charge | autre)
```

### Logique metier

- Loyer RDC (chambres 1–10) : **150 000 Ar fixe/mois**
- Loyer 1er etage (chambres I–X) : **200 000 Ar fixe/mois**
- Facture JIRAMA individuelle : `consommation (kWh) × prixUnitaire`
- Benefice mensuel : `Σ loyers percus + Σ JIRAMA percus − Σ depenses`
- IL faut verifier si la montant a payer a JIRAMA est egale a la somme de jirama payer par les locataires et ce par mois.(car la companie envoie une certaine somme a payer)

### UI tableau double entree

- **Lignes** : locataires (N° chambre + nom)
- **Colonnes** : mois (Jan–Dec) + colonne Total
- **Cellule** : loyer + JIRAMA — colorisee selon statut (vert=paye, rouge=impaye, orange=partiel)
- **Export** : bouton Excel (meme format que gestion_loyer.xlsx)
- Filtres : annee, etage (RDC/1ER), statut paiement

### Endpoints API a creer (backend)

```
GET    /api/loyer/locataires
POST   /api/loyer/locataires
PUT    /api/loyer/locataires/:id
DELETE /api/loyer/locataires/:id

GET    /api/loyer/factures?mois=&annee=
POST   /api/loyer/factures
PUT    /api/loyer/factures/:id

GET    /api/loyer/consommations?factureId=
POST   /api/loyer/consommations (batch: tableau de {locataireId, consommation})

GET    /api/loyer/paiements?mois=&annee=
POST   /api/loyer/paiements
PUT    /api/loyer/paiements/:id

GET    /api/loyer/depenses?mois=&annee=
POST   /api/loyer/depenses
PUT    /api/loyer/depenses/:id
DELETE /api/loyer/depenses/:id

GET    /api/loyer/benefices?mois=&annee=   (calcul agrege)
```

---

## MODULE 2 — Site Vitrine (public, sans auth)

### Routes frontend

**Pages publiques**

| Route | Page |
|---|---|
| `/vitrine/` | Accueil — liste des biens avec filtres |
| `/vitrine/bien/:id` | Detail d'un bien (galerie, description, prix, contact) |

**Pages admin (protegees)**

| Route | Page |
|---|---|
| `/vitrine/admin/` | Liste de tous les biens (dashboard admin) |
| `/vitrine/admin/new` | Ajouter un bien |
| `/vitrine/admin/edit/:id` | Modifier un bien |

### Modele de donnees

**Bien**
```
id, type (CHAMBRE | VILLA), titre, description,
prix (Ar/mois), surface (m²), photos[] (URLs),
localisation, disponible (bool),
nbPieces, nbChambres,
caracteristiques[] (parking, jardin, securite, meuble, eau, electricite...)
```

### UI Vitrine (inspire chic-immo.com)

- Header avec logo + slogan + bouton contact
- **Cards** des biens : photo principale, titre, prix, surface, badge Disponible/Indisponible
- **Filtres** : type (chambre/villa), prix min/max, disponibilite
- **Page detail** : galerie swiper, description complete, tableau caracteristiques, prix, bouton WhatsApp/contact
- Design : couleurs neutres/pro (blanc, gris, or), police moderne
- **100% responsive** (mobile-first, Bootstrap grid)
- Pas de login pour les visiteurs

### Endpoints API a creer (backend)

```
GET    /api/vitrine/biens?type=&disponible=&prixMin=&prixMax=
GET    /api/vitrine/biens/:id
POST   /api/vitrine/biens          (admin, protege)
PUT    /api/vitrine/biens/:id      (admin, protege)
DELETE /api/vitrine/biens/:id      (admin, protege)
POST   /api/vitrine/biens/:id/photos  (upload photos, admin)
```

---

## ORDRE D'IMPLEMENTATION PROPOSE

1. **Refonte design global** (header, sidebar, theme) — base pour tout le reste
2. **Module Gestion Loyer** — locataires → factures JIRAMA → tableau paiements → benefices
3. **Module Vitrine** — pages publiques → admin biens → galerie photos

> Attendre validation avant de commencer chaque etape. JE VALIDE
