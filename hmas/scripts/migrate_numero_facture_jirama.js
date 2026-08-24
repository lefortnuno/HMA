"use strict";
/**
 * Migration : numéro de facture JIRAMA, par mois.
 *
 * Le site de la compagnie (jirama.mg) permet de vérifier une facture à
 * partir de son numéro. Jusqu'ici rien ne le conservait : on le note donc
 * sur la ligne mensuelle, à côté du prix unitaire et du montant reçu.
 *
 * Idempotent.
 * Usage : node scripts/migrate_numero_facture_jirama.js [local|prod]
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
      `SELECT COUNT(*) n FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA=? AND TABLE_NAME='facture_jirama' AND COLUMN_NAME='numeroFacture'`,
      [cfg.database],
    );
    if (col[0].n) {
      console.log("   = facture_jirama.numeroFacture déjà présente");
    } else {
      await q(
        conn,
        "ALTER TABLE facture_jirama ADD COLUMN numeroFacture VARCHAR(40) DEFAULT NULL",
      );
      console.log("   + facture_jirama.numeroFacture");
    }
    console.log(`[${cible}] ✅ migration terminée.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
})();
