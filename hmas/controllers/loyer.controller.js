"use strict";
const Locataire  = require("../models/locataire.model");
const Facture    = require("../models/facture.model");
const Paiement   = require("../models/paiement.model");
const Depense    = require("../models/depense.model");
const Occupation = require("../models/occupation.model");
const { sendErr, badRequest } = require("../utils/http");
const V = require("../utils/calc");

// ─── Locataires ───────────────────────────────────────────────
module.exports.getAllLocataires = (req, res) => {
  Locataire.getAll(req.query.bienId, (err, data) => {
    if (err) sendErr(res, err);
    else res.send(data);
  });
};

function valideLocataire(body) {
  const { nom, chambre, etage, loyer, caution, bienId } = body;
  if (!nom || !String(nom).trim()) return "Le nom est requis.";
  if (!V.isEtageValide(etage)) return "Étage invalide (RDC ou 1ER).";
  if (!V.isChambreValide(chambre, etage, Number(bienId) || 0))
    return "Chambre invalide pour cet étage/appartement.";
  if (!V.isMontantValide(loyer)) return "Loyer invalide (montant positif requis).";
  if (caution !== undefined && caution !== "" && !V.isMontantValide(caution))
    return "Caution invalide (montant positif requis).";
  return null;
}

module.exports.createLocataire = (req, res) => {
  const { nom, prenom, chambre, etage, loyer, tel, email, dateEntree, actif, bienId, caution } = req.body;
  const erreur = valideLocataire(req.body);
  if (erreur) return badRequest(res, erreur);

  const data = {
    nom, prenom, chambre, etage, loyer, tel, email,
    dateEntree: dateEntree || null,
    actif: actif ? 1 : 0,
    bienId: Number(bienId) || 0,
    caution: Number(caution) || 0,
  };

  const insert = () =>
    Locataire.create(data, (err, result) => {
      if (err) return sendErr(res, err);
      Occupation.log({
        locataireId: result.id, nom: data.nom, prenom: data.prenom,
        chambre: data.chambre, etage: data.etage, bienId: data.bienId,
        action: "ENTREE", details: `Entrée — chambre ${data.chambre} (${data.etage})`,
      });
      res.send(result);
    });

  // Une chambre occupee (locataire actif) ne peut pas recevoir un 2e actif (dans le meme appart).
  if (data.actif) {
    Locataire.findActiveInChambre(chambre, etage, data.bienId, null, (err, occupant) => {
      if (err) return sendErr(res, err);
      if (occupant)
        return res.status(409).send({
          success: false,
          message: `La chambre ${chambre} (${etage}) est déjà occupée par ${occupant.nom}.`,
        });
      insert();
    });
  } else {
    insert();
  }
};

