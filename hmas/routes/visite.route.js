const router = require("express").Router();
const ctrl = require("../controllers/visite.controller");
const admin = require("../middlewares/admin.middleware");
const connecte = require("../middlewares/connecte.middleware");

/**
 * Journal des connexions et de la navigation.
 *
 * Ecriture ouverte a tout compte authentifie — locataires compris, ce sont
 * aussi leurs venues qu'on trace. Lecture reservee a l'administrateur : le
 * journal dit qui consulte quoi et quand.
 */
router.post("/", connecte.checkUtilisateur, ctrl.tracer);
router.get("/", admin.checkUtilisateur, ctrl.getJournal);

module.exports = router;
