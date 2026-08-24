/**
 * Contrat de bail — constantes partagées entre les formats individuel et
 * groupe (voir pages/loyer/bail.js).
 *
 * Le bailleur qui signe le contrat n'est pas celui qui encaisse au
 * quotidien : les quittances de loyer portent le nom du gestionnaire
 * (LEFORT N. Nuno), le bail porte celui de la propriétaire (sa mère,
 * titulaire du bien). Les deux sont corrects, chacun dans son document.
 */
export const BAILLEUR = {
  nom: "RAMIANDRISOA Nirina Noeline",
  adresse: "Villa Kinya, Andrainjato, Fianarantsoa",
  cin: "301 992 072 765",
};

export const VILLE = "Fianarantsoa";
export const SOUS_TITRE = "Villa Kinya — Andrainjato, Fianarantsoa";

export const LOYER = { RDC: 150000, "1ER": 200000 };

const EN_LETTRES = { RDC: "cent cinquante mille (150 000)", "1ER": "deux cent mille (200 000)" };

/**
 * Article 1 : le loyer. Formulé au singulier pour un contrat qui ne
 * concerne qu'un étage (individuel, ou groupe limité à un étage), au double
 * s'il couvre les deux — exactement la formulation retenue pour le contrat
 * de la résidence entière.
 */
export function article1(etages) {
  const rdc = etages.has("RDC");
  const premier = etages.has("1ER");
  if (rdc && premier) {
    return (
      "Le présent bail est consenti pour un loyer mensuel de " +
      `${EN_LETTRES.RDC} ariary pour les chambres du rez-de-chaussée et de ` +
      `${EN_LETTRES["1ER"]} ariary pour les chambres du premier étage, que ` +
      "chaque locataire s'oblige à transférer par mobile money ou à régler " +
      "en espèces, mensuellement, tous les 05 du mois à l'échéance du loyer."
    );
  }
  const montant = EN_LETTRES[rdc ? "RDC" : "1ER"];
  return (
    `Le présent bail est consenti pour un loyer mensuel de ${montant} ariary, ` +
    "que le locataire s'oblige à transférer par mobile money ou à régler en " +
    "espèces, mensuellement, tous les 05 du mois à l'échéance du loyer."
  );
}

export const ARTICLE_2 =
  "Le présent bail est consenti pour la durée de 1 an, à moins que l'une " +
  "des Parties ne manifeste à l'autre l'intention de le résilier avec un " +
  "préavis de 3 mois.";

export const ARTICLE_3 =
  "Le défaut d'exécution du présent bail, faisant l'objet d'une sommation " +
  "d'exécution faite selon les règles, restée sans effet dans un délai de " +
  "30 jours, entraînera la résiliation de plein droit dudit bail si bon " +
  "semble au propriétaire.";

/** Nom légal si connu, sinon repli sur le nom d'usage — jamais de champ vide. */
export const nomLegalDe = (loc) =>
  (loc.nomComplet && loc.nomComplet.trim()) || `${loc.nom} ${loc.prenom || ""}`.trim();

export const cinDe = (loc) => (loc.cin && loc.cin.trim()) || null;
