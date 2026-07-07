const router = require("express").Router();
const HistoController = require("../controllers/histo.controller");
const admin = require("../middlewares/admin.middleware");

router.post("/", admin.checkUtilisateur, HistoController.addHisto);
router.post("/filtre", admin.checkUtilisateur, HistoController.filtreHisto);
router.post(
  "/recherche",
  admin.checkUtilisateur,
  HistoController.searchSomeHisto
);

router.get("/histo/:id", admin.checkUtilisateur, HistoController.getAllMyHisto);
router.get(
  "/inComing/:id",
  admin.checkUtilisateur,
  HistoController.getAllMyInComingHisto
);
router.get(
  "/inComingTtl/:id",
  admin.checkUtilisateur,
  HistoController.getMyTotalOfInComing
);
router.get(
  "/outGoing/:id",
  admin.checkUtilisateur,
  HistoController.getAllMyOutGoingHisto
);
router.get(
  "/outGoingTtl/:id",
  admin.checkUtilisateur,
  HistoController.getMyTotalOfOutGoing
);
router.get("/:id", admin.checkUtilisateur, HistoController.getIdHisto);

router.put("/:id", admin.checkUtilisateur, HistoController.updateMyHisto);

router.delete("/:id", admin.checkUtilisateur, HistoController.deleteMyHisto);

module.exports = router;
