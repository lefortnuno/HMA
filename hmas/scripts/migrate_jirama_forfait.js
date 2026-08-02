"use strict";
/**
 * Migration : forfait JIRAMA par locataire.
 *
 * Certains locataires reglent l'eau et l'electricite au forfait (10 000 Ar
 * par mois) plutot qu'au releve. Le compteur individuel reste la reference
 * quand il depasse : le du du mois vaut max(forfait, releve).
 *
 * Idempotent. Usage : node scripts/migrate_jirama_forfait.js [local|prod]
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

// Locataires au forfait, designes par leur chambre (bien 0 = VILLA KINYA).
const AU_FORFAIT = [
  { chambre: "10", etage: "RDC", montant: 10000 },  // MIOTY
  { chambre: "IV", etage: "1ER", montant: 10000 },  // TONY
  { chambre: "6",  etage: "RDC", montant: 10000 },  // JUDIANNE
];

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
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='locataire' AND COLUMN_NAME='jiramaForfait'",
      [cfg.database]
    );
    if (col.length) {
      console.log("   = colonne jiramaForfait deja presente");
    } else {
      await q(
        conn,
        "ALTER TABLE locataire ADD COLUMN jiramaForfait INT DEFAULT NULL AFTER modePaiement"
      );
      console.log("   + colonne jiramaForfait ajoutee");
    }

    for (const f of AU_FORFAIT) {
      const res = await q(
        conn,
        "UPDATE locataire SET jiramaForfait = ? WHERE chambre = ? AND etage = ? AND actif = 1 AND (jiramaForfait IS NULL OR jiramaForfait <> ?)",
        [f.montant, f.chambre, f.etage, f.montant]
      );
      const [loc] = await q(
        conn,
        "SELECT nom FROM locataire WHERE chambre = ? AND etage = ? AND actif = 1",
        [f.chambre, f.etage]
      );
      console.log(
        res.affectedRows
          ? `   + ${loc ? loc.nom : "?"} (ch. ${f.chambre}) → forfait ${f.montant.toLocaleString()} Ar`
          : `   = ${loc ? loc.nom : "ch. " + f.chambre} deja au forfait (ou introuvable)`
      );
    }

    const total = await q(
      conn,
      "SELECT nom, chambre, jiramaForfait FROM locataire WHERE jiramaForfait IS NOT NULL AND actif = 1 ORDER BY id"
    );
    console.log(`   · ${total.length} locataire(s) au forfait :`);
    total.forEach((t) => console.log(`     - ${t.nom} (ch. ${t.chambre}) : ${t.jiramaForfait} Ar`));

    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
})();
