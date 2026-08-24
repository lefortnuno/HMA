"use strict";
const db = require("../config/db");

const Verification = {};

Verification.create = (data, result) => {
  const { code, type, bienId, titre, details, creeParId } = data;
  db.query(
    "INSERT INTO document_verification (code, type, bienId, titre, details, creeParId) VALUES (?,?,?,?,?,?)",
    [code, type, Number(bienId) || 0, titre || null, JSON.stringify(details || {}), creeParId || null],
    (err, res) => {
      if (err) result(err, null);
      else result(null, { id: res.insertId, code });
    }
  );
};

Verification.getByCode = (code, result) => {
  db.query("SELECT * FROM document_verification WHERE code=?", [code], (err, rows) => {
    if (err) return result(err, null);
    if (!rows.length) return result(null, null);
    const r = rows[0];
    result(null, {
      ...r,
      details: typeof r.details === "string" ? JSON.parse(r.details) : r.details,
    });
  });
};

module.exports = Verification;
