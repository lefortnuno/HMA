"use strict";
const db = require("../config/db");

/**
 * Acces aux donnees du budget OTIP. MODULE TEMPORAIRE (voir utils/otip.js).
 *
 * Les six sections du budget partagent une seule table : leurs colonnes se
 * recouvrent largement, et un CRUD unique vaut mieux que six presque
 * identiques — a ecrire comme a supprimer.
 */
const Otip = {};

// Colonnes qu'une ecriture est autorisee a toucher. Tout le reste est ignore :
// le client ne choisit ni l'id ni la table.
const CHAMPS = [
  "section", "libelle", "contact", "montant", "montant2",
  "mois", "moisRemb", "statut", "notes", "ordre", "finDeMois",
];

const filtrer = (data, champs) => {
  const out = {};
  champs.forEach((c) => {
    if (data[c] !== undefined) out[c] = data[c] === "" ? null : data[c];
  });
  return out;
};

Otip.getLignes = (result) => {
  db.query(
    "SELECT * FROM otip_ligne ORDER BY FIELD(section,'LIQUIDITE','CREANCE','EMPRUNT','REVENU','FIXE','PONCTUELLE'), ordre, id",
    (err, res) => (err ? result(err, null) : result(null, res)),
  );
};

Otip.createLigne = (data, result) => {
  const ligne = filtrer(data, CHAMPS);
  ligne.montant = Number(ligne.montant) || 0;
  ligne.montant2 = Number(ligne.montant2) || 0;
  db.query("INSERT INTO otip_ligne SET ?", ligne, (err, res) =>
    err ? result(err, null) : result(null, { id: res.insertId, ...ligne }),
  );
};

Otip.updateLigne = (id, data, result) => {
  const champs = filtrer(data, CHAMPS);
  if (!Object.keys(champs).length) return result(null, { success: true });
  db.query("UPDATE otip_ligne SET ? WHERE id=?", [champs, id], (err) =>
    err ? result(err, null) : result(null, { success: true, id: Number(id), ...champs }),
  );
};

Otip.deleteLigne = (id, result) => {
  db.query("DELETE FROM otip_ligne WHERE id=?", [id], (err) =>
    err ? result(err, null) : result(null, { success: true }),
  );
};

// ── Depenses journalieres ──────────────────────────────────────────────────
const CHAMPS_DEP = ["date", "categorie", "description", "montant"];

Otip.getDepenses = (result) => {
  db.query(
    "SELECT * FROM otip_depense ORDER BY date DESC, id DESC",
    (err, res) => (err ? result(err, null) : result(null, res)),
  );
};

Otip.createDepense = (data, result) => {
  const d = filtrer(data, CHAMPS_DEP);
  d.montant = Number(d.montant) || 0;
  db.query("INSERT INTO otip_depense SET ?", d, (err, res) =>
    err ? result(err, null) : result(null, { id: res.insertId, ...d }),
  );
};

Otip.updateDepense = (id, data, result) => {
  const champs = filtrer(data, CHAMPS_DEP);
  if (!Object.keys(champs).length) return result(null, { success: true });
  db.query("UPDATE otip_depense SET ? WHERE id=?", [champs, id], (err) =>
    err ? result(err, null) : result(null, { success: true }),
  );
};

Otip.deleteDepense = (id, result) => {
  db.query("DELETE FROM otip_depense WHERE id=?", [id], (err) =>
    err ? result(err, null) : result(null, { success: true }),
  );
};

// ── Parametres (objectif, libelles des deux periodes...) ───────────────────
Otip.getParams = (result) => {
  db.query("SELECT * FROM otip_param", (err, res) => {
    if (err) return result(err, null);
    const o = {};
    (res || []).forEach((r) => (o[r.cle] = r.valeur));
    result(null, o);
  });
};

Otip.setParam = (cle, valeur, result) => {
  db.query(
    "INSERT INTO otip_param SET ? ON DUPLICATE KEY UPDATE valeur=VALUES(valeur)",
    { cle, valeur: valeur === "" ? null : valeur },
    (err) => (err ? result(err, null) : result(null, { success: true, cle, valeur })),
  );
};

module.exports = Otip;
