const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config({ path: "./config/.env" });

const utilisateurRoute = require("./routes/utilisateur.route");
const serviceRoute = require("./routes/service.route");
const histoRoute = require("./routes/histo.route");
const boutiqueRoute = require("./routes/boutique.route");
const loyerRoute   = require("./routes/loyer.route");
const vitrineRoute = require("./routes/vitrine.route");
const financeRoute = require("./routes/finance.route");

const app = express();
// Inutile d'annoncer la pile technique a qui interroge le serveur.
app.disable("x-powered-by");

// Durcissement des reponses de l'API.
app.use((req, res, next) => {
  res.header("X-Content-Type-Options", "nosniff");
  res.header("Referrer-Policy", "no-referrer");
  // L'API ne renvoie que du JSON : rien qui ait vocation a etre encadre.
  res.header("X-Frame-Options", "DENY");
  next();
});

// Limite relevee : les photos de profil transitent en data URL base64.
app.use(bodyParser.urlencoded({ extended: true, limit: "2mb" }));
app.use(bodyParser.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// CORS restreint aux origines connues. CORS_ORIGINS (valeurs separees par des
// virgules) permet d'en ajouter sans toucher au code ; en son absence on
// retient cette liste plutot que "*", pour ne pas dependre d'une variable
// d'environnement oubliee sur le serveur.
//
// A noter : le CORS n'est applique QUE par les navigateurs. Les appels
// serveur-a-serveur (le bot de keep-alive, un cron, curl) ne sont pas
// concernes et continuent de fonctionner sans en-tete Origin.
const ORIGINES_PAR_DEFAUT = [
  "https://e-hma.vercel.app",
  "http://localhost:1103",
  "http://localhost:3000",
];
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
if (allowedOrigins.length === 0) allowedOrigins.push(...ORIGINES_PAR_DEFAUT);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Route de "keep-alive" : reponse instantanee, aucune requete DB.
// Utilisee par le cron GitHub Actions pour empecher Render de s'endormir.
app.get("/ping", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/utilisateur", utilisateurRoute);
app.use("/api/service", serviceRoute);
app.use("/api/histo", histoRoute);
app.use("/api/boutique", boutiqueRoute);
app.use("/api/loyer", loyerRoute);
app.use("/api/vitrine", vitrineRoute);
app.use("/api/finance", financeRoute);
// MODULE TEMPORAIRE — budget OTIP, a retirer avec scripts/remove_otip.js
app.use("/api/otip", require("./routes/otip.route"));

const PORT = process.env.PORT || 5103;
app.listen(PORT, () => {
  const { ADMIN, USER } = require("./middlewares/roles");
  console.log(`Lancé sur le port ${PORT} ....`);
  // Trace utile : un role mal configure bloque silencieusement l'admin.
  console.log(`Roles -> ADMIN=${ADMIN} | USER=${USER}`);
  console.log(
    `CORS -> ${allowedOrigins.length ? allowedOrigins.join(", ") : "toutes origines (CORS_ORIGINS non definie)"}`
  );
});
