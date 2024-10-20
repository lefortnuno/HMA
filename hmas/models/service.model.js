let dbConn = require("../config/db");

let Service = function (service) {
  this.id = service.id;
  this.nom = service.nom;
  this.fandrefesana = service.fandrefesana;
  this.karazana = service.karazana;
};

Service.addService = async (newService) => {
  try {
    const [rows] = await dbConn.query("SELECT * FROM serivisy WHERE nom = ?", [
      newService.nom,
    ]);

    if (rows.length > 0) {
      throw new Error("Service déjà existant !");
    }

    const [result] = await dbConn.query("INSERT INTO serivisy SET ?", [
      newService,
    ]);

    return result;
  } catch (error) {
    console.log("Erreur dans addService:", error.message);

    throw error;
  }
};
module.exports = Service;
