"use strict";
const Utilisateur = require("../models/utilisateur.model");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const tmp = 3 * 24 * 60 * 60 * 1000;

const createToken = (account) => {
  return jwt.sign({ account }, process.env.TOKEN_SECRET, { expiresIn: tmp });
};

module.exports.addUtilisateur = (req, res) => {
  let { nom, prenom, pwd, idPS } = req.body;
  pwd = bcrypt.hashSync(pwd, 10);
  const newUtilisateur = { nom, prenom, pwd, idPS };

  Utilisateur.addUtilisateur(newUtilisateur, (err, resp) => {
    if (err) {
      res.send(err);
    } else {
      res.send(resp);
    }
  });
};

module.exports.loginUtilisateur = (req, res) => {
  let { idPS, pwd } = req.body;

  Utilisateur.loginUtilisateur({ idPS }, (err, resp) => {
    if (!err) {
      if (resp.length != 0) {
        const mdp = resp[0].pwd;
        const validePwd = bcrypt.compareSync(pwd, mdp);

        if (validePwd) {
          const token = createToken(resp);
          res.send({ success: true, token, user: resp, message: "Connecté à HMA!" });
        } else {
          res.send({ success: false, message : "Mot de passe incorrect!" });
        }
      } else {
        res.send({ success: false, message:"Identifiant incorrect!" });
      }
    } else {
      res.send({success: false, message: err});
    }
  });
};

module.exports.getAllUtilisateurs = (req, res) => {
  Utilisateur.getAllUtilisateurs((err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.getMyTotalOfUser = (req, res) => {
  Utilisateur.getMyTotalOfUser((err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.getIdUtilisateur = (req, res) => {
  Utilisateur.getIdUtilisateur(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.updateUtilisateur = (req, res) => {
  let { nom, prenom, idPS, pwd } = req.body;
  pwd = bcrypt.hashSync(pwd, 10);
  const updateUtilisateur = { nom, prenom, idPS, pwd };

  Utilisateur.updateUtilisateur(
    updateUtilisateur,
    req.params.id,
    (err, resp) => {
      if (!err) {
        res.send(resp);
      } else {
        res.send(err);
      }
    }
  );
};

module.exports.deleteUtilisateur = (req, res) => {
  Utilisateur.deleteUtilisateur(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.searchUtilisateur = (req, res) => {
  const { val } = req.body;

  Utilisateur.searchUtilisateur({ val }, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};
