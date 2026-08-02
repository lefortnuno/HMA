"use strict";
/**
 * Migration : identifiant de conversation Messenger d'un locataire.
 * Permet d'ouvrir directement sa discussion plutot qu'une recherche Facebook.
 * Idempotent. Usage : node scripts/migrate_messenger.js [local|prod]
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

const q = (conn, sql) =>
  new Promise((resolve, reject) =>
    conn.query(sql, (err, res) => (err ? reject(err) : resolve(res)))
  );

(async () => {
  const cible = (process.argv[2] || "prod").toLowerCase();
  const cfg = TARGETS[cible];
  if (!cfg || !cfg.host) return console.log("Cible inconnue.");
  const conn = mysql.createConnection(cfg);
  console.log(`\n[${cible}] → ${cfg.user}@${cfg.host}/${cfg.database}`);
  try {
    const existe = await q(
      conn,
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA='${cfg.database}' AND TABLE_NAME='locataire' AND COLUMN_NAME='messengerId'`
    );
    if (existe.length === 0) {
      await q(conn, "ALTER TABLE locataire ADD COLUMN messengerId VARCHAR(60) DEFAULT NULL");
      console.log("   + locataire.messengerId ajoutee");
    } else console.log("   = locataire.messengerId existe deja");
    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
})();
