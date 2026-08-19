"use strict";
/**
 * Budget OTIP — garantie bancaire pour le depart d'Iruno en France.
 *
 * MODULE TEMPORAIRE. Tout ce qui le concerne est prefixe `otip` et se
 * supprime d'un bloc : voir scripts/remove_otip.js.
 *
 * Le budget ne se lit plus mois par mois mais par DATE DE DEPART : Iruno part
 * le 29 aout, ou le 7 septembre. L'argent doit etre reuni avant son depart —
 * ce qui tombe apres ne sert plus la garantie.
 *
 * La difference entre les deux dates tient a une seule chose : la paie de fin
 * de mois. Le 29 aout elle n'est pas encore versee, le 7 septembre si. D'ou
 * le drapeau `finDeMois` sur les revenus.
 *
 * Le « reste a trouver » se calcule sur le depart le plus tot, celui qui
 * laisse le moins d'argent : mieux vaut viser haut et etre en avance que
 * decouvrir un trou la veille.
 *
 * Les montants sont en dirhams (MAD), et non en ariary comme le reste de
 * l'application : ce budget vit dans un pays different.
 */

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
 * Previsionnel des deux dates de depart.
 *
 * @param lignes    lignes du budget (toutes sections confondues)
 * @param depenses  depenses journalieres deja engagees
 * @param params    { objectif, periode1, periode2, depart1, depart2 }
 */
function calculer(lignes, depenses, params) {
  const l = Array.isArray(lignes) ? lignes : [];
  const p = params || {};
  const objectif = nb(p.objectif);
  // Periode retenue pour la garantie : celle d'avant le depart. Les libelles
  // restent ceux des lignes ("Août"), on ne les renomme pas.
  const P1 = p.periode1 || "Août";
  const P2 = p.periode2 || "Septembre";

  const depensesEngagees = (Array.isArray(depenses) ? depenses : []).reduce(
    (s, d) => s + nb(d.montant),
    0,
  );

  // Les depenses deja engagees viennent en deduction du point de depart.
  const liquidites = somme(l, "LIQUIDITE") - depensesEngagees;
  const fixes = somme(l, "FIXE");

  // Revenus : ceux qui tombent en cours de mois sont acquis dans les deux cas,
  // ceux de fin de mois seulement si le depart est posterieur a la paie.
  const revenus = l.filter((x) => x.section === "REVENU");
  const revenusCourants = revenus
    .filter((x) => !x.finDeMois)
    .reduce((s, x) => s + nb(x.montant), 0);
  const revenusFinDeMois = revenus
    .filter((x) => x.finDeMois)
    .reduce((s, x) => s + nb(x.montant), 0);

  const creances = sommeMois(l, "CREANCE", P1);
  const emprunts = sommeMois(l, "EMPRUNT", P1);
  const ponctuelles = sommeMois(l, "PONCTUELLE", P1);
  // Un remboursement ne pese que s'il a demarre avant le depart. Celui de
  // Souria commence fin septembre : il ne greve aucun des deux scenarios.
  const remboursements = l
    .filter((x) => x.section === "EMPRUNT" && x.moisRemb === P1)
    .reduce((s, x) => s + nb(x.montant2), 0);

  const socle = liquidites + revenusCourants + creances + emprunts - fixes - ponctuelles - remboursements;

  const scenarios = [
    {
      cle: "TOT",
      libelle: p.depart1 || "29 août",
      paieRecue: false,
      disponible: socle,
    },
    {
      cle: "TARD",
      libelle: p.depart2 || "7 septembre",
      paieRecue: true,
      disponible: socle + revenusFinDeMois,
    },
  ].map((s) => ({
    ...s,
    liquidites,
    revenus: revenusCourants + (s.paieRecue ? revenusFinDeMois : 0),
    creances,
    emprunts,
    fixes,
    ponctuelles,
    remboursements,
    manque: Math.max(objectif - s.disponible, 0),
  }));

  // Le scenario de reference est le depart le plus tot : c'est celui qui
  // laisse le moins d'argent, donc celui qui ne reserve pas de surprise.
  const reference = scenarios[0];

  // Ce qui tombe apres le depart : conserve et affiche, mais hors garantie.
  const horsFenetre = {
    revenus: revenus.reduce((s, x) => s + nb(x.montant2), 0),
    creances: sommeMois(l, "CREANCE", P2),
    ponctuelles: sommeMois(l, "PONCTUELLE", P2),
    remboursements: l
      .filter((x) => x.section === "EMPRUNT" && x.moisRemb === P2)
      .reduce((s, x) => s + nb(x.montant2), 0),
  };

  return {
    objectif,
    depensesEngagees,
    liquidites,
    revenusCourants,
    revenusFinDeMois,
    totalCreances: somme(l, "CREANCE"),
    totalEmprunts: somme(l, "EMPRUNT"),
    totalRemboursementMensuel: somme(l, "EMPRUNT", "montant2"),
    totalFixes: fixes,
    totalPonctuelles: somme(l, "PONCTUELLE"),
    scenarios,
    reference,
    soldeReference: reference.disponible,
    resteATrouver: Math.max(objectif - reference.disponible, 0),
    surplus: Math.max(reference.disponible - objectif, 0),
    // Part de l'objectif deja couverte, bornee a 100 % pour la barre.
    progression: objectif > 0 ? Math.min((reference.disponible / objectif) * 100, 100) : 0,
    horsFenetre,
  };
}

module.exports = { SECTIONS, isSectionValide, calculer };
