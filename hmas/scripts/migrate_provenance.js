"use strict";
/**
 * Migration : provenance de l'argent encaisse.
 *
 * Un loyer marque PAYE ne dit pas qui l'a recu. Certains locataires reglent
 * directement au bailleur, d'autres remettent la somme sur place. Les deux
 * sont bien payes, mais un seul se retrouve entre les mains du bailleur.
 *
 * Deux drapeaux par ligne de paiement repondent a cette question, et une
 * table par mois porte ce qui n'appartient a aucun locataire : les frais
 * eventuels (retrait Mvola...) et la somme reellement recue, celle qui sert
 * a confirmer — ou non — le solde attendu.
 *
 * Par defaut tout est considere recu par le bailleur : c'est le cas courant,
 * et cela laisse les mois deja saisis inchanges.
 *
 * Idempotent : chaque ajout est teste avant d'etre applique.
 * Usage : node scripts/migrate_provenance.js [local|prod]
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

// Juillet 2026 : releve par le bailleur sur sa feuille de provenance, ces
// loyers ont ete remis sur place et non a lui. Repere par nom et non par
// numero de chambre — la feuille numerote en suite, pas en chambres.
const REMIS_SUR_PLACE = {
  mois: 7,
  annee: 2026,
  noms: ["Louisa", "Derick", "Mioty", "Lanja", "Tantely"],
};

const q = (conn, sql, params) =>
  new Promise((resolve, reject) =>
    conn.query(sql, params, (err, res) => (err ? reject(err) : resolve(res))),
  );

async function colonneExiste(conn, base, table, colonne) {
  const r = await q(
    conn,
    `SELECT COUNT(*) n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?`,
    [base, table, colonne],
  );
  return r[0].n > 0;
}

(async () => {
  const cible = (process.argv[2] || "prod").toLowerCase();
  const cfg = TARGETS[cible];
  if (!cfg || !cfg.host) return console.log("Cible inconnue.");
  const conn = mysql.createConnection(cfg);
  console.log(`\n[${cible}] → ${cfg.user}@${cfg.host}/${cfg.database}`);
  try {
    // 1. Drapeaux de provenance sur chaque paiement.
    const COLS = [
      ["loyerRecuParMoi", "TINYINT(1) NOT NULL DEFAULT 1"],
      ["jiramaRecuParMoi", "TINYINT(1) NOT NULL DEFAULT 1"],
    ];
    for (const [col, def] of COLS) {
      if (await colonneExiste(conn, cfg.database, "paiement_loyer", col)) {
        console.log(`   = paiement_loyer.${col} deja presente`);
      } else {
        await q(conn, `ALTER TABLE paiement_loyer ADD COLUMN ${col} ${def}`);
        console.log(`   + paiement_loyer.${col}`);
      }
    }

    // 2. Ce qui n'appartient a aucun locataire : frais, et somme recue.
    await q(
      conn,
      `CREATE TABLE IF NOT EXISTS provenance_mois (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bienId INT NOT NULL DEFAULT 0,
        mois TINYINT NOT NULL,
        annee YEAR NOT NULL,
        fraisLibelle VARCHAR(160) DEFAULT NULL,
        fraisMontant INT NOT NULL DEFAULT 0,
        sommeRecue BIGINT DEFAULT NULL,
        majLe TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_periode (bienId, mois, annee)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );
    console.log("   = table provenance_mois prete");

    // 3. Report de la feuille de juillet.
    const { mois, annee, noms } = REMIS_SUR_PLACE;
    const deja = await q(
      conn,
      `SELECT COUNT(*) n FROM paiement_loyer WHERE mois=? AND annee=? AND loyerRecuParMoi=0`,
      [mois, annee],
    );
    if (deja[0].n > 0) {
      console.log(`   = ${mois}/${annee} deja renseigne (${deja[0].n} ligne(s))`);
    } else {
      let total = 0;
      for (const nom of noms) {
        const r = await q(
          conn,
          `UPDATE paiement_loyer p JOIN locataire l ON l.id = p.locataireId
           SET p.loyerRecuParMoi = 0
           WHERE p.mois=? AND p.annee=? AND l.nom=?`,
          [mois, annee, nom],
        );
        if (!r.affectedRows) console.log(`   ! ${nom} : aucune ligne trouvee`);
        total += r.affectedRows;
      }
      console.log(`   ~ ${mois}/${annee} : ${total} loyer(s) marques remis sur place`);
    }

    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
})();
