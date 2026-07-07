"use strict";
const Bien = require("../models/bien.model");
const { sendErr } = require("../utils/http");

module.exports.getAllBiens = (req, res) => {
  const { type, disponible } = req.query;
  Bien.getAll({ type, disponible }, (err, data) => {
    if (err) sendErr(res, err);
    else res.send(data);
  });
};

module.exports.getBienById = (req, res) => {
  Bien.getById(req.params.id, (err, data) => {
    if (err) sendErr(res, err);
    else if (!data) res.status(404).send({ message: "Bien introuvable" });
    else res.send(data);
  });
};

module.exports.createBien = (req, res) => {
  const { type, titre, description, prix, surface, localisation, disponible, nbChambres, nbPieces, photos, caracteristiques } = req.body;
  const data = { type, titre, description: description || null, prix, surface: surface || null, localisation: localisation || null, disponible: disponible ? 1 : 0, nbChambres: nbChambres || null, nbPieces: nbPieces || null, photos: photos || [], caracteristiques: caracteristiques || [] };
  Bien.create(data, (err, result) => {
    if (err) sendErr(res, err);
    else res.send(result);
  });
};

module.exports.updateBien = (req, res) => {
  const { type, titre, description, prix, surface, localisation, disponible, nbChambres, nbPieces, photos, caracteristiques } = req.body;
  const data = { type, titre, description: description || null, prix, surface: surface || null, localisation: localisation || null, disponible: disponible ? 1 : 0, nbChambres: nbChambres || null, nbPieces: nbPieces || null, photos: photos || [], caracteristiques: caracteristiques || [] };
  Bien.update(req.params.id, data, (err, result) => {
    if (err) sendErr(res, err);
    else res.send(result);
  });
};

module.exports.deleteBien = (req, res) => {
  Bien.delete(req.params.id, (err, result) => {
    if (err) sendErr(res, err);
    else res.send(result);
  });
};
