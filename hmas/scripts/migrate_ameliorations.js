"use strict";
/**
 * Migration "ameliorations" :
 *  - locataire.caution (depot de garantie)
 *  - table occupation_histo (historique d'occupation des chambres)
 *  - depense_immo.bienId (si pas deja fait par migrate_bienId.js)
 * Idempotent.
 *
 * Usage : node scripts/migrate_ameliorations.js [local|prod|both]
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
  if (!cfg.host) {
    console.log(`\n[${name}] ⏭  ignore (config absente).`);
    return;
  }
  const conn = mysql.createConnection(cfg);
  const db = cfg.database;
  console.log(`\n[${name}] → ${cfg.user}@${cfg.host}/${db}`);
  try {
    if (!(await columnExists(conn, db, "locataire", "caution"))) {
      await q(conn, "ALTER TABLE locataire ADD COLUMN caution INT NOT NULL DEFAULT 0");
      console.log("   + locataire.caution ajoutee");
    } else console.log("   = locataire.caution existe deja");

    if (!(await columnExists(conn, db, "depense_immo", "bienId"))) {
      await q(conn, "ALTER TABLE depense_immo ADD COLUMN bienId INT NOT NULL DEFAULT 0");
      console.log("   + depense_immo.bienId ajoutee");
    } else console.log("   = depense_immo.bienId existe deja");

    await q(
      conn,
      `CREATE TABLE IF NOT EXISTS occupation_histo (
        id          INT(11)      NOT NULL AUTO_INCREMENT,
        locataireId INT(11)      DEFAULT NULL,
        nom         VARCHAR(100) DEFAULT NULL,
        prenom      VARCHAR(100) DEFAULT NULL,
        chambre     VARCHAR(10)  DEFAULT NULL,
        etage       VARCHAR(5)   DEFAULT NULL,
        bienId      INT(11)      NOT NULL DEFAULT 0,
        action      ENUM('ENTREE','MODIFICATION','SORTIE') NOT NULL,
        details     VARCHAR(255) DEFAULT NULL,
        dateAction  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );
    console.log("   + table occupation_histo prete");

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
