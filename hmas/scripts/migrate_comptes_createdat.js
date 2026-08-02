"use strict";
/**
 * Migration : date de creation des comptes (colonne createdAt).
 * Les comptes existants sans date prennent la date du jour.
 * Idempotent. Usage : node scripts/migrate_comptes_createdat.js [local|prod]
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

async function migrateOne(name, cfg) {
  if (!cfg.host) return console.log(`\n[${name}] ⏭  ignore.`);
  const conn = mysql.createConnection(cfg);
  const db = cfg.database;
  console.log(`\n[${name}] → ${cfg.user}@${cfg.host}/${db}`);
  try {
    const existe = await q(
      conn,
      "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?",
      [db, "mpampiasa", "createdAt"]
    );
    if (existe.length === 0) {
      await q(
        conn,
        "ALTER TABLE mpampiasa ADD COLUMN createdAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP"
      );
      console.log("   + mpampiasa.createdAt ajoutee");
    } else console.log("   = mpampiasa.createdAt existe deja");

    const r = await q(conn, "UPDATE mpampiasa SET createdAt = NOW() WHERE createdAt IS NULL");
    console.log(`   ${r.affectedRows} compte(s) date(s) a aujourd'hui`);
    console.log(`[${name}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${name}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
}

(async () => {
  const cible = (process.argv[2] || "prod").toLowerCase();
  await migrateOne(cible, TARGETS[cible]);
  console.log("\nTermine.");
})();
