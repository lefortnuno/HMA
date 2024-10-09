let dbConn = require("../config/db");

let Utilisateur = function (utilisateur) {
  this.id = utilisateur.id;
  this.nom = utilisateur.nom;
  this.prenom = utilisateur.prenom;
  this.pwd = utilisateur.pwd;
  this.idPS = utilisateur.idPS;
  this.karazana = utilisateur.karazana;
};

const reqSQL = `SELECT * FROM mpampiasa `;
const ordre = ` ORDER BY id DESC `;
const reqMntTtl = `SELECT COUNT(id) AS isaTtl FROM mpampiasa`;

Utilisateur.addUtilisateur = (newUtilisateur, result) => {
  Utilisateur.getIdPSUtilisateur(newUtilisateur.idPS, (err, resIdPS) => {
    if (resIdPS.length == 0) {
      dbConn.query(
        "INSERT INTO mpampiasa SET ?",
        newUtilisateur,
        (err, res) => {
          if (!err) {
            result(null, { success: true, message: "Ajout reussi !" });
          } else {
            result(err, null);
          }
        }
      );
    } else {
      result(null, {
        success: false,
        message: `Ajout non autorisé! Utilisateur Existant !`,
      });
    }
  });
};

Utilisateur.deleteUtilisateur = (id, result) => {
  Utilisateur.getIdUtilisateur(id, (err, resId) => {
    if (resId.length != 0) {
      dbConn.query(
        `DELETE FROM mpampiasa WHERE id = ${id}`,
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
        message: `Echec de suppression! Utilisateur non existant !`,
      });
    }
  });
};

Utilisateur.loginUtilisateur = (values, result) => {
  const requete = ` WHERE idPS=?`;
  dbConn.query(reqSQL + requete, [values.idPS, values.pwd], (err, res) => {
    if (!err) {
      result(null, res);
    } else {
      result(err, null);
    }
  });
};

Utilisateur.getAllUtilisateurs = (result) => {
  dbConn.query(reqSQL + ordre, (err, res) => {
    if (err) {
      result(err, null);
    } else {
      result(null, res);
    }
  });
};

Utilisateur.getMyTotalOfUser = (result) => {
  dbConn.query(reqMntTtl, (err, res) => {
    if (err) {
      result(err, null);
    } else {
      result(null, res);
    }
  });
};

Utilisateur.getIdUtilisateur = (id, result) => {
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

Utilisateur.getIdPSUtilisateur = (idPS, result) => {
  dbConn.query(reqSQL + ` WHERE idPS = ?`, idPS, (err, res) => {
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

Utilisateur.searchUtilisateur = (valeur, result) => {
  dbConn.query(
    reqSQL +
      `WHERE (nom LIKE '%${valeur.val}%' OR prenom LIKE '%${valeur.val}%')` +
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

Utilisateur.updateUtilisateur = (updateUtilisateur, id, result) => {
  Utilisateur.getIdUtilisateur(id, (err, resId) => {
    if (resId[0].idPS == updateUtilisateur.idPS) {
      delete updateUtilisateur.idPS; // j'enleve l'idPS parce qu'il n'a pas ete modifier

      dbConn.query(
        `UPDATE mpampiasa SET ? WHERE id = ${id}`,
        updateUtilisateur,
        function (err, res) {
          if (err) {
            result(err, null);
          } else {
            result(null, { success: true, message: "Reussi" });
          }
        }
      );
    } else {
      Utilisateur.getIdPSUtilisateur(updateUtilisateur.idPS, (err, resIdPS) => {
        if (resIdPS.length == 0) {
          dbConn.query(
            `UPDATE mpampiasa SET ? WHERE id = ${id}`,
            updateUtilisateur,
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
            message: `Echec de la modification! Utilisateur existant !`,
          });
        }
      });
    }
  });
};

module.exports = Utilisateur;
