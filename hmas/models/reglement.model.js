"use strict";
const db = require("../config/db");

/** Reglement interieur affiche sur l'accueil. */
const Reglement = {};

// `actifsSeuls` : ce que voient les locataires et les simples utilisateurs.
Reglement.getAll = (actifsSeuls, result) => {
  const sql =
    "SELECT * FROM reglement" +
    (actifsSeuls ? " WHERE actif = 1" : "") +
    " ORDER BY ordre ASC, id ASC";
  db.query(sql, (err, res) => {
    if (err) result(err, null);
    else result(null, res);
  });
};

Reglement.getById = (id, result) => {
  db.query("SELECT * FROM reglement WHERE id = ?", [id], (err, res) => {
    if (err) result(err, null);
    else result(null, res[0] || null);
  });
};

Reglement.create = (data, result) => {
  db.query("INSERT INTO reglement SET ?", data, (err, res) => {
    if (err) result(err, null);
    else result(null, { id: res.insertId, success: true });
  });
};

Reglement.update = (id, data, result) => {
  db.query("UPDATE reglement SET ? WHERE id = ?", [data, id], (err) => {
    if (err) result(err, null);
    else result(null, { success: true });
  });
};

Reglement.delete = (id, result) => {
  db.query("DELETE FROM reglement WHERE id = ?", [id], (err) => {
    if (err) result(err, null);
    else result(null, { success: true });
  });
};

// Place une nouvelle regle en fin de liste.
Reglement.prochainOrdre = (result) => {
  db.query("SELECT COALESCE(MAX(ordre), 0) + 1 AS suivant FROM reglement", (err, res) => {
    if (err) result(err, null);
    else result(null, res[0].suivant);
  });
};

module.exports = Reglement;
