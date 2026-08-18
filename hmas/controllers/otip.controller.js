"use strict";
const Otip = require("../models/otip.model");
const O = require("../utils/otip");
const { sendErr, badRequest } = require("../utils/http");

/**
 * Budget OTIP. MODULE TEMPORAIRE (voir utils/otip.js).
 *
 * Le previsionnel est calcule ici et non dans le navigateur : c'est la meme
 * chaine que le classeur, elle est testee (tests/otip.test.js), et l'export
 * comme l'affichage doivent en donner le meme resultat.
 */

const PARAMS_AUTORISES = ["objectif", "periode1", "periode2", "titre", "echeance"];

/** Etat complet : lignes, depenses, parametres et previsionnel. */
module.exports.getTout = (req, res) => {
  Otip.getLignes((err, lignes) => {
    if (err) return sendErr(res, err);
    Otip.getDepenses((err2, depenses) => {
      if (err2) return sendErr(res, err2);
      Otip.getParams((err3, params) => {
        if (err3) return sendErr(res, err3);
        // DECIMAL revient en chaine avec le driver mysql : on normalise ici
        // pour que le calcul et le client manipulent bien des nombres.
        const num = (l) => ({
          ...l,
          montant: Number(l.montant),
          montant2: Number(l.montant2),
        });
        const L = (lignes || []).map(num);
        const D = (depenses || []).map((d) => ({ ...d, montant: Number(d.montant) }));
        res.send({
          lignes: L,
          depenses: D,
          params,
          calcul: O.calculer(L, D, {
            objectif: Number(params.objectif),
            periode1: params.periode1,
            periode2: params.periode2,
          }),
        });
      });
    });
  });
};

// ── Lignes de budget ───────────────────────────────────────────────────────
module.exports.createLigne = (req, res) => {
  const { section, libelle } = req.body || {};
  if (!O.isSectionValide(section)) return badRequest(res, "Section inconnue.");
  if (!libelle || !String(libelle).trim()) return badRequest(res, "Libellé requis.");
  Otip.createLigne(req.body, (err, r) => (err ? sendErr(res, err) : res.send(r)));
};

module.exports.updateLigne = (req, res) => {
  const { id } = req.params;
  if (!id || Number.isNaN(Number(id))) return badRequest(res, "Ligne invalide.");
  if (req.body.section !== undefined && !O.isSectionValide(req.body.section))
    return badRequest(res, "Section inconnue.");
  Otip.updateLigne(id, req.body || {}, (err, r) => (err ? sendErr(res, err) : res.send(r)));
};

module.exports.deleteLigne = (req, res) => {
  const { id } = req.params;
  if (!id || Number.isNaN(Number(id))) return badRequest(res, "Ligne invalide.");
  Otip.deleteLigne(id, (err, r) => (err ? sendErr(res, err) : res.send(r)));
};

// ── Depenses journalieres ──────────────────────────────────────────────────
module.exports.createDepense = (req, res) => {
  const { montant } = req.body || {};
  if (montant === undefined || Number.isNaN(Number(montant)))
    return badRequest(res, "Montant invalide.");
  Otip.createDepense(req.body, (err, r) => (err ? sendErr(res, err) : res.send(r)));
};

module.exports.updateDepense = (req, res) => {
  const { id } = req.params;
  if (!id || Number.isNaN(Number(id))) return badRequest(res, "Dépense invalide.");
  Otip.updateDepense(id, req.body || {}, (err, r) => (err ? sendErr(res, err) : res.send(r)));
};

module.exports.deleteDepense = (req, res) => {
  const { id } = req.params;
  if (!id || Number.isNaN(Number(id))) return badRequest(res, "Dépense invalide.");
  Otip.deleteDepense(id, (err, r) => (err ? sendErr(res, err) : res.send(r)));
};

// ── Parametres ─────────────────────────────────────────────────────────────
module.exports.setParam = (req, res) => {
  const { cle, valeur } = req.body || {};
  if (!PARAMS_AUTORISES.includes(cle)) return badRequest(res, "Paramètre inconnu.");
  Otip.setParam(cle, valeur, (err, r) => (err ? sendErr(res, err) : res.send(r)));
};
