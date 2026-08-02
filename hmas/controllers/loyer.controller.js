"use strict";
const Locataire  = require("../models/locataire.model");
const Facture    = require("../models/facture.model");
const Paiement   = require("../models/paiement.model");
const Depense    = require("../models/depense.model");
const Occupation = require("../models/occupation.model");
const Validation = require("../models/validation.model");
const { sendErr, badRequest } = require("../utils/http");
const V = require("../utils/calc");
const Compte = require("../utils/compte");
const PaiementHisto = require("../models/paiementhisto.model");


const isAdmin = (req) => req.user && Number(req.user.karazana) === 1;
const auteurDe = (req) => ({
  auteurId: req.user ? req.user.id : 0,
  auteurNom: req.user ? `${req.user.nom} ${req.user.prenom || ""}`.trim() : "?",
});

// ─── Locataires ───────────────────────────────────────────────
module.exports.getAllLocataires = (req, res) => {
  Locataire.getAll(req.query.bienId, (err, data) => {
    if (err) sendErr(res, err);
    else res.send(data);
  });
};

function valideLocataire(body) {
  const { nom, chambre, etage, loyer, caution, bienId, photo } = body;
  if (!nom || !String(nom).trim()) return "Le nom est requis.";
  if (photo && String(photo).length > 700000) return "Photo trop lourde (max ~500 Ko).";
  if (!V.isEtageValide(etage)) return "Étage invalide (RDC ou 1ER).";
  if (!V.isChambreValide(chambre, etage, Number(bienId) || 0))
    return "Chambre invalide pour cet étage/appartement.";
  if (!V.isMontantValide(loyer)) return "Loyer invalide (montant positif requis).";
  if (caution !== undefined && caution !== "" && !V.isMontantValide(caution))
    return "Caution invalide (montant positif requis).";
  return null;
}

// Execution reelle d'un ajout (utilisee en direct par l'admin,
// ou au moment de l'approbation d'une demande de simple user).
function execCreateLocataire(data, cb) {
  Locataire.create(data, (err, result) => {
    if (err) return cb(err);
    Occupation.log({
      locataireId: result.id, nom: data.nom, prenom: data.prenom,
      chambre: data.chambre, etage: data.etage, bienId: data.bienId,
      action: "ENTREE", details: `Entrée — chambre ${data.chambre} (${data.etage})`,
    });
    // Compte de connexion cree automatiquement : le code a 4 chiffres est
    // renvoye UNE SEULE FOIS pour etre transmis au locataire.
    Compte.creerPourLocataire({ id: result.id, ...data }, (errC, compte) => {
      if (errC) console.error("[compte locataire]", errC.message);
      cb(null, compte ? { ...result, compte } : result);
    });
  });
}

function normaliseLocataire(body) {
  const { nom, prenom, chambre, etage, loyer, tel, email, dateEntree, actif, bienId, caution, photo, messengerId, jourPaiement, modePaiement } = body;
  return {
    nom, prenom, chambre, etage, loyer, tel, email,
    dateEntree: dateEntree || null,
    actif: actif ? 1 : 0,
    bienId: Number(bienId) || 0,
    caution: Number(caution) || 0,
    photo: photo || null, // data URL base64 ou avatar predefini
    messengerId: messengerId || null, // identifiant de conversation Messenger
    // Jour habituel de reglement (1 a 31), null si non renseigne.
    jourPaiement: jourPaiement ? Math.min(31, Math.max(1, Number(jourPaiement))) : null,
    // ECHU : il consomme puis il paie (le mois M se regle au mois M+1).
    // AVANCE : il paie puis il consomme (le mois M se regle dans le mois M).
    modePaiement: String(modePaiement).toUpperCase() === "AVANCE" ? "AVANCE" : "ECHU",
    // Forfait mensuel JIRAMA (null = facturation au releve du compteur).
    jiramaForfait:
      body.jiramaForfait === "" || body.jiramaForfait === undefined || body.jiramaForfait === null
        ? null
        : Math.max(0, Number(body.jiramaForfait) || 0),
  };
}

module.exports.createLocataire = (req, res) => {
  const erreur = valideLocataire(req.body);
  if (erreur) return badRequest(res, erreur);
  const data = normaliseLocataire(req.body);

  const proceed = () => {
    if (isAdmin(req)) {
      execCreateLocataire(data, (err, result) => {
        if (err) return sendErr(res, err);
        res.send(result);
      });
    } else {
      // Simple user : la demande part en validation admin.
      Validation.create(
        { entite: "LOCATAIRE", action: "AJOUT", entiteId: null, avant: null, apres: data, ...auteurDe(req) },
        (err, result) => {
          if (err) return sendErr(res, err);
          res.status(202).send({
            ...result,
            message: "Demande d'ajout envoyée à l'admin pour validation.",
          });
        }
      );
    }
  };

  // Une chambre occupee (locataire actif) ne peut pas recevoir un 2e actif (dans le meme appart).
  if (data.actif) {
    Locataire.findActiveInChambre(data.chambre, data.etage, data.bienId, null, (err, occupant) => {
      if (err) return sendErr(res, err);
      if (occupant)
        return res.status(409).send({
          success: false,
          message: `La chambre ${data.chambre} (${data.etage}) est déjà occupée par ${occupant.nom}.`,
        });
      proceed();
    });
  } else {
    proceed();
  }
};

// Execution reelle d'une modification (+ log occupation).
function execUpdateLocataire(id, data, avant, cb) {
  Locataire.update(id, data, (err, result) => {
    if (err) return cb(err);
    if (avant) {
      if (avant.actif && !data.actif) {
        // Depart du locataire : sa fiche et son historique restent, mais son
        // compte de connexion est retire (il n'habite plus le logement).
        Compte.supprimerPourLocataire(id, () => {});
        Occupation.log({
          locataireId: +id, nom: data.nom, prenom: data.prenom,
          chambre: avant.chambre, etage: avant.etage, bienId: data.bienId,
          action: "SORTIE", details: `Sortie — chambre ${avant.chambre} (${avant.etage})`,
        });
      } else if (avant.chambre !== data.chambre || avant.etage !== data.etage) {
        Occupation.log({
          locataireId: +id, nom: data.nom, prenom: data.prenom,
          chambre: data.chambre, etage: data.etage, bienId: data.bienId,
          action: "MODIFICATION",
          details: `Changement : ${avant.chambre} (${avant.etage}) → ${data.chambre} (${data.etage})`,
        });
      } else if (!avant.actif && data.actif) {
        Occupation.log({
          locataireId: +id, nom: data.nom, prenom: data.prenom,
          chambre: data.chambre, etage: data.etage, bienId: data.bienId,
          action: "ENTREE", details: `Réactivation — chambre ${data.chambre} (${data.etage})`,
        });
      }
    }
    cb(null, result);
  });
}

