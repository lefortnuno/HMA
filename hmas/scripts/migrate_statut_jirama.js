"use strict";
/**
 * Migration : statut de reglement propre au JIRAMA.
 *
 * Loyer et JIRAMA partageaient une seule colonne `statut`, ce qui rendait
 * impossible de dire "loyer paye, electricite pas encore". Chaque ligne porte
 * desormais son statut JIRAMA, independant du loyer.
 *
 * Reprise de l'existant : une ligne avec un montant JIRAMA deja encaisse
 * (statut loyer PAYE ou PARTIEL) passe en PAYE, les autres en IMPAYE.
 *
 * Idempotent. Usage : node scripts/migrate_statut_jirama.js [local|prod]
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
    const col = await q(
      conn,
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='paiement_loyer' AND COLUMN_NAME='statutJIRAMA'",
      [cfg.database]
    );
    if (col.length) {
      console.log("   = colonne statutJIRAMA deja presente");
    } else {
      await q(
        conn,
        "ALTER TABLE paiement_loyer ADD COLUMN statutJIRAMA ENUM('PAYE','PARTIEL','IMPAYE','DOUTE') NOT NULL DEFAULT 'IMPAYE' AFTER montantJIRAMA"
      );
      console.log("   + colonne statutJIRAMA ajoutee");

      // Reprise : ce qui etait deja encaisse cote JIRAMA passe en PAYE.
      const maj = await q(
        conn,
        "UPDATE paiement_loyer SET statutJIRAMA='PAYE' WHERE montantJIRAMA > 0 AND statut IN ('PAYE','PARTIEL')"
      );
      console.log(`   ~ ${maj.affectedRows} ligne(s) reprise(s) en PAYE`);
    }

    const rep = await q(
      conn,
      "SELECT statutJIRAMA, COUNT(*) nb, COALESCE(SUM(montantJIRAMA),0) total FROM paiement_loyer GROUP BY statutJIRAMA"
    );
    rep.forEach((r) => console.log(`   · ${r.statutJIRAMA} : ${r.nb} ligne(s), ${Number(r.total).toLocaleString()} Ar`));

    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
})();
