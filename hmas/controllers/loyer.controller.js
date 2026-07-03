"use strict";
const Locataire = require("../models/locataire.model");
const Facture   = require("../models/facture.model");
const Paiement  = require("../models/paiement.model");
const Depense   = require("../models/depense.model");

// ─── Locataires ───────────────────────────────────────────────
module.exports.getAllLocataires = (req, res) => {
  Locataire.getAll((err, data) => {
    if (err) res.status(500).send(err);
    else res.send(data);
  });
};

module.exports.createLocataire = (req, res) => {
  const { nom, prenom, chambre, etage, loyer, tel, email, dateEntree, actif } = req.body;
  const data = { nom, prenom, chambre, etage, loyer, tel, email, dateEntree: dateEntree || null, actif: actif ? 1 : 0 };

  const insert = () =>
    Locataire.create(data, (err, result) => {
      if (err) res.status(500).send(err);
      else res.send(result);
    });

  // Une chambre occupee (locataire actif) ne peut pas recevoir un 2e actif.
  if (data.actif) {
    Locataire.findActiveInChambre(chambre, etage, null, (err, occupant) => {
      if (err) return res.status(500).send(err);
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
  const { nom, prenom, chambre, etage, loyer, tel, email, dateEntree, actif } = req.body;
  const data = { nom, prenom, chambre, etage, loyer, tel, email, dateEntree: dateEntree || null, actif: actif ? 1 : 0 };

  const doUpdate = () =>
    Locataire.update(req.params.id, data, (err, result) => {
      if (err) res.status(500).send(err);
      else res.send(result);
    });

  if (data.actif) {
    Locataire.findActiveInChambre(chambre, etage, req.params.id, (err, occupant) => {
      if (err) return res.status(500).send(err);
      if (occupant)
        return res.status(409).send({
          success: false,
          message: `La chambre ${chambre} (${etage}) est déjà occupée par ${occupant.nom}.`,
        });
      doUpdate();
    });
  } else {
    doUpdate();
  }
};

module.exports.deleteLocataire = (req, res) => {
  Locataire.delete(req.params.id, (err, result) => {
    if (err) res.status(500).send(err);
    else res.send(result);
  });
};

// ─── Factures JIRAMA ──────────────────────────────────────────
module.exports.getFacture = (req, res) => {
  const { mois, annee } = req.query;
  Facture.getByMoisAnnee(mois, annee, (err, data) => {
    if (err) res.status(500).send(err);
    else res.send(data);
  });
};

module.exports.createFacture = (req, res) => {
  const { mois, annee, prixUnitaire, montantTotal, dateFacture, consommations } = req.body;

  Facture.create({ mois, annee, prixUnitaire, montantTotal, dateFacture }, (err, fact) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).send({ message: "Une facture existe déjà pour ce mois/année. Utilisez la mise à jour.", success: false });
      }
      return res.status(500).send(err);
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

  Facture.update(id, { prixUnitaire, montantTotal, dateFacture }, (err) => {
    if (err) return res.status(500).send(err);

    if (!consommations || consommations.length === 0) return res.send({ success: true });

    Facture.deleteConsos(id, (err2) => {
      if (err2) return res.status(500).send(err2);

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
  Paiement.getByAnnee(annee, (err, data) => {
    if (err) res.status(500).send(err);
    else res.send(data);
  });
};

module.exports.createPaiement = (req, res) => {
  const { locataireId, mois, annee, montantLoyer, montantJIRAMA, statut, datePaiement } = req.body;

  Paiement.getExisting(locataireId, mois, annee, (err, existing) => {
    if (err) return res.status(500).send(err);

    const data = { locataireId, mois, annee, montantLoyer, montantJIRAMA: montantJIRAMA || 0, statut, datePaiement: datePaiement || null };

    if (existing) {
      Paiement.update(existing.id, data, (err2, result) => {
        if (err2) res.status(500).send(err2);
        else res.send({ ...result, id: existing.id });
      });
    } else {
      Paiement.create(data, (err2, result) => {
        if (err2) res.status(500).send(err2);
        else res.send(result);
      });
    }
  });
};

module.exports.updatePaiement = (req, res) => {
  const { montantLoyer, montantJIRAMA, statut, datePaiement } = req.body;
  Paiement.update(req.params.id, { montantLoyer, montantJIRAMA, statut, datePaiement: datePaiement || null }, (err, result) => {
    if (err) res.status(500).send(err);
    else res.send(result);
  });
};

// ─── Dépenses ────────────────────────────────────────────────
module.exports.getDepenses = (req, res) => {
  const { mois, annee } = req.query;
  Depense.getByMoisAnnee(mois, annee, (err, data) => {
    if (err) res.status(500).send(err);
    else res.send(data);
  });
};

module.exports.createDepense = (req, res) => {
  const { description, montant, mois, annee, categorie, date } = req.body;
  Depense.create({ description, montant, mois, annee, categorie: categorie || "Autre", date: date || null }, (err, result) => {
    if (err) res.status(500).send(err);
    else res.send(result);
  });
};

module.exports.updateDepense = (req, res) => {
  const { description, montant, categorie, date } = req.body;
  Depense.update(req.params.id, { description, montant, categorie, date: date || null }, (err, result) => {
    if (err) res.status(500).send(err);
    else res.send(result);
  });
};

module.exports.deleteDepense = (req, res) => {
  Depense.delete(req.params.id, (err, result) => {
    if (err) res.status(500).send(err);
    else res.send(result);
  });
};

// ─── Bénéfices ───────────────────────────────────────────────
module.exports.getBenefices = (req, res) => {
  const { mois, annee } = req.query;

  Paiement.sumByMoisAnnee(mois, annee, (err, sums) => {
    if (err) return res.status(500).send(err);

    Depense.sumByMoisAnnee(mois, annee, (err2, depSum) => {
      if (err2) return res.status(500).send(err2);

      Paiement.getByMoisAnnee(mois, annee, (err3, paiements) => {
        if (err3) return res.status(500).send(err3);

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