// Execution reelle d'une suppression (+ log occupation).
function execDeleteLocataire(id, avant, cb) {
  // Le compte de connexion du locataire disparait avec sa fiche.
  Compte.supprimerPourLocataire(id, () => {});
  Locataire.delete(id, (err, result) => {
    if (err) return cb(err);
    if (avant) {
      Occupation.log({
        locataireId: +id, nom: avant.nom, prenom: avant.prenom,
        chambre: avant.chambre, etage: avant.etage, bienId: avant.bienId || 0,
        action: "SORTIE", details: `Suppression — chambre ${avant.chambre} (${avant.etage})`,
      });
    }
    cb(null, result);
  });
}

module.exports.updateLocataire = (req, res) => {
  const erreur = valideLocataire(req.body);
  if (erreur) return badRequest(res, erreur);
  const data = normaliseLocataire(req.body);

  const proceed = (avant) => {
    if (isAdmin(req)) {
      execUpdateLocataire(req.params.id, data, avant, (err, result) => {
        if (err) return sendErr(res, err);
        res.send(result);
      });
    } else {
      Validation.create(
        {
          entite: "LOCATAIRE", action: "MODIFICATION", entiteId: +req.params.id,
          avant: avant || null, apres: data, ...auteurDe(req),
        },
        (err, result) => {
          if (err) return sendErr(res, err);
          res.status(202).send({
            ...result,
            message: "Demande de modification envoyée à l'admin pour validation.",
          });
        }
      );
    }
  };

  const verifier = (avant) => {
    if (data.actif) {
      Locataire.findActiveInChambre(data.chambre, data.etage, data.bienId, req.params.id, (err, occupant) => {
        if (err) return sendErr(res, err);
        if (occupant)
          return res.status(409).send({
            success: false,
            message: `La chambre ${data.chambre} (${data.etage}) est déjà occupée par ${occupant.nom}.`,
          });
        proceed(avant);
      });
    } else {
      proceed(avant);
    }
  };

  Locataire.getById(req.params.id, (errAvant, avant) => {
    verifier(errAvant ? null : avant);
  });
};

module.exports.deleteLocataire = (req, res) => {
  Locataire.getById(req.params.id, (errAvant, avant) => {
    if (isAdmin(req)) {
      execDeleteLocataire(req.params.id, errAvant ? null : avant, (err, result) => {
        if (err) return sendErr(res, err);
        res.send(result);
      });
    } else {
      Validation.create(
        {
          entite: "LOCATAIRE", action: "SUPPRESSION", entiteId: +req.params.id,
          avant: errAvant ? null : avant, apres: null, ...auteurDe(req),
        },
        (err, result) => {
          if (err) return sendErr(res, err);
          res.status(202).send({
            ...result,
            message: "Demande de suppression envoyée à l'admin pour validation.",
          });
        }
      );
    }
  });
};

// ─── Demandes de validation (workflow admin) ─────────────────
module.exports.getValidations = (req, res) => {
  // Admin : tout voir. Simple user : uniquement ses demandes.
  const auteurId = isAdmin(req) ? null : req.user.id;
  Validation.getAll(auteurId, (err, data) => {
    if (err) sendErr(res, err);
    else res.send(data);
  });
};

module.exports.countValidations = (req, res) => {
  Validation.countPending((err, data) => {
    if (err) sendErr(res, err);
    else res.send(data);
  });
};

