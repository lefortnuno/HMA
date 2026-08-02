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
 * Mois réellement à recouvrer pour un locataire, sur une année donnée :
 * de son entrée jusqu'au dernier mois dont l'échéance est passée.
 */
export function moisExigibles(loc, annee) {
  if (!loc) return [];
  const now = new Date();
  const anneeCourante = now.getFullYear();
  const moisCourant = now.getMonth() + 1;

  if (Number(annee) > anneeCourante) return []; // année à venir

  let debut = 1;
  if (loc.dateEntree) {
    const d = new Date(loc.dateEntree);
    if (!isNaN(d)) {
      if (d.getFullYear() > Number(annee)) return []; // pas encore entré
      if (d.getFullYear() === Number(annee)) debut = d.getMonth() + 1;
    }
  }

  let fin;
  if (Number(annee) !== anneeCourante) {
    fin = 12; // année passée : tous les mois sont échus
  } else {
    const jour = Number(loc.jourPaiement) || 0;
    const echeanceDuMoisPassee = jour > 0 && now.getDate() > jour;

    if (estAvance(loc)) {
      // Le mois en cours est dû dès que sa date de règlement est dépassée.
      fin = echeanceDuMoisPassee ? moisCourant : moisCourant - 1;
    } else if (jour > 0) {
      // À terme échu : c'est le mois PRÉCÉDENT qui se règle ce mois-ci.
      // Avant la date habituelle, il n'est pas encore en retard.
      fin = echeanceDuMoisPassee ? moisCourant - 1 : moisCourant - 2;
    } else {
      // Jour de règlement inconnu : le mois précédent reste à recouvrer
      // pendant le mois en cours, sans qu'on puisse dire s'il est en retard.
      fin = moisCourant - 1;
    }
  }

  const mois = [];
  for (let m = debut; m <= fin; m++) mois.push(m);
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
