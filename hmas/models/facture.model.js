"use strict";
const db = require("../config/db");

const Facture = {};

Facture.getByMoisAnnee = (mois, annee, result) => {
  db.query(
    `SELECT f.*,
      (SELECT JSON_ARRAYAGG(JSON_OBJECT(
        'id', c.id, 'locataireId', c.locataireId,
        'indexPrev', c.indexPrev, 'indexCurr', c.indexCurr,
        'consommation', c.consommation, 'montantJIRAMA', c.montantJIRAMA
      )) FROM consommation_locataire c WHERE c.factureId = f.id) AS consommations
     FROM facture_jirama f WHERE f.mois = ? AND f.annee = ?`,
    [mois, annee],
    (err, res) => {
      if (err) result(err, null);
      else {
        const rows = res.map((r) => ({
          ...r,
          consommations: r.consommations ? JSON.parse(r.consommations) : [],
        }));
        result(null, rows);
      }
    }
  );
};

Facture.create = (data, result) => {
  const { mois, annee, prixUnitaire, montantTotal, dateFacture } = data;
  db.query(
    "INSERT INTO facture_jirama (mois, annee, prixUnitaire, montantTotal, dateFacture) VALUES (?,?,?,?,?)",
    [mois, annee, prixUnitaire, montantTotal || 0, dateFacture || null],
    (err, res) => {
      if (err) result(err, null);
      else result(null, { id: res.insertId, success: true });
    }
  );
};

Facture.update = (id, data, result) => {
  const { prixUnitaire, montantTotal, dateFacture } = data;
  db.query(
    "UPDATE facture_jirama SET prixUnitaire=?, montantTotal=?, dateFacture=? WHERE id=?",
    [prixUnitaire, montantTotal || 0, dateFacture || null, id],
    (err) => {
      if (err) result(err, null);
      else result(null, { success: true });
    }
  );
};

Facture.deleteConsos = (factureId, result) => {
  db.query("DELETE FROM consommation_locataire WHERE factureId = ?", [factureId], (err) => {
    if (err) result(err, null);
    else result(null, { success: true });
  });
};

Facture.insertConso = (data, result) => {
  db.query("INSERT INTO consommation_locataire SET ?", data, (err, res) => {
    if (err) result(err, null);
    else result(null, { id: res.insertId });
  });
};

module.exports = Facture;
