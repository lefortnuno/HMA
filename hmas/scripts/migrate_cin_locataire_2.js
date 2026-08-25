"use strict";
/**
 * Migration : nom complet et CIN des locataires — deuxième lot.
 *
 * Trois correspondances supplémentaires confirmées par recoupement du nom
 * (chambre 6 : Judianne / RDC ; chambre I : Francia / 1er étage ; chambre
 * IX : Tantely / 1er étage), envoyées par le bailleur pour l'impression
 * urgente du contrat de bail.
 *
 * Complète hmas/scripts/migrate_cin_locataire.js — mêmes colonnes, ne les
 * recrée pas si elles existent déjà.
 *
 * Idempotent : une valeur déjà saisie n'est jamais écrasée.
 * Usage : node scripts/migrate_cin_locataire_2.js [local|prod]
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

const CONNUS = [
  { chambre: "6", etage: "RDC", nomComplet: "RAHARIMALAZA Judianne Mariano", cin: "209 012 045 560" },
  { chambre: "I", etage: "1ER", nomComplet: "FENOARINOSINIRINA Eleonie Francia", cin: "216 012 023 970" },
  { chambre: "IX", etage: "1ER", nomComplet: "ANDRIANARISOA Razafimandimby Tantelinirina Bernadia", cin: "518 012 011 708" },
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
    let maj = 0;
    for (const t of CONNUS) {
      const r = await q(
        conn,
        `UPDATE locataire
           SET nomComplet=?, cin=?
         WHERE bienId=0 AND actif=1 AND chambre=? AND etage=?
           AND (nomComplet IS NULL OR nomComplet='')`,
        [t.nomComplet, t.cin, t.chambre, t.etage],
      );
      if (r.affectedRows) {
        maj += r.affectedRows;
        console.log(`   ~ chambre ${t.chambre} (${t.etage}) : ${t.nomComplet}`);
      } else {
        console.log(`   – chambre ${t.chambre} (${t.etage}) : déjà renseignée ou introuvable`);
      }
    }
    console.log(`   · ${maj} fiche(s) mise(s) à jour`);

    console.log(`[${cible}] ✅ migration terminée.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
})();
