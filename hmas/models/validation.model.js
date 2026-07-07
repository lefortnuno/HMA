"use strict";
const db = require("../config/db");

/**
 * Demandes de validation : actions des simples users en attente
 * d'approbation/refus par l'admin.
 */
const Validation = {};

Validation.create = (data, result) => {
  const row = {
    ...data,
    avant: data.avant ? JSON.stringify(data.avant) : null,
    apres: data.apres ? JSON.stringify(data.apres) : null,
  };
  db.query("INSERT INTO demande_validation SET ?", row, (err, res) => {
    if (err) result(err, null);
    else result(null, { id: res.insertId, success: true, pending: true });
  });
};

function parse(row) {
  return {
    ...row,
    avant: row.avant ? JSON.parse(row.avant) : null,
    apres: row.apres ? JSON.parse(row.apres) : null,
  };
}

// Admin : toutes les demandes. Simple user : uniquement les siennes.
Validation.getAll = (auteurId, result) => {
  let sql = "SELECT * FROM demande_validation";
  const params = [];
  if (auteurId) {
    sql += " WHERE auteurId = ?";
    params.push(auteurId);
  }
  sql += " ORDER BY (statut='EN_ATTENTE') DESC, dateDemande DESC, id DESC LIMIT 200";
  db.query(sql, params, (err, res) => {
    if (err) result(err, null);
    else result(null, res.map(parse));
  });
};

Validation.countPending = (result) => {
  db.query(
    "SELECT COUNT(*) AS nb FROM demande_validation WHERE statut='EN_ATTENTE'",
    (err, res) => {
      if (err) result(err, null);
      else result(null, res[0]);
    }
  );
};

Validation.getById = (id, result) => {
  db.query("SELECT * FROM demande_validation WHERE id = ?", [id], (err, res) => {
    if (err) result(err, null);
    else result(null, res[0] ? parse(res[0]) : null);
  });
};

Validation.decide = (id, statut, decideurNom, result) => {
  db.query(
    "UPDATE demande_validation SET statut=?, decideurNom=?, dateDecision=NOW() WHERE id=? AND statut='EN_ATTENTE'",
    [statut, decideurNom, id],
    (err, res) => {
      if (err) result(err, null);
      else result(null, { success: true, changed: res.affectedRows > 0 });
    }
  );
};

module.exports = Validation;
