"use strict";
/**
 * Migration : contrats de bail individuels signes electroniquement.
 *
 * Jusqu'ici le contrat n'existait qu'au moment du telechargement : il etait
 * reconstruit a la volee depuis la fiche du locataire, puis oublie. Une
 * signature n'aurait alors porte sur rien de stable.
 *
 * Cette table fige donc un contrat au moment ou on le met a la signature :
 * nom legal, CIN, chambre et loyer y sont recopies. Si la fiche du locataire
 * change ensuite, le contrat signe garde les valeurs sur lesquelles les deux
 * parties se sont engagees.
 *
 * `pdf` recoit le document final en base64, une fois les deux signatures
 * posees. C'est lui qui fait foi ; il n'est plus regenere.
 *
 * Idempotent.
 * Usage : node scripts/migrate_bail_contrat.js [local|prod]
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
    const t = await q(
      conn,
      `SELECT COUNT(*) n FROM information_schema.TABLES
       WHERE TABLE_SCHEMA=? AND TABLE_NAME='bail_contrat'`,
      [cfg.database],
    );
    if (t[0].n) {
      console.log("   = bail_contrat déjà présente");
    } else {
      await q(
        conn,
        `CREATE TABLE bail_contrat (
          id INT AUTO_INCREMENT PRIMARY KEY,
          locataireId INT NOT NULL,
          bienId INT DEFAULT 0,

          nomLegal VARCHAR(160),
          cin VARCHAR(40),
          chambre VARCHAR(10),
          etage VARCHAR(10),
          loyer INT DEFAULT 0,
          bailleurNom VARCHAR(160),
          bailleurCin VARCHAR(40),

          statut ENUM('ATTENTE','SIGNE') NOT NULL DEFAULT 'ATTENTE',
          codeVerif VARCHAR(24) DEFAULT NULL,

          sigLocataireType ENUM('DESSIN','TEXTE') DEFAULT NULL,
          sigLocataireData MEDIUMTEXT,
          sigLocataireLe DATETIME DEFAULT NULL,

          sigBailleurType ENUM('DESSIN','TEXTE') DEFAULT NULL,
          sigBailleurData MEDIUMTEXT,
          sigBailleurLe DATETIME DEFAULT NULL,

          pdf MEDIUMTEXT,
          pdfLe DATETIME DEFAULT NULL,

          creeLe DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_locataire (locataireId),
          INDEX idx_statut (statut)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      );
      console.log("   + table bail_contrat");
    }
    console.log(`[${cible}] ✅ migration terminée.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
})();