module.exports.updateLocataire = (req, res) => {
  const { nom, prenom, chambre, etage, loyer, tel, email, dateEntree, actif, bienId, caution } = req.body;
  const erreur = valideLocataire(req.body);
  if (erreur) return badRequest(res, erreur);

  const data = {
    nom, prenom, chambre, etage, loyer, tel, email,
    dateEntree: dateEntree || null,
    actif: actif ? 1 : 0,
    bienId: Number(bienId) || 0,
    caution: Number(caution) || 0,
  };

  const doUpdate = (avant) =>
    Locataire.update(req.params.id, data, (err, result) => {
      if (err) return sendErr(res, err);
      // Historique : changement de chambre ou depart (actif -> inactif)
      if (avant) {
        if (avant.actif && !data.actif) {
          Occupation.log({
            locataireId: +req.params.id, nom: data.nom, prenom: data.prenom,
            chambre: avant.chambre, etage: avant.etage, bienId: data.bienId,
            action: "SORTIE", details: `Sortie — chambre ${avant.chambre} (${avant.etage})`,
          });
        } else if (avant.chambre !== data.chambre || avant.etage !== data.etage) {
          Occupation.log({
            locataireId: +req.params.id, nom: data.nom, prenom: data.prenom,
            chambre: data.chambre, etage: data.etage, bienId: data.bienId,
            action: "MODIFICATION",
            details: `Changement : ${avant.chambre} (${avant.etage}) → ${data.chambre} (${data.etage})`,
          });
        } else if (!avant.actif && data.actif) {
          Occupation.log({
            locataireId: +req.params.id, nom: data.nom, prenom: data.prenom,
            chambre: data.chambre, etage: data.etage, bienId: data.bienId,
            action: "ENTREE", details: `Réactivation — chambre ${data.chambre} (${data.etage})`,
          });
        }
      }
      res.send(result);
    });

  const verifier = (avant) => {
    if (data.actif) {
      Locataire.findActiveInChambre(chambre, etage, data.bienId, req.params.id, (err, occupant) => {
        if (err) return sendErr(res, err);
        if (occupant)
          return res.status(409).send({
            success: false,
            message: `La chambre ${chambre} (${etage}) est déjà occupée par ${occupant.nom}.`,
          });
        doUpdate(avant);
      });
    } else {
      doUpdate(avant);
    }
  };

  Locataire.getById(req.params.id, (errAvant, avant) => {
    verifier(errAvant ? null : avant);
  });
};

module.exports.deleteLocataire = (req, res) => {
  Locataire.getById(req.params.id, (errAvant, avant) => {
    Locataire.delete(req.params.id, (err, result) => {
      if (err) return sendErr(res, err);
      if (avant) {
        Occupation.log({
          locataireId: +req.params.id, nom: avant.nom, prenom: avant.prenom,
          chambre: avant.chambre, etage: avant.etage, bienId: avant.bienId || 0,
          action: "SORTIE", details: `Suppression — chambre ${avant.chambre} (${avant.etage})`,
        });
      }
      res.send(result);
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

module.exports.createPaiement = (req, res) => {
  const { locataireId, mois, annee, montantLoyer, montantJIRAMA, statut, datePaiement } = req.body;
  if (!V.isMoisValide(mois)) return badRequest(res, "Mois invalide (1-12).");
  if (!V.isAnneeValide(annee)) return badRequest(res, "Année invalide.");
  if (!V.isMontantValide(montantLoyer)) return badRequest(res, "Montant loyer invalide.");
  if (montantJIRAMA !== undefined && !V.isMontantValide(montantJIRAMA))
    return badRequest(res, "Montant JIRAMA invalide.");
  if (!V.isStatutValide(statut)) return badRequest(res, "Statut invalide (PAYE/PARTIEL/IMPAYE).");

  Paiement.getExisting(locataireId, mois, annee, (err, existing) => {
    if (err) return sendErr(res, err);

    const data = { locataireId, mois, annee, montantLoyer, montantJIRAMA: montantJIRAMA || 0, statut, datePaiement: datePaiement || null };

    if (existing) {
      Paiement.update(existing.id, data, (err2, result) => {
        if (err2) sendErr(res, err2);
        else res.send({ ...result, id: existing.id });
      });
    } else {
      Paiement.create(data, (err2, result) => {
        if (err2) sendErr(res, err2);
        else res.send(result);
      });
    }
  });
};

module.exports.updatePaiement = (req, res) => {
  const { montantLoyer, montantJIRAMA, statut, datePaiement } = req.body;
  if (!V.isMontantValide(montantLoyer)) return badRequest(res, "Montant loyer invalide.");
  if (montantJIRAMA !== undefined && !V.isMontantValide(montantJIRAMA))
    return badRequest(res, "Montant JIRAMA invalide.");
  if (!V.isStatutValide(statut)) return badRequest(res, "Statut invalide.");
  Paiement.update(req.params.id, { montantLoyer, montantJIRAMA, statut, datePaiement: datePaiement || null }, (err, result) => {
    if (err) sendErr(res, err);
    else res.send(result);
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
