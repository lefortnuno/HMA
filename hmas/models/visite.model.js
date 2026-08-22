"use strict";
const db = require("../config/db");

/**
 * Journal des connexions et des pages consultees.
 *
 * Cette table s'ecrit a chaque changement de page : c'est la seule de
 * l'application ou le volume vient du simple fait de naviguer. Deux regles
 * en decoulent.
 *
 * A l'ecriture, on n'attend rien : l'insertion part et le client a deja sa
 * reponse. Tracer ne doit jamais ralentir ce qu'on trace.
 *
 * A la lecture, on ne balaie jamais toute la table : l'ecran demande une
 * page a la fois, et les deux index couvrent exactement ces requetes.
 */
const Visite = {};

// Une chaine trop longue est coupee plutot que refusee : un journal ne doit
// jamais faire echouer l'action qu'il observe.
const coupe = (v, n) =>
  v === undefined || v === null || v === "" ? null : String(v).slice(0, n);

/**
 * Enregistre une entree, sans faire attendre l'appelant.
 *
 * L'erreur eventuelle est avalee volontairement : un journal indisponible
 * ne doit ni casser une connexion, ni empecher d'afficher une page.
 */
Visite.enregistrer = (data) => {
  const ligne = {
    utilisateurId: Number(data.utilisateurId) || null,
    nom: coupe(data.nom, 120),
    karazana: data.karazana === undefined || data.karazana === null
      ? null
      : Number(data.karazana),
    type: data.type === "CONNEXION" ? "CONNEXION" : "PAGE",
    chemin: coupe(data.chemin, 160),
    titre: coupe(data.titre, 120),
    appareil: coupe(data.appareil, 60),
  };
  db.query("INSERT INTO visite SET ?", ligne, () => {});
};

/** Page de journal, du plus recent au plus ancien. */
Visite.lister = ({ type, utilisateurId, depuis, limite, decalage }, result) => {
  const where = [];
  const params = [];
  if (type === "CONNEXION" || type === "PAGE") {
    where.push("type = ?");
    params.push(type);
  }
  if (utilisateurId) {
    where.push("utilisateurId = ?");
    params.push(Number(utilisateurId));
  }
  if (depuis) {
    where.push("dateAction >= ?");
    params.push(depuis);
  }
  const clause = where.length ? " WHERE " + where.join(" AND ") : "";
  const lim = Math.min(Math.max(Number(limite) || 50, 1), 200);
  const off = Math.max(Number(decalage) || 0, 0);

  db.query(
    `SELECT * FROM visite${clause}
     ORDER BY dateAction DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, lim, off],
    (err, lignes) => {
      if (err) return result(err, null);
      // Un COUNT explicite, et non SQL_CALC_FOUND_ROWS / FOUND_ROWS() : avec
      // un pool, ces deux requetes peuvent partir sur des connexions
      // differentes, et le compteur se rapporte alors a une autre requete.
      // La pagination affichait un total qui n'etait pas le sien.
      db.query(
        `SELECT COUNT(*) AS total FROM visite${clause}`,
        params,
        (err2, t) => {
          if (err2) return result(err2, null);
          result(null, { lignes, total: t[0].total, limite: lim, decalage: off });
        },
      );
    },
  );
};

/**
 * Repere par utilisateur : derniere venue et volume, sur une fenetre donnee.
 *
 * Agrege en base plutot qu'en JavaScript : ramener des milliers de lignes
 * pour les compter cote serveur serait le meilleur moyen de rendre l'ecran
 * lent, ce qu'on cherche precisement a eviter.
 */
Visite.resume = (jours, result) => {
  const j = Math.min(Math.max(Number(jours) || 30, 1), 365);
  db.query(
    `SELECT utilisateurId, nom, karazana,
            COUNT(*) AS total,
            SUM(type='CONNEXION') AS connexions,
            SUM(type='PAGE') AS pages,
            MAX(dateAction) AS derniere
       FROM visite
      WHERE dateAction >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY utilisateurId, nom, karazana
      ORDER BY derniere DESC`,
    [j],
    (err, res) => (err ? result(err, null) : result(null, res)),
  );
};

/** Pages les plus consultees sur la fenetre. */
Visite.pagesPopulaires = (jours, result) => {
  const j = Math.min(Math.max(Number(jours) || 30, 1), 365);
  db.query(
    `SELECT chemin, titre, COUNT(*) AS vues, MAX(dateAction) AS derniere
       FROM visite
      WHERE type='PAGE' AND dateAction >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY chemin, titre
      ORDER BY vues DESC
      LIMIT 15`,
    [j],
    (err, res) => (err ? result(err, null) : result(null, res)),
  );
};

/**
 * Purge des entrees trop anciennes.
 *
 * Sans elle la table grossirait indefiniment et finirait par peser sur les
 * lectures. Declenchee depuis la consultation du journal, au plus une fois
 * par heure — voir le controleur.
 */
Visite.purger = (jours) => {
  const j = Math.min(Math.max(Number(jours) || 120, 7), 3650);
  db.query("DELETE FROM visite WHERE dateAction < DATE_SUB(NOW(), INTERVAL ? DAY)", [j], () => {});
};

module.exports = Visite;
