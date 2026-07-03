"use strict";
/**
 * Migration multi-appartement.
 * Ajoute la colonne `bienId` (0 = VILLA KINYA par defaut) a `locataire`
 * et `facture_jirama`, et fait passer la cle unique JIRAMA a (mois,annee,bienId).
 *
 * Idempotent : verifie l'existence avant chaque changement.
 *
 * Usage : node scripts/migrate_bienId.js [local|prod|both]
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

async function indexExists(conn, db, table, index) {
  const r = await q(
    conn,
    "SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND INDEX_NAME=?",
    [db, table, index]
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
    await q(conn, "SELECT 1");

    // 1) locataire.bienId
    if (!(await columnExists(conn, db, "locataire", "bienId"))) {
      await q(conn, "ALTER TABLE locataire ADD COLUMN bienId INT NOT NULL DEFAULT 0");
      console.log("   + locataire.bienId ajoutee (defaut 0 = VILLA KINYA)");
    } else console.log("   = locataire.bienId existe deja");

    // 2) facture_jirama.bienId
    if (!(await columnExists(conn, db, "facture_jirama", "bienId"))) {
      await q(conn, "ALTER TABLE facture_jirama ADD COLUMN bienId INT NOT NULL DEFAULT 0");
      console.log("   + facture_jirama.bienId ajoutee");
    } else console.log("   = facture_jirama.bienId existe deja");

    // 3) Cle unique JIRAMA : (mois,annee) -> (mois,annee,bienId)
    if (await indexExists(conn, db, "facture_jirama", "unique_mois_annee")) {
      await q(conn, "ALTER TABLE facture_jirama DROP INDEX unique_mois_annee");
      console.log("   - ancienne cle unique (mois,annee) supprimee");
    }
    if (!(await indexExists(conn, db, "facture_jirama", "unique_mois_annee_bien"))) {
      await q(
        conn,
        "ALTER TABLE facture_jirama ADD UNIQUE KEY unique_mois_annee_bien (mois, annee, bienId)"
      );
      console.log("   + nouvelle cle unique (mois,annee,bienId) creee");
    } else console.log("   = cle unique (mois,annee,bienId) existe deja");

    // 4) Backfill de securite
    await q(conn, "UPDATE locataire SET bienId = 0 WHERE bienId IS NULL");
    await q(conn, "UPDATE facture_jirama SET bienId = 0 WHERE bienId IS NULL");

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
