"use strict";
/**
 * Migration : locataire non concerne par la JIRAMA d'un mois.
 *
 * Cas reel : Canddis n'a pas occupe sa chambre en juillet. Elle ne doit rien
 * au titre de l'eau et de l'electricite — ce qui n'est ni  paye  ni  impaye .
 * La marquer  paye 0 Ar  reviendrait a ecrire dans le registre un reglement
 * qui n'a pas eu lieu ; la laisser  impayee  la ferait figurer dans les
 * rappels. D'ou un drapeau distinct, qui neutralise aussi le forfait mensuel.
 *
 * Idempotent. Usage : node scripts/migrate_jirama_exempt.js [local|prod]
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
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='consommation_locataire' AND COLUMN_NAME='exempt'",
      [cfg.database]
    );
    if (col.length) {
      console.log("   = colonne exempt deja presente");
    } else {
      await q(
        conn,
        "ALTER TABLE consommation_locataire ADD COLUMN exempt TINYINT(1) NOT NULL DEFAULT 0 AFTER montantJIRAMA"
      );
      console.log("   + colonne exempt ajoutee");
    }

    const rep = await q(
      conn,
      "SELECT exempt, COUNT(*) nb FROM consommation_locataire GROUP BY exempt"
    );
    rep.forEach((r) =>
      console.log(`   · ${r.exempt ? "non concernes" : "concernes"} : ${r.nb} ligne(s)`)
    );

    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
})();
