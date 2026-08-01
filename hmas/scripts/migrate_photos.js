"use strict";
/**
 * Migration : colonne `photo` sur mpampiasa (comptes) et locataire.
 * La photo est stockee en data URL base64 (MEDIUMTEXT) plutot que sur le
 * disque de Render, qui est efface a chaque redeploiement.
 * Idempotent. Usage : node scripts/migrate_photos.js [local|prod|both]
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

async function columnExists(conn, db, table, column) {
  const r = await q(
    conn,
    "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?",
    [db, table, column]
  );
  return r.length > 0;
}

async function migrateOne(name, cfg) {
  if (!cfg.host) return console.log(`\n[${name}] ⏭  ignore.`);
  const conn = mysql.createConnection(cfg);
  const db = cfg.database;
  console.log(`\n[${name}] → ${cfg.user}@${cfg.host}/${db}`);
  try {
    for (const table of ["mpampiasa", "locataire"]) {
      if (!(await columnExists(conn, db, table, "photo"))) {
        await q(conn, `ALTER TABLE ${table} ADD COLUMN photo MEDIUMTEXT DEFAULT NULL`);
        console.log(`   + ${table}.photo ajoutee`);
      } else console.log(`   = ${table}.photo existe deja`);
    }
    console.log(`[${name}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${name}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
}

(async () => {
  const arg = (process.argv[2] || "both").toLowerCase();
  const names = arg === "both" ? ["local", "prod"] : [arg];
  for (const n of names) await migrateOne(n, TARGETS[n]);
  console.log("\nTermine.");
})();
