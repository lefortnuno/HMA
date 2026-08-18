"use strict";
/**
 * Migration : budget OTIP (garantie bancaire pour le depart d'Iruno).
 *
 * MODULE TEMPORAIRE. Trois tables prefixees `otip_`, supprimables d'un bloc
 * par scripts/remove_otip.js le jour ou le dossier sera clos.
 *
 * Une seule table porte toutes les lignes du budget plutot que six : les
 * sections n'utilisent qu'une partie des colonnes, et une table unique donne
 * un CRUD unique — donc un seul endroit a ecrire, et un seul a supprimer.
 *
 *   section      libelle      contact  montant    montant2      mois        moisRemb
 *   LIQUIDITE    poste                 solde
 *   CREANCE      qui me doit           montant                  echeance
 *   EMPRUNT      preteur      oui      emprunte   remb./mois    reception   debut remb.
 *   REVENU       poste                 periode 1  periode 2
 *   FIXE         poste                 par mois
 *   PONCTUELLE   poste                 montant                  mois prevu
 *
 * Idempotent : les tables ne sont semees que si elles sont vides.
 * Usage : node scripts/migrate_otip.js [local|prod]
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

// Valeurs reprises du classeur Budget_OTIP_Iruno.xlsx, salaire de 9 000 DH
// sur les deux mois (confirme par le bailleur).
const LIGNES = [
  ["LIQUIDITE", "Compte bancaire (CIH)", null, 6954, 0, null, null, null, 1],
  ["LIQUIDITE", "Portefeuille (cash)", null, 230, 0, null, null, null, 2],
  ["LIQUIDITE", "Épargne", null, 545, 0, null, null, null, 3],

  ["CREANCE", "Ami (155 DH)", null, 155, 0, "Août", null, null, 1],
  ["CREANCE", "Amie (versement 1/2)", null, 210, 0, "Août", null, null, 2],
  ["CREANCE", "Amie (versement 2/2)", null, 210, 0, "Septembre", null, null, 3],
  ["CREANCE", "Ami (petite dette)", null, 10, 0, "Août", null, null, 4],

  ["EMPRUNT", "Souria / AC2I", "soulad@ac2i.ma", 30000, 3000, "Août", "Septembre", "SIGNE", 1],
  ["EMPRUNT", "Rica", null, 20000, 0, "Août", null, "A_NEGOCIER", 2],
  ["EMPRUNT", "Tom", null, 15000, 0, "Août", null, "A_NEGOCIER", 3],
  ["EMPRUNT", "Nasser", null, 10000, 0, "Août", null, "A_NEGOCIER", 4],

  ["REVENU", "Salaire", null, 9000, 9000, null, null, null, 1],
  ["REVENU", "Loyers Madagascar (locataires)", null, 2152, 2152, null, null, null, 2],

  ["FIXE", "Loyer", null, 1150, 0, null, null, null, 1],
  ["FIXE", "Internet", null, 60, 0, null, null, null, 2],
  ["FIXE", "Wifi", null, 500, 0, null, null, null, 3],
  ["FIXE", "Tram", null, 160, 0, null, null, null, 4],
  ["FIXE", "Gym", null, 290, 0, null, null, null, 5],
  ["FIXE", "Redal", null, 100, 0, null, null, null, 6],
  ["FIXE", "Abonnement Claude Pro", null, 231, 0, null, null, null, 7],

  ["PONCTUELLE", "Événement (Caustard)", null, 950, 0, "Août", null, null, 1],
  ["PONCTUELLE", "Enterrement", null, 1000, 0, "Août", null, null, 2],
  ["PONCTUELLE", "Mariage", null, 1000, 0, "Septembre", null, null, 3],
];

const PARAMS = [
  ["objectif", "120000"],
  ["periode1", "Août"],
  ["periode2", "Septembre"],
  ["titre", "Budget OTIP — garant d'Iruno"],
  ["echeance", "Réunir 120 000 DH avant fin septembre 2026 (idéal : fin août)"],
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
    await q(
      conn,
      `CREATE TABLE IF NOT EXISTS otip_ligne (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section VARCHAR(16) NOT NULL,
        libelle VARCHAR(160) NOT NULL,
        contact VARCHAR(160) DEFAULT NULL,
        montant DECIMAL(12,2) NOT NULL DEFAULT 0,
        montant2 DECIMAL(12,2) NOT NULL DEFAULT 0,
        mois VARCHAR(24) DEFAULT NULL,
        moisRemb VARCHAR(24) DEFAULT NULL,
        statut VARCHAR(24) DEFAULT NULL,
        notes VARCHAR(300) DEFAULT NULL,
        ordre INT NOT NULL DEFAULT 0,
        KEY idx_section (section)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );
    await q(
      conn,
      `CREATE TABLE IF NOT EXISTS otip_depense (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE DEFAULT NULL,
        categorie VARCHAR(60) DEFAULT NULL,
        description VARCHAR(300) DEFAULT NULL,
        montant DECIMAL(12,2) NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );
    await q(
      conn,
      `CREATE TABLE IF NOT EXISTS otip_param (
        cle VARCHAR(40) PRIMARY KEY,
        valeur VARCHAR(300) DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );
    console.log("   = 3 tables otip_* pretes");

    const [{ n }] = await q(conn, "SELECT COUNT(*) n FROM otip_ligne");
    if (n > 0) {
      console.log(`   = ${n} ligne(s) deja en base, aucun ajout`);
    } else {
      for (const r of LIGNES) {
        await q(
          conn,
          `INSERT INTO otip_ligne
             (section, libelle, contact, montant, montant2, mois, moisRemb, statut, ordre)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          r,
        );
      }
      console.log(`   + ${LIGNES.length} lignes de budget semees`);
    }

    for (const [cle, valeur] of PARAMS) {
      await q(
        conn,
        "INSERT INTO otip_param SET ? ON DUPLICATE KEY UPDATE cle=cle",
        { cle, valeur },
      );
    }
    console.log(`   = ${PARAMS.length} parametres en place`);

    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
})();
