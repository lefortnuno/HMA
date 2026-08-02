const AuthMidleware = require("./auth.middleware");
const { ADMIN, USER } = require("./roles");

// Routes ouvertes a tout utilisateur connecte (admin inclus).
module.exports.checkUtilisateur = (req, res, next) => {
  AuthMidleware.checkUtilisateur(req, res, next, {
    admin: ADMIN,
    user: USER,
  });
};
