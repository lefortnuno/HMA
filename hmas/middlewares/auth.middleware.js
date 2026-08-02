const UtilisateurModel = require("../models/utilisateur.model");
const jwt = require("jsonwebtoken");
const { estRole } = require("./roles");

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
          if (!resultat || !resultat[0]) {
            return res.status(401).send({
              message: "Compte introuvable, merci de vous reconnecter.",
              success: false,
            });
          }
          const karazana = resultat[0].karazana;
          // `tous` : route ouverte a n importe quel compte authentifie
          // (ex. modification de son propre compte), quel que soit son role.
          if (
            myUserRole.tous ||
            estRole(karazana, myUserRole.admin) ||
            estRole(karazana, myUserRole.user)
          ) {
            // Utilisateur courant (role verifie en DB) mis a disposition
            // des controleurs pour le workflow de validation.
            req.user = {
              id: resultat[0].id,
              nom: resultat[0].nom,
              prenom: resultat[0].prenom,
              karazana: resultat[0].karazana,
              locataireId: resultat[0].locataireId || null,
              mdpTemporaire: resultat[0].mdpTemporaire || 0,
            };
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
