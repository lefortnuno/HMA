"use strict";
const db = require("../config/db");

const Paiement = {};

Paiement.getByAnnee = (annee, result) => {
  db.query(
    "SELECT * FROM paiement_loyer WHERE annee = ? ORDER BY locataireId, mois",
    [annee],
    (err, res) => {
      if (err) result(err, null);
      else result(null, res);
    }
  );
};

Paiement.getByMoisAnnee = (mois, annee, result) => {
  db.query(
    `SELECT p.*, l.nom, l.prenom, l.chambre, l.etage
     FROM paiement_loyer p
     JOIN locataire l ON l.id = p.locataireId
     WHERE p.mois = ? AND p.annee = ?`,
    [mois, annee],
    (err, res) => {
      if (err) result(err, null);
      else result(null, res);
    }
  );
};

Paiement.getExisting = (locataireId, mois, annee, result) => {
  db.query(
    "SELECT * FROM paiement_loyer WHERE locataireId=? AND mois=? AND annee=?",
    [locataireId, mois, annee],
    (err, res) => {
      if (err) result(err, null);
      else result(null, res[0] || null);
    }
  );
};

Paiement.create = (data, result) => {
  db.query("INSERT INTO paiement_loyer SET ?", data, (err, res) => {
    if (err) result(err, null);
    else result(null, { id: res.insertId, success: true });
  });
};

Paiement.update = (id, data, result) => {
  db.query("UPDATE paiement_loyer SET ? WHERE id=?", [data, id], (err) => {
    if (err) result(err, null);
    else result(null, { success: true });
  });
};

Paiement.sumByMoisAnnee = (mois, annee, result) => {
  db.query(
    `SELECT
      COALESCE(SUM(CASE WHEN statut IN ('PAYE','PARTIEL') THEN montantLoyer ELSE 0 END), 0) AS totalLoyers,
      COALESCE(SUM(CASE WHEN statut IN ('PAYE','PARTIEL') THEN montantJIRAMA ELSE 0 END), 0) AS totalJIRAMA
     FROM paiement_loyer WHERE mois=? AND annee=?`,
    [mois, annee],
    (err, res) => {
      if (err) result(err, null);
      else result(null, res[0]);
    }
  );
};

module.exports = Paiement;
