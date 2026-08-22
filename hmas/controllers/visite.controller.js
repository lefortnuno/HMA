"use strict";
const Visite = require("../models/visite.model");
const { sendErr } = require("../utils/http");

/**
 * Journal des connexions et de la navigation.
 *
 * Le point d'attention est la vitesse : l'enregistrement est appele a chaque
 * changement de page. Il repond donc immediatement, sans attendre l'ecriture
 * en base, et n'echoue jamais — au pire il ne trace pas.
 */

// Un journal ne doit rien dire du materiel : juste de quoi distinguer un
// telephone d'un ordinateur quand on relit l'historique.
function appareilDepuis(agent) {
  const a = String(agent || "");
  if (/Android/i.test(a)) return "Android";
  if (/iPhone|iPad|iPod/i.test(a)) return "iOS";
  if (/Windows/i.test(a)) return "Windows";
  if (/Mac OS/i.test(a)) return "macOS";
  if (/Linux/i.test(a)) return "Linux";
  return null;
}

/** Enregistre une page consultee. Ouvert a tout compte authentifie. */
module.exports.tracer = (req, res) => {
  // On repond avant d'ecrire : le client n'a aucune raison d'attendre.
  res.status(204).end();
  const u = req.user || {};
  Visite.enregistrer({
    utilisateurId: u.id,
    nom: `${u.nom || ""} ${u.prenom || ""}`.trim() || null,
    karazana: u.karazana,
    type: "PAGE",
    chemin: (req.body || {}).chemin,
    titre: (req.body || {}).titre,
    appareil: appareilDepuis(req.headers["user-agent"]),
  });
};

// La purge est declenchee par la consultation du journal, jamais par son
// ecriture : c'est une action rare et administrative, l'inverse d'un tracage.
let dernierePurge = 0;
const UNE_HEURE = 3600 * 1000;
const RETENTION_JOURS = 120;

module.exports.getJournal = (req, res) => {
  const maintenant = Date.now();
  if (maintenant - dernierePurge > UNE_HEURE) {
    dernierePurge = maintenant;
    Visite.purger(RETENTION_JOURS);
  }

  const { type, utilisateurId, limite, decalage, jours } = req.query;
  Visite.lister({ type, utilisateurId, limite, decalage }, (err, page) => {
    if (err) return sendErr(res, err);
    Visite.resume(jours, (err2, resume) => {
      if (err2) return sendErr(res, err2);
      Visite.pagesPopulaires(jours, (err3, pages) => {
        if (err3) return sendErr(res, err3);
        res.send({ ...page, resume, pages, retentionJours: RETENTION_JOURS });
      });
    });
  });
};

// Utilise par le controleur d'authentification, hors requete HTTP dediee.
module.exports.tracerConnexion = (utilisateur, agent) => {
  Visite.enregistrer({
    utilisateurId: utilisateur.id,
    nom: `${utilisateur.nom || ""} ${utilisateur.prenom || ""}`.trim() || null,
    karazana: utilisateur.karazana,
    type: "CONNEXION",
    chemin: "/signin/",
    titre: "Connexion",
    appareil: appareilDepuis(agent),
  });
};
