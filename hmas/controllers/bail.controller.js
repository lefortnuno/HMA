"use strict";
const crypto = require("crypto");
const Bail = require("../models/bail.model");
const Locataire = require("../models/locataire.model");
const { ADMIN, LOCATAIRE, estRole } = require("../middlewares/roles");

const sendErr = (res, err) =>
  res.status(500).send({ message: err.message || "Erreur serveur.", success: false });
const badRequest = (res, message) => res.status(400).send({ message, success: false });
const interdit = (res) =>
  res.status(403).send({ message: "Accès non autorisé.", success: false });

const estAdmin = (req) => estRole(req.user?.karazana, ADMIN);
const estLocataire = (req) => estRole(req.user?.karazana, LOCATAIRE);

/**
 * Qui signe quoi.
 *
 * L'admin signe en tant que bailleur ; un locataire ne peut signer que le
 * contrat de sa propre chambre, et seulement du cote locataire. Le role est
 * deduit du compte, jamais lu dans la requete : sinon n'importe qui pourrait
 * demander a signer a la place du bailleur.
 */
function roleDe(req, contrat) {
  if (estAdmin(req)) return "BAILLEUR";
  if (estLocataire(req) && req.user.locataireId === contrat.locataireId) {
    return "LOCATAIRE";
  }
  return null;
}

/** Met un contrat a la signature, en figeant les donnees du locataire. */
module.exports.creer = (req, res) => {
  const { locataireId, bailleurNom, bailleurCin } = req.body || {};
  if (!locataireId) return badRequest(res, "Locataire manquant.");

  Locataire.getById(locataireId, (err, loc) => {
    if (err) return sendErr(res, err);
    if (!loc) return badRequest(res, "Locataire introuvable.");

    const nomLegal =
      (loc.nomComplet && loc.nomComplet.trim()) ||
      `${loc.nom} ${loc.prenom || ""}`.trim();

    Bail.create(
      {
        locataireId: Number(locataireId),
        bienId: Number(loc.bienId) || 0,
        nomLegal,
        cin: (loc.cin || "").trim() || null,
        chambre: loc.chambre,
        etage: loc.etage,
        loyer: Number(loc.loyer) || 0,
        bailleurNom: bailleurNom || null,
        bailleurCin: bailleurCin || null,
        statut: "ATTENTE",
        codeVerif: crypto.randomBytes(6).toString("base64url"),
      },
      (err2, data) => (err2 ? sendErr(res, err2) : res.send(data)),
    );
  });
};

/** Suivi cote bailleur. */
module.exports.lister = (req, res) => {
  if (!estAdmin(req)) return interdit(res);
  Bail.getAll(req.query.bienId, (err, data) =>
    err ? sendErr(res, err) : res.send(data),
  );
};

/** Le contrat du locataire connecte, pour son espace personnel. */
module.exports.leMien = (req, res) => {
  const id = req.user.locataireId;
  if (!id) return res.send(null);
  Bail.getDuLocataire(id, (err, data) =>
    err ? sendErr(res, err) : res.send(data),
  );
};

/** Fiche complete : sert a rebatir le PDF avec les signatures deja posees. */
module.exports.detail = (req, res) => {
  Bail.getById(req.params.id, (err, contrat) => {
    if (err) return sendErr(res, err);
    if (!contrat) return badRequest(res, "Contrat introuvable.");
    if (!estAdmin(req) && req.user.locataireId !== contrat.locataireId) {
      return interdit(res);
    }
    res.send(contrat);
  });
};

module.exports.signer = (req, res) => {
  const { type, data } = req.body || {};
  if (!["DESSIN", "TEXTE"].includes(type)) {
    return badRequest(res, "Type de signature invalide.");
  }
  if (!data || !String(data).trim()) {
    return badRequest(res, "Signature vide.");
  }

  Bail.getById(req.params.id, (err, contrat) => {
    if (err) return sendErr(res, err);
    if (!contrat) return badRequest(res, "Contrat introuvable.");

    const role = roleDe(req, contrat);
    if (!role) return interdit(res);
    if (contrat.statut === "SIGNE") {
      return badRequest(res, "Ce contrat est déjà signé et clos.");
    }
    const deja =
      role === "BAILLEUR" ? contrat.sigBailleurLe : contrat.sigLocataireLe;
    if (deja) return badRequest(res, "Vous avez déjà signé ce contrat.");

    Bail.signer(req.params.id, role, type, String(data), (err2) => {
      if (err2) return sendErr(res, err2);
      // On renvoie l'etat a jour : le client sait alors s'il lui revient de
      // produire le PDF final (cas de la seconde signature).
      Bail.getById(req.params.id, (err3, maj) =>
        err3 ? sendErr(res, err3) : res.send({ success: true, role, contrat: maj }),
      );
    });
  });
};

/**
 * Fige le PDF final. N'est accepte qu'une fois les deux signatures posees,
 * et une seule fois : un contrat clos ne se remplace pas.
 */
module.exports.figer = (req, res) => {
  const { pdf } = req.body || {};
  if (!pdf || typeof pdf !== "string") return badRequest(res, "PDF manquant.");

  Bail.getById(req.params.id, (err, contrat) => {
    if (err) return sendErr(res, err);
    if (!contrat) return badRequest(res, "Contrat introuvable.");
    if (!roleDe(req, contrat)) return interdit(res);
    if (!contrat.sigLocataireLe || !contrat.sigBailleurLe) {
      return badRequest(res, "Les deux signatures sont requises.");
    }
    if (contrat.statut === "SIGNE") {
      return badRequest(res, "Ce contrat est déjà figé.");
    }
    Bail.figer(req.params.id, pdf, (err2) =>
      err2 ? sendErr(res, err2) : res.send({ success: true }),
    );
  });
};

/** Renvoie le PDF fige, en base64. */
module.exports.pdf = (req, res) => {
  Bail.getById(req.params.id, (err, contrat) => {
    if (err) return sendErr(res, err);
    if (!contrat) return badRequest(res, "Contrat introuvable.");
    if (!estAdmin(req) && req.user.locataireId !== contrat.locataireId) {
      return interdit(res);
    }
    Bail.getPdf(req.params.id, (err2, row) => {
      if (err2) return sendErr(res, err2);
      if (!row || !row.pdf) return badRequest(res, "Aucun PDF enregistré.");
      res.send({
        nomLegal: row.nomLegal,
        chambre: row.chambre,
        pdf: row.pdf,
      });
    });
  });
};

module.exports.supprimer = (req, res) => {
  if (!estAdmin(req)) return interdit(res);
  Bail.delete(req.params.id, (err, r) =>
    err ? sendErr(res, err) : res.send(r),
  );
};
