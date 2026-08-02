"use strict";
/**
 * Migration : mode de reglement du locataire.
 *
 *  ECHU   : il consomme puis il paie. Le loyer du mois M se regle au mois M+1
 *           (regle historique de la Villa Kinya).
 *  AVANCE : il paie puis il consomme. Le loyer du mois M se regle dans le mois M
 *           (regle retenue pour les nouveaux locataires).
 *
 * Les fiches existantes basculent en ECHU, qui decrit leur fonctionnement reel.
 *
 * Idempotent. Usage : node scripts/migrate_mode_paiement.js [local|prod]
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
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='locataire' AND COLUMN_NAME='modePaiement'",
      [cfg.database]
    );
    if (col.length) {
      console.log("   = colonne modePaiement deja presente");
    } else {
      await q(
        conn,
        "ALTER TABLE locataire ADD COLUMN modePaiement ENUM('ECHU','AVANCE') NOT NULL DEFAULT 'ECHU' AFTER jourPaiement"
      );
      console.log("   + colonne modePaiement ajoutee (defaut ECHU)");
    }

    const maj = await q(
      conn,
      "UPDATE locataire SET modePaiement='ECHU' WHERE modePaiement IS NULL OR modePaiement=''"
    );
    if (maj.affectedRows) console.log(`   ~ ${maj.affectedRows} fiche(s) passee(s) en ECHU`);

    const repartition = await q(
      conn,
      "SELECT modePaiement, COUNT(*) nb FROM locataire GROUP BY modePaiement"
    );
    repartition.forEach((r) => console.log(`   · ${r.modePaiement} : ${r.nb}`));

    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
})();
