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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
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

app.listen(process.env.PORT || process.env.IP_HOST, () => {
  console.log(`Lancé sur ${process.env.IP_HOST}:${process.env.PORT} .... `);
});