module.exports.decideValidation = (req, res) => {
  const decision = req.body.decision; // "APPROUVE" | "REFUSE"
  if (!["APPROUVE", "REFUSE"].includes(decision))
    return badRequest(res, "Décision invalide.");

  Validation.getById(req.params.id, (err, demande) => {
    if (err) return sendErr(res, err);
    if (!demande) return res.status(404).send({ success: false, message: "Demande introuvable." });
    if (demande.statut !== "EN_ATTENTE")
      return badRequest(res, "Cette demande a déjà été traitée.");

    const decideurNom = auteurDe(req).auteurNom;
    const marquer = (cb) => Validation.decide(req.params.id, decision, decideurNom, cb);

    if (decision === "REFUSE") {
      return marquer((err2) => {
        if (err2) return sendErr(res, err2);
        res.send({ success: true, statut: "REFUSE" });
      });
    }

    // APPROUVE : executer l'action demandee.
    const finir = (err2) => {
      if (err2) return sendErr(res, err2);
      marquer((err3) => {
        if (err3) return sendErr(res, err3);
        res.send({ success: true, statut: "APPROUVE" });
      });
    };

    // ── Paiements : upsert du paiement demande ──
    if (demande.entite === "PAIEMENT") {
      const a = demande.apres || {};
      const data = {
        locataireId: a.locataireId,
        mois: a.mois,
        annee: a.annee,
        montantLoyer: a.montantLoyer,
        montantJIRAMA: a.montantJIRAMA || 0,
        statut: a.statut,
        statutJIRAMA: a.statutJIRAMA || (a.montantJIRAMA > 0 ? "PAYE" : "IMPAYE"),
        datePaiement: a.datePaiement ? String(a.datePaiement).split("T")[0] : null,
      };
      if (!data.locataireId) return badRequest(res, "Demande de paiement invalide.");
      // L'ecriture est portee au journal au nom de l'admin qui approuve,
      // avec le demandeur rappele en clair.
      return execUpsertPaiement(data, finir, {
        id: req.user.id,
        nom: `${decideurNom} (validation de ${demande.auteurNom || "?"})`,
      });
    }

    // ── Code oublie ──
    // Approuver coupe l'acces : l'ancien code est remplace par un code
    // aleatoire que personne ne connait, et le compte repasse en "code neuf".
    // L'admin transmet ensuite un vrai code via le bouton Acces, qui
    // reapparait justement dans la page Utilisateurs.
    if (demande.entite === "ACCES") {
      const Compte = require("../utils/compte");
      const bcrypt = require("bcrypt");
      const db = require("../config/db");
      return db.query(
        "UPDATE mpampiasa SET pwd = ?, mdpTemporaire = 1 WHERE id = ?",
        [bcrypt.hashSync(Compte.codeAleatoire(), 10), demande.entiteId],
        (e) => finir(e)
      );
    }

    // ── Reglement interieur ──
    if (demande.entite === "REGLEMENT") {
      if (demande.action === "SUPPRESSION")
        return Reglement.delete(demande.entiteId, finir);
      if (demande.action === "MODIFICATION")
        return Reglement.update(demande.entiteId, demande.apres, finir);
      return Reglement.prochainOrdre((e, ordre) => {
        if (e) return sendErr(res, e);
        Reglement.create(
          { ...demande.apres, ordre, auteurNom: demande.auteurNom || null },
          finir
        );
      });
    }

    // ── Comptes : modification de profil demandee par un locataire ──
    // Sans cette branche, entiteId (un id de compte) etait pris pour un id de
    // locataire et l'approbation echouait sur une mise a jour impossible.
    if (demande.entite === "COMPTE") {
      const a = demande.apres || {};
      const Utilisateur = require("../models/utilisateur.model");
      return Utilisateur.updateProfil(
        demande.entiteId,
        { nom: a.nom, prenom: a.prenom, photo: a.photo },
        finir
      );
    }

    // ── Locataires ──
    if (demande.action === "AJOUT") {
      const data = demande.apres;
      // La chambre a pu etre prise entre-temps : re-verifier.
      if (data.actif) {
        Locataire.findActiveInChambre(data.chambre, data.etage, data.bienId, null, (e, occupant) => {
          if (e) return sendErr(res, e);
          if (occupant)
            return res.status(409).send({
              success: false,
              message: `Impossible d'approuver : la chambre ${data.chambre} est maintenant occupée par ${occupant.nom}.`,
            });
          execCreateLocataire(data, finir);
        });
      } else {
        execCreateLocataire(data, finir);
      }
    } else if (demande.action === "MODIFICATION") {
      const data = demande.apres;
      Locataire.getById(demande.entiteId, (e, avant) => {
        if (data.actif) {
          Locataire.findActiveInChambre(data.chambre, data.etage, data.bienId, demande.entiteId, (e2, occupant) => {
            if (e2) return sendErr(res, e2);
            if (occupant)
              return res.status(409).send({
                success: false,
                message: `Impossible d'approuver : la chambre ${data.chambre} est occupée par ${occupant.nom}.`,
              });
            execUpdateLocataire(demande.entiteId, data, e ? null : avant, finir);
          });
        } else {
          execUpdateLocataire(demande.entiteId, data, e ? null : avant, finir);
        }
      });
    } else if (demande.action === "SUPPRESSION") {
      Locataire.getById(demande.entiteId, (e, avant) => {
        execDeleteLocataire(demande.entiteId, e ? null : avant, finir);
      });
    } else {
      badRequest(res, "Type d'action inconnu.");
    }
  });
};

// ─── Règlement intérieur ──────────────────────────────────────
// Visible de tous (locataires compris). L'admin gere directement ;
// utilisateurs et locataires proposent, l'admin tranche.
const Reglement = require("../models/reglement.model");

function valideRegle(body) {
  const titre = String(body.titre || "").trim();
  const texte = String(body.texte || "").trim();
  if (titre.length < 3) return "Le titre est trop court.";
  if (titre.length > 160) return "Le titre est trop long (160 caractères max).";
  if (texte.length < 10) return "Détaillez un peu la règle (10 caractères min).";
  if (texte.length > 2000) return "Règle trop longue (2000 caractères max).";
  return null;
}

const normaliseRegle = (body) => ({
  titre: String(body.titre).trim(),
  texte: String(body.texte).trim(),
  icone: body.icone ? String(body.icone).slice(0, 40) : null,
  actif: body.actif === undefined ? 1 : body.actif ? 1 : 0,
});

module.exports.getReglements = (req, res) => {
  // Seul l'admin voit les règles désactivées.
  Reglement.getAll(!isAdmin(req), (err, data) => {
    if (err) sendErr(res, err);
    else res.send(data);
  });
};

module.exports.createReglement = (req, res) => {
  const erreur = valideRegle(req.body);
  if (erreur) return badRequest(res, erreur);
  const data = normaliseRegle(req.body);

  if (!isAdmin(req)) {
    return Validation.create(
      { entite: "REGLEMENT", action: "AJOUT", entiteId: null, avant: null, apres: data, ...auteurDe(req) },
      (err, result) => {
        if (err) return sendErr(res, err);
        res.status(202).send({
          ...result,
          message: "Proposition envoyée : le propriétaire la validera.",
        });
      }
    );
  }

  Reglement.prochainOrdre((err, ordre) => {
    if (err) return sendErr(res, err);
    Reglement.create(
      { ...data, ordre: req.body.ordre || ordre, auteurNom: auteurDe(req).auteurNom },
      (err2, result) => {
        if (err2) sendErr(res, err2);
        else res.send(result);
      }
    );
  });
};

module.exports.updateReglement = (req, res) => {
  const erreur = valideRegle(req.body);
  if (erreur) return badRequest(res, erreur);
  const data = normaliseRegle(req.body);
  if (req.body.ordre !== undefined) data.ordre = Number(req.body.ordre) || 0;

  Reglement.getById(req.params.id, (err, avant) => {
    if (err) return sendErr(res, err);
    if (!avant) return res.status(404).send({ success: false, message: "Règle introuvable." });

    if (!isAdmin(req)) {
      return Validation.create(
        {
          entite: "REGLEMENT", action: "MODIFICATION",
          entiteId: Number(req.params.id), avant, apres: data, ...auteurDe(req),
        },
        (err2, result) => {
          if (err2) return sendErr(res, err2);
          res.status(202).send({
            ...result,
            message: "Modification envoyée : le propriétaire la validera.",
          });
        }
      );
    }

    Reglement.update(req.params.id, data, (err2, result) => {
      if (err2) sendErr(res, err2);
      else res.send(result);
    });
  });
};

