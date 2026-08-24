"use strict";
/**
 * Migration : table de vérification des documents (reçus & contrats de
 * bail) générés par l'app.
 *
 * Chaque PDF généré côté client embarque un QR code pointant vers
 * /verification/<code> sur le site. Cette table est la source de vérité
 * consultée par cette page publique : sans elle, n'importe qui pourrait
 * fabriquer un faux QR "valide".
 *
 * Idempotent.
 * Usage : node scripts/migrate_document_verification.js [local|prod]
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
    const tbl = await q(
      conn,
      `SELECT COUNT(*) n FROM information_schema.TABLES
       WHERE TABLE_SCHEMA=? AND TABLE_NAME='document_verification'`,
      [cfg.database],
    );
    if (tbl[0].n) {
      console.log("   = document_verification déjà présente");
    } else {
      await q(
        conn,
        `CREATE TABLE document_verification (
          id INT AUTO_INCREMENT PRIMARY KEY,
          code VARCHAR(24) NOT NULL UNIQUE,
          type ENUM('RECU','BAIL') NOT NULL,
          bienId INT DEFAULT 0,
          titre VARCHAR(200),
          details JSON,
          creeParId INT DEFAULT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
      );
      console.log("   + table document_verification");
    }
    console.log(`[${cible}] ✅ migration terminée.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
})();
