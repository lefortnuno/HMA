const router = require("express").Router();
const BoutiqueController = require("../controllers/boutique.controller");
const admin = require("../middlewares/admin.middleware");

router.post("/", BoutiqueController.addBoutique);
router.post("/trie", admin.checkUtilisateur, BoutiqueController.trieBoutique);
router.post(
  "/recherche",
  admin.checkUtilisateur,
  BoutiqueController.searchBoutique
);

router.get("/", admin.checkUtilisateur, BoutiqueController.getAllBoutiques);
router.get(
  "/boutiqueTtl",
  admin.checkUtilisateur,
  BoutiqueController.getMyTotalOfBoutique
);
router.get("/:id", admin.checkUtilisateur, BoutiqueController.getIdBoutique);

router.put("/:id", admin.checkUtilisateur, BoutiqueController.updateBoutique);

router.delete("/:id", admin.checkUtilisateur, BoutiqueController.deleteBoutique);

module.exports = router;
