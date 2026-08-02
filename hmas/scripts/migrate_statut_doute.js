"use strict";
/**
 * Migration : nouveau statut de paiement "DOUTE".
 *
 * Cas d'usage : le locataire affirme avoir paye, mais le reglement n'est pas
 * encore confirme sur place. Le loyer reste donc a recouvrer, tout en etant
 * distingue d'un impaye franc.
 *
 * Idempotent. Usage : node scripts/migrate_statut_doute.js [local|prod]
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
      "SELECT COLUMN_TYPE t FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='paiement_loyer' AND COLUMN_NAME='statut'",
      [cfg.database]
    );
    const actuel = col.length ? col[0].t : "";
    if (actuel.includes("DOUTE")) {
      console.log("   = le statut DOUTE existe deja");
    } else {
      await q(
        conn,
        "ALTER TABLE paiement_loyer MODIFY statut ENUM('PAYE','PARTIEL','IMPAYE','DOUTE') NOT NULL DEFAULT 'IMPAYE'"
      );
      console.log("   + statut DOUTE ajoute a paiement_loyer");
    }

    // Le journal stocke le statut en texte libre : rien a modifier.
    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
})();
