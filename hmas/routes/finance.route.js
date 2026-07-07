const router = require("express").Router();
const ctrl   = require("../controllers/finance.controller");
const user   = require("../middlewares/user.middleware");
const admin  = require("../middlewares/admin.middleware");

router.get("/revenus",         admin.checkUtilisateur, ctrl.getRevenus);
router.post("/revenus",        admin.checkUtilisateur, ctrl.createRevenu);
router.put("/revenus/:id",     admin.checkUtilisateur, ctrl.updateRevenu);
router.delete("/revenus/:id",  admin.checkUtilisateur, ctrl.deleteRevenu);

router.get("/charges",         admin.checkUtilisateur, ctrl.getCharges);
router.post("/charges",        admin.checkUtilisateur, ctrl.createCharge);
router.put("/charges/:id",     admin.checkUtilisateur, ctrl.updateCharge);
router.delete("/charges/:id",  admin.checkUtilisateur, ctrl.deleteCharge);

router.get("/depenses",        admin.checkUtilisateur, ctrl.getDepenses);
router.post("/depenses",       admin.checkUtilisateur, ctrl.createDepense);
router.put("/depenses/:id",    admin.checkUtilisateur, ctrl.updateDepense);
router.delete("/depenses/:id", admin.checkUtilisateur, ctrl.deleteDepense);

router.get("/casuel",          admin.checkUtilisateur, ctrl.getCasuel);
router.post("/casuel",         admin.checkUtilisateur, ctrl.createCasuel);
router.put("/casuel/:id",      admin.checkUtilisateur, ctrl.updateCasuel);
router.delete("/casuel/:id",   admin.checkUtilisateur, ctrl.deleteCasuel);

router.get("/annuel",          admin.checkUtilisateur, ctrl.getAnnuel);
router.get("/bilan",           admin.checkUtilisateur, ctrl.getBilan);

module.exports = router;
