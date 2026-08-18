"use strict";
/**
 * Budget OTIP — garantie bancaire pour le depart d'Iruno en France.
 *
 * MODULE TEMPORAIRE. Tout ce qui le concerne est prefixe `otip` et se
 * supprime d'un bloc : voir scripts/remove_otip.js.
 *
 * Ce fichier rejoue la chaine de calcul du classeur Budget_OTIP_Iruno.xlsx.
 * Le principe tient en une phrase : le solde roule d'un mois sur l'autre,
 * comme un compte en banque. Septembre ne repart pas de zero, il continue
 * sur ce qui reste fin aout.
 *
 * Les montants sont en dirhams (MAD), et non en ariary comme le reste de
 * l'application : ce budget vit dans un pays different.
 */

// Natures de ligne. Chacune n'utilise qu'une partie des colonnes, d'ou une
// seule table plutot que six (voir models/otip.model.js).
const SECTIONS = {
  LIQUIDITE: { label: "Liquidités actuelles" },
  CREANCE: { label: "Créances à recevoir" },
  EMPRUNT: { label: "Emprunts prévus" },
  REVENU: { label: "Revenus mensuels" },
  FIXE: { label: "Dépenses fixes" },
  PONCTUELLE: { label: "Dépenses ponctuelles" },
};

const isSectionValide = (s) =>
  Object.prototype.hasOwnProperty.call(SECTIONS, String(s || ""));

const nb = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const somme = (lignes, section, champ = "montant") =>
  lignes
    .filter((l) => l.section === section)
    .reduce((s, l) => s + nb(l[champ]), 0);

const sommeMois = (lignes, section, mois, champ = "montant") =>
  lignes
    .filter((l) => l.section === section && l.mois === mois)
    .reduce((s, l) => s + nb(l[champ]), 0);

/**
 * Remboursements dus au cours d'un mois donne.
 *
 * Cumulatif a dessein : un pret dont le remboursement demarre en aout se
 * rembourse aussi en septembre. On additionne donc tous les prets dont le
 * debut tombe a ce mois-ci ou avant.
 */
function remboursementsDus(lignes, moisOrdonnes, indexMois) {
  const dejaCommences = moisOrdonnes.slice(0, indexMois + 1);
  return lignes
    .filter((l) => l.section === "EMPRUNT" && dejaCommences.includes(l.moisRemb))
    .reduce((s, l) => s + nb(l.montant2), 0);
}

/**
 * Previsionnel complet.
 *
 * @param lignes    lignes du budget (toutes sections confondues)
 * @param depenses  depenses journalieres deja engagees
 * @param params    { objectif, periode1, periode2 }
 */
function calculer(lignes, depenses, params) {
  const l = Array.isArray(lignes) ? lignes : [];
  const objectif = nb(params && params.objectif);
  const p1 = (params && params.periode1) || "Août";
  const p2 = (params && params.periode2) || "Septembre";
  const mois = [p1, p2];

  const depensesEngagees = (Array.isArray(depenses) ? depenses : []).reduce(
    (s, d) => s + nb(d.montant),
    0,
  );

  // Les depenses deja engagees viennent en deduction du point de depart.
  const liquidites = somme(l, "LIQUIDITE") - depensesEngagees;
  const fixes = somme(l, "FIXE");

  const colonnes = mois.map((m, i) => {
    const revenus = somme(l, "REVENU", i === 0 ? "montant" : "montant2");
    const creances = sommeMois(l, "CREANCE", m);
    const emprunts = sommeMois(l, "EMPRUNT", m);
    const ponctuelles = sommeMois(l, "PONCTUELLE", m);
    const remboursements = remboursementsDus(l, mois, i);
    return {
      mois: m,
      revenus,
      creances,
      emprunts,
      fixes,
      remboursements,
      ponctuelles,
      net: revenus + creances + emprunts - fixes - remboursements - ponctuelles,
    };
  });

  // Le solde roule : chaque mois ouvre sur la cloture du precedent.
  let report = liquidites;
  colonnes.forEach((c) => {
    c.ouverture = report;
    c.cloture = report + c.net;
    report = c.cloture;
  });

  const final = colonnes[colonnes.length - 1].cloture;

  return {
    objectif,
    depensesEngagees,
    liquidites,
    totalCreances: somme(l, "CREANCE"),
    totalEmprunts: somme(l, "EMPRUNT"),
    totalRemboursementMensuel: somme(l, "EMPRUNT", "montant2"),
    totalFixes: fixes,
    totalPonctuelles: somme(l, "PONCTUELLE"),
    colonnes,
    soldeFinal: final,
    resteATrouver: Math.max(objectif - final, 0),
    surplus: Math.max(final - objectif, 0),
    // Part de l'objectif deja couverte, bornee a 100 % pour la barre de progression.
    progression: objectif > 0 ? Math.min((final / objectif) * 100, 100) : 0,
  };
}

module.exports = { SECTIONS, isSectionValide, calculer };
