"use strict";
/**
 * Migration : Iruno est parti, le budget OTIP passe de la collecte de la
 * garantie au remboursement des deux prets qui l'ont financee.
 *
 * MODULE TEMPORAIRE (voir utils/otip.js).
 *
 * - CPM : 26 300 DH sur 18 mois (au lieu du montant provisoire de 18 248 DH
 *   saisi avant que le pret soit finalise)
 * - AC2I : 30 000 DH sur 10 mois — deja exact en base, seul le statut change
 *
 * Les deux passent de ACCORDE a REMBOURSEMENT : l'argent est recu, on est
 * maintenant dans la phase de remboursement.
 *
 * Idempotent : relancer le script sans effet une fois les valeurs en place.
 * Usage : node scripts/migrate_otip_remboursement_iruno.js [local|prod]
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

const PRETS = [
  { libelle: "CPM", montant: 26300, montant2: Math.round(26300 / 18) },
  { libelle: "AC2I", montant: 30000, montant2: Math.round(30000 / 10) },
];

const ECHEANCE =
  "Remboursement des prêts pour la garantie d'Iruno, parti en France : " +
  "CPM (26 300 DH sur 18 mois) et AC2I (30 000 DH sur 10 mois).";

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
    for (const p of PRETS) {
      const r = await q(
        conn,
        "SELECT id FROM otip_ligne WHERE section='EMPRUNT' AND libelle=?",
        [p.libelle],
      );
      if (!r.length) {
        console.log(`   ! ${p.libelle} introuvable, ignoré`);
        continue;
      }
      await q(
        conn,
        `UPDATE otip_ligne SET montant=?, montant2=?, statut='REMBOURSEMENT'
         WHERE id=?`,
        [p.montant, p.montant2, r[0].id],
      );
      console.log(
        `   ~ ${p.libelle} (id ${r[0].id}) : ${p.montant} DH, ${p.montant2} DH/mois, REMBOURSEMENT`,
      );
    }

    await q(
      conn,
      "INSERT INTO otip_param SET ? ON DUPLICATE KEY UPDATE valeur=VALUES(valeur)",
      { cle: "echeance", valeur: ECHEANCE },
    );
    console.log("   ~ echeance mise à jour");

    console.log(`[${cible}] ✅ migration terminée.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
})();
