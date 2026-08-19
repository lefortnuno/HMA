"use strict";
/**
 * Migration : deux dates de depart possibles au lieu de deux mois.
 *
 * MODULE TEMPORAIRE (voir utils/otip.js).
 *
 * Iruno part le 29 aout, ou le 7 septembre. La difference tient a une seule
 * chose : la paie de fin aout. Le 29, elle n'est pas encore tombee ; le
 * 7 septembre, si. D'ou une colonne `finDeMois` sur les revenus, qui dit
 * lesquels n'arrivent qu'a la fin du mois.
 *
 * Strictement additive : aucune ligne supprimee, aucun montant touche. Les
 * libelles de periode ("Août", "Septembre") restent tels quels — les lignes
 * y sont rattachees par ce texte, les renommer ferait disparaitre leurs
 * montants du calcul sans rien signaler.
 *
 * Idempotent.
 * Usage : node scripts/migrate_otip_depart.js [local|prod]
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

// Ancienne echeance semee par migrate_otip.js. On ne la remplace que si elle
// n'a pas ete retouchee a la main.
const ECHEANCE_SEMEE =
  "Réunir 120 000 DH avant fin septembre 2026 (idéal : fin août)";
const ECHEANCE_NEUVE =
  "Réunir 120 000 DH avant le départ d'Iruno — le 29 août, ou le 7 septembre au plus tard";

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
    // Compte de controle : rien ne doit disparaitre.
    const [avant] = await q(
      conn,
      "SELECT COUNT(*) n, COALESCE(SUM(montant),0) t FROM otip_ligne",
    );
    console.log(`   · avant : ${avant.n} lignes, total montants ${avant.t}`);

    const col = await q(
      conn,
      `SELECT COUNT(*) n FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA=? AND TABLE_NAME='otip_ligne' AND COLUMN_NAME='finDeMois'`,
      [cfg.database],
    );
    if (col[0].n) {
      console.log("   = otip_ligne.finDeMois deja presente");
    } else {
      await q(
        conn,
        "ALTER TABLE otip_ligne ADD COLUMN finDeMois TINYINT(1) NOT NULL DEFAULT 0",
      );
      console.log("   + otip_ligne.finDeMois");
    }

    // Le salaire est le revenu de fin de mois. S'il a ete renomme, la mise a
    // jour ne trouve rien et le drapeau reste a poser a la main : on le dit.
    const [{ dejaMarques }] = await q(
      conn,
      "SELECT COUNT(*) dejaMarques FROM otip_ligne WHERE finDeMois=1",
    );
    if (dejaMarques > 0) {
      console.log(`   = ${dejaMarques} revenu(s) deja marque(s) fin de mois`);
    } else {
      const r = await q(
        conn,
        "UPDATE otip_ligne SET finDeMois=1 WHERE section='REVENU' AND libelle LIKE '%alaire%'",
      );
      if (r.affectedRows) {
        console.log(`   ~ ${r.affectedRows} revenu(s) marque(s) « versé en fin de mois »`);
      } else {
        console.log("   ! aucun revenu nomme « salaire » : drapeau a poser depuis l'ecran");
      }
    }

    for (const [cle, valeur] of [["depart1", "29 août"], ["depart2", "7 septembre"]]) {
      await q(
        conn,
        "INSERT INTO otip_param SET ? ON DUPLICATE KEY UPDATE cle=cle",
        { cle, valeur },
      );
    }
    console.log("   = dates de depart en place (29 août / 7 septembre)");

    const ech = await q(conn, "SELECT valeur FROM otip_param WHERE cle='echeance'");
    if (ech[0] && ech[0].valeur === ECHEANCE_SEMEE) {
      await q(conn, "UPDATE otip_param SET valeur=? WHERE cle='echeance'", [ECHEANCE_NEUVE]);
      console.log("   ~ echeance mise a jour");
    } else {
      console.log("   = echeance personnalisee, laissee telle quelle");
    }

    const [apres] = await q(
      conn,
      "SELECT COUNT(*) n, COALESCE(SUM(montant),0) t FROM otip_ligne",
    );
    console.log(`   · apres : ${apres.n} lignes, total montants ${apres.t}`);
    if (apres.n !== avant.n || Number(apres.t) !== Number(avant.t)) {
      console.log("   ❌ DONNEES MODIFIEES — a verifier !");
      process.exitCode = 1;
    } else {
      console.log("   ✓ aucune donnee perdue ni modifiee");
    }

    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
})();
