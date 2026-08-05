"use strict";
const db = require("../config/db");

/**
 * Ce qui, dans un mois, n'appartient a aucun locataire.
 *
 * Deux valeurs seulement : les frais eventuels (retrait Mvola, transfert...)
 * et la somme reellement recue. La premiere s'ajoute au decompte, la seconde
 * sert a le confronter a la realite — c'est elle qui revele un ecart.
 *
 * Une seule ligne par (bien, mois, annee), garantie par la cle unique.
 */
const Provenance = {};

Provenance.get = (bienId, mois, annee, result) => {
  db.query(
    "SELECT * FROM provenance_mois WHERE bienId=? AND mois=? AND annee=?",
    [Number(bienId) || 0, mois, annee],
    (err, res) => {
      if (err) result(err, null);
      else result(null, res[0] || null);
    },
  );
};

/**
 * Enregistre la periode, en creant la ligne si elle n'existe pas encore.
 *
 * ON DUPLICATE KEY plutot qu'un SELECT suivi d'un INSERT ou d'un UPDATE :
 * deux saisies simultanees ne peuvent pas creer deux lignes concurrentes.
 */
Provenance.save = (bienId, mois, annee, data, result) => {
  const ligne = {
    bienId: Number(bienId) || 0,
    mois: Number(mois),
    annee: Number(annee),
    fraisLibelle: data.fraisLibelle || null,
    fraisMontant: Number(data.fraisMontant) || 0,
    sommeRecue:
      data.sommeRecue === "" || data.sommeRecue === null || data.sommeRecue === undefined
        ? null
        : Number(data.sommeRecue),
  };
  db.query(
    `INSERT INTO provenance_mois SET ?
     ON DUPLICATE KEY UPDATE fraisLibelle=VALUES(fraisLibelle),
                             fraisMontant=VALUES(fraisMontant),
                             sommeRecue=VALUES(sommeRecue)`,
    ligne,
    (err) => {
      if (err) result(err, null);
      else result(null, { success: true, ...ligne });
    },
  );
};

module.exports = Provenance;
