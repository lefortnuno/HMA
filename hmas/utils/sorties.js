"use strict";
/**
 * Nature des sorties d'argent.
 *
 * « Depense immobiliere » ne suffisait plus : il faut aussi loger le
 * quotidien, les fonds envoyes a la famille a l'etranger, et les
 * investissements a venir.
 *
 * La distinction qui compte n'est pas le libelle mais `impacte` : une charge
 * de la residence greve son resultat, un envoi familial n'est pas une charge
 * — c'est une part du benefice qu'on en sort. Les confondre ferait fondre le
 * resultat de la maison sans qu'elle ait rien coute de plus.
 *
 * Le defaut reste modifiable ligne par ligne : une meme nature peut couvrir
 * les deux cas selon la situation.
 */
const TYPES = {
  IMMOBILIER: { label: "Immobilier", impacte: true },
  QUOTIDIEN: { label: "Quotidien", impacte: true },
  FAMILLE: { label: "Envoi famille", impacte: false },
  INVESTISSEMENT: { label: "Investissement", impacte: false },
  AUTRE: { label: "Autre", impacte: true },
};

const isTypeValide = (t) => Object.prototype.hasOwnProperty.call(TYPES, String(t || ""));

/** Type normalise, avec repli sur IMMOBILIER (la nature historique). */
const normaliseType = (t) => (isTypeValide(t) ? String(t) : "IMMOBILIER");

/**
 * Cette sortie greve-t-elle le resultat de la residence ?
 *
 * Le choix explicite prime ; sinon on retient le defaut de la nature.
 */
function impacteBenefice(type, choixExplicite) {
  if (choixExplicite !== undefined && choixExplicite !== null && choixExplicite !== "")
    return choixExplicite ? 1 : 0;
  return TYPES[normaliseType(type)].impacte ? 1 : 0;
}

module.exports = { TYPES, isTypeValide, normaliseType, impacteBenefice };
