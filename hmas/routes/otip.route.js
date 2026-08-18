const router = require("express").Router();
const ctrl = require("../controllers/otip.controller");
const admin = require("../middlewares/admin.middleware");

/**
 * Budget OTIP. MODULE TEMPORAIRE (voir utils/otip.js).
 *
 * Reserve a l'administrateur de bout en bout : ce sont les finances
 * personnelles du bailleur, pas la gestion de la residence.
 */
router.get("/", admin.checkUtilisateur, ctrl.getTout);

router.post("/lignes", admin.checkUtilisateur, ctrl.createLigne);
router.put("/lignes/:id", admin.checkUtilisateur, ctrl.updateLigne);
router.delete("/lignes/:id", admin.checkUtilisateur, ctrl.deleteLigne);

router.post("/depenses", admin.checkUtilisateur, ctrl.createDepense);
router.put("/depenses/:id", admin.checkUtilisateur, ctrl.updateDepense);
router.delete("/depenses/:id", admin.checkUtilisateur, ctrl.deleteDepense);

router.post("/params", admin.checkUtilisateur, ctrl.setParam);

module.exports = router;
