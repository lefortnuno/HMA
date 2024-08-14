let dbConn = require("../config/db");

let Hetsika = function (hetsika) {
  this.id = hetsika.id;
  this.date = hetsika.date;
  this.coms = hetsika.coms;
  this.qte = hetsika.qte;
  this.karazana = hetsika.karazana;
  this.idS = hetsika.idS;
  this.idM = hetsika.idM;
};

const reqSQL = `SELECT * FROM hetsika `;
const ordre = ` ORDER BY id DESC `;

Hetsika.addHetsika = (newHetsika, result) => {
  dbConn.query("INSERT INTO hetsika SET ?", newHetsika, (err, res) => {
    if (!err) {
      result(null, { success: true, message: "Ajout reussi !" });
    } else {
      result(err, null);
    }
  });
};

Hetsika.deleteHetsika = (ids, result) => {
  Hetsika.getIdHetsikaIdM(ids.id, (err, resId) => {
    if (resId.length != 0) {
      dbConn.query(
        `DELETE FROM hetsika WHERE id = ${ids.id} AND idM = ${ids.idM}`,
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
        message: `Echec de suppression! Historique non existant !`,
      });
    }
  });
};

Hetsika.getAllHetsikaIdM = (idM, result) => {
  dbConn.query(reqSQL + ` WHERE idM = ?`, idM, (err, res) => {
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

Hetsika.getIdHetsikaIdM = (ids, result) => {
  dbConn.query(
    reqSQL + ` WHERE id = ? AND idM = ?`,
    [ids.id, ids.idM],
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

Hetsika.searchAllHetsikaIdM = (valeur, result) => {
  dbConn.query(
    reqSQL +
      `WHERE idM = ${valeur.idM} AND (nom LIKE '%${valeur.val}%' OR prenom LIKE '%${valeur.val}%')` +
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

Hetsika.updateHetsikaIdM = (updateHetsika, ids, result) => {
  Hetsika.getIdHetsikaIdM(ids.id, (err, resId) => {
    if (resId.length != 0) {
      dbConn.query(
        `UPDATE hetsika SET ? WHERE id = ${ids.id} AND idM = ${ids.idM}`,
        updateHetsika,
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
        message: `Echec de la modification! Historique non existant!`,
      });
    }
  });
};

module.exports = Hetsika;
