const AuthMidleware = require("./auth.middleware");
const { ADMIN, LOCATAIRE } = require("./roles");

// Routes de l'espace personnel d'un locataire.
// L'admin y a acces aussi (pour consulter/depanner).
module.exports.checkUtilisateur = (req, res, next) => {
  AuthMidleware.checkUtilisateur(req, res, next, {
    admin: ADMIN,
    user: LOCATAIRE,
  });
};
