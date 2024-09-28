const router = require("express").Router();
const HistoController = require("../controllers/histo.controller");
const user = require("../middlewares/user.middleware");

router.post("/", user.checkUtilisateur, HistoController.addHisto);
router.post("/filtre", user.checkUtilisateur, HistoController.filtreHisto);
router.post(
  "/recherche",
  user.checkUtilisateur,
  HistoController.searchSomeHisto
);

router.get("/histo/:id", user.checkUtilisateur, HistoController.getAllMyHisto);
router.get(
  "/inComing/:id",
  user.checkUtilisateur,
  HistoController.getAllMyInComingHisto
);
router.get(
  "/inComingTtl/:id",
  user.checkUtilisateur,
  HistoController.getMyTotalOfInComing
);
router.get(
  "/outGoing/:id",
  user.checkUtilisateur,
  HistoController.getAllMyOutGoingHisto
);
router.get(
  "/outGoingTtl/:id",
  user.checkUtilisateur,
  HistoController.getMyTotalOfOutGoing
);
router.get("/:id", user.checkUtilisateur, HistoController.getIdHisto);

router.put("/:id", user.checkUtilisateur, HistoController.updateMyHisto);

router.delete("/:id", user.checkUtilisateur, HistoController.deleteMyHisto);

module.exports = router;
