"use strict";
const db = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { LOCATAIRE } = require("../middlewares/roles");

/**
 * Compte de connexion d'un locataire.
 * Code a 4 chiffres genere aleatoirement, a changer obligatoirement
 * a la premiere connexion (mdpTemporaire = 1).
 */
const Compte = {};

// Tirage uniforme et non predictible (pas Math.random).
Compte.codeAleatoire = () => String(crypto.randomInt(0, 10000)).padStart(4, "0");

/**
 * Identifiant de connexion : MAJUSCULES, sans accent ni caractere special.
 * "Gaëlle" -> "GAELLE". Le code se saisit au pave numerique sur telephone,
 * l'identifiant doit donc etre le plus simple possible a taper.
 */
Compte.identifiantDe = (nom) =>
  String(nom || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents combinants
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase() || "LOCATAIRE";

// Trouve un identifiant libre : "Nom", puis "NomChambre", puis "NomChambre2"...
function identifiantLibre(base, chambre, essai, cb) {
  const candidat =
    essai === 0 ? base : essai === 1 ? `${base}${chambre}` : `${base}${chambre}${essai}`;
  db.query("SELECT 1 FROM mpampiasa WHERE idPS = ? LIMIT 1", [candidat], (err, res) => {
    if (err) return cb(err);
    if (res.length === 0) return cb(null, candidat);
    if (essai > 20) return cb(null, `${base}${Date.now() % 10000}`);
    identifiantLibre(base, chambre, essai + 1, cb);
  });
}

/**
 * Cree le compte d'un locataire s'il n'en a pas deja un.
 * cb(err, { idPS, code }) — `code` en clair, a transmettre puis oublier.
 */
Compte.creerPourLocataire = (loc, cb) => {
  db.query(
    "SELECT id FROM mpampiasa WHERE locataireId = ? LIMIT 1",
    [loc.id],
    (err, existant) => {
      if (err) return cb(err);
      if (existant.length) return cb(null, null); // deja un compte

      identifiantLibre(Compte.identifiantDe(loc.nom), loc.chambre, 0, (err2, idPS) => {
        if (err2) return cb(err2);
        const code = Compte.codeAleatoire();
        db.query(
          "INSERT INTO mpampiasa SET ?",
          {
            nom: loc.nom,
            prenom: loc.prenom || "",
            idPS,
            pwd: bcrypt.hashSync(code, 10),
            karazana: LOCATAIRE,
            locataireId: loc.id,
            mdpTemporaire: 1,
          },
          (err3) => {
            if (err3) return cb(err3);
            cb(null, { idPS, code });
          }
        );
      });
    }
  );
};

/**
 * Supprime le compte de connexion rattache a une fiche locataire.
 * Best-effort : un echec ici ne doit pas empecher la suppression du locataire.
 */
Compte.supprimerPourLocataire = (locataireId, cb) => {
  db.query("DELETE FROM mpampiasa WHERE locataireId = ?", [locataireId], (err, res) => {
    if (err) return cb ? cb(err) : console.error("[compte locataire]", err.message);
    if (cb) cb(null, { supprimes: res.affectedRows });
  });
};

module.exports = Compte;
