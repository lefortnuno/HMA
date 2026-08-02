"use strict";
const db = require("../config/db");

/**
 * Journal des paiements : trace qui a saisi ou modifie quel paiement.
 * Sert notamment a retrouver un reglement attribue au mauvais locataire.
 */
const PaiementHisto = {};

// Best-effort : un echec de journalisation ne bloque pas l'enregistrement.
PaiementHisto.log = (entry) => {
  const row = {
    ...entry,
    avant: entry.avant ? JSON.stringify(entry.avant) : null,
  };
  db.query("INSERT INTO paiement_histo SET ?", row, (err) => {
    if (err) console.error("[paiement_histo]", err.code, err.message);
  });
};

// Journal d'une annee, du plus recent au plus ancien.
PaiementHisto.getByAnnee = (annee, result) => {
  db.query(
    `SELECT h.*, l.bienId
     FROM paiement_histo h
     LEFT JOIN locataire l ON l.id = h.locataireId
     WHERE h.annee = ?
     ORDER BY h.dateAction DESC, h.id DESC
     LIMIT 500`,
    [annee],
    (err, res) => {
      if (err) return result(err, null);
      result(
        null,
        res.map((r) => ({ ...r, avant: r.avant ? JSON.parse(r.avant) : null }))
      );
    }
  );
};

module.exports = PaiementHisto;
