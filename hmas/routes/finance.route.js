const router = require("express").Router();
const ctrl   = require("../controllers/finance.controller");
const user   = require("../middlewares/user.middleware");

router.get("/revenus",         user.checkUtilisateur, ctrl.getRevenus);
router.post("/revenus",        user.checkUtilisateur, ctrl.createRevenu);
router.put("/revenus/:id",     user.checkUtilisateur, ctrl.updateRevenu);
router.delete("/revenus/:id",  user.checkUtilisateur, ctrl.deleteRevenu);

router.get("/charges",         user.checkUtilisateur, ctrl.getCharges);
router.post("/charges",        user.checkUtilisateur, ctrl.createCharge);
router.put("/charges/:id",     user.checkUtilisateur, ctrl.updateCharge);
router.delete("/charges/:id",  user.checkUtilisateur, ctrl.deleteCharge);

router.get("/depenses",        user.checkUtilisateur, ctrl.getDepenses);
router.post("/depenses",       user.checkUtilisateur, ctrl.createDepense);
router.delete("/depenses/:id", user.checkUtilisateur, ctrl.deleteDepense);

router.get("/casuel",          user.checkUtilisateur, ctrl.getCasuel);
router.post("/casuel",         user.checkUtilisateur, ctrl.createCasuel);
router.delete("/casuel/:id",   user.checkUtilisateur, ctrl.deleteCasuel);

router.get("/annuel",          user.checkUtilisateur, ctrl.getAnnuel);
router.get("/bilan",           user.checkUtilisateur, ctrl.getBilan);

module.exports = router;
