/**
 * Échéances de loyer.
 *
 * Deux façons de régler, selon le locataire :
 *
 *  ECHU (« il consomme puis il paie ») — règle historique de la Villa Kinya.
 *      Le loyer du mois M se règle le jour J du mois M+1.
 *      Ex. : Ben Aly paie le 15 ; le loyer de juillet est dû le 15 août.
 *
 *  AVANCE (« il paie puis il consomme ») — règle des nouveaux locataires.
 *      Le loyer du mois M se règle le jour J du mois M lui-même.
 *
 * Sans mode enregistré, on retient ECHU : c'est le fonctionnement de toutes
 * les fiches créées avant l'introduction de ce réglage.
 */

export const MODE_ECHU = "ECHU";
export const MODE_AVANCE = "AVANCE";

export function estAvance(loc) {
  return String(loc?.modePaiement || MODE_ECHU).toUpperCase() === MODE_AVANCE;
}

/**
 * Jour de règlement retenu pour les calculs.
 * À défaut de jour saisi, c'est le jour d'entrée : la date anniversaire du
 * bail est celle à laquelle le locataire se présente chaque mois.
 */
// Jour du mois où le locataire est entré (1 par défaut).
export function jourEntree(loc) {
  const d = loc?.dateEntree ? new Date(loc.dateEntree) : null;
  return d && !isNaN(d) ? d.getDate() : 1;
}

/**
 * Le règlement du locataire chevauche-t-il deux mois ?
 *
 * Seulement pour une entrée à la moitié du mois ou plus, ET avec un jour de
 * règlement habituel renseigné : sans ces deux conditions, on ne sait pas où
 * couper la période et le locataire règle des mois entiers. Une entrée le 2
 * du mois n'est pas un chevauchement.
 */
export function aChevalSurDeuxMois(loc) {
  return jourEntree(loc) >= 15 && Number(loc?.jourPaiement) > 0;
}

export function jourReglement(loc) {
  const saisi = Number(loc?.jourPaiement) || 0;
  if (saisi) return saisi;
  const d = loc?.dateEntree ? new Date(loc.dateEntree) : null;
  if (d && !isNaN(d)) return d.getDate();
  return 1; // rien de connu : échéance au changement de mois
}

/**
 * Part du loyer d'un mois déjà exigible aujourd'hui : 0, la moitié, ou tout.
 *
 * Un locataire entré en cours de mois règle à cheval sur deux mois. Ben Aly,
 * entré le 15 : son versement du 15 août solde la seconde moitié de juillet
 * et avance la première moitié d'août. Au 2 août, juin lui est donc dû en
 * entier, juillet pour moitié seulement, et août pas encore.
 *
 * Pour une entrée le 1er (la majorité des fiches), il n'y a pas de chevauchement
 * et l'on retombe sur le comportement d'origine : 0 puis tout.
 */
// Mois antérieur à l'arrivée du locataire : il ne lui est rien dû.
export function estAvantEntree(loc, mois, annee) {
  if (!loc?.dateEntree) return false;
  const d = new Date(loc.dateEntree);
  if (isNaN(d)) return false;
  const an = Number(annee);
  if (d.getFullYear() > an) return true;
  return d.getFullYear() === an && Number(mois) < d.getMonth() + 1;
}

export function partExigible(loc, mois, annee) {
  if (!loc) return 0;
  if (estAvantEntree(loc, mois, annee)) return 0;
  const now = new Date();
  const anneeCourante = now.getFullYear();
  const m = Number(mois);
  const a = Number(annee);

  if (a > anneeCourante) return 0;
  if (a < anneeCourante) return 1; // année révolue : tout est dû

  const jour = jourReglement(loc);
  const moisCourant = now.getMonth() + 1;
  // Le mois d'échéance du solde : M pour un règlement d'avance, M+1 sinon.
  const moisSolde = estAvance(loc) ? m : m + 1;
  const passee = (moisCible) =>
    moisCourant > moisCible || (moisCourant === moisCible && now.getDate() >= jour);

  if (passee(moisSolde)) return 1;
  // Demi-période uniquement pour un cycle qui chevauche vraiment deux mois.
  if (aChevalSurDeuxMois(loc) && passee(moisSolde - 1)) return 0.5;
  return 0;
}

// Montant réellement dû à ce jour pour un mois donné.
export function montantDu(loc, mois, annee) {
  return Math.round((Number(loc?.loyer) || 0) * partExigible(loc, mois, annee));
}

/**
 * Mois réellement à recouvrer pour un locataire, sur une année donnée :
 * de son entrée jusqu'au dernier mois dont l'échéance est passée.
 */
export function moisExigibles(loc, annee) {
  if (!loc) return [];
  let debut = 1;
  if (loc.dateEntree) {
    const d = new Date(loc.dateEntree);
    if (!isNaN(d)) {
      if (d.getFullYear() > Number(annee)) return []; // pas encore entré
      if (d.getFullYear() === Number(annee)) debut = d.getMonth() + 1;
    }
  }

  const mois = [];
  for (let m = debut; m <= 12; m++) {
    if (partExigible(loc, m, annee) > 0) mois.push(m);
  }
  return mois;
}

// Libellé court pour les colonnes de tableau : « le 15 (M+1) ».
export function libelleJour(loc) {
  const jour = Number(loc?.jourPaiement) || 0;
  if (!jour) return null;
  return estAvance(loc) ? `le ${jour}` : `le ${jour} (M+1)`;
}

// Phrase complète pour les infobulles et les fiches.
export function libelleEcheance(loc) {
  const jour = Number(loc?.jourPaiement) || 0;
  if (estAvance(loc)) {
    return jour
      ? `Règle d'avance, le ${jour} du mois même`
      : "Règle d'avance (paie puis consomme)";
  }
  return jour
    ? `Règle à terme échu, le ${jour} du mois suivant`
    : "Règle à terme échu (consomme puis paie)";
}

// Mois où tombe l'échéance du loyer de `mois` : M pour un règlement
// d'avance, M+1 pour un règlement à terme échu.
export function moisEcheance(loc, mois) {
  return estAvance(loc) ? Number(mois) : Number(mois) + 1;
}
