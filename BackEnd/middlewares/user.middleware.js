const AuthMidleware = require("./auth.middleware");

const monRole = process.env.xUSER;

module.exports.checkUtilisateur = (req, res, next) => {
  AuthMidleware.checkUtilisateur(req, res, next, {
    admin: process.env.xADMIN,
    user: monRole,
  });
};
