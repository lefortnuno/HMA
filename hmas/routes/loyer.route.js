const router  = require("express").Router();
const ctrl    = require("../controllers/loyer.controller");
const user    = require("../middlewares/user.middleware");
const admin   = require("../middlewares/admin.middleware");
const locataire = require("../middlewares/locataire.middleware");
const connecte = require("../middlewares/connecte.middleware");

// ── Locataires ────────────────────────────────────────────────
router.get("/locataires",        user.checkUtilisateur, ctrl.getAllLocataires);
router.post("/locataires",       user.checkUtilisateur, ctrl.createLocataire);
router.put("/locataires/:id",    user.checkUtilisateur, ctrl.updateLocataire);
router.delete("/locataires/:id", user.checkUtilisateur, ctrl.deleteLocataire);

// ── Factures JIRAMA ───────────────────────────────────────────
router.get("/factures",     user.checkUtilisateur, ctrl.getFacture);
router.post("/factures",    user.checkUtilisateur, ctrl.createFacture);
router.put("/factures/:id", user.checkUtilisateur, ctrl.updateFacture);

// ── Paiements ─────────────────────────────────────────────────
router.get("/paiements",      user.checkUtilisateur, ctrl.getPaiements);
router.post("/paiements",     user.checkUtilisateur, ctrl.createPaiement);
// Reglement de l'electricite, saisi depuis le tableau JIRAMA.
router.post("/paiements/jirama", user.checkUtilisateur, ctrl.upsertJirama);
router.put("/paiements/:id",  user.checkUtilisateur, ctrl.updatePaiement);

// ── Dépenses ──────────────────────────────────────────────────
router.get("/depenses",       user.checkUtilisateur, ctrl.getDepenses);
router.post("/depenses",      user.checkUtilisateur, ctrl.createDepense);
router.put("/depenses/:id",   user.checkUtilisateur, ctrl.updateDepense);
router.delete("/depenses/:id",user.checkUtilisateur, ctrl.deleteDepense);

// ── Bénéfices ─────────────────────────────────────────────────
router.get("/benefices", user.checkUtilisateur, ctrl.getBenefices);
router.get("/benefices/annee", user.checkUtilisateur, ctrl.getBeneficesAnnee);

// ── Historique d'occupation ───────────────────────────────────
router.get("/historique", user.checkUtilisateur, ctrl.getHistorique);

// ── Historique des paiements ──────────────────────────────────
router.get("/paiements/detail",     user.checkUtilisateur, ctrl.getPaiementsDetail);
router.get("/paiements/historique", user.checkUtilisateur, ctrl.getHistoriquePaiements);

// ── Demandes de validation (workflow admin) ───────────────────
router.get("/validations",        user.checkUtilisateur,  ctrl.getValidations);
router.get("/validations/count",  user.checkUtilisateur,  ctrl.countValidations);
router.post("/validations/:id/decision", admin.checkUtilisateur, ctrl.decideValidation);

// ── Règlement intérieur ───────────────────────────────────────
// Ouvert aux locataires : ils le lisent et peuvent proposer une règle.
router.get("/reglements",        connecte.checkUtilisateur, ctrl.getReglements);
router.post("/reglements",       connecte.checkUtilisateur, ctrl.createReglement);
router.put("/reglements/:id",    connecte.checkUtilisateur, ctrl.updateReglement);
router.delete("/reglements/:id", connecte.checkUtilisateur, ctrl.deleteReglement);

// ── Espace personnel du locataire ─────────────────────────────
router.get("/mon-espace", locataire.checkUtilisateur, ctrl.getMonEspace);
// Le locataire declare un reglement : part en validation chez l'admin.
router.post("/mon-espace/paiement", locataire.checkUtilisateur, ctrl.declarerPaiement);

module.exports = router;
