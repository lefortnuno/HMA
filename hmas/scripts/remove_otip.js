"use strict";
/**
 * Retrait du module OTIP, une fois Iruno parti en France.
 *
 * Ce script fait la moitie base de donnees : il supprime les trois tables
 * `otip_*` et rien d'autre. Il affiche ensuite la liste exacte des fichiers
 * a effacer et des trois lignes a retirer, pour que le nettoyage du code se
 * fasse sans avoir a chercher.
 *
 * Par securite il ne fait rien sans confirmation explicite :
 *   node scripts/remove_otip.js prod --confirmer
 */
const mysql = require("mysql");
require("dotenv").config({ path: __dirname + "/../config/.env" });

const TARGETS = {
  local: {
    host: process.env.OFFLINE_DB_HOST,
    user: process.env.OFFLINE_DB_USER,
    password: process.env.OFFLINE_DB_MDP,
    database: process.env.OFFLINE_DB_NAME,
  },
  prod: {
    host: process.env.SUN_DB_HOST,
    user: process.env.SUN_DB_USER,
    password: process.env.SUN_DB_MDP,
    database: process.env.SUN_DB_NAME,
  },
};

const TABLES = ["otip_ligne", "otip_depense", "otip_param"];

const FICHIERS = [
  "hmas/utils/otip.js",
  "hmas/models/otip.model.js",
  "hmas/controllers/otip.controller.js",
  "hmas/routes/otip.route.js",
  "hmas/tests/otip.test.js",
  "hmas/scripts/migrate_otip.js",
  "hmas/scripts/migrate_otip_depart.js",
  "hmas/scripts/remove_otip.js",
  "hmac/src/pages/otip/  (tout le dossier)",
];

const LIGNES_A_RETIRER = [
  'hmas/index.js            : app.use("/api/otip", require("./routes/otip.route"));',
  'hmac/src/App.js          : la Route  path="/otip/"',
  "hmac/src/components/sidebar/sidebar.js : l'entree \"Budget OTIP\"",
];

const q = (conn, sql) =>
  new Promise((resolve, reject) =>
    conn.query(sql, (err, res) => (err ? reject(err) : resolve(res))),
  );

(async () => {
  const cible = (process.argv[2] || "prod").toLowerCase();
  const confirme = process.argv.includes("--confirmer");
  const cfg = TARGETS[cible];
  if (!cfg || !cfg.host) return console.log("Cible inconnue.");

  if (!confirme) {
    console.log(`\nCe script supprimera DEFINITIVEMENT sur [${cible}] :`);
    TABLES.forEach((t) => console.log("   - " + t));
    console.log("\nRelancer avec --confirmer pour executer :");
    console.log(`   node scripts/remove_otip.js ${cible} --confirmer\n`);
    return;
  }

  const conn = mysql.createConnection(cfg);
  console.log(`\n[${cible}] → ${cfg.user}@${cfg.host}/${cfg.database}`);
  try {
    for (const t of TABLES) {
      await q(conn, `DROP TABLE IF EXISTS \`${t}\``);
      console.log("   - " + t + " supprimee");
    }
    console.log("\nReste a faire cote code :");
    console.log("\n  Fichiers a effacer :");
    FICHIERS.forEach((f) => console.log("   rm  " + f));
    console.log("\n  Lignes a retirer (une par fichier) :");
    LIGNES_A_RETIRER.forEach((l) => console.log("   · " + l));
    console.log(`\n[${cible}] ✅ tables supprimees.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
})();