module.exports.deleteReglement = (req, res) => {
  Reglement.getById(req.params.id, (err, avant) => {
    if (err) return sendErr(res, err);
    if (!avant) return res.status(404).send({ success: false, message: "Règle introuvable." });

    if (!isAdmin(req)) {
      return Validation.create(
        {
          entite: "REGLEMENT", action: "SUPPRESSION",
          entiteId: Number(req.params.id), avant, apres: null, ...auteurDe(req),
        },
        (err2, result) => {
          if (err2) return sendErr(res, err2);
          res.status(202).send({
            ...result,
            message: "Demande de retrait envoyée à l'admin pour validation.",
          });
        }
      );
    }

    Reglement.delete(req.params.id, (err2, result) => {
      if (err2) sendErr(res, err2);
      else res.send(result);
    });
  });
};

// ─── Historique d'occupation ──────────────────────────────────
module.exports.getHistorique = (req, res) => {
  Occupation.getAll(req.query.bienId, (err, data) => {
    if (err) sendErr(res, err);
    else res.send(data);
  });
};

// ─── Factures JIRAMA ──────────────────────────────────────────
module.exports.getFacture = (req, res) => {
  const { mois, annee, bienId } = req.query;
  if (!V.isAnneeValide(annee)) return badRequest(res, "Année invalide.");
  if (mois !== undefined && mois !== "" && !V.isMoisValide(mois))
    return badRequest(res, "Mois invalide (1-12).");
  Facture.getByMoisAnnee(mois, annee, bienId, (err, data) => {
    if (err) sendErr(res, err);
    else res.send(data);
  });
};

function validesConsommations(consommations) {
  if (!consommations) return null;
  for (const c of consommations) {
    if (!V.isMontantValide(c.indexPrev) || !V.isMontantValide(c.indexCurr))
      return "Index de consommation invalide (valeurs positives requises).";
    if (!V.isMontantValide(c.montantJIRAMA))
      return "Montant JIRAMA invalide.";
  }
  return null;
}

module.exports.createFacture = (req, res) => {
  const { mois, annee, prixUnitaire, montantTotal, dateFacture, consommations, bienId } = req.body;
  if (!V.isMoisValide(mois)) return badRequest(res, "Mois invalide (1-12).");
  if (!V.isAnneeValide(annee)) return badRequest(res, "Année invalide.");
  if (!V.isMontantValide(prixUnitaire)) return badRequest(res, "Prix unitaire invalide.");
  if (montantTotal !== undefined && !V.isMontantValide(montantTotal))
    return badRequest(res, "Montant total invalide.");
  const errConso = validesConsommations(consommations);
  if (errConso) return badRequest(res, errConso);

  Facture.create({ mois, annee, prixUnitaire, montantTotal, dateFacture, bienId }, (err, fact) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).send({ message: "Une facture existe déjà pour ce mois/année. Utilisez la mise à jour.", success: false });
      }
      return sendErr(res, err);
    }

    if (!consommations || consommations.length === 0) return res.send({ ...fact, success: true });

    let done = 0;
    consommations.forEach((c) => {
      const row = {
        locataireId: c.locataireId,
        factureId: fact.id,
        indexPrev: c.indexPrev || 0,
        indexCurr: c.indexCurr || 0,
        consommation: c.consommation || 0,
        montantJIRAMA: c.montantJIRAMA || 0,
      };
      Facture.insertConso(row, () => {
        done++;
        if (done === consommations.length) res.send({ success: true, id: fact.id });
      });
    });
  });
};

module.exports.updateFacture = (req, res) => {
  const { prixUnitaire, montantTotal, dateFacture, consommations } = req.body;
  const id = req.params.id;
  if (!V.isMontantValide(prixUnitaire)) return badRequest(res, "Prix unitaire invalide.");
  if (montantTotal !== undefined && !V.isMontantValide(montantTotal))
    return badRequest(res, "Montant total invalide.");
  const errConso = validesConsommations(consommations);
  if (errConso) return badRequest(res, errConso);

  Facture.update(id, { prixUnitaire, montantTotal, dateFacture }, (err) => {
    if (err) return sendErr(res, err);

    if (!consommations || consommations.length === 0) return res.send({ success: true });

    Facture.deleteConsos(id, (err2) => {
      if (err2) return sendErr(res, err2);

      let done = 0;
      consommations.forEach((c) => {
        const row = {
          locataireId: c.locataireId,
          factureId: id,
          indexPrev: c.indexPrev || 0,
          indexCurr: c.indexCurr || 0,
          consommation: c.consommation || 0,
          montantJIRAMA: c.montantJIRAMA || 0,
        };
        Facture.insertConso(row, () => {
          done++;
          if (done === consommations.length) res.send({ success: true });
        });
      });
    });
  });
};

// ─── Paiements ────────────────────────────────────────────────
module.exports.getPaiements = (req, res) => {
  const { annee } = req.query;
  if (!V.isAnneeValide(annee)) return badRequest(res, "Année invalide.");
  Paiement.getByAnnee(annee, (err, data) => {
    if (err) sendErr(res, err);
    else res.send(data);
  });
};

