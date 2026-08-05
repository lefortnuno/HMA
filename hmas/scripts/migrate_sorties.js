"use strict";
/**
 * Migration : les depenses ne sont plus seulement immobilieres.
 *
 * La table ne portait que les charges de la maison. Il faut aussi y loger les
 * depenses du quotidien, les fonds envoyes a la famille a l'etranger, et les
 * investissements a venir. Trois natures qui ne se comparent pas.
 *
 * D'ou la distinction importante : un envoi a la famille n'est pas une charge
 * de la maison, c'est une part du benefice qu'on en sort. Le compter comme
 * une depense ferait fondre le resultat de la residence sans raison. La
 * colonne `impacteBenefice` tranche ligne par ligne, avec un defaut sensé
 * selon la nature — et reste modifiable a la main.
 *
 * Idempotent : chaque ajout est teste avant d'etre applique.
 * Usage : node scripts/migrate_sorties.js [local|prod]
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

const COLS = [
  // Nature de la sortie. Les lignes deja saisies sont immobilieres.
  ["type", "VARCHAR(24) NOT NULL DEFAULT 'IMMOBILIER'"],
  // A qui l'argent est parti : surtout utile pour les envois familiaux.
  ["beneficiaire", "VARCHAR(120) DEFAULT NULL"],
  // Cette sortie greve-t-elle le resultat de la residence ?
  ["impacteBenefice", "TINYINT(1) NOT NULL DEFAULT 1"],
];

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
    for (const [col, def] of COLS) {
      const r = await q(
        conn,
        `SELECT COUNT(*) n FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA=? AND TABLE_NAME='depense_immo' AND COLUMN_NAME=?`,
        [cfg.database, col],
      );
      if (r[0].n > 0) {
        console.log(`   = depense_immo.${col} deja presente`);
      } else {
        await q(conn, `ALTER TABLE depense_immo ADD COLUMN ${col} ${def}`);
        console.log(`   + depense_immo.${col}`);
      }
    }
    const [{ n }] = await q(conn, "SELECT COUNT(*) n FROM depense_immo");
    console.log(`   · ${n} ligne(s) existante(s), toutes immobilieres par defaut`);
    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
})();
