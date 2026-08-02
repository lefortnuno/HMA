"use strict";
/**
 * Migration :
 *  - table paiement_histo : journal des paiements (qui a saisi quoi, quand)
 *  - locataire.jourPaiement : jour habituel de reglement (1 a 31)
 * Idempotent. Usage : node scripts/migrate_paiements_histo.js [local|prod]
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

(async () => {
  const cible = (process.argv[2] || "prod").toLowerCase();
  const cfg = TARGETS[cible];
  if (!cfg || !cfg.host) return console.log("Cible inconnue.");
  const conn = mysql.createConnection(cfg);
  console.log(`\n[${cible}] → ${cfg.user}@${cfg.host}/${cfg.database}`);
  try {
    // Jour de paiement habituel
    const colonne = await q(
      conn,
      "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='locataire' AND COLUMN_NAME='jourPaiement'",
      [cfg.database]
    );
    if (colonne.length === 0) {
      await q(conn, "ALTER TABLE locataire ADD COLUMN jourPaiement TINYINT DEFAULT NULL");
      console.log("   + locataire.jourPaiement ajoutee");
    } else console.log("   = locataire.jourPaiement existe deja");

    // Journal des paiements
    await q(
      conn,
      `CREATE TABLE IF NOT EXISTS paiement_histo (
        id            INT(11)      NOT NULL AUTO_INCREMENT,
        paiementId    INT(11)      DEFAULT NULL,
        locataireId   INT(11)      NOT NULL,
        locataireNom  VARCHAR(150) DEFAULT NULL,
        chambre       VARCHAR(10)  DEFAULT NULL,
        etage         VARCHAR(5)   DEFAULT NULL,
        mois          TINYINT      NOT NULL,
        annee         YEAR         NOT NULL,
        action        ENUM('AJOUT','MODIFICATION') NOT NULL,
        montantLoyer  INT(11)      DEFAULT 0,
        montantJIRAMA FLOAT        DEFAULT 0,
        statut        VARCHAR(10)  DEFAULT NULL,
        avant         TEXT         DEFAULT NULL,
        auteurId      INT(11)      DEFAULT NULL,
        auteurNom     VARCHAR(150) DEFAULT NULL,
        dateAction    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_locataire (locataireId),
        KEY idx_periode (annee, mois)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );
    console.log("   + table paiement_histo prete");
    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
})();
