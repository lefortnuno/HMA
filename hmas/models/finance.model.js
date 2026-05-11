"use strict";
const db = require("../config/db");

const Finance = {};

// ─── Revenus Fixes ─────────────────────────────────────────────
Finance.getRevenus = (userId, mois, annee, result) => {
  db.query(
    "SELECT * FROM finance_revenus WHERE userId=? AND mois=? AND annee=? ORDER BY nom",
    [userId, mois, annee],
    (err, res) => { if (err) result(err, null); else result(null, res); }
  );
};
Finance.createRevenu = (data, result) => {
  db.query("INSERT INTO finance_revenus SET ?", data, (err, res) => {
    if (err) result(err, null);
    else result(null, { id: res.insertId, success: true });
  });
};
Finance.updateRevenu = (id, userId, data, result) => {
  db.query("UPDATE finance_revenus SET ? WHERE id=? AND userId=?", [data, id, userId], (err) => {
    if (err) result(err, null); else result(null, { success: true });
  });
};
Finance.deleteRevenu = (id, userId, result) => {
  db.query("DELETE FROM finance_revenus WHERE id=? AND userId=?", [id, userId], (err) => {
    if (err) result(err, null); else result(null, { success: true });
  });
};

// ─── Charges Fixes ─────────────────────────────────────────────
Finance.getCharges = (userId, mois, annee, result) => {
  db.query(
    "SELECT * FROM finance_charges WHERE userId=? AND mois=? AND annee=? ORDER BY nom",
    [userId, mois, annee],
    (err, res) => { if (err) result(err, null); else result(null, res); }
  );
};
Finance.createCharge = (data, result) => {
  db.query("INSERT INTO finance_charges SET ?", data, (err, res) => {
    if (err) result(err, null);
    else result(null, { id: res.insertId, success: true });
  });
};
Finance.updateCharge = (id, userId, data, result) => {
  db.query("UPDATE finance_charges SET ? WHERE id=? AND userId=?", [data, id, userId], (err) => {
    if (err) result(err, null); else result(null, { success: true });
  });
};
Finance.deleteCharge = (id, userId, result) => {
  db.query("DELETE FROM finance_charges WHERE id=? AND userId=?", [id, userId], (err) => {
    if (err) result(err, null); else result(null, { success: true });
  });
};

// ─── Dépenses Variables ────────────────────────────────────────
Finance.getDepensesRange = (userId, start, end, result) => {
  db.query(
    "SELECT * FROM finance_depenses WHERE userId=? AND date_depense >= ? AND date_depense <= ? ORDER BY date_depense DESC, heure_depense DESC",
    [userId, start, end],
    (err, res) => { if (err) result(err, null); else result(null, res); }
  );
};
Finance.getDepensesMoisAnnee = (userId, mois, annee, result) => {
  db.query(
    "SELECT * FROM finance_depenses WHERE userId=? AND mois=? AND annee=? ORDER BY date_depense DESC, heure_depense DESC",
    [userId, mois, annee],
    (err, res) => { if (err) result(err, null); else result(null, res); }
  );
};
Finance.createDepense = (data, result) => {
  db.query("INSERT INTO finance_depenses SET ?", data, (err, res) => {
    if (err) result(err, null);
    else result(null, { id: res.insertId, success: true });
  });
};
Finance.deleteDepense = (id, userId, result) => {
  db.query("DELETE FROM finance_depenses WHERE id=? AND userId=?", [id, userId], (err) => {
    if (err) result(err, null); else result(null, { success: true });
  });
};
Finance.depensesParSemaine = (userId, mois, annee, result) => {
  db.query(
    "SELECT semaine, SUM(montant) AS total, COUNT(*) AS nb FROM finance_depenses WHERE userId=? AND mois=? AND annee=? GROUP BY semaine ORDER BY semaine",
    [userId, mois, annee],
    (err, res) => { if (err) result(err, null); else result(null, res); }
  );
};
Finance.sumDepenses = (userId, mois, annee, result) => {
  db.query(
    "SELECT COALESCE(SUM(montant), 0) AS total FROM finance_depenses WHERE userId=? AND mois=? AND annee=?",
    [userId, mois, annee],
    (err, res) => { if (err) result(err, null); else result(null, res[0]); }
  );
};

// ─── Casuel (revenus occasionnels) ─────────────────────────────
Finance.getCasuel = (userId, mois, annee, result) => {
  db.query(
    "SELECT * FROM finance_casuel WHERE userId=? AND mois=? AND annee=? ORDER BY date_casuel DESC",
    [userId, mois, annee],
    (err, res) => { if (err) result(err, null); else result(null, res); }
  );
};
Finance.createCasuel = (data, result) => {
  db.query("INSERT INTO finance_casuel SET ?", data, (err, res) => {
    if (err) result(err, null);
    else result(null, { id: res.insertId, success: true });
  });
};
Finance.deleteCasuel = (id, userId, result) => {
  db.query("DELETE FROM finance_casuel WHERE id=? AND userId=?", [id, userId], (err) => {
    if (err) result(err, null); else result(null, { success: true });
  });
};
Finance.sumCasuel = (userId, mois, annee, result) => {
  db.query(
    "SELECT COALESCE(SUM(montant), 0) AS total FROM finance_casuel WHERE userId=? AND mois=? AND annee=?",
    [userId, mois, annee],
    (err, res) => { if (err) result(err, null); else result(null, res[0]); }
  );
};

// ─── Agrégats annuels (pour graphique) ────────────────────────
Finance.getAnnuelRevenus = (userId, annee, result) => {
  db.query(
    "SELECT mois, COALESCE(SUM(montant), 0) AS total FROM finance_revenus WHERE userId=? AND annee=? GROUP BY mois",
    [userId, annee],
    (err, res) => { if (err) result(err, null); else result(null, res); }
  );
};
Finance.getAnnuelDepenses = (userId, annee, result) => {
  db.query(
    "SELECT mois, COALESCE(SUM(montant), 0) AS total FROM finance_depenses WHERE userId=? AND annee=? GROUP BY mois",
    [userId, annee],
    (err, res) => { if (err) result(err, null); else result(null, res); }
  );
};

module.exports = Finance;
