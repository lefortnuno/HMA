const router = require("express").Router();
const BoutiqueController = require("../controllers/boutique.controller");
const user = require("../middlewares/user.middleware");

router.post("/", BoutiqueController.addBoutique);
router.post("/trie", user.checkUtilisateur, BoutiqueController.trieBoutique);
router.post(
  "/recherche",
  user.checkUtilisateur,
  BoutiqueController.searchBoutique
);

router.get("/", user.checkUtilisateur, BoutiqueController.getAllBoutiques);
router.get(
  "/boutiqueTtl",
  user.checkUtilisateur,
  BoutiqueController.getMyTotalOfBoutique
);
router.get("/:id", user.checkUtilisateur, BoutiqueController.getIdBoutique);

router.put("/:id", user.checkUtilisateur, BoutiqueController.updateBoutique);

router.delete("/:id", user.checkUtilisateur, BoutiqueController.deleteBoutique);

module.exports = router;
