"use strict";
/**
 * Logique metier pure (sans DB) : calculs JIRAMA / benefices + validations.
 * Testee par tests/calc.test.js.
 */

const CHAMBRES_RDC = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const CHAMBRES_1ER = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const MONO_CHAMBRE = "Villa"; // slot unique d'un appartement loue en entier

// ── Calculs ──────────────────────────────────────────────────────────────────
function consommation(indexPrev, indexCurr) {
  const prev = Number(indexPrev) || 0;
  const curr = Number(indexCurr) || 0;
  return Math.max(0, curr - prev);
}

function montantJIRAMA(conso, prixUnitaire) {
  const c = Number(conso) || 0;
  const p = Number(prixUnitaire) || 0;
  if (c < 0 || p < 0) return 0;
  return c * p;
}

function benefice(totalLoyers, totalJIRAMA, totalDepenses) {
  return (
    (Number(totalLoyers) || 0) +
    (Number(totalJIRAMA) || 0) -
    (Number(totalDepenses) || 0)
  );
}

// ── Validations ──────────────────────────────────────────────────────────────
function isMoisValide(mois) {
  const m = Number(mois);
  return Number.isInteger(m) && m >= 1 && m <= 12;
}

function isAnneeValide(annee) {
  const a = Number(annee);
  return Number.isInteger(a) && a >= 2020 && a <= 2100;
}

function isMontantValide(montant) {
  const m = Number(montant);
  return Number.isFinite(m) && m >= 0;
}

function isEtageValide(etage) {
  return etage === "RDC" || etage === "1ER";
}

// bienId 0 = VILLA KINYA (grille stricte). Autre bien = slot "Villa".
function isChambreValide(chambre, etage, bienId) {
  if (Number(bienId) !== 0) return chambre === MONO_CHAMBRE;
  if (etage === "RDC") return CHAMBRES_RDC.includes(String(chambre));
  if (etage === "1ER") return CHAMBRES_1ER.includes(String(chambre));
  return false;
}

function isStatutValide(statut) {
  return ["PAYE", "PARTIEL", "IMPAYE"].includes(statut);
}

module.exports = {
  CHAMBRES_RDC,
  CHAMBRES_1ER,
  MONO_CHAMBRE,
  consommation,
  montantJIRAMA,
  benefice,
  isMoisValide,
  isAnneeValide,
  isMontantValide,
  isEtageValide,
  isChambreValide,
  isStatutValide,
};