// Upsert reel d'un paiement (admin direct, ou approbation d'une demande).
function execUpsertPaiement(data, cb, auteur) {
  // Chaque ecriture est journalisee : sans cela, un reglement attribue au
  // mauvais locataire est impossible a retracer apres coup.
  const journaliser = (action, paiementId, avant) =>
    Locataire.getById(data.locataireId, (e, loc) => {
      PaiementHisto.log({
        paiementId: paiementId || null,
        locataireId: data.locataireId,
        locataireNom: loc ? `${loc.nom} ${loc.prenom || ""}`.trim() : null,
        chambre: loc ? loc.chambre : null,
        etage: loc ? loc.etage : null,
        mois: data.mois,
        annee: data.annee,
        action,
        montantLoyer: data.montantLoyer || 0,
        montantJIRAMA: data.montantJIRAMA || 0,
        statut: data.statut,
        avant: avant || null,
        auteurId: auteur ? auteur.id : null,
        auteurNom: auteur ? auteur.nom : null,
      });
    });

  Paiement.getExisting(data.locataireId, data.mois, data.annee, (err, existing) => {
    if (err) return cb(err);
    if (existing) {
      Paiement.update(existing.id, data, (err2, result) => {
        if (err2) return cb(err2);
        journaliser("MODIFICATION", existing.id, {
          montantLoyer: existing.montantLoyer,
          montantJIRAMA: existing.montantJIRAMA,
          statut: existing.statut,
        });
        cb(null, { ...result, id: existing.id });
      });
    } else {
      Paiement.create(data, (err2, result) => {
        if (err2) return cb(err2);
        journaliser("AJOUT", result ? result.id : null, null);
        cb(null, result);
      });
    }
  });
}

// Enrichit la demande avec le nom/chambre du locataire (affichage notifications).
function metaLocataire(locataireId, cb) {
  Locataire.getById(locataireId, (err, loc) => {
    if (err || !loc) return cb({});
    cb({ locataireNom: `${loc.nom} ${loc.prenom || ""}`.trim(), chambre: loc.chambre, etage: loc.etage });
  });
}

function validePaiement(body) {
  const { mois, annee, montantLoyer, montantJIRAMA, statut, statutJIRAMA } = body;
  if (!V.isMoisValide(mois)) return "Mois invalide (1-12).";
  if (!V.isAnneeValide(annee)) return "Année invalide.";
  if (!V.isMontantValide(montantLoyer)) return "Montant loyer invalide.";
  if (montantJIRAMA !== undefined && !V.isMontantValide(montantJIRAMA))
    return "Montant JIRAMA invalide.";
  if (!V.isStatutValide(statut)) return "Statut invalide (PAYE/PARTIEL/IMPAYE).";
  // Le JIRAMA se regle independamment du loyer : il a son propre statut.
  if (statutJIRAMA !== undefined && !V.isStatutValide(statutJIRAMA))
    return "Statut JIRAMA invalide (PAYE/PARTIEL/IMPAYE).";
  return null;
}

// Statut JIRAMA retenu, avec repli sur l'existant puis sur IMPAYE.
const statutJiramaDe = (body, existant) =>
  V.isStatutValide(body.statutJIRAMA)
    ? body.statutJIRAMA
    : existant?.statutJIRAMA || "IMPAYE";

module.exports.createPaiement = (req, res) => {
  const { locataireId, mois, annee, montantLoyer, montantJIRAMA, statut, datePaiement } = req.body;
  const erreur = validePaiement(req.body);
  if (erreur) return badRequest(res, erreur);

  // Le statut JIRAMA se determine a partir de la ligne existante : le tableau
  // des loyers ne le touche pas, celui du JIRAMA ne touche pas au loyer.
  Paiement.getExisting(locataireId, mois, annee, (errE, deja) => {
    if (errE) return sendErr(res, errE);
    const data = {
      locataireId, mois, annee, montantLoyer,
      montantJIRAMA: montantJIRAMA || 0,
      statut,
      statutJIRAMA: statutJiramaDe(req.body, deja),
      datePaiement: datePaiement || null,
    };

  if (isAdmin(req)) {
    return execUpsertPaiement(
      data,
      (err, result) => {
        if (err) sendErr(res, err);
        else res.send(result);
      },
      { id: req.user.id, nom: auteurDe(req).auteurNom }
    );
  }

  // Simple user : demande de validation (avec l'eventuel paiement existant en "avant").
  Paiement.getExisting(locataireId, mois, annee, (err, existing) => {
    if (err) return sendErr(res, err);
    metaLocataire(locataireId, (meta) => {
      Validation.create(
        {
          entite: "PAIEMENT",
          action: existing ? "MODIFICATION" : "AJOUT",
          entiteId: existing ? existing.id : null,
          avant: existing ? { ...existing, ...meta } : null,
          apres: { ...data, ...meta },
          ...auteurDe(req),
        },
        (err2, result) => {
          if (err2) return sendErr(res, err2);
          res.status(202).send({
            ...result,
            message: "Demande de paiement envoyée à l'admin pour validation.",
          });
        }
      );
    });
  });
  });
};

/**
 * Reglement JIRAMA d'un locataire pour un mois.
 *
 * Loyer et electricite vivent sur la meme ligne : on repart donc de la ligne
 * existante et l'on ne remplace que la partie JIRAMA. Sans cela, saisir une
 * facture d'electricite ecraserait la date ou le montant du loyer.
 */
module.exports.upsertJirama = (req, res) => {
  const { locataireId, mois, annee, montantJIRAMA, statutJIRAMA } = req.body;
  if (!locataireId) return badRequest(res, "Locataire manquant.");
  if (!V.isMoisValide(mois)) return badRequest(res, "Mois invalide (1-12).");
  if (!V.isAnneeValide(annee)) return badRequest(res, "Année invalide.");
  if (!V.isMontantValide(montantJIRAMA)) return badRequest(res, "Montant JIRAMA invalide.");
  if (!V.isStatutValide(statutJIRAMA)) return badRequest(res, "Statut JIRAMA invalide.");

  Paiement.getExisting(locataireId, mois, annee, (err, existant) => {
    if (err) return sendErr(res, err);

    const data = {
      locataireId: Number(locataireId),
      mois: Number(mois),
      annee: Number(annee),
      // Partie loyer conservee telle quelle.
      montantLoyer: existant ? existant.montantLoyer : 0,
      statut: existant ? existant.statut : "IMPAYE",
      datePaiement: existant ? existant.datePaiement : null,
      // Partie JIRAMA remplacee.
      montantJIRAMA: Number(montantJIRAMA) || 0,
      statutJIRAMA,
    };

    if (isAdmin(req)) {
      return execUpsertPaiement(
        data,
        (err2, result) => {
          if (err2) sendErr(res, err2);
          else res.send(result);
        },
        { id: req.user.id, nom: auteurDe(req).auteurNom }
      );
    }

    metaLocataire(locataireId, (meta) => {
      Validation.create(
        {
          entite: "PAIEMENT",
          action: existant ? "MODIFICATION" : "AJOUT",
          entiteId: existant ? existant.id : null,
          avant: existant ? { ...existant, ...meta } : null,
          apres: { ...data, ...meta },
          ...auteurDe(req),
        },
        (err2, result) => {
          if (err2) return sendErr(res, err2);
          res.status(202).send({
            ...result,
            message: "Demande envoyée à l'admin pour validation.",
          });
        }
      );
    });
  });
};

