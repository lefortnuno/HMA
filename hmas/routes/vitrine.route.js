const router = require("express").Router();
const ctrl   = require("../controllers/vitrine.controller");
const user   = require("../middlewares/user.middleware");

// ── Public (pas d'auth) ───────────────────────────────────────
router.get("/biens",     ctrl.getAllBiens);
router.get("/biens/:id", ctrl.getBienById);

// ── Admin (auth requise) ──────────────────────────────────────
router.post("/biens",       user.checkUtilisateur, ctrl.createBien);
router.put("/biens/:id",    user.checkUtilisateur, ctrl.updateBien);
router.delete("/biens/:id", user.checkUtilisateur, ctrl.deleteBien);

module.exports = router;
