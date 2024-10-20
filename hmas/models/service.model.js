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

Service.addService = async (newService) => {
  try {
    const resNom = await Service.getNomService(newService.nom);
    if (resNom.length == 0) {
      const result = (await dbConn).query(
        "INSERT INTO serivisy SET ?",
        newService
      );
      return { success: true, message: "Ajout reussi !" };
    } else {
      return {
        success: false,
        message: `Ajout non autorisé! Service Existant !`,
      }; 
    }
  } catch (error) {
    throw err;
  }
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

Service.fetchAndUpdateImage = async () => {
  try {
    const [rows] = await dbConn.query(reqSQL + ` WHERE sImg is NULL`);

    for (const row of rows) {
      const imageUrl = await this.fetchImage(row.nom);
      if (imageUrl) {
        await dbConn.query("UPDATE serivisy SET sImg=? WHERE id=?", [
          imageUrl,
          row.id,
        ]);
      }
    }
  } catch (error) {
    console.log(error);
  }
};
async function fetchImage(imageName) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    imageName
  )}&client_id=${process.env.UNSPLASH_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  return data.results[0]?.urls?.regular || null;
}

module.exports = Service;
