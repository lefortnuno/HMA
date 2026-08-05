"use strict";
/**
 * Logique metier pure (sans DB) : calculs JIRAMA / benefices + validations.
 * Testee par tests/calc.test.js.
 */
const { jourLocal } = require("./dates");

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
  // DOUTE : le locataire affirme avoir paye, en attente de confirmation
  // sur place. Le loyer reste compte comme a recouvrer.
  return ["PAYE", "PARTIEL", "IMPAYE", "DOUTE"].includes(statut);
}

// Jour du mois ou la facture de la compagnie arrive habituellement.
const JOUR_FACTURE_JIRAMA = 25;

/**
 * La facture JIRAMA d'un mois est-elle censee etre arrivee ?
 *
 * L'eau et l'electricite se consomment puis se paient : le releve du mois en
 * cours n'existe pas encore, et rien ne peut etre reclame avant l'arrivee de
 * la facture, vers le 25. Sans cette regle, le mois en cours apparaissait des
 * le 1er dans les sommes a recouvrer.
 *
 * Le quantieme est celui de Tananarive, pas celui du serveur : Render tourne
 * en UTC et le 25 y commence trois heures apres le 25 malgache.
 */
function factureJiramaArrivee(mois, annee, aujourdhui = new Date()) {
  const m = Number(mois);
  const a = Number(annee);
  const {
    annee: anneeCourante,
    mois: moisCourant,
    jour: jourCourant,
  } = jourLocal(aujourdhui);

  if (a < anneeCourante) return true;   // annee revolue
  if (a > anneeCourante) return false;  // annee a venir
  if (m < moisCourant) return true;     // mois revolu
  if (m > moisCourant) return false;    // mois a venir
  return jourCourant >= JOUR_FACTURE_JIRAMA;
}

/**
 * Statuts admis pour l'eau et l'electricite.
 *
 * ABSENT s'ajoute aux quatre autres : le locataire n'a pas occupe sa chambre
 * du mois, rien ne lui est du. Volontairement absent de isStatutValide : une
 * absence ne dispense jamais du loyer.
 */
function isStatutJiramaValide(statut) {
  return isStatutValide(statut) || statut === "ABSENT";
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
  isStatutJiramaValide,
  factureJiramaArrivee,
  JOUR_FACTURE_JIRAMA,
};
