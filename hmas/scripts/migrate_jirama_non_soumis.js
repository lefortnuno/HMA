"use strict";
/**
 * Migration : locataire non soumis a la JIRAMA.
 *
 * Convenu des le depart avec Derick, Lanja et Maeva : leur bail ne comprend
 * pas l'eau et l'electricite. Ce n'est pas une absence ponctuelle (colonne
 * `exempt` d'un mois donne) mais une regle permanente de leur contrat.
 *
 * A ne pas confondre non plus avec un forfait a 0 : un forfait absent
 * signifie  facture au releve du compteur , pas  ne paie rien .
 *
 * Idempotent. Usage : node scripts/migrate_jirama_non_soumis.js [local|prod]
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

// Locataires hors JIRAMA, designes par leur chambre (bien 0 = VILLA KINYA).
const HORS_JIRAMA = [
  { chambre: "7", etage: "RDC" },  // Derick
  { chambre: "V", etage: "1ER" },  // Lanja
  { chambre: "VI", etage: "1ER" }, // Maeva
];

const q = (conn, sql, params) =>
  new Promise((resolve, reject) =>
    conn.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)))
  );

(async () => {
  const cible = (process.argv[2] || "prod").toLowerCase();
  const cfg = TARGETS[cible];
  if (!cfg || !cfg.host) return console.log("Cible inconnue.");
  const conn = mysql.createConnection(cfg);
  console.log(`\n[${cible}] → ${cfg.user}@${cfg.host}/${cfg.database}`);
  try {
    const col = await q(
      conn,
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='locataire' AND COLUMN_NAME='jiramaNonSoumis'",
      [cfg.database]
    );
    if (col.length) {
      console.log("   = colonne jiramaNonSoumis deja presente");
    } else {
      await q(
        conn,
        "ALTER TABLE locataire ADD COLUMN jiramaNonSoumis TINYINT(1) NOT NULL DEFAULT 0 AFTER jiramaForfait"
      );
      console.log("   + colonne jiramaNonSoumis ajoutee");
    }

    for (const l of HORS_JIRAMA) {
      const res = await q(
        conn,
        "UPDATE locataire SET jiramaNonSoumis = 1 WHERE chambre = ? AND etage = ? AND actif = 1 AND jiramaNonSoumis = 0",
        [l.chambre, l.etage]
      );
      const [loc] = await q(
        conn,
        "SELECT nom FROM locataire WHERE chambre = ? AND etage = ? AND actif = 1",
        [l.chambre, l.etage]
      );
      console.log(
        res.affectedRows
          ? `   + ${loc ? loc.nom : "?"} (ch. ${l.chambre}) → hors JIRAMA`
          : `   = ${loc ? loc.nom : "ch. " + l.chambre} deja hors JIRAMA (ou introuvable)`
      );
    }

    const total = await q(
      conn,
      "SELECT nom, chambre FROM locataire WHERE jiramaNonSoumis = 1 AND actif = 1 ORDER BY id"
    );
    console.log(`   · ${total.length} locataire(s) hors JIRAMA :`);
    total.forEach((t) => console.log(`     - ${t.nom} (ch. ${t.chambre})`));

    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
})();
