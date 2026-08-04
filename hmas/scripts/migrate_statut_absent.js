"use strict";
/**
 * Migration : statut JIRAMA "ABSENT".
 *
 * Un locataire qui n'a pas occupe sa chambre du mois ne doit rien au titre de
 * l'eau et de l'electricite. Ce n'est ni un paiement, ni un impaye : le
 * marquer "paye 0 Ar" inscrirait au registre un reglement qui n'a pas eu
 * lieu, et le laisser "impaye" le maintiendrait dans les relances.
 *
 * Le statut ne concerne QUE la JIRAMA : le loyer, lui, reste du meme en cas
 * d'absence, et son propre statut n'est pas touche.
 *
 * Idempotent. Usage : node scripts/migrate_statut_absent.js [local|prod]
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
    const [col] = await q(
      conn,
      "SELECT COLUMN_TYPE t FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='paiement_loyer' AND COLUMN_NAME='statutJIRAMA'",
      [cfg.database]
    );
    if (col && col.t.includes("ABSENT")) {
      console.log("   = le statut ABSENT existe deja");
    } else {
      await q(
        conn,
        "ALTER TABLE paiement_loyer MODIFY statutJIRAMA ENUM('PAYE','PARTIEL','IMPAYE','DOUTE','ABSENT') NOT NULL DEFAULT 'IMPAYE'"
      );
      console.log("   + statut ABSENT ajoute a statutJIRAMA");
    }

    // Le statut du loyer n'est volontairement pas touche : une absence ne
    // dispense pas du loyer.
    const rep = await q(
      conn,
      "SELECT statutJIRAMA, COUNT(*) nb FROM paiement_loyer GROUP BY statutJIRAMA"
    );
    rep.forEach((r) => console.log(`   · ${r.statutJIRAMA} : ${r.nb} ligne(s)`));

    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
})();
