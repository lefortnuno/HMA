"use strict";
/**
 * Migration : table demande_validation (workflow d'approbation admin).
 * Les ajouts/modifs/suppressions de locataires faits par un simple user
 * sont mis en attente jusqu'a decision de l'admin.
 * Idempotent. Usage : node scripts/migrate_validations.js [local|prod|both]
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

async function migrateOne(name, cfg) {
  if (!cfg.host) return console.log(`\n[${name}] ⏭  ignore.`);
  const conn = mysql.createConnection(cfg);
  console.log(`\n[${name}] → ${cfg.user}@${cfg.host}/${cfg.database}`);
  try {
    await q(
      conn,
      `CREATE TABLE IF NOT EXISTS demande_validation (
        id           INT(11)      NOT NULL AUTO_INCREMENT,
        entite       VARCHAR(30)  NOT NULL DEFAULT 'LOCATAIRE',
        action       ENUM('AJOUT','MODIFICATION','SUPPRESSION') NOT NULL,
        entiteId     INT(11)      DEFAULT NULL,
        avant        TEXT         DEFAULT NULL,
        apres        TEXT         DEFAULT NULL,
        auteurId     INT(11)      NOT NULL,
        auteurNom    VARCHAR(150) DEFAULT NULL,
        statut       ENUM('EN_ATTENTE','APPROUVE','REFUSE') NOT NULL DEFAULT 'EN_ATTENTE',
        dateDemande  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        dateDecision TIMESTAMP    NULL DEFAULT NULL,
        decideurNom  VARCHAR(150) DEFAULT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );
    console.log("   + table demande_validation prete");
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
