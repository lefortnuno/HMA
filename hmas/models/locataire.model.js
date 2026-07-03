"use strict";
const db = require("../config/db");

const Locataire = {};

Locataire.getAll = (result) => {
  db.query("SELECT * FROM locataire ORDER BY etage ASC, chambre ASC", (err, res) => {
    if (err) result(err, null);
    else result(null, res);
  });
};

Locataire.getById = (id, result) => {
  db.query("SELECT * FROM locataire WHERE id = ?", [id], (err, res) => {
    if (err) result(err, null);
    else result(null, res[0]);
  });
};

// Renvoie le locataire ACTIF occupant deja une chambre/etage (hors excludeId).
// Sert a interdire 2 locataires actifs dans la meme chambre.
Locataire.findActiveInChambre = (chambre, etage, excludeId, result) => {
  let sql =
    "SELECT id, nom FROM locataire WHERE chambre = ? AND etage = ? AND actif = 1";
  const params = [chambre, etage];
  if (excludeId) {
    sql += " AND id <> ?";
    params.push(excludeId);
  }
  db.query(sql, params, (err, res) => {
    if (err) result(err, null);
    else result(null, res[0] || null);
  });
};

Locataire.create = (data, result) => {
  db.query("INSERT INTO locataire SET ?", data, (err, res) => {
    if (err) result(err, null);
    else result(null, { id: res.insertId, success: true });
  });
};

Locataire.update = (id, data, result) => {
  db.query("UPDATE locataire SET ? WHERE id = ?", [data, id], (err, res) => {
    if (err) result(err, null);
    else result(null, { success: true });
  });
};

Locataire.delete = (id, result) => {
  db.query("DELETE FROM locataire WHERE id = ?", [id], (err, res) => {
    if (err) result(err, null);
    else result(null, { success: true });
  });
};

module.exports = Locataire;
