const AuthMidleware = require("./auth.middleware");

// Routes accessibles a tout compte authentifie, sans distinction de role :
// un locataire (karazana 2) doit pouvoir changer son propre code, ce que
// `user.middleware` (admin + user uniquement) lui refusait.
module.exports.checkUtilisateur = (req, res, next) => {
  AuthMidleware.checkUtilisateur(req, res, next, { tous: true });
};