module.exports.updatePaiement = (req, res) => {
  const { montantLoyer, montantJIRAMA, statut, datePaiement } = req.body;
  if (!V.isMontantValide(montantLoyer)) return badRequest(res, "Montant loyer invalide.");
  if (montantJIRAMA !== undefined && !V.isMontantValide(montantJIRAMA))
    return badRequest(res, "Montant JIRAMA invalide.");
  if (!V.isStatutValide(statut)) return badRequest(res, "Statut invalide.");
  if (req.body.statutJIRAMA !== undefined && !V.isStatutValide(req.body.statutJIRAMA))
    return badRequest(res, "Statut JIRAMA invalide.");

  const data = { montantLoyer, montantJIRAMA, statut, datePaiement: datePaiement || null };
  if (V.isStatutValide(req.body.statutJIRAMA)) data.statutJIRAMA = req.body.statutJIRAMA;

  if (isAdmin(req)) {
    return Paiement.update(req.params.id, data, (err, result) => {
      if (err) sendErr(res, err);
      else res.send(result);
    });
  }

  Paiement.getById(req.params.id, (err, existing) => {
    if (err) return sendErr(res, err);
    if (!existing) return res.status(404).send({ success: false, message: "Paiement introuvable." });
    metaLocataire(existing.locataireId, (meta) => {
      Validation.create(
        {
          entite: "PAIEMENT",
          action: "MODIFICATION",
          entiteId: +req.params.id,
          avant: { ...existing, ...meta },
          apres: { ...existing, ...data, ...meta },
          ...auteurDe(req),
        },
        (err2, result) => {
          if (err2) return sendErr(res, err2);
          res.status(202).send({
            ...result,
            message: "Demande de paiement envoyée à l'admin pour validation.",
          });
        }
      );
    });
  });
};

// ─── Dépenses ────────────────────────────────────────────────
module.exports.getDepenses = (req, res) => {
  const { mois, annee, bienId } = req.query;
  Depense.getByMoisAnnee(mois, annee, bienId, (err, data) => {
    if (err) sendErr(res, err);
    else res.send(data);
  });
};

module.exports.createDepense = (req, res) => {
  const { description, montant, mois, annee, categorie, date, bienId } = req.body;
  if (!description || !String(description).trim())
    return badRequest(res, "Description requise.");
  if (!V.isMontantValide(montant)) return badRequest(res, "Montant invalide (positif requis).");
  if (!V.isMoisValide(mois)) return badRequest(res, "Mois invalide (1-12).");
  if (!V.isAnneeValide(annee)) return badRequest(res, "Année invalide.");
  Depense.create(
    { description, montant, mois, annee, categorie: categorie || "Autre", date: date || null, bienId: Number(bienId) || 0 },
    (err, result) => {
      if (err) sendErr(res, err);
      else res.send(result);
    }
  );
};

module.exports.updateDepense = (req, res) => {
  const { description, montant, categorie, date } = req.body;
  if (!V.isMontantValide(montant)) return badRequest(res, "Montant invalide (positif requis).");
  Depense.update(req.params.id, { description, montant, categorie, date: date || null }, (err, result) => {
    if (err) sendErr(res, err);
    else res.send(result);
  });
};

module.exports.deleteDepense = (req, res) => {
  Depense.delete(req.params.id, (err, result) => {
    if (err) sendErr(res, err);
    else res.send(result);
  });
};

// ─── Bénéfices ───────────────────────────────────────────────
module.exports.getBenefices = (req, res) => {
  const { mois, annee, bienId } = req.query;
  if (!V.isMoisValide(mois)) return badRequest(res, "Mois invalide (1-12).");
  if (!V.isAnneeValide(annee)) return badRequest(res, "Année invalide.");

  Paiement.sumByMoisAnnee(mois, annee, bienId, (err, sums) => {
    if (err) return sendErr(res, err);

    Depense.sumByMoisAnnee(mois, annee, bienId, (err2, depSum) => {
      if (err2) return sendErr(res, err2);

      Paiement.getByMoisAnnee(mois, annee, bienId, (err3, paiements) => {
        if (err3) return sendErr(res, err3);

        res.send({
          mois: +mois,
          annee: +annee,
          totalLoyers: sums.totalLoyers || 0,
          totalJIRAMA: sums.totalJIRAMA || 0,
          totalDepenses: depSum.totalDepenses || 0,
          paiements: paiements || [],
        });
      });
    });
  });
};

// Evolution des benefices sur les 12 mois d'une annee (dashboard annuel).
module.exports.getBeneficesAnnee = (req, res) => {
  const { annee, bienId } = req.query;
  if (!V.isAnneeValide(annee)) return badRequest(res, "Année invalide.");

  Paiement.sumByAnnee(annee, bienId, (err, revenus) => {
    if (err) return sendErr(res, err);

    Depense.sumByAnnee(annee, bienId, (err2, depenses) => {
      if (err2) return sendErr(res, err2);

      const revMap = {}, depMap = {};
      (revenus || []).forEach((r) => (revMap[r.mois] = r));
      (depenses || []).forEach((d) => (depMap[d.mois] = d));

      const moisData = [];
      for (let m = 1; m <= 12; m++) {
        const totalLoyers = (revMap[m] && revMap[m].totalLoyers) || 0;
        const totalJIRAMA = (revMap[m] && revMap[m].totalJIRAMA) || 0;
        const totalDepenses = (depMap[m] && depMap[m].totalDepenses) || 0;
        moisData.push({
          mois: m,
          totalLoyers,
          totalJIRAMA,
          totalDepenses,
          benefice: V.benefice(totalLoyers, totalJIRAMA, totalDepenses),
        });
      }
      res.send({ annee: +annee, mois: moisData });
    });
  });
};

