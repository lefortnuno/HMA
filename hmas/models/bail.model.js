"use strict";
const db = require("../config/db");

/**
 * Contrats de bail individuels mis a la signature.
 *
 * Le PDF fige (`pdf`) n'est jamais renvoye avec les listes : c'est le plus
 * gros champ de la table, et l'ecran de suivi n'en a pas besoin. Il ne se
 * lit qu'a l'unite, au telechargement.
 */
const Bail = {};

const SANS_PDF = `id, locataireId, bienId, nomLegal, cin, chambre, etage, loyer,
  bailleurNom, bailleurCin, statut, codeVerif,
  sigLocataireType, sigLocataireLe, sigBailleurType, sigBailleurLe,
  pdfLe, creeLe`;

Bail.create = (data, result) => {
  db.query("INSERT INTO bail_contrat SET ?", data, (err, res) =>
    err ? result(err, null) : result(null, { id: res.insertId, ...data }),
  );
};

/** Contrats d'un bien, le plus recent d'abord. */
Bail.getAll = (bienId, result) => {
  let sql = `SELECT ${SANS_PDF} FROM bail_contrat`;
  const params = [];
  if (bienId !== undefined && bienId !== null && bienId !== "") {
    sql += " WHERE bienId = ?";
    params.push(Number(bienId));
  }
  sql += " ORDER BY creeLe DESC, id DESC";
  db.query(sql, params, (err, res) =>
    err ? result(err, null) : result(null, res),
  );
};

/** Le contrat en cours d'un locataire : le dernier cree. */
Bail.getDuLocataire = (locataireId, result) => {
  db.query(
    `SELECT ${SANS_PDF} FROM bail_contrat WHERE locataireId = ?
     ORDER BY creeLe DESC, id DESC LIMIT 1`,
    [Number(locataireId)],
    (err, res) => (err ? result(err, null) : result(null, res[0] || null)),
  );
};

/** Fiche complete, signatures comprises : sert a rebatir le PDF. */
Bail.getById = (id, result) => {
  db.query(
    `SELECT id, locataireId, bienId, nomLegal, cin, chambre, etage, loyer,
            bailleurNom, bailleurCin, statut, codeVerif,
            sigLocataireType, sigLocataireData, sigLocataireLe,
            sigBailleurType, sigBailleurData, sigBailleurLe, pdfLe, creeLe
     FROM bail_contrat WHERE id = ?`,
    [Number(id)],
    (err, res) => (err ? result(err, null) : result(null, res[0] || null)),
  );
};

Bail.getPdf = (id, result) => {
  db.query(
    "SELECT id, nomLegal, chambre, statut, pdf FROM bail_contrat WHERE id = ?",
    [Number(id)],
    (err, res) => (err ? result(err, null) : result(null, res[0] || null)),
  );
};

/** Pose la signature d'une partie. `role` vaut LOCATAIRE ou BAILLEUR. */
Bail.signer = (id, role, type, data, result) => {
  const prefixe = role === "BAILLEUR" ? "sigBailleur" : "sigLocataire";
  const champs = {
    [`${prefixe}Type`]: type,
    [`${prefixe}Data`]: data,
    [`${prefixe}Le`]: new Date(),
  };
  db.query(
    "UPDATE bail_contrat SET ? WHERE id = ?",
    [champs, Number(id)],
    (err) => (err ? result(err, null) : result(null, { success: true })),
  );
};

/** Enregistre le PDF final et clot le contrat. */
Bail.figer = (id, pdf, result) => {
  db.query(
    "UPDATE bail_contrat SET pdf = ?, pdfLe = ?, statut = 'SIGNE' WHERE id = ?",
    [pdf, new Date(), Number(id)],
    (err) => (err ? result(err, null) : result(null, { success: true })),
  );
};

Bail.delete = (id, result) => {
  db.query("DELETE FROM bail_contrat WHERE id = ?", [Number(id)], (err) =>
    err ? result(err, null) : result(null, { success: true }),
  );
};

module.exports = Bail;
