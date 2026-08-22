import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "./axios";

/**
 * Journal de navigation.
 *
 * Tracer ne doit jamais se voir. Trois précautions, chacune pour une raison
 * précise :
 *
 *  · L'envoi n'est jamais attendu et son échec est ignoré. Un journal
 *    indisponible ne doit pas empêcher une page de s'afficher.
 *
 *  · Une même page n'est réenregistrée qu'au bout d'un moment. Sans cela, un
 *    simple aller-retour entre deux écrans, ou un double rendu de React en
 *    développement, gonflerait la table pour rien.
 *
 *  · L'envoi part après le rendu, hors du chemin critique : la page est déjà
 *    à l'écran quand la requête décolle.
 */

// Délai avant de réenregistrer la même page. Assez long pour absorber les
// allers-retours, assez court pour qu'une vraie revisite soit vue.
const DELAI_REPETITION = 60 * 1000;

// Nom lisible d'un écran, pour ne pas relire des chemins bruts. Les segments
// variables (identifiants) sont regroupés sous une même entrée.
const ECRANS = [
  [/^\/home\/?$/, "Accueil"],
  [/^\/notifications\/?$/, "Notifications"],
  [/^\/loyer\/?$/, "Tableau Loyer"],
  [/^\/loyer\/chambres\/?$/, "Chambres"],
  [/^\/loyer\/locataires\/?$/, "Locataires"],
  [/^\/loyer\/locataires\/new\/?$/, "Ajout locataire"],
  [/^\/loyer\/locataires\/\d+/, "Fiche locataire"],
  [/^\/loyer\/jirama\/?$/, "Factures JIRAMA"],
  [/^\/loyer\/depenses\/?$/, "Sorties d'argent"],
  [/^\/loyer\/benefices\/?$/, "Bénéfices"],
  [/^\/loyer\/historique\/?$/, "Historique"],
  [/^\/otip\/?$/, "Budget OTIP"],
  [/^\/vitrine\/admin\/?$/, "Mes Biens"],
  [/^\/vitrine\/bien\/\d+/, "Détail d'un bien"],
  [/^\/vitrine\/?$/, "Vitrine"],
  [/^\/users\/?$/, "Utilisateurs"],
  [/^\/aboutUser\/\d+/, "Fiche utilisateur"],
  [/^\/editUser\/\d+/, "Édition utilisateur"],
  [/^\/mon-espace\/?$/, "Mon espace (locataire)"],
  [/^\/mes-factures\/?$/, "Mes factures (locataire)"],
  [/^\/parametres\/?$/, "Mon compte"],
  [/^\/premier-acces\/?$/, "Premier accès"],
  [/^\/about\/?$/, "À propos"],
];

function titreDe(chemin) {
  const trouve = ECRANS.find(([motif]) => motif.test(chemin));
  return trouve ? trouve[1] : chemin;
}

/**
 * À monter une seule fois, à l'intérieur du routeur.
 *
 * Ne trace rien tant que personne n'est connecté : le journal parle de
 * comptes, pas de visiteurs anonymes.
 */
export default function useTraceurVisites() {
  const location = useLocation();
  // Dernier envoi par chemin, pour ne pas répéter. Un ref, pas un state :
  // le traceur ne doit provoquer aucun rendu.
  const derniers = useRef({});

  useEffect(() => {
    const token = localStorage.token;
    if (!token) return;

    const chemin = location.pathname;
    const maintenant = Date.now();
    if (maintenant - (derniers.current[chemin] || 0) < DELAI_REPETITION) return;
    derniers.current[chemin] = maintenant;

    // Après le rendu : la page est déjà affichée quand la requête part.
    const t = setTimeout(() => {
      axios
        .post(
          "visite",
          { chemin, titre: titreDe(chemin) },
          { headers: { Authorization: token } },
        )
        .catch(() => {});
    }, 0);
    return () => clearTimeout(t);
  }, [location.pathname]);
}
