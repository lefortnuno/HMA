"use strict";
/**
 * Migration : horodatages en UTC.
 *
 * Les colonnes TIMESTAMP n'ont rien a rattraper : MySQL les stocke deja en
 * UTC en interne et ne fait que les convertir a la lecture. Passer la session
 * en UTC (voir config/db.js) suffit a les rendre correctement.
 *
 * Les colonnes DATETIME, elles, sont stockees litteralement : leurs valeurs
 * ont ete ecrites a l'heure du serveur MySQL (UTC+2) et doivent etre recalees.
 * Une seule table est concernee : reglement.dateCreation.
 *
 * Les colonnes DATE ne sont pas touchees : une date d'entree ou de reglement
 * est une date calendaire, la meme sous tous les fuseaux.
 *
 * Le decalage n'est pas ecrit en dur : on le demande au serveur, ce qui rend
 * le script juste meme si l'heure d'ete a change entre-temps.
 *
 * Idempotent : un marqueur en base empeche un second decalage.
 * Usage : node scripts/migrate_horodatage_utc.js [local|prod]
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

// table -> colonnes DATETIME a recaler
const DATETIME_COLS = { reglement: ["dateCreation"] };

const q = (conn, sql, params) =>
  new Promise((resolve, reject) =>
    conn.query(sql, params, (err, res) => (err ? reject(err) : resolve(res))),
  );

(async () => {
  const cible = (process.argv[2] || "prod").toLowerCase();
  const cfg = TARGETS[cible];
  if (!cfg || !cfg.host) return console.log("Cible inconnue.");
  const conn = mysql.createConnection(cfg);
  console.log(`\n[${cible}] → ${cfg.user}@${cfg.host}/${cfg.database}`);
  try {
    // Table de marquage : sans elle, relancer le script decalerait a nouveau.
    await q(
      conn,
      `CREATE TABLE IF NOT EXISTS migration_appliquee (
        cle VARCHAR(80) PRIMARY KEY,
        applique_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        detail VARCHAR(255) DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );

    const CLE = "horodatage_utc_v1";
    const deja = await q(conn, "SELECT 1 FROM migration_appliquee WHERE cle=?", [CLE]);
    if (deja.length) {
      console.log("   = deja appliquee, aucun decalage (idempotent)");
      console.log(`[${cible}] ✅ rien a faire.`);
      return;
    }

    // Decalage reel du serveur MySQL par rapport a UTC, en secondes.
    // `decalage` et non `dec` : DEC est un mot reserve MariaDB (DECIMAL).
    const [{ decalage: dec }] = await q(
      conn,
      "SELECT TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), NOW()) AS decalage",
    );
    console.log(`   · decalage serveur : ${dec > 0 ? "+" : ""}${dec / 3600} h`);

    if (dec === 0) {
      console.log("   = serveur deja en UTC, aucune valeur a recaler");
    } else {
      for (const [table, cols] of Object.entries(DATETIME_COLS)) {
        const t = await q(
          conn,
          "SELECT COUNT(*) n FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?",
          [cfg.database, table],
        );
        if (!t[0].n) {
          console.log(`   – ${table} absente, ignoree`);
          continue;
        }
        for (const col of cols) {
          const r = await q(
            conn,
            `UPDATE ?? SET ?? = DATE_SUB(??, INTERVAL ? SECOND) WHERE ?? IS NOT NULL`,
            [table, col, col, dec, col],
          );
          console.log(`   ~ ${table}.${col} : ${r.affectedRows} ligne(s) recalee(s)`);
        }
      }
    }

    await q(conn, "INSERT INTO migration_appliquee SET ?", {
      cle: CLE,
      detail: `decalage ${dec}s retire des colonnes DATETIME`,
    });

    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
})();
