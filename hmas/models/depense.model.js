"use strict";
const db = require("../config/db");

const Depense = {};

Depense.getByMoisAnnee = (mois, annee, bienId, result) => {
  let sql = "SELECT * FROM depense_immo WHERE mois=? AND annee=?";
  const params = [mois, annee];
  if (bienId !== undefined && bienId !== null && bienId !== "") {
    sql += " AND bienId=?";
    params.push(Number(bienId));
  }
  db.query(sql + " ORDER BY date DESC", params, (err, res) => {
    if (err) result(err, null);
    else result(null, res);
  });
};

Depense.create = (data, result) => {
  db.query("INSERT INTO depense_immo SET ?", data, (err, res) => {
    if (err) result(err, null);
    else result(null, { id: res.insertId, success: true });
  });
};

Depense.update = (id, data, result) => {
  db.query("UPDATE depense_immo SET ? WHERE id=?", [data, id], (err) => {
    if (err) result(err, null);
    else result(null, { success: true });
  });
};

Depense.delete = (id, result) => {
  db.query("DELETE FROM depense_immo WHERE id=?", [id], (err) => {
    if (err) result(err, null);
    else result(null, { success: true });
  });
};

Depense.sumByMoisAnnee = (mois, annee, bienId, result) => {
  let sql =
    "SELECT COALESCE(SUM(montant), 0) AS totalDepenses FROM depense_immo WHERE mois=? AND annee=?";
  const params = [mois, annee];
  if (bienId !== undefined && bienId !== null && bienId !== "") {
    sql += " AND bienId=?";
    params.push(Number(bienId));
  }
  db.query(sql, params, (err, res) => {
    if (err) result(err, null);
    else result(null, res[0]);
  });
};

// Somme des benefices par mois pour toute une annee (dashboard annuel).
Depense.sumByAnnee = (annee, bienId, result) => {
  let sql =
    "SELECT mois, COALESCE(SUM(montant),0) AS totalDepenses FROM depense_immo WHERE annee=?";
  const params = [annee];
  if (bienId !== undefined && bienId !== null && bienId !== "") {
    sql += " AND bienId=?";
    params.push(Number(bienId));
  }
  db.query(sql + " GROUP BY mois", params, (err, res) => {
    if (err) result(err, null);
    else result(null, res);
  });
};

module.exports = Depense;
