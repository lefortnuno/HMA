"use strict";
const db = require("../config/db");

/**
 * Historique d'occupation : trace qui a occupe quelle chambre et quand.
 * Alimente automatiquement par create/update/delete locataire.
 */
const Occupation = {};

Occupation.log = (entry) => {
  // best-effort : une erreur de log ne doit jamais bloquer l'operation principale
  db.query("INSERT INTO occupation_histo SET ?", entry, (err) => {
    if (err) console.error("[occupation_histo]", err.code, err.message);
  });
};

Occupation.getAll = (bienId, result) => {
  let sql = "SELECT * FROM occupation_histo";
  const params = [];
  if (bienId !== undefined && bienId !== null && bienId !== "") {
    sql += " WHERE bienId = ?";
    params.push(Number(bienId));
  }
  sql += " ORDER BY dateAction DESC, id DESC LIMIT 500";
  db.query(sql, params, (err, res) => {
    if (err) result(err, null);
    else result(null, res);
  });
};

module.exports = Occupation;
