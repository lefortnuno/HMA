"use strict";
const Utilisateur = require("../models/utilisateur.model");
const { sendErr } = require("../utils/http");
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
      sendErr(res, err);
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
      sendErr(res, err);
    }
  });
};

module.exports.getMyTotalOfUser = (req, res) => {
  Utilisateur.getMyTotalOfUser((err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      sendErr(res, err);
    }
  });
};

module.exports.getIdUtilisateur = (req, res) => {
  Utilisateur.getIdUtilisateur(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      sendErr(res, err);
    }
  });
};

module.exports.updateUtilisateur = (req, res) => {
  let { nom, prenom, idPS, karazana, pwd } = req.body;
  const updateData = { nom, prenom, idPS };
  if (karazana !== undefined && karazana !== "") updateData.karazana = karazana;
  if (pwd) updateData.pwd = bcrypt.hashSync(pwd, 10);

  Utilisateur.updateUtilisateur(updateData, req.params.id, (err, resp) => {
    if (!err) res.send(resp);
    else sendErr(res, err);
  });
};

module.exports.deleteUtilisateur = (req, res) => {
  Utilisateur.deleteUtilisateur(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      sendErr(res, err);
    }
  });
};

module.exports.searchUtilisateur = (req, res) => {
  const { val } = req.body;

  Utilisateur.searchUtilisateur({ val }, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      sendErr(res, err);
    }
  });
};

// ─── Mon compte (self-service, tout utilisateur connecté) ──────
// Modifie UNIQUEMENT son propre profil : nom, prénom, mot de passe.
// karazana (rôle) et idPS ne sont jamais modifiables ici.
module.exports.updateMonCompte = (req, res) => {
  const { nom, prenom, pwd, pwdActuel } = req.body;
  const moi = req.user;
  if (!moi || !moi.id)
    return res.status(401).send({ success: false, message: "Non authentifié." });

  Utilisateur.getIdUtilisateur(moi.id, (err, resultat) => {
    if (err || !resultat || !resultat[0]) return sendErr(res, err || new Error("introuvable"));

    const updateData = {};
    if (nom !== undefined && String(nom).trim()) updateData.nom = String(nom).trim();
    if (prenom !== undefined) updateData.prenom = String(prenom).trim();

    if (pwd) {
      if (String(pwd).length < 4)
        return res.status(400).send({ success: false, message: "Mot de passe trop court (4 caractères min)." });
      // L'ancien mot de passe est exigé pour changer le mot de passe.
      if (!pwdActuel || !bcrypt.compareSync(pwdActuel, resultat[0].pwd))
        return res.status(400).send({ success: false, message: "Mot de passe actuel incorrect." });
      updateData.pwd = bcrypt.hashSync(pwd, 10);
    }

    if (Object.keys(updateData).length === 0)
      return res.status(400).send({ success: false, message: "Rien à modifier." });

    const dbConn = require("../config/db");
    dbConn.query("UPDATE mpampiasa SET ? WHERE id = ?", [updateData, moi.id], (err2) => {
      if (err2) return sendErr(res, err2);
      res.send({
        success: true,
        message: "Compte mis à jour !",
        nom: updateData.nom || resultat[0].nom,
        prenom: updateData.prenom !== undefined ? updateData.prenom : resultat[0].prenom,
      });
    });
  });
};