// ─── Espace personnel du locataire ────────────────────────────
// Un compte "locataire" ne voit QUE sa propre fiche et ses propres paiements.
module.exports.getMonEspace = (req, res) => {
  const annee = req.query.annee;
  if (!V.isAnneeValide(annee)) return badRequest(res, "Année invalide.");

  // L'admin peut consulter l'espace d'un locataire via ?locataireId=
  const locataireId = isAdmin(req)
    ? req.query.locataireId || req.user.locataireId
    : req.user.locataireId;

  if (!locataireId)
    return res.status(403).send({
      success: false,
      message: "Ce compte n'est rattaché à aucune fiche locataire.",
    });

  Locataire.getById(locataireId, (err, loc) => {
    if (err) return sendErr(res, err);
    if (!loc) return res.status(404).send({ success: false, message: "Fiche introuvable." });

    // Ce que le locataire doit au titre de l'eau et de l'electricite, mois par
    // mois : son forfait, ou le releve de son compteur s'il est plus eleve.
    Facture.getByMoisAnnee(null, annee, loc.bienId, (errF, factures) => {
      const releves = {};
      if (!errF) {
        (factures || []).forEach((f) => {
          (f.consommations || []).forEach((c) => {
            if (String(c.locataireId) === String(locataireId))
              releves[f.mois] = c.montantJIRAMA || 0;
          });
        });
      }
      const forfait = Number(loc.jiramaForfait) || 0;
      const maintenant = new Date();
      const jiramaDu = {};
      for (let m = 1; m <= 12; m++) {
        const releve = releves[m] || 0;
        if (!forfait) {
          jiramaDu[m] = releve;
          continue;
        }
        // Le forfait ne court qu'entre l'entree du locataire et le mois en cours.
        const entree = loc.dateEntree ? new Date(loc.dateEntree) : null;
        const avantEntree =
          entree && !isNaN(entree) &&
          (entree.getFullYear() > Number(annee) ||
            (entree.getFullYear() === Number(annee) && m < entree.getMonth() + 1));
        const aVenir =
          Number(annee) > maintenant.getFullYear() ||
          (Number(annee) === maintenant.getFullYear() && m > maintenant.getMonth() + 1);
        jiramaDu[m] = avantEntree || aVenir ? releve : Math.max(forfait, releve);
      }

    Paiement.getByAnnee(annee, (err2, tous) => {
      if (err2) return sendErr(res, err2);
      const miens = (tous || []).filter(
        (p) => String(p.locataireId) === String(locataireId)
      );
      // Declarations encore en attente : le locataire doit voir qu'il a deja
      // signale un reglement, sans pouvoir le declarer deux fois.
      Validation.pendingPaiements(locataireId, (err3, attentes) => {
      const enAttente = (err3 ? [] : attentes)
        .filter((d) => String(d.apres?.annee) === String(annee))
        .map((d) => ({
          id: d.id,
          mois: d.apres.mois,
          annee: d.apres.annee,
          montantLoyer: d.apres.montantLoyer || 0,
          montantJIRAMA: d.apres.montantJIRAMA || 0,
          // Une declaration ne portant que sur l'electricite n'engage pas le loyer.
          volet: d.apres.volet || "LOYER",
          datePaiement: d.apres.datePaiement || null,
          dateDemande: d.dateDemande,
        }));
      // Aucune donnee des autres locataires ne sort d'ici.
      res.send({
        locataire: {
          id: loc.id, nom: loc.nom, prenom: loc.prenom,
          chambre: loc.chambre, etage: loc.etage, loyer: loc.loyer,
          caution: loc.caution, dateEntree: loc.dateEntree, photo: loc.photo,
          jourPaiement: loc.jourPaiement, modePaiement: loc.modePaiement || "ECHU",
          jiramaForfait: loc.jiramaForfait || null,
        },
        annee: +annee,
        paiements: miens,
        jiramaDu,
        enAttente,
      });
      });
    });
    });
  });
};

/**
 * Le locataire declare lui-meme un reglement d'eau et d'electricite.
 *
 * Meme principe que la declaration de loyer : rien n'est ecrit dans les
 * paiements, la demande part en validation. La partie loyer de la ligne est
 * reprise telle quelle pour ne pas etre ecrasee a l'approbation.
 */
module.exports.declarerJirama = (req, res) => {
  const locataireId = req.user.locataireId;
  if (!locataireId)
    return res.status(403).send({
      success: false,
      message: "Ce compte n'est rattaché à aucune fiche locataire.",
    });

  const { mois, annee, montantJIRAMA, datePaiement } = req.body;
  if (!V.isMoisValide(mois)) return badRequest(res, "Mois invalide (1-12).");
  if (!V.isAnneeValide(annee)) return badRequest(res, "Année invalide.");
  if (!V.isMontantValide(montantJIRAMA) || Number(montantJIRAMA) <= 0)
    return badRequest(res, "Indiquez le montant réglé.");

  Locataire.getById(locataireId, (err, loc) => {
    if (err) return sendErr(res, err);
    if (!loc) return res.status(404).send({ success: false, message: "Fiche introuvable." });

    if (loc.dateEntree) {
      const entree = new Date(loc.dateEntree);
      if (!isNaN(entree)) {
        const debut = entree.getFullYear() * 12 + entree.getMonth();
        const vise = Number(annee) * 12 + (Number(mois) - 1);
        if (vise < debut) return badRequest(res, "Ce mois précède votre date d'entrée.");
      }
    }

    Validation.pendingPaiements(locataireId, (errP, attentes) => {
      if (errP) return sendErr(res, errP);
      const doublon = (attentes || []).some(
        (d) =>
          String(d.apres?.mois) === String(mois) &&
          String(d.apres?.annee) === String(annee) &&
          d.apres?.volet === "JIRAMA"
      );
      if (doublon)
        return res.status(409).send({
          success: false,
          message: "Vous avez déjà déclaré ce mois : la demande est en cours de vérification.",
        });

      Paiement.getExisting(locataireId, mois, annee, (err2, existant) => {
        if (err2) return sendErr(res, err2);
        const data = {
          locataireId,
          mois: Number(mois),
          annee: Number(annee),
          // Partie loyer conservee telle quelle.
          montantLoyer: existant ? existant.montantLoyer : 0,
          statut: existant ? existant.statut : "IMPAYE",
          datePaiement: existant ? existant.datePaiement : null,
          montantJIRAMA: Number(montantJIRAMA),
          statutJIRAMA: "PAYE",
          volet: "JIRAMA",
        };
        if (datePaiement && !existant) data.datePaiement = String(datePaiement).split("T")[0];

        const meta = {
          locataireNom: `${loc.nom} ${loc.prenom || ""}`.trim(),
          chambre: loc.chambre,
          etage: loc.etage,
          declareParLocataire: true,
        };
        Validation.create(
          {
            entite: "PAIEMENT",
            action: existant ? "MODIFICATION" : "AJOUT",
            entiteId: existant ? existant.id : null,
            avant: existant ? { ...existant, ...meta } : null,
            apres: { ...data, ...meta },
            ...auteurDe(req),
          },
          (err3, result) => {
            if (err3) return sendErr(res, err3);
            res.status(202).send({
              ...result,
              message: "Déclaration envoyée : elle sera vérifiée par le propriétaire.",
            });
          }
        );
      });
    });
  });
};

