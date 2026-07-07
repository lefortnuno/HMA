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

Paiement.getByMoisAnnee = (mois, annee, bienId, result) => {
  let sql = `SELECT p.*, l.nom, l.prenom, l.chambre, l.etage
     FROM paiement_loyer p
     JOIN locataire l ON l.id = p.locataireId
     WHERE p.mois = ? AND p.annee = ?`;
  const params = [mois, annee];
  if (bienId !== undefined && bienId !== null && bienId !== "") {
    sql += " AND l.bienId = ?";
    params.push(Number(bienId));
  }
  db.query(sql, params, (err, res) => {
    if (err) result(err, null);
    else result(null, res);
  });
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

Paiement.sumByMoisAnnee = (mois, annee, bienId, result) => {
  let sql = `SELECT
      COALESCE(SUM(CASE WHEN p.statut IN ('PAYE','PARTIEL') THEN p.montantLoyer ELSE 0 END), 0) AS totalLoyers,
      COALESCE(SUM(CASE WHEN p.statut IN ('PAYE','PARTIEL') THEN p.montantJIRAMA ELSE 0 END), 0) AS totalJIRAMA
     FROM paiement_loyer p
     JOIN locataire l ON l.id = p.locataireId
     WHERE p.mois=? AND p.annee=?`;
  const params = [mois, annee];
  if (bienId !== undefined && bienId !== null && bienId !== "") {
    sql += " AND l.bienId = ?";
    params.push(Number(bienId));
  }
  db.query(sql, params, (err, res) => {
    if (err) result(err, null);
    else result(null, res[0]);
  });
};

// Totaux par mois sur une annee complete (dashboard annuel des benefices).
Paiement.sumByAnnee = (annee, bienId, result) => {
  let sql = `SELECT p.mois,
      COALESCE(SUM(CASE WHEN p.statut IN ('PAYE','PARTIEL') THEN p.montantLoyer ELSE 0 END), 0) AS totalLoyers,
      COALESCE(SUM(CASE WHEN p.statut IN ('PAYE','PARTIEL') THEN p.montantJIRAMA ELSE 0 END), 0) AS totalJIRAMA
     FROM paiement_loyer p
     JOIN locataire l ON l.id = p.locataireId
     WHERE p.annee=?`;
  const params = [annee];
  if (bienId !== undefined && bienId !== null && bienId !== "") {
    sql += " AND l.bienId = ?";
    params.push(Number(bienId));
  }
  db.query(sql + " GROUP BY p.mois", params, (err, res) => {
    if (err) result(err, null);
    else result(null, res);
  });
};

module.exports = Paiement;
