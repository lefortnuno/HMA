const router = require("express").Router();
const ServiceController = require("../controllers/service.controller"); 

router.post("/", ServiceController.addService);

module.exports = router;
