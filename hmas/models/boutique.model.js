let dbConn = require("../config/db");

let Boutique = function (boutique) {
  this.id = boutique.id;
  this.nom = boutique.nom;
  this.prix = boutique.prix;
  this.idB = boutique.idB;
};

const reqSQL = `SELECT * FROM botika WHERE id IN (SELECT MIN(id) FROM botika GROUP BY nom) `;
const reqSQLList = `SELECT * FROM botika WHERE id IN (SELECT MIN(id) FROM botika GROUP BY nom) `;
const ordre = ` ORDER BY id DESC `;
const reqMntTtl = `SELECT COUNT(DISTINCT nom) AS isaTtl FROM botika`;

Boutique.addBoutique = (newBoutique, result) => {
  Boutique.getNomBoutique(newBoutique, (err, resNom) => {
    if (resNom.length == 0) {
      dbConn.query("INSERT INTO botika SET ?", newBoutique, (err, res) => {
        if (!err) {
          result(null, { success: true, message: "Ajout reussi !" });
        } else {
          result(err, null);
        }
      });
    } else {
      result(null, {
        success: false,
        message: `Ajout non autorisé! Service Boutique Existant !`,
      });
    }
  });
};

Boutique.deleteBoutique = (id, result) => {
  Boutique.getIdBoutique(id, (err, resId) => {
    if (resId.length != 0) {
      dbConn.query(`DELETE FROM botika WHERE id = ${id}`, function (err, res) {
        if (err) {
          result(err, null);
        } else {
          result(null, { success: true });
        }
      });
    } else {
      result(null, {
        success: false,
        message: `Echec de suppression! Boutique non existant !`,
      });
    }
  });
};

Boutique.getAllBoutiques = (result) => {
  dbConn.query(reqSQL + ordre, (err, res) => {
    if (err) {
      result(err, null);
    } else {
      result(null, res);
    }
  });
};

Boutique.getIdBoutique = (id, result) => {
  dbConn.query(reqSQL + ` AND id = ?`, id, (err, res) => {
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

Boutique.getMyTotalOfBoutique = (result) => {
  dbConn.query(reqMntTtl, (err, res) => {
    if (err) {
      result(err, null);
    } else {
      result(null, res);
    }
  });
};

Boutique.getNomBoutique = (verif, result) => {
  dbConn.query(
    reqSQL + ` AND nom = ? AND idB=?`,
    [verif.nom, verif.idB],
    (err, res) => {
      if (err) {
        result(err, null);
      } else {
        if (res.length !== 0) {
          result(null, res);
        } else {
          result(null, res);
        }
      }
    }
  );
};

Boutique.searchBoutique = (valeur, result) => {
  dbConn.query(
    reqSQL + ` AND nom LIKE '${valeur.val}%'` + ordre,
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

Boutique.advancedSearchBoutique = (valeur, result) => {
  dbConn.query(
    reqSQL +
      ` AND (nom LIKE '%${valeur.val}%' OR prix LIKE '%${valeur.val}%')` +
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

Boutique.trieBoutiqueByUnite = (valeur, result) => {
  dbConn.query(
    reqSQL + ` AND fandrefesana = '${valeur.val}'` + ordre,
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

Boutique.trieBoutiqueByType = (valeur, result) => {
  dbConn.query(
    reqSQL + ` AND karazana = '${valeur.val}'` + ordre,
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

Boutique.updateBoutique = (updateBoutique, id, result) => {
  Boutique.getIdBoutique(id, (err, resId) => {
    if (resId[0].nom == updateBoutique.nom) {
      delete updateBoutique.nom; // j'enleve l'nom parce qu'il n'a pas ete modifier

      dbConn.query(
        `UPDATE botika SET ? WHERE id = ${id}`,
        updateBoutique,
        function (err, res) {
          if (err) {
            result(err, null);
          } else {
            result(null, { success: true, message: "Reussi" });
          }
        }
      );
    } else {
      Boutique.getNomBoutique(updateBoutique.nom, (err, resNom) => {
        if (resNom.length == 0) {
          dbConn.query(
            `UPDATE botika SET ? WHERE id = ${id}`,
            updateBoutique,
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
            message: `Echec de la modification! Service Boutique existant!`,
          });
        }
      });
    }
  });
};

module.exports = Boutique;
