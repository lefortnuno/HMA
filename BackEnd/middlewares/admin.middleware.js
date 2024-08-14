const AuthMidleware = require("./auth.middleware");

const monRole = process.env.xADMIN;

module.exports.checkUtilisateur = (req, res, next) => {
  AuthMidleware.checkUtilisateur(req, res, next, {
    admin: monRole,
    user: monRole,
  });
};
