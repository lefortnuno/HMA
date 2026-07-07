"use strict";
/**
 * Reponses d'erreur generiques : on log le detail cote serveur,
 * mais on ne renvoie JAMAIS l'erreur SQL brute au client
 * (elle revele la structure de la base).
 */
module.exports.sendErr = (res, err, message) => {
  console.error("[API ERROR]", (err && err.code) || "", (err && err.message) || err);
  res.status(500).send({ success: false, message: message || "Erreur serveur." });
};

module.exports.badRequest = (res, message) => {
  res.status(400).send({ success: false, message });
};
