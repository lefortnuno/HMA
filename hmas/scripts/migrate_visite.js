"use strict";
/**
 * Migration : journal des connexions et des pages consultees.
 *
 * Rien n'etait trace jusqu'ici — ni les connexions, ni la navigation. Le
 * journal demarre donc a la date de cette migration ; l'historique anterieur
 * n'existe nulle part et ne peut pas etre reconstitue.
 *
 * La table est ecrite a chaque changement de page : elle doit rester legere.
 * D'ou des colonnes courtes, aucun texte libre volumineux, et deux index qui
 * couvrent les seules lectures faites par l'ecran (les plus recentes, et
 * celles d'un utilisateur donne).
 *
 * Idempotent.
 * Usage : node scripts/migrate_visite.js [local|prod]
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
    await q(
      conn,
      `CREATE TABLE IF NOT EXISTS visite (
        id INT AUTO_INCREMENT PRIMARY KEY,
        utilisateurId INT DEFAULT NULL,
        nom VARCHAR(120) DEFAULT NULL,
        karazana TINYINT DEFAULT NULL,
        type ENUM('CONNEXION','PAGE') NOT NULL DEFAULT 'PAGE',
        chemin VARCHAR(160) DEFAULT NULL,
        titre VARCHAR(120) DEFAULT NULL,
        appareil VARCHAR(60) DEFAULT NULL,
        dateAction TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_recentes (dateAction),
        KEY idx_utilisateur (utilisateurId, dateAction)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );
    console.log("   = table visite prete");

    const [{ n }] = await q(conn, "SELECT COUNT(*) n FROM visite");
    console.log(`   · ${n} entree(s) enregistree(s)`);
    if (n === 0) {
      console.log("   ! le journal demarre maintenant : rien n'etait trace avant");
    }

    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
})();
