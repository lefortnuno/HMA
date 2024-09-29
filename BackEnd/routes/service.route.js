const router = require("express").Router();
const ServiceController = require("../controllers/service.controller");
const user = require("../middlewares/user.middleware");

router.post("/", user.checkUtilisateur, ServiceController.addService);
router.post("/trie", user.checkUtilisateur, ServiceController.trieService);
router.post(
  "/recherche",
  user.checkUtilisateur,
  ServiceController.searchService
);

router.get("/", user.checkUtilisateur, ServiceController.getAllServices);
router.get("/serviceTtl", user.checkUtilisateur, ServiceController.getMyTotalOfService);
router.get("/:id", user.checkUtilisateur, ServiceController.getIdService);

router.put("/:id", user.checkUtilisateur, ServiceController.updateService);

router.delete("/:id", user.checkUtilisateur, ServiceController.deleteService);

module.exports = router;
