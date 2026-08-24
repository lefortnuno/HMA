"use strict";
/**
 * Migration : nom complet et CIN des locataires.
 *
 * Le champ `nom` sert d'usage courant dans toute l'application (tableaux,
 * reçus, messages) — "Trecy", "Sendrah"... Le nom légal complet et le CIN
 * n'ont jamais été demandés, or le contrat de bail en a besoin. Deux
 * colonnes s'ajoutent donc, sans toucher à `nom`/`prenom`.
 *
 * Semées avec les six correspondances confirmées par recoupement du nom,
 * relevées sur les notes manuscrites du bailleur (WhatsApp). Les dix autres
 * locataires actifs restent sans CIN — non communiqué à ce jour.
 *
 * Idempotent : une valeur déjà saisie n'est jamais écrasée.
 * Usage : node scripts/migrate_cin_locataire.js [local|prod]
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

// Repérées par chambre (bienId=0, Villa Kinya) plutôt que par nom d'usage :
// c'est la clé fiable, le nom d'usage ("Trecy") ne figure pas sur les notes.
const CONNUS = [
  { chambre: "1", etage: "RDC", nomComplet: "RAKOTOSON Seheritina Trecy", cin: "216 012 029 030" },
  { chambre: "2", etage: "RDC", nomComplet: "FENOSOA Malatiavina", cin: "301 072 044 564" },
  { chambre: "5", etage: "RDC", nomComplet: "TIAVINIRINA Sedrah Violette", cin: "508 072 012 742" },
  { chambre: "7", etage: "RDC", nomComplet: "ROSKO Havimantanaina Frédéric", cin: "508 991 038 134" },
  { chambre: "VI", etage: "1ER", nomComplet: "RODYSOA Maeva Marye Anaïs", cin: "301 092 061 845" },
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
    for (const [col, def] of [
      ["nomComplet", "VARCHAR(160) DEFAULT NULL"],
      ["cin", "VARCHAR(40) DEFAULT NULL"],
    ]) {
      const r = await q(
        conn,
        `SELECT COUNT(*) n FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA=? AND TABLE_NAME='locataire' AND COLUMN_NAME=?`,
        [cfg.database, col],
      );
      if (r[0].n) console.log(`   = locataire.${col} déjà présente`);
      else {
        await q(conn, `ALTER TABLE locataire ADD COLUMN ${col} ${def}`);
        console.log(`   + locataire.${col}`);
      }
    }

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
