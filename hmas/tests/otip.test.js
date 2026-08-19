"use strict";
/**
 * Budget OTIP — previsionnel des deux dates de depart.
 *
 * Iruno part le 29 aout ou le 7 septembre. Seule la paie de fin de mois
 * separe les deux cas, et le « reste a trouver » se calcule sur le depart le
 * plus tot — celui qui laisse le moins d'argent.
 *
 * Fichier temporaire, supprime avec le module (scripts/remove_otip.js).
 */
const { test } = require("node:test");
const assert = require("node:assert");
const O = require("../utils/otip");

const PARAMS = {
  objectif: 120000,
  periode1: "Août",
  periode2: "Septembre",
  depart1: "29 août",
  depart2: "7 septembre",
};

// Jeu de reference : la situation reellement saisie par le bailleur.
const LIGNES = [
  { section: "LIQUIDITE", libelle: "Compte bancaire (CIH)", montant: 6954 },
  { section: "LIQUIDITE", libelle: "Portefeuille (cash)", montant: 230 },
  { section: "LIQUIDITE", libelle: "Épargne", montant: 545 },

  { section: "CREANCE", libelle: "Ami (155 DH)", montant: 155, mois: "Août" },
  { section: "CREANCE", libelle: "Amie (1/2)", montant: 210, mois: "Août" },
  { section: "CREANCE", libelle: "Amie (2/2)", montant: 210, mois: "Septembre" },
  { section: "CREANCE", libelle: "Ami (petite dette)", montant: 10, mois: "Août" },

  { section: "EMPRUNT", libelle: "Papa", montant: 21000, mois: "Août" },
  { section: "EMPRUNT", libelle: "Souria / AC2I", montant: 30000, mois: "Août",
    montant2: 3000, moisRemb: "Septembre" },
  { section: "EMPRUNT", libelle: "Tom", montant: 20000, mois: "Août" },

  { section: "REVENU", libelle: "Salaire", montant: 9000, montant2: 9000, finDeMois: 1 },
  { section: "REVENU", libelle: "Loyers Madagascar", montant: 2152, montant2: 2152 },

  { section: "FIXE", libelle: "Loyer", montant: 1150 },
  { section: "FIXE", libelle: "Internet", montant: 60 },
  { section: "FIXE", libelle: "Wifi", montant: 500 },
  { section: "FIXE", libelle: "Tram", montant: 160 },
  { section: "FIXE", libelle: "Gym", montant: 290 },
  { section: "FIXE", libelle: "Redal", montant: 100 },
  { section: "FIXE", libelle: "Abonnement Claude Pro", montant: 231 },

  { section: "PONCTUELLE", libelle: "Nourriture", montant: 500, mois: "Août" },
  { section: "PONCTUELLE", libelle: "Enterrement", montant: 1000, mois: "Août" },
  { section: "PONCTUELLE", libelle: "Mariage", montant: 1000, mois: "Septembre" },
];

const DEPENSES = [{ montant: 316 }];

//  7 729 de liquidites − 316 de depenses          =  7 413
//  + 2 152 loyers + 375 creances + 71 000 emprunts
//  − 2 491 fixes − 1 500 ponctuelles              = 76 949  (depart le 29 aout)
//  + 9 000 de paie                                = 85 949  (depart le 7 septembre)
const SANS_PAIE = 76949;
const AVEC_PAIE = 85949;

test("les deux departs ne different que de la paie de fin de mois", () => {
  const r = O.calculer(LIGNES, DEPENSES, PARAMS);
  assert.strictEqual(r.scenarios.length, 2);
  assert.strictEqual(r.scenarios[0].libelle, "29 août");
  assert.strictEqual(r.scenarios[1].libelle, "7 septembre");
  assert.strictEqual(r.scenarios[0].disponible, SANS_PAIE);
  assert.strictEqual(r.scenarios[1].disponible, AVEC_PAIE);
  assert.strictEqual(r.scenarios[1].disponible - r.scenarios[0].disponible, 9000);
});

