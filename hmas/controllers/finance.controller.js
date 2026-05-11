"use strict";
const Finance = require("../models/finance.model");

// ─── Revenus ───────────────────────────────────────────────────
module.exports.getRevenus = (req, res) => {
  const { mois, annee, userId } = req.query;
  Finance.getRevenus(userId, mois, annee, (err, data) => {
    if (err) res.status(500).send(err); else res.send(data);
  });
};
module.exports.createRevenu = (req, res) => {
  const { userId, nom, montant, mois, annee, est_epargne } = req.body;
  Finance.createRevenu(
    { userId, nom, montant: +montant || 0, mois, annee, est_epargne: est_epargne ? 1 : 0 },
    (err, result) => { if (err) res.status(500).send(err); else res.send(result); }
  );
};
module.exports.updateRevenu = (req, res) => {
  const { userId, nom, montant, est_epargne } = req.body;
  Finance.updateRevenu(
    req.params.id, userId,
    { nom, montant: +montant || 0, est_epargne: est_epargne ? 1 : 0 },
    (err, result) => { if (err) res.status(500).send(err); else res.send(result); }
  );
};
module.exports.deleteRevenu = (req, res) => {
  const { userId } = req.query;
  Finance.deleteRevenu(req.params.id, userId, (err, result) => {
    if (err) res.status(500).send(err); else res.send(result);
  });
};

// ─── Charges ───────────────────────────────────────────────────
module.exports.getCharges = (req, res) => {
  const { mois, annee, userId } = req.query;
  Finance.getCharges(userId, mois, annee, (err, data) => {
    if (err) res.status(500).send(err); else res.send(data);
  });
};
module.exports.createCharge = (req, res) => {
  const { userId, nom, montant, mois, annee } = req.body;
  Finance.createCharge(
    { userId, nom, montant: +montant || 0, mois, annee },
    (err, result) => { if (err) res.status(500).send(err); else res.send(result); }
  );
};
module.exports.updateCharge = (req, res) => {
  const { userId, nom, montant } = req.body;
  Finance.updateCharge(
    req.params.id, userId,
    { nom, montant: +montant || 0 },
    (err, result) => { if (err) res.status(500).send(err); else res.send(result); }
  );
};
module.exports.deleteCharge = (req, res) => {
  const { userId } = req.query;
  Finance.deleteCharge(req.params.id, userId, (err, result) => {
    if (err) res.status(500).send(err); else res.send(result);
  });
};

// ─── Dépenses ──────────────────────────────────────────────────
module.exports.getDepenses = (req, res) => {
  const { start, end, mois, annee, userId } = req.query;
  if (start && end) {
    Finance.getDepensesRange(userId, start, end, (err, data) => {
      if (err) res.status(500).send(err); else res.send(data);
    });
  } else {
    Finance.getDepensesMoisAnnee(userId, mois, annee, (err, data) => {
      if (err) res.status(500).send(err); else res.send(data);
    });
  }
};
module.exports.createDepense = (req, res) => {
  const { userId, nom, montant, date_depense, heure_depense, semaine, mois, annee } = req.body;
  Finance.createDepense(
    { userId, nom, montant: +montant, date_depense, heure_depense, semaine, mois, annee },
    (err, result) => { if (err) res.status(500).send(err); else res.send(result); }
  );
};
module.exports.deleteDepense = (req, res) => {
  const { userId } = req.query;
  Finance.deleteDepense(req.params.id, userId, (err, result) => {
    if (err) res.status(500).send(err); else res.send(result);
  });
};

// ─── Casuel ────────────────────────────────────────────────────
module.exports.getCasuel = (req, res) => {
  const { mois, annee, userId } = req.query;
  Finance.getCasuel(userId, mois, annee, (err, data) => {
    if (err) res.status(500).send(err); else res.send(data);
  });
};
module.exports.createCasuel = (req, res) => {
  const { userId, nom, montant, date_casuel, mois, annee } = req.body;
  Finance.createCasuel(
    { userId, nom, montant: +montant || 0, date_casuel, mois, annee },
    (err, result) => { if (err) res.status(500).send(err); else res.send(result); }
  );
};
module.exports.deleteCasuel = (req, res) => {
  const { userId } = req.query;
  Finance.deleteCasuel(req.params.id, userId, (err, result) => {
    if (err) res.status(500).send(err); else res.send(result);
  });
};

// ─── Annuel (graphique) ────────────────────────────────────────
module.exports.getAnnuel = (req, res) => {
  const { annee, userId } = req.query;
  Finance.getAnnuelRevenus(userId, annee, (err, revData) => {
    if (err) return res.status(500).send(err);
    Finance.getAnnuelDepenses(userId, annee, (err2, depData) => {
      if (err2) return res.status(500).send(err2);
      const revMap = {};
      const depMap = {};
      revData.forEach(r => { revMap[r.mois] = +r.total; });
      depData.forEach(d => { depMap[d.mois] = +d.total; });
      const chart = Array.from({ length: 12 }, (_, i) => ({
        mois: i + 1,
        revenus:  revMap[i + 1] || 0,
        depenses: depMap[i + 1] || 0,
      }));
      res.send(chart);
    });
  });
};

// ─── Bilan ─────────────────────────────────────────────────────
module.exports.getBilan = (req, res) => {
  const { mois, annee, userId } = req.query;
  Finance.getRevenus(userId, mois, annee, (err, revenus) => {
    if (err) return res.status(500).send(err);
    Finance.getCharges(userId, mois, annee, (err2, charges) => {
      if (err2) return res.status(500).send(err2);
      Finance.depensesParSemaine(userId, mois, annee, (err3, parSemaine) => {
        if (err3) return res.status(500).send(err3);
        Finance.sumDepenses(userId, mois, annee, (err4, depSum) => {
          if (err4) return res.status(500).send(err4);
          Finance.sumCasuel(userId, mois, annee, (err5, casuelSum) => {
            if (err5) return res.status(500).send(err5);
            const totalRevenus  = revenus.reduce((s, r) => s + (+r.montant || 0), 0);
            const totalCharges  = charges.reduce((s, c) => s + (+c.montant || 0), 0);
            const totalDepenses = +depSum.total || 0;
            const totalCasuel   = +casuelSum.total || 0;
            const solde         = totalRevenus + totalCasuel - totalCharges - totalDepenses;
            res.send({ mois: +mois, annee: +annee, revenus, charges, parSemaine, totalRevenus, totalCharges, totalDepenses, totalCasuel, solde });
          });
        });
      });
    });
  });
};
