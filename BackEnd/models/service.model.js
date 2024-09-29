let dbConn = require("../config/db");

let Service = function (service) {
  this.id = service.id;
  this.nom = service.nom;
  this.prix = service.prix;
  this.fandrefesana = service.fandrefesana;
  this.karazana = service.karazana;
};

const reqSQL = `SELECT * FROM serivisy `;
const ordre = ` ORDER BY id DESC `;
const reqMntTtl = `SELECT COUNT(id) AS isaTtl FROM serivisy`;

Service.addService = (newService, result) => {
  Service.getNomService(newService.nom, (err, resNom) => {
    if (resNom.length == 0) {
      dbConn.query("INSERT INTO serivisy SET ?", newService, (err, res) => {
        if (!err) {
          result(null, { success: true, message: "Ajout reussi !" });
        } else {
          result(err, null);
        }
      });
    } else {
      result(null, {
        success: false,
        message: `Ajout non autorisé! Service Existant !`,
      });
    }
  });
};

Service.deleteService = (id, result) => {
  Service.getIdService(id, (err, resId) => {
    if (resId.length != 0) {
      dbConn.query(
        `DELETE FROM serivisy WHERE id = ${id}`,
        function (err, res) {
          if (err) {
            result(err, null);
          } else {
            result(null, { success: true });
          }
        }
      );
    } else {
      result(null, {
        success: false,
        message: `Echec de suppression! Service non existant !`,
      });
    }
  });
};

Service.getAllServices = (result) => {
  dbConn.query(reqSQL + ordre, (err, res) => {
    if (err) {
      result(err, null);
    } else {
      result(null, res);
    }
  });
};

Service.getIdService = (id, result) => {
  dbConn.query(reqSQL + ` WHERE id = ?`, id, (err, res) => {
    if (err) {
      result(err, null);
    } else {
      if (res.length !== 0) {
        result(null, res);
      } else {
        result(null, res);
      }
    }
  });
};

Service.getMyTotalOfService = (result) => {
  dbConn.query(reqMntTtl, (err, res) => {
    if (err) {
      result(err, null);
    } else {
      result(null, res);
    }
  });
};

Service.getNomService = (nom, result) => {
  dbConn.query(reqSQL + ` WHERE nom = ?`, nom, (err, res) => {
    if (err) {
      result(err, null);
    } else {
      if (res.length !== 0) {
        result(null, res);
      } else {
        result(null, res);
      }
    }
  });
};

Service.searchService = (valeur, result) => { 
  dbConn.query(
    reqSQL + `WHERE nom LIKE '${valeur.val}%'` + ordre,
    (err, res) => { 
      if (err) {
        result({ err, message: "erreur !", success: false }, null);
      } else {
        if (res.length !== 0) {
          result(null, { res, message: "trouvé !", success: true });
        } else {
          result(null, { res, message: "Introuvable !", success: false });
        }
      }
    }
  );
};

Service.advancedSearchService = (valeur, result) => {
  dbConn.query(
    reqSQL +
      `WHERE (nom LIKE '%${valeur.val}%' OR prix LIKE '%${valeur.val}%')` +
      ordre,
    (err, res) => {
      if (err) {
        result({ err, message: "erreur !", success: false }, null);
      } else {
        if (res.length !== 0) {
          result(null, { res, message: "trouvé !", success: true });
        } else {
          result(null, { res, message: "Introuvable !", success: false });
        }
      }
    }
  );
};

Service.trieServiceByUnite = (valeur, result) => {
  dbConn.query(
    reqSQL + `WHERE  fandrefesana = '${valeur.val}'` + ordre,
    (err, res) => {
      if (err) {
        result({ err, message: "erreur !", success: false }, null);
      } else {
        if (res.length !== 0) {
          result(null, { res, message: "trouvé !", success: true });
        } else {
          result(null, { res, message: "Introuvable !", success: false });
        }
      }
    }
  );
};

Service.trieServiceByType = (valeur, result) => {
  dbConn.query(
    reqSQL + `WHERE karazana = '${valeur.val}'` + ordre,
    (err, res) => {
      if (err) {
        result({ err, message: "erreur !", success: false }, null);
      } else {
        if (res.length !== 0) {
          result(null, { res, message: "trouvé !", success: true });
        } else {
          result(null, { res, message: "Introuvable !", success: false });
        }
      }
    }
  );
};

Service.updateService = (updateService, id, result) => {
  Service.getIdService(id, (err, resId) => {
    if (resId[0].nom == updateService.nom) {
      delete updateService.nom; // j'enleve l'nom parce qu'il n'a pas ete modifier

      dbConn.query(
        `UPDATE serivisy SET ? WHERE id = ${id}`,
        updateService,
        function (err, res) {
          if (err) {
            result(err, null);
          } else {
            result(null, { success: true, message: "Reussi" });
          }
        }
      );
    } else {
      Service.getNomService(updateService.nom, (err, resNom) => {
        if (resNom.length == 0) {
          dbConn.query(
            `UPDATE serivisy SET ? WHERE id = ${id}`,
            updateService,
            function (err, res) {
              if (err) {
                result(err, null);
              } else {
                result(null, { success: true, message: "Reussi" });
              }
            }
          );
        } else {
          result(null, {
            success: false,
            message: `Echec de la modification! Service existant!`,
          });
        }
      });
    }
  });
};

module.exports = Service;
