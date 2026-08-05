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

// Liste chronologique des paiements d'une annee, avec le locataire concerne.
Paiement.getDetailAnnee = (annee, bienId, result) => {
  let sql = `SELECT p.*, l.nom, l.prenom, l.chambre, l.etage, l.bienId, l.jourPaiement
     FROM paiement_loyer p
     JOIN locataire l ON l.id = p.locataireId
     WHERE p.annee = ?`;
  const params = [annee];
  if (bienId !== undefined && bienId !== null && bienId !== "") {
    sql += " AND l.bienId = ?";
    params.push(Number(bienId));
  }
  db.query(sql + " ORDER BY p.datePaiement DESC, p.id DESC", params, (err, res) => {
    if (err) result(err, null);
    else result(null, res);
  });
};

Paiement.getById = (id, result) => {
  db.query("SELECT * FROM paiement_loyer WHERE id = ?", [id], (err, res) => {
    if (err) result(err, null);
    else result(null, res[0] || null);
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
      COALESCE(SUM(CASE WHEN p.statutJIRAMA IN ('PAYE','PARTIEL') THEN p.montantJIRAMA ELSE 0 END), 0) AS totalJIRAMA
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
      COALESCE(SUM(CASE WHEN p.statutJIRAMA IN ('PAYE','PARTIEL') THEN p.montantJIRAMA ELSE 0 END), 0) AS totalJIRAMA
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

/**
 * Qui a encaisse ce paiement ?
 *
 * Ne touche qu'aux deux drapeaux de provenance : les montants et les statuts
 * restent ceux qui ont ete valides, marquer une provenance n'est pas modifier
 * un paiement.
 */
Paiement.setProvenance = (id, data, result) => {
  const champs = {};
  if (data.loyerRecuParMoi !== undefined)
    champs.loyerRecuParMoi = data.loyerRecuParMoi ? 1 : 0;
  if (data.jiramaRecuParMoi !== undefined)
    champs.jiramaRecuParMoi = data.jiramaRecuParMoi ? 1 : 0;
  if (!Object.keys(champs).length) return result(null, { success: true });

  db.query("UPDATE paiement_loyer SET ? WHERE id=?", [champs, id], (err) => {
    if (err) result(err, null);
    else result(null, { success: true, ...champs });
  });
};

module.exports = Paiement;
