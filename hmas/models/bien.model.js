"use strict";
const db = require("../config/db");

const Bien = {};

function parse(row) {
  if (!row) return row;
  return {
    ...row,
    photos: row.photos ? JSON.parse(row.photos) : [],
    caracteristiques: row.caracteristiques ? JSON.parse(row.caracteristiques) : [],
  };
}

Bien.getAll = (filters, result) => {
  let q = "SELECT * FROM bien_immo WHERE 1=1";
  const params = [];
  if (filters.type) { q += " AND type=?"; params.push(filters.type); }
  if (filters.disponible !== undefined && filters.disponible !== "") {
    q += " AND disponible=?";
    params.push(filters.disponible === "true" || filters.disponible === true ? 1 : 0);
  }
  q += " ORDER BY id DESC";
  db.query(q, params, (err, res) => {
    if (err) result(err, null);
    else result(null, res.map(parse));
  });
};

Bien.getById = (id, result) => {
  db.query("SELECT * FROM bien_immo WHERE id=?", [id], (err, res) => {
    if (err) result(err, null);
    else result(null, parse(res[0]));
  });
};

Bien.create = (data, result) => {
  const row = {
    ...data,
    photos: JSON.stringify(data.photos || []),
    caracteristiques: JSON.stringify(data.caracteristiques || []),
  };
  db.query("INSERT INTO bien_immo SET ?", row, (err, res) => {
    if (err) result(err, null);
    else result(null, { id: res.insertId, success: true });
  });
};

Bien.update = (id, data, result) => {
  const row = {
    ...data,
    photos: JSON.stringify(data.photos || []),
    caracteristiques: JSON.stringify(data.caracteristiques || []),
  };
  db.query("UPDATE bien_immo SET ? WHERE id=?", [row, id], (err) => {
    if (err) result(err, null);
    else result(null, { success: true });
  });
};

Bien.delete = (id, result) => {
  db.query("DELETE FROM bien_immo WHERE id=?", [id], (err) => {
    if (err) result(err, null);
    else result(null, { success: true });
  });
};

module.exports = Bien;
