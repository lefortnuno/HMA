"use strict";
/**
 * Migration : reglement de l'agence RSG (Study Ready Go) en trois tranches.
 *
 * MODULE TEMPORAIRE (voir utils/otip.js) : ces parametres partent avec le
 * reste du budget OTIP, scripts/remove_otip.js supprimant la table entiere.
 *
 * L'agence accepte les 120 000 DH de la garantie en trois virements plutot
 * qu'en un seul. Chaque tranche tient dans un parametre `rsg_tN`, en JSON
 * compact : une cle par tranche parce que `otip_param.valeur` est limitee a
 * 300 caracteres.
 *
 * La premiere tranche est renseignee d'apres le bordereau CIH Bank du
 * 27/08/2026 (docs/IrunoLA-SRG-V-3395Euro.pdf). Les deux suivantes sont
 * creees vides, a completer depuis la page Budget OTIP au fil des virements.
 *
 * Idempotent : une tranche deja saisie n'est jamais ecrasee.
 * Usage : node scripts/migrate_otip_tranches_rsg.js [local|prod]
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

const TRANCHES = [
  [
    "rsg_t1",
    {
      montant: 37790,
      date: "2026-08-27",
      ref: "007400355542727082026",
      banque: "CIH Bank",
    },
  ],
  ["rsg_t2", { montant: 0, date: "", ref: "", banque: "" }],
  ["rsg_t3", { montant: 0, date: "", ref: "", banque: "" }],
];

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
    for (const [cle, valeur] of TRANCHES) {
      const json = JSON.stringify(valeur);
      if (json.length > 300) {
        throw new Error(`${cle} depasse 300 caracteres (${json.length})`);
      }
      const deja = await q(conn, "SELECT valeur FROM otip_param WHERE cle=?", [cle]);
      if (deja.length && deja[0].valeur) {
        console.log(`   = ${cle} deja renseignee, laissee intacte`);
        continue;
      }
      await q(
        conn,
        "INSERT INTO otip_param SET ? ON DUPLICATE KEY UPDATE valeur=VALUES(valeur)",
        { cle, valeur: json },
      );
      console.log(`   + ${cle} : ${json}`);
    }
    console.log(`[${cible}] ✅ migration terminée.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
})();
