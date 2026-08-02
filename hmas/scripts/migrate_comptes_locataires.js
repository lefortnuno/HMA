"use strict";
/**
 * Migration : comptes de connexion pour les locataires.
 *  - mpampiasa.locataireId    : lie un compte a une fiche locataire
 *  - mpampiasa.mdpTemporaire  : 1 = mot de passe par defaut, a changer a la 1re connexion
 * Idempotent. Usage : node scripts/migrate_comptes_locataires.js [local|prod|both]
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
    if (!(await columnExists(conn, db, "mpampiasa", "locataireId"))) {
      await q(conn, "ALTER TABLE mpampiasa ADD COLUMN locataireId INT DEFAULT NULL");
      console.log("   + mpampiasa.locataireId ajoutee");
    } else console.log("   = mpampiasa.locataireId existe deja");

    if (!(await columnExists(conn, db, "mpampiasa", "mdpTemporaire"))) {
      await q(conn, "ALTER TABLE mpampiasa ADD COLUMN mdpTemporaire TINYINT(1) NOT NULL DEFAULT 0");
      console.log("   + mpampiasa.mdpTemporaire ajoutee");
    } else console.log("   = mpampiasa.mdpTemporaire existe deja");

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
