const router = require("express").Router();
const ctrl = require("../controllers/verification.controller");
const user = require("../middlewares/user.middleware");

// Creation : depuis l'app, au moment ou un PDF (recu/bail) est genere.
router.post("/", user.checkUtilisateur, ctrl.creer);

// Lecture : publique, c'est la page que le QR code ouvre.
router.get("/:code", ctrl.getByCode);

module.exports = router;
