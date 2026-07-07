const router = require("express").Router();
const ServiceController = require("../controllers/service.controller");
const admin = require("../middlewares/admin.middleware");

router.post("/", admin.checkUtilisateur, ServiceController.addService);
router.post("/trie", admin.checkUtilisateur, ServiceController.trieService);
router.post(
  "/recherche",
  admin.checkUtilisateur,
  ServiceController.searchService
);

router.get("/", admin.checkUtilisateur, ServiceController.getAllServices);
router.get("/serviceTtl", admin.checkUtilisateur, ServiceController.getMyTotalOfService);
router.get("/:id", admin.checkUtilisateur, ServiceController.getIdService);

router.put("/:id", admin.checkUtilisateur, ServiceController.updateService);

router.delete("/:id", admin.checkUtilisateur, ServiceController.deleteService);

module.exports = router;
