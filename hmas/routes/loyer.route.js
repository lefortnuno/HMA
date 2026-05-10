const router  = require("express").Router();
const ctrl    = require("../controllers/loyer.controller");
const user    = require("../middlewares/user.middleware");

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
router.put("/paiements/:id",  user.checkUtilisateur, ctrl.updatePaiement);

// ── Dépenses ──────────────────────────────────────────────────
router.get("/depenses",       user.checkUtilisateur, ctrl.getDepenses);
router.post("/depenses",      user.checkUtilisateur, ctrl.createDepense);
router.put("/depenses/:id",   user.checkUtilisateur, ctrl.updateDepense);
router.delete("/depenses/:id",user.checkUtilisateur, ctrl.deleteDepense);

// ── Bénéfices ─────────────────────────────────────────────────
router.get("/benefices", user.checkUtilisateur, ctrl.getBenefices);

module.exports = router;
