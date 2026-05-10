"use strict";
const db = require("../config/db");

const Depense = {};

Depense.getByMoisAnnee = (mois, annee, result) => {
  db.query(
    "SELECT * FROM depense_immo WHERE mois=? AND annee=? ORDER BY date DESC",
    [mois, annee],
    (err, res) => {
      if (err) result(err, null);
      else result(null, res);
    }
  );
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

Depense.sumByMoisAnnee = (mois, annee, result) => {
  db.query(
    "SELECT COALESCE(SUM(montant), 0) AS totalDepenses FROM depense_immo WHERE mois=? AND annee=?",
    [mois, annee],
    (err, res) => {
      if (err) result(err, null);
      else result(null, res[0]);
    }
  );
};

module.exports = Depense;
