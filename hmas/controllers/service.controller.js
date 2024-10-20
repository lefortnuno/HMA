"use strict";
const Service = require("../models/service.model");
const ResponseHelper = require("../helpers/responseHelper");

module.exports.addService = async (req, res) => {
  const { nom, prix, fandrefesana, karazana } = req.body;
  const newService = { nom, prix, fandrefesana, karazana };

  try {
    const result = await Service.addService(newService);
    ResponseHelper.sendResponse(res, true, "Ajout réussi !", result);
  } catch (error) {
    ResponseHelper.sendResponse(
      res,
      false,
      "Erreur lors de l'ajout !",
      error.message,
      500
    );
  }
};
