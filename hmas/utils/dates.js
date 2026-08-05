"use strict";
/**
 * Le jour courant, vu du logement.
 *
 * Render tourne en UTC, Madagascar est a UTC+3 : entre minuit et 3 h a
 * Tananarive, le serveur est encore la veille. Toute regle metier qui compare
 * un quantieme (« la facture JIRAMA arrive le 25 ») se trompait donc pendant
 * trois heures chaque nuit.
 *
 * Le fuseau est fixe toute l'annee, sans heure d'ete : aucune ambiguite.
 */
const FUSEAU_LOGEMENT = "Indian/Antananarivo";

/** { annee, mois (1-12), jour } a l'instant donne, dans le fuseau du logement. */
function jourLocal(instant = new Date(), fuseau = FUSEAU_LOGEMENT) {
  // en-CA formate directement en AAAA-MM-JJ.
  const [a, m, j] = new Intl.DateTimeFormat("en-CA", {
    timeZone: fuseau,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(instant)
    .split("-")
    .map(Number);
  return { annee: a, mois: m, jour: j };
}

/** Date du jour au format AAAA-MM-JJ, dans le fuseau du logement. */
function dateDuJour(instant = new Date(), fuseau = FUSEAU_LOGEMENT) {
  const { annee, mois, jour } = jourLocal(instant, fuseau);
  return `${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
}

module.exports = { FUSEAU_LOGEMENT, jourLocal, dateDuJour };
