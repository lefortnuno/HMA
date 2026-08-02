const AuthMidleware = require("./auth.middleware");
const { ADMIN } = require("./roles");

// Routes reservees a l'administrateur.
module.exports.checkUtilisateur = (req, res, next) => {
  AuthMidleware.checkUtilisateur(req, res, next, {
    admin: ADMIN,
    user: ADMIN,
  });
};