// Le locataire signale lui-meme un reglement : rien n'est ecrit dans les
// paiements, la declaration part en validation chez l'admin. Le locataire
// vise est TOUJOURS celui du compte connecte, jamais celui du corps de requete.
module.exports.declarerPaiement = (req, res) => {
  const locataireId = req.user.locataireId;
  if (!locataireId)
    return res.status(403).send({
      success: false,
      message: "Ce compte n'est rattaché à aucune fiche locataire.",
    });

  const { mois, annee, montantLoyer, montantJIRAMA, datePaiement } = req.body;
  if (!V.isMoisValide(mois)) return badRequest(res, "Mois invalide (1-12).");
  if (!V.isAnneeValide(annee)) return badRequest(res, "Année invalide.");
  if (!V.isMontantValide(montantLoyer)) return badRequest(res, "Montant du loyer invalide.");
  if (montantJIRAMA !== undefined && montantJIRAMA !== "" && !V.isMontantValide(montantJIRAMA))
    return badRequest(res, "Montant JIRAMA invalide.");
  if (Number(montantLoyer) + Number(montantJIRAMA || 0) <= 0)
    return badRequest(res, "Indiquez le montant réglé.");

  Validation.pendingPaiements(locataireId, (errP, attentes) => {
    if (errP) return sendErr(res, errP);
    // Une declaration de loyer et une declaration d'electricite sur le meme
    // mois ne se font pas doublon : ce sont deux volets distincts.
    const doublon = (attentes || []).some(
      (d) =>
        String(d.apres?.mois) === String(mois) &&
        String(d.apres?.annee) === String(annee) &&
        (d.apres?.volet || "LOYER") === "LOYER"
    );
    if (doublon)
      return res.status(409).send({
        success: false,
        message: "Vous avez déjà déclaré ce mois : la demande est en cours de vérification.",
      });

    Locataire.getById(locataireId, (err, loc) => {
      if (err) return sendErr(res, err);
      if (!loc) return res.status(404).send({ success: false, message: "Fiche introuvable." });

      // Un mois anterieur a l'arrivee du locataire ne le concerne pas.
      if (loc.dateEntree) {
        const entree = new Date(loc.dateEntree);
        if (!isNaN(entree)) {
          const debut = entree.getFullYear() * 12 + entree.getMonth();
          const vise = Number(annee) * 12 + (Number(mois) - 1);
          if (vise < debut)
            return badRequest(res, "Ce mois précède votre date d'entrée.");
        }
      }

      // Reglement partiel tant que le loyer du mois n'est pas couvert.
      const du = Number(loc.loyer) || 0;
      const data = {
        locataireId,
        mois: Number(mois),
        annee: Number(annee),
        montantLoyer: Number(montantLoyer),
        montantJIRAMA: Number(montantJIRAMA) || 0,
        statut: Number(montantLoyer) >= du ? "PAYE" : "PARTIEL",
        statutJIRAMA: Number(montantJIRAMA) > 0 ? "PAYE" : "IMPAYE",
        datePaiement: datePaiement ? String(datePaiement).split("T")[0] : null,
        volet: "LOYER",
      };

      Paiement.getExisting(locataireId, data.mois, data.annee, (err2, existing) => {
        if (err2) return sendErr(res, err2);
        const meta = {
          locataireNom: `${loc.nom} ${loc.prenom || ""}`.trim(),
          chambre: loc.chambre,
          etage: loc.etage,
          declareParLocataire: true,
        };
        Validation.create(
          {
            entite: "PAIEMENT",
            action: existing ? "MODIFICATION" : "AJOUT",
            entiteId: existing ? existing.id : null,
            avant: existing ? { ...existing, ...meta } : null,
            apres: { ...data, ...meta },
            ...auteurDe(req),
          },
          (err3, result) => {
            if (err3) return sendErr(res, err3);
            res.status(202).send({
              ...result,
              message: "Déclaration envoyée : elle sera vérifiée par le propriétaire.",
            });
          }
        );
      });
    });
  });
};


// ─── Journal des paiements ────────────────────────────────────
module.exports.getHistoriquePaiements = (req, res) => {
  const { annee } = req.query;
  if (!V.isAnneeValide(annee)) return badRequest(res, "Année invalide.");
  PaiementHisto.getByAnnee(annee, (err, data) => {
    if (err) sendErr(res, err);
    else res.send(data);
  });
};

// Liste chronologique des paiements enregistres (etat actuel) : permet de
// reperer un reglement attribue au mauvais locataire.
module.exports.getPaiementsDetail = (req, res) => {
  const { annee, bienId } = req.query;
  if (!V.isAnneeValide(annee)) return badRequest(res, "Année invalide.");
  Paiement.getDetailAnnee(annee, bienId, (err, data) => {
    if (err) sendErr(res, err);
    else res.send(data);
  });
};
