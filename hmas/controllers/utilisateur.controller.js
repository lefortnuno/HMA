"use strict";
const Utilisateur = require("../models/utilisateur.model");
const { sendErr } = require("../utils/http");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const tmp = 3 * 24 * 60 * 60 * 1000;

/**
 * Jeton volontairement MINIMAL : uniquement l'identifiant et le role.
 *
 * Signer la ligne complete de l'utilisateur embarquait le hash du mot de passe
 * (le payload d'un JWT est lisible par quiconque) et surtout la photo de profil
 * en base64. Le jeton depassait alors plusieurs dizaines de Ko et, comme il est
 * envoye dans l'en-tete Authorization de CHAQUE requete, le serveur repondait
 * "431 Request Header Fields Too Large" : l'application paraissait vide.
 *
 * La forme tableau est conservee : les middlewares lisent decodedToken.account[0].
 */
const createToken = (rows) => {
  const u = Array.isArray(rows) ? rows[0] : rows;
  const account = [{ id: u.id, karazana: u.karazana }];
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
          // Le hash du mot de passe ne quitte jamais le serveur.
          const user = resp.map(({ pwd: _pwd, ...reste }) => reste);
          res.send({ success: true, token, user, message: "Connecté à HMA!" });
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
  // Un compte de locataire et sa fiche vont de pair : supprimer l'un
  // supprime l'autre (la fiche entraine aussi ses paiements, cle etrangere
  // ON DELETE CASCADE). L'interface previent avant de confirmer.
  Utilisateur.getIdUtilisateur(req.params.id, (errU, resU) => {
    const locataireId = !errU && resU && resU[0] ? resU[0].locataireId : null;

    Utilisateur.deleteUtilisateur(req.params.id, (err, resp) => {
      if (err) return sendErr(res, err);
      if (!locataireId) return res.send(resp);

      const Locataire = require("../models/locataire.model");
      Locataire.delete(locataireId, (err2) => {
        if (err2) console.error("[suppression fiche locataire]", err2.message);
        res.send({ ...resp, locataireSupprime: !err2 });
      });
    });
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
  const { nom, prenom, pwd, pwdActuel, photo } = req.body;
  const moi = req.user;
  if (!moi || !moi.id)
    return res.status(401).send({ success: false, message: "Non authentifié." });

  Utilisateur.getIdUtilisateur(moi.id, (err, resultat) => {
    if (err || !resultat || !resultat[0]) return sendErr(res, err || new Error("introuvable"));

    const updateData = {};
    if (nom !== undefined && String(nom).trim()) updateData.nom = String(nom).trim();
    if (prenom !== undefined) updateData.prenom = String(prenom).trim();
    // Photo de profil : data URL base64 (ou "" pour retirer la photo).
    if (photo !== undefined) {
      if (photo && String(photo).length > 700000)
        return res.status(400).send({ success: false, message: "Photo trop lourde (max ~500 Ko)." });
      updateData.photo = photo || null;
    }

    if (pwd) {
      if (String(pwd).length < 4)
        return res.status(400).send({ success: false, message: "Mot de passe trop court (4 caractères min)." });
      // L'ancien mot de passe est exigé pour changer le mot de passe.
      if (!pwdActuel || !bcrypt.compareSync(pwdActuel, resultat[0].pwd))
        return res.status(400).send({ success: false, message: "Mot de passe actuel incorrect." });
      updateData.pwd = bcrypt.hashSync(pwd, 10);
      // Le mot de passe par defaut a ete remplace : plus d obligation.
      updateData.mdpTemporaire = 0;
    }

    if (Object.keys(updateData).length === 0)
      return res.status(400).send({ success: false, message: "Rien à modifier." });

    // Un locataire ne modifie pas son profil (nom, prenom, photo) sans l accord
    // de l admin. Le changement de code, lui, reste immediat : il est exige des
    // la premiere connexion et releve de la seule securite du compte.
    const { LOCATAIRE } = require("../middlewares/roles");
    const estLocataire = Number(moi.karazana) === LOCATAIRE;
    const champsProfil = ["nom", "prenom", "photo"].filter((c) => c in updateData);

    if (estLocataire && champsProfil.length) {
      const Validation = require("../models/validation.model");
      const avant = {};
      const apres = {};
      champsProfil.forEach((c) => {
        avant[c] = resultat[0][c];
        apres[c] = updateData[c];
      });
      return Validation.create(
        {
          entite: "COMPTE",
          action: "MODIFICATION",
          entiteId: moi.id,
          avant: { ...avant, idPS: resultat[0].idPS },
          apres: { ...apres, idPS: resultat[0].idPS },
          auteurId: moi.id,
          auteurNom: `${moi.nom} ${moi.prenom || ""}`.trim(),
        },
        (errV, resV) => {
          if (errV) return sendErr(res, errV);
          // Le code eventuel est tout de meme applique (securite du compte).
          const suite = () =>
            res.status(202).send({
              ...resV,
              message: "Demande envoyée à l administrateur pour validation.",
            });
          if (!updateData.pwd) return suite();
          const dbC = require("../config/db");
          dbC.query(
            "UPDATE mpampiasa SET pwd = ?, mdpTemporaire = 0 WHERE id = ?",
            [updateData.pwd, moi.id],
            (e3) => (e3 ? sendErr(res, e3) : suite())
          );
        }
      );
    }

    const dbConn = require("../config/db");
    dbConn.query("UPDATE mpampiasa SET ? WHERE id = ?", [updateData, moi.id], (err2) => {
      if (err2) return sendErr(res, err2);
      res.send({
        success: true,
        message: "Compte mis à jour !",
        nom: updateData.nom || resultat[0].nom,
        prenom: updateData.prenom !== undefined ? updateData.prenom : resultat[0].prenom,
        photo: updateData.photo !== undefined ? updateData.photo : resultat[0].photo,
        mdpTemporaire: updateData.mdpTemporaire !== undefined ? updateData.mdpTemporaire : resultat[0].mdpTemporaire,
      });
    });
  });
};

// ─── Renvoyer les accès d'un compte (admin) ────────────────────
// Les codes sont hachés : impossible de relire l'ancien. On en génère
// donc un nouveau, et le changement à la 1re connexion redevient obligatoire.
/**
 * Code oublie : le compte demande lui-meme une reinitialisation.
 *
 * Route publique — celui qui a oublie son code ne peut pas se connecter. Rien
 * n'est modifie ici : une demande part chez l'admin, qui tranche depuis ses
 * notifications. C'est seulement a l'approbation que l'ancien code cesse de
 * fonctionner.
 */
module.exports.demanderReinitialisation = (req, res) => {
  const Validation = require("../models/validation.model");
  const idPS = String(req.body.idPS || "").trim();

  // Reponse volontairement identique dans tous les cas : un inconnu ne doit
  // pas pouvoir deviner quels identifiants existent.
  const repondre = () =>
    res.send({
      success: true,
      message:
        "Demande transmise au propriétaire. Il vous communiquera un nouveau code.",
    });

  if (!idPS) return repondre();

  Utilisateur.getIdPSUtilisateur(idPS, (err, resultat) => {
    if (err || !resultat || !resultat[0]) return repondre();
    const compte = resultat[0];

    Validation.pendingPour("ACCES", compte.id, (err2, dejaEnCours) => {
      if (err2 || dejaEnCours) return repondre(); // une demande suffit
      Validation.create(
        {
          entite: "ACCES",
          action: "MODIFICATION",
          entiteId: compte.id,
          avant: null,
          apres: {
            idPS: compte.idPS,
            nom: compte.nom,
            prenom: compte.prenom || "",
            motif: "Code oublié — demande de réinitialisation",
          },
          // L'auteur de la demande, c'est le titulaire du compte lui-meme.
          auteurId: compte.id,
          auteurNom: `${compte.nom || ""} ${compte.prenom || ""}`.trim() || compte.idPS,
        },
        () => repondre()
      );
    });
  });
};

module.exports.regenererAcces = (req, res) => {
  const Compte = require("../utils/compte");
  const dbConn = require("../config/db");

  Utilisateur.getIdUtilisateur(req.params.id, (err, resultat) => {
    if (err) return sendErr(res, err);
    if (!resultat || !resultat[0])
      return res.status(404).send({ success: false, message: "Compte introuvable." });

    const compte = resultat[0];
    const code = Compte.codeAleatoire();
    dbConn.query(
      "UPDATE mpampiasa SET pwd = ?, mdpTemporaire = 1 WHERE id = ?",
      [bcrypt.hashSync(code, 10), compte.id],
      (err2) => {
        if (err2) return sendErr(res, err2);
        // Le code en clair n'est renvoyé qu'ici, une seule fois.
        res.send({
          success: true,
          idPS: compte.idPS,
          nom: compte.nom,
          code,
          message: "Nouveau code généré.",
        });
      }
    );
  });
};