test("le reste a trouver se base sur le depart le plus tot", () => {
  const r = O.calculer(LIGNES, DEPENSES, PARAMS);
  assert.strictEqual(r.reference.libelle, "29 août");
  assert.strictEqual(r.soldeReference, SANS_PAIE);
  assert.strictEqual(r.resteATrouver, 120000 - SANS_PAIE);
  // Surtout pas le scenario le plus favorable : il masquerait 9 000 DH.
  assert.notStrictEqual(r.resteATrouver, 120000 - AVEC_PAIE);
});

test("un revenu sans drapeau est acquis dans les deux cas", () => {
  const r = O.calculer(LIGNES, DEPENSES, PARAMS);
  assert.strictEqual(r.revenusCourants, 2152); // loyers Madagascar
  assert.strictEqual(r.revenusFinDeMois, 9000); // salaire
  assert.strictEqual(r.scenarios[0].revenus, 2152);
  assert.strictEqual(r.scenarios[1].revenus, 11152);
});

test("plus aucun horizon « fin septembre »", () => {
  const r = O.calculer(LIGNES, DEPENSES, PARAMS);
  assert.strictEqual(r.colonnes, undefined);
  assert.ok(!("cloture" in r.scenarios[0]));
});

test("ce qui tombe apres le depart est conserve mais hors garantie", () => {
  const r = O.calculer(LIGNES, DEPENSES, PARAMS);
  assert.strictEqual(r.horsFenetre.creances, 210);      // Amie 2/2
  assert.strictEqual(r.horsFenetre.ponctuelles, 1000);  // Mariage
  assert.strictEqual(r.horsFenetre.remboursements, 3000); // Souria, fin sept.
  assert.strictEqual(r.horsFenetre.revenus, 11152);
  // et rien de tout cela n'entre dans les scenarios
  assert.strictEqual(r.scenarios[0].creances, 375);
  assert.strictEqual(r.scenarios[0].ponctuelles, 1500);
  assert.strictEqual(r.scenarios[0].remboursements, 0);
});

test("un remboursement demarrant avant le depart greve les deux scenarios", () => {
  const avance = LIGNES.map((l) =>
    l.libelle === "Souria / AC2I" ? { ...l, moisRemb: "Août" } : l,
  );
  const r = O.calculer(avance, DEPENSES, PARAMS);
  assert.strictEqual(r.scenarios[0].remboursements, 3000);
  assert.strictEqual(r.scenarios[0].disponible, SANS_PAIE - 3000);
  assert.strictEqual(r.scenarios[1].disponible, AVEC_PAIE - 3000);
});

test("les depenses journalieres se deduisent des deux scenarios", () => {
  const r = O.calculer(LIGNES, [...DEPENSES, { montant: 500 }], PARAMS);
  assert.strictEqual(r.depensesEngagees, 816);
  assert.strictEqual(r.scenarios[0].disponible, SANS_PAIE - 500);
  assert.strictEqual(r.scenarios[1].disponible, AVEC_PAIE - 500);
  assert.strictEqual(r.resteATrouver, 120000 - SANS_PAIE + 500);
});

test("objectif atteint : plus de reste, un surplus apparait", () => {
  const riche = [...LIGNES, { section: "LIQUIDITE", libelle: "Don", montant: 50000 }];
  const r = O.calculer(riche, DEPENSES, PARAMS);
  assert.strictEqual(r.resteATrouver, 0);
  assert.strictEqual(r.surplus, SANS_PAIE + 50000 - 120000);
  assert.strictEqual(r.progression, 100);
});

test("une saisie vide ou aberrante ne casse pas le calcul", () => {
  const r = O.calculer(
    [{ section: "LIQUIDITE", montant: null }, { section: "FIXE", montant: "abc" }],
    [{ montant: undefined }],
    PARAMS,
  );
  assert.strictEqual(r.liquidites, 0);
  assert.strictEqual(r.totalFixes, 0);
  assert.ok(Number.isFinite(r.soldeReference));
  assert.ok(Number.isFinite(r.scenarios[1].disponible));
});

test("sections connues seulement", () => {
  assert.ok(O.isSectionValide("EMPRUNT"));
  assert.ok(!O.isSectionValide("N_IMPORTE_QUOI"));
});
