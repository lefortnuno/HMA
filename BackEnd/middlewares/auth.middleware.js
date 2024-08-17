const UtilisateurModel = require("../models/utilisateur.model");
const jwt = require("jsonwebtoken");

module.exports.checkUtilisateur = (req, res, next, myUserRole) => {
  const token = req.headers.authorization;  
  /*
  // pour PostMan
  const authHeader = req.headers.authorization || ""; // Assure qu'on a une chaîne vide si c'est undefined
  const token = authHeader.includes(" ") ? authHeader.split(" ")[1] : ""; 
  */

  if (token) {
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
      if (decodedToken) {
        const dtok = decodedToken.account[0];

        UtilisateurModel.getIdUtilisateur(dtok.id, (err, resultat) => {
          if (
            resultat[0].karazana == myUserRole.admin ||
            resultat[0].karazana == myUserRole.user
          ) {
            next();
          } else {
            res.status(403).send({
              message: ` Accès non autorisé! Utilisateur(${resultat[0].karazana})!`,
              success: false,
            });
          }
        });
      } else {
        res.status(401).send({
          message: `Action non autorisé! Impossible de décoder votre jeton/token!`,
          success: false,
        });
      }
    });
  } else {
    res.status(401).send({
      message: `Action non autorisé! Impossible de trouver votre jeton/token  !`,
      success: false,
    });
  }
};
