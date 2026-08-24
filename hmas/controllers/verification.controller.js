"use strict";
const crypto = require("crypto");
const Verification = require("../models/verification.model");

const TYPES = ["RECU", "BAIL"];

// Court, lisible, suffisamment aléatoire pour ne pas être devinable.
function genererCode() {
  return crypto.randomBytes(6).toString("base64url");
}

module.exports.creer = (req, res) => {
  const { type, bienId, titre, details } = req.body || {};
  if (!TYPES.includes(type)) return res.status(400).json({ error: "type invalide" });

  Verification.create(
    { code: genererCode(), type, bienId, titre, details, creeParId: req.user?.id || null },
    (err, data) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(data);
    }
  );
};

// Public — pas de middleware d'auth : c'est justement ce que le visiteur
// scanne sans être connecté.
module.exports.getByCode = (req, res) => {
  Verification.getByCode(req.params.code, (err, doc) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!doc) return res.status(404).json({ error: "Document introuvable" });
    res.json(doc);
  });
};
