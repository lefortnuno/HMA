"use strict";
/**
 * Migration : autorise "SUPPRESSION" dans le journal des paiements.
 *
 * Jusqu'ici un paiement mal saisi (mauvais locataire, mauvais mois) ne
 * pouvait pas etre retire : seuls AJOUT et MODIFICATION existaient dans
 * l'enum de paiement_histo. La suppression doit rester tracee comme le
 * reste — sinon un montant qui disparait du tableau devient impossible a
 * expliquer a posteriori.
 *
 * Idempotent.
 * Usage : node scripts/migrate_paiement_suppression.js [local|prod]
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
    conn.query(sql, params, (err, res) => (err ? reject(err) : resolve(res))),
  );

(async () => {
  const cible = (process.argv[2] || "prod").toLowerCase();
  const cfg = TARGETS[cible];
  if (!cfg || !cfg.host) return console.log("Cible inconnue.");
  const conn = mysql.createConnection({ ...cfg, connectTimeout: 20000 });
  console.log(`\n[${cible}] → ${cfg.user}@${cfg.host}/${cfg.database}`);
  try {
    const col = await q(
      conn,
      `SELECT COLUMN_TYPE t FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA=? AND TABLE_NAME='paiement_histo' AND COLUMN_NAME='action'`,
      [cfg.database],
    );
    if (col[0] && col[0].t.includes("SUPPRESSION")) {
      console.log("   = paiement_histo.action contient déjà SUPPRESSION");
    } else {
      await q(
        conn,
        "ALTER TABLE paiement_histo MODIFY action ENUM('AJOUT','MODIFICATION','SUPPRESSION') NOT NULL",
      );
      console.log("   + SUPPRESSION ajoutée à paiement_histo.action");
    }
    console.log(`[${cible}] ✅ migration terminée.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
})();
