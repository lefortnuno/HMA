let dbConn = require("../config/db");

let Histo = function (histo) {
  this.id = histo.id;
  this.date = histo.date;
  this.coms = histo.coms;
  this.qte = histo.qte;
  this.karazana = histo.karazana;
  this.idS = histo.idS;
  this.idM = histo.idM;
};

const reqSQL = `SELECT 
                hetsika.id as id,
                hetsika.karazana as hk,
                serivisy.nom as snom,
                serivisy.karazana as sk,
                mpampiasa.nom as mnom,
                ROUND(prix * qte, 2) as montant, 
                DATE_FORMAT(date, '%d/%m/%Y') as date,
                prenom, prix, fandrefesana, coms, qte, idS, idM
                FROM hetsika, mpampiasa, serivisy 
                WHERE (mpampiasa.id = hetsika.idM AND serivisy.id = hetsika.idS)`;
const myReq = ` AND idM = ? `;
const ordre = ` ORDER BY id DESC `;
const reqMntTtl = ` SELECT SUM(ROUND(prix * qte, 2)) AS montantTtl FROM 
                    hetsika
                    JOIN mpampiasa ON mpampiasa.id = hetsika.idM
                    JOIN serivisy ON serivisy.id = hetsika.idS
                    WHERE idM = ? `;

Histo.addHisto = (newHisto, result) => {
  dbConn.query("INSERT INTO hetsika SET ?", newHisto, (err, res) => {
    if (!err) {
      result(null, { success: true, message: "Ajout reussi !" });
    } else {
      result(err, null);
    }
  });
};

Histo.getAllMyHisto = (id, result) => {
  dbConn.query(reqSQL + myReq + ordre, id, (err, res) => {
    if (err) {
      result(err, null);
    } else {
      result(null, res);
    }
  });
};

Histo.getAllMyInComingHisto = (id, result) => {
  dbConn.query(
    reqSQL + myReq + ` AND hetsika.karazana = 1 ` + ordre,
    id,
    (err, res) => {  
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    }
  );
};

Histo.getMyTotalOfInComing = (id, result) => {
  dbConn.query(reqMntTtl + ` AND hetsika.karazana = 1 `, id, (err, res) => { 
    if (err) {
      result(err, null);
    } else {
      result(null, res);
    }
  });
};

Histo.getAllMyOutGoingHisto = (id, result) => {
  dbConn.query(
    reqSQL + myReq + ` AND hetsika.karazana = 0 ` + ordre,
    id,
    (err, res) => {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    }
  );
};

Histo.getIdHisto = (id, result) => {
  dbConn.query(reqSQL + ` AND hetsika.id = ? `, id, (err, res) => {
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

Histo.searchSomeHisto = (valeur, result) => {
  dbConn.query(
    reqSQL + myReq + `AND serivisy.nom LIKE '%${valeur.val}%'` + ordre,
    [valeur.idM],
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

Histo.updateMyHisto = (updateHisto, id, result) => {
  Histo.getIdHisto(id, (err, resId) => {
    if (resId.length != 0) {
      dbConn.query(
        `UPDATE hetsika SET ? WHERE id = ${id}`,
        updateHisto,
        function (err, res) {
          if (err) {
            result(err, null);
          } else {
            result(null, { success: true, message: "Modification reussi !" });
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

Histo.deleteMyHisto = (id, result) => {
  Histo.getIdHisto(id, (err, resId) => {
    if (resId.length != 0) {
      dbConn.query(
        `DELETE FROM hetsika WHERE hetsika.id = ${id}`,
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

Histo.filtreHisto = (valeur, result) => {
  dbConn.query(
    reqSQL +
      myReq +
      ` AND date between '${valeur.date1}' AND '${valeur.date2})' ` +
      ordre,
    [valeur.idM],
    (err, res) => {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    }
  );
};

module.exports = Histo;
