"use strict";
const db = require("../config/db");

const Locataire = {};

Locataire.getAll = (bienId, result) => {
  // Ordre "chambre" reel (1..10 puis I..X) et non alphabetique ("1","10","2"...).
  const ordre =
    "'1','2','3','4','5','6','7','8','9','10'," +
    "'I','II','III','IV','V','VI','VII','VIII','IX','X'";
  let sql = "SELECT * FROM locataire";
  const params = [];
  if (bienId !== undefined && bienId !== null && bienId !== "") {
    sql += " WHERE bienId = ?";
    params.push(Number(bienId));
  }
  sql += ` ORDER BY etage ASC, FIELD(chambre, ${ordre})`;
  db.query(sql, params, (err, res) => {
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

// Renvoie le locataire ACTIF occupant deja une chambre/etage d'un bien (hors excludeId).
// Sert a interdire 2 locataires actifs dans la meme chambre du meme appartement.
Locataire.findActiveInChambre = (chambre, etage, bienId, excludeId, result) => {
  let sql =
    "SELECT id, nom FROM locataire WHERE chambre = ? AND etage = ? AND bienId = ? AND actif = 1";
  const params = [chambre, etage, Number(bienId) || 0];
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
