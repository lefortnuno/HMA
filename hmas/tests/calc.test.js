"use strict";
const { test } = require("node:test");
const assert = require("node:assert");
const V = require("../utils/calc");

// ── Calcul JIRAMA ────────────────────────────────────────────────────────────
test("consommation = indexCurr - indexPrev", () => {
  assert.strictEqual(V.consommation(100, 150), 50);
});

test("consommation jamais negative (index decroissant)", () => {
  assert.strictEqual(V.consommation(200, 150), 0);
});

test("consommation avec valeurs absentes = 0", () => {
  assert.strictEqual(V.consommation(undefined, undefined), 0);
  assert.strictEqual(V.consommation(null, 50), 50);
});

test("montantJIRAMA = conso x prix unitaire", () => {
  assert.strictEqual(V.montantJIRAMA(50, 500), 25000);
});

test("montantJIRAMA refuse les valeurs negatives", () => {
  assert.strictEqual(V.montantJIRAMA(-10, 500), 0);
  assert.strictEqual(V.montantJIRAMA(10, -500), 0);
});

// ── Benefices ────────────────────────────────────────────────────────────────
test("benefice = loyers + jirama - depenses", () => {
  assert.strictEqual(V.benefice(1500000, 200000, 300000), 1400000);
});

test("benefice peut etre negatif (mois deficitaire)", () => {
  assert.strictEqual(V.benefice(0, 0, 100000), -100000);
});

// ── Validations ──────────────────────────────────────────────────────────────
test("mois valide : 1 a 12 uniquement", () => {
  assert.ok(V.isMoisValide(1));
  assert.ok(V.isMoisValide(12));
  assert.ok(!V.isMoisValide(0));
  assert.ok(!V.isMoisValide(13));
  assert.ok(!V.isMoisValide("abc"));
  assert.ok(!V.isMoisValide(1.5));
});

test("annee valide : bornes raisonnables", () => {
  assert.ok(V.isAnneeValide(2026));
  assert.ok(!V.isAnneeValide(1999));
  assert.ok(!V.isAnneeValide(3000));
});

test("montant valide : positif ou nul, fini", () => {
  assert.ok(V.isMontantValide(0));
  assert.ok(V.isMontantValide(150000));
  assert.ok(!V.isMontantValide(-1));
  assert.ok(!V.isMontantValide("abc"));
  assert.ok(!V.isMontantValide(Infinity));
});

test("etage valide : RDC ou 1ER", () => {
  assert.ok(V.isEtageValide("RDC"));
  assert.ok(V.isEtageValide("1ER"));
  assert.ok(!V.isEtageValide("2EME"));
});

// ── Anti-doublon / chambres (KINYA bienId=0) ────────────────────────────────
test("chambre KINYA RDC : 1-10 valides, chiffres romains refuses", () => {
  assert.ok(V.isChambreValide("1", "RDC", 0));
  assert.ok(V.isChambreValide("10", "RDC", 0));
  assert.ok(!V.isChambreValide("11", "RDC", 0));
  assert.ok(!V.isChambreValide("I", "RDC", 0));
});

test("chambre KINYA 1ER : I-X valides, chiffres arabes refuses", () => {
  assert.ok(V.isChambreValide("I", "1ER", 0));
  assert.ok(V.isChambreValide("X", "1ER", 0));
  assert.ok(!V.isChambreValide("XI", "1ER", 0));
  assert.ok(!V.isChambreValide("1", "1ER", 0));
});

test("appart mono (bienId != 0) : seul le slot 'Villa' est valide", () => {
  assert.ok(V.isChambreValide("Villa", "RDC", 7));
  assert.ok(!V.isChambreValide("1", "RDC", 7));
});

test("statut paiement valide", () => {
  assert.ok(V.isStatutValide("PAYE"));
  assert.ok(V.isStatutValide("PARTIEL"));
  assert.ok(V.isStatutValide("IMPAYE"));
  assert.ok(!V.isStatutValide("EN_COURS"));
});

// ── Roles (regression : un xADMIN manquant bloquait l'admin) ────────────────
const { estRole } = require("../middlewares/roles");

test("estRole compare chaines et nombres indifferemment", () => {
  assert.ok(estRole(1, 1));
  assert.ok(estRole("1", 1));
  assert.ok(estRole(1, "1"));
  assert.ok(estRole(0, "0"));
  assert.ok(!estRole(1, 0));
});

test("estRole refuse un role non defini (ne laisse pas passer)", () => {
  assert.ok(!estRole(1, undefined));
  assert.ok(!estRole(0, undefined));
  assert.ok(!estRole(undefined, 1));
});

test("valeurs par defaut des roles quand les variables d'env sont absentes", () => {
  const { ADMIN, USER } = require("../middlewares/roles");
  assert.strictEqual(Number.isNaN(ADMIN), false);
  assert.strictEqual(Number.isNaN(USER), false);
  assert.notStrictEqual(ADMIN, USER);
});

test("statut DOUTE accepte (dit avoir paye, a confirmer)", () => {
  assert.ok(V.isStatutValide("DOUTE"));
  assert.ok(!V.isStatutValide("DOUTEUX"));
});

// ── Fuseau horaire ───────────────────────────────────────────────────────────
// Le serveur tourne en UTC, le logement vit a UTC+3. Les regles qui comparent
// un quantieme doivent suivre Tananarive, sinon elles se trompent chaque nuit
// entre minuit et 3 h.
const D = require("../utils/dates");

test("le jour courant suit Tananarive, pas le serveur", () => {
  // 24 aout 22h30 UTC = 25 aout 01h30 a Tananarive.
  const instant = new Date("2026-08-24T22:30:00Z");
  assert.strictEqual(instant.getUTCDate(), 24);
  assert.deepStrictEqual(D.jourLocal(instant), {
    annee: 2026,
    mois: 8,
    jour: 25,
  });
  assert.strictEqual(D.dateDuJour(instant), "2026-08-25");
});

test("la facture JIRAMA arrive le 25 malgache, pas le 25 UTC", () => {
  // Meme instant : deja le 25 a Tananarive, encore le 24 pour le serveur.
  assert.ok(V.factureJiramaArrivee(8, 2026, new Date("2026-08-24T22:30:00Z")));
  // La veille au soir a Tananarive : la facture n'est pas encore la.
  assert.ok(!V.factureJiramaArrivee(8, 2026, new Date("2026-08-23T22:30:00Z")));
});

test("bascule d'annee prise dans le bon fuseau", () => {
  // 31 decembre 22h UTC = 1er janvier 01h a Tananarive : l'annee a tourne.
  assert.deepStrictEqual(D.jourLocal(new Date("2026-12-31T22:00:00Z")), {
    annee: 2027,
    mois: 1,
    jour: 1,
  });
});
