"use strict";
/**
 * Le previsionnel doit rendre exactement ce que calcule Budget_OTIP_Iruno.xlsx.
 *
 * Les valeurs attendues ci-dessous sont celles mises en cache par Excel dans
 * le classeur : si le calcul reimplemente derive, ces tests le disent.
 *
 * Fichier temporaire, supprime avec le module (scripts/remove_otip.js).
 */
const { test } = require("node:test");
const assert = require("node:assert");
const O = require("../utils/otip");

// Reprise fidele du classeur, salaire de 9 000 DH sur les deux mois.
const PARAMS = { objectif: 120000, periode1: "Août", periode2: "Septembre" };

const LIGNES = [
  { section: "LIQUIDITE", libelle: "Compte bancaire (CIH)", montant: 6954 },
  { section: "LIQUIDITE", libelle: "Portefeuille (cash)", montant: 230 },
  { section: "LIQUIDITE", libelle: "Épargne", montant: 545 },

  { section: "CREANCE", libelle: "Ami (155 DH)", montant: 155, mois: "Août" },
  { section: "CREANCE", libelle: "Amie (1/2)", montant: 210, mois: "Août" },
  { section: "CREANCE", libelle: "Amie (2/2)", montant: 210, mois: "Septembre" },
  { section: "CREANCE", libelle: "Ami (petite dette)", montant: 10, mois: "Août" },

  { section: "EMPRUNT", libelle: "Souria / AC2I", montant: 30000, mois: "Août",
    montant2: 3000, moisRemb: "Septembre" },
  { section: "EMPRUNT", libelle: "Rica", montant: 20000, mois: "Août", montant2: 0 },
  { section: "EMPRUNT", libelle: "Tom", montant: 15000, mois: "Août", montant2: 0 },
  { section: "EMPRUNT", libelle: "Nasser", montant: 10000, mois: "Août", montant2: 0 },

  { section: "REVENU", libelle: "Salaire", montant: 9000, montant2: 9000 },
  { section: "REVENU", libelle: "Loyers Madagascar", montant: 2152, montant2: 2152 },

  { section: "FIXE", libelle: "Loyer", montant: 1150 },
  { section: "FIXE", libelle: "Internet", montant: 60 },
  { section: "FIXE", libelle: "Wifi", montant: 500 },
  { section: "FIXE", libelle: "Tram", montant: 160 },
  { section: "FIXE", libelle: "Gym", montant: 290 },
  { section: "FIXE", libelle: "Redal", montant: 100 },
  { section: "FIXE", libelle: "Abonnement Claude Pro", montant: 231 },

  { section: "PONCTUELLE", libelle: "Événement (Caustard)", montant: 950, mois: "Août" },
  { section: "PONCTUELLE", libelle: "Enterrement", montant: 1000, mois: "Août" },
  { section: "PONCTUELLE", libelle: "Mariage", montant: 1000, mois: "Septembre" },
];

test("les totaux de section rejoignent le classeur", () => {
  const r = O.calculer(LIGNES, [], PARAMS);
  assert.strictEqual(r.liquidites, 7729);        // B13
  assert.strictEqual(r.totalEmprunts, 75000);    // C35
  assert.strictEqual(r.totalFixes, 2491);        // B52
  assert.strictEqual(r.totalPonctuelles, 2950);  // B59
  assert.strictEqual(r.totalCreances, 585);      // B21
});

test("le solde de cloture reproduit exactement le classeur", () => {
  const r = O.calculer(LIGNES, [], PARAMS);
  assert.strictEqual(r.colonnes[0].cloture, 89815); // B71
  assert.strictEqual(r.colonnes[1].cloture, 94686); // C71
  assert.strictEqual(r.resteATrouver, 25314);       // B77
  assert.strictEqual(r.surplus, 0);
});

test("septembre part du solde d'aout, il ne repart pas de zero", () => {
  const r = O.calculer(LIGNES, [], PARAMS);
  assert.strictEqual(r.colonnes[1].ouverture, r.colonnes[0].cloture);
});

test("un remboursement commence en aout court aussi en septembre", () => {
  // Souria demarre en septembre : rien en aout, 3 000 en septembre.
  const r = O.calculer(LIGNES, [], PARAMS);
  assert.strictEqual(r.colonnes[0].remboursements, 0);
  assert.strictEqual(r.colonnes[1].remboursements, 3000);

  // Le meme pret demarre en aout : preleve les deux mois.
  const avance = LIGNES.map((l) =>
    l.libelle === "Souria / AC2I" ? { ...l, moisRemb: "Août" } : l,
  );
  const r2 = O.calculer(avance, [], PARAMS);
  assert.strictEqual(r2.colonnes[0].remboursements, 3000);
  assert.strictEqual(r2.colonnes[1].remboursements, 3000);
});

test("les depenses journalieres se deduisent du point de depart", () => {
  const r = O.calculer(LIGNES, [{ montant: 500 }, { montant: 229 }], PARAMS);
  assert.strictEqual(r.depensesEngagees, 729);
  assert.strictEqual(r.liquidites, 7000);
  // Le retrait se propage jusqu'au bout de la chaine.
  assert.strictEqual(r.colonnes[1].cloture, 94686 - 729);
  assert.strictEqual(r.resteATrouver, 25314 + 729);
});

test("objectif atteint : plus de reste, un surplus apparait", () => {
  const riche = [...LIGNES, { section: "LIQUIDITE", libelle: "Don", montant: 40000 }];
  const r = O.calculer(riche, [], PARAMS);
  assert.strictEqual(r.resteATrouver, 0);
  assert.strictEqual(r.surplus, 94686 + 40000 - 120000);
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
  assert.ok(Number.isFinite(r.soldeFinal));
});

test("sections connues seulement", () => {
  assert.ok(O.isSectionValide("EMPRUNT"));
  assert.ok(!O.isSectionValide("N_IMPORTE_QUOI"));
});
