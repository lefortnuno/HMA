"use strict";
/**
 * Valeurs des roles.
 *
 * Elles etaient lues uniquement dans les variables d'environnement : si
 * xADMIN n'etait pas definie (cas d'un deploiement ou la variable a ete
 * oubliee), elle valait `undefined` et la comparaison `karazana == undefined`
 * echouait -> l'ADMIN se voyait refuser toutes les routes (403) tandis que les
 * simples utilisateurs passaient. On applique donc des valeurs par defaut.
 */
const ADMIN = Number(process.env.xADMIN ?? 1);
const USER = Number(process.env.xUSER ?? 0);
// Locataire : acces limite a SON propre espace (ses paiements), jamais aux
// donnees des autres locataires.
const LOCATAIRE = Number(process.env.xLOCATAIRE ?? 2);

// Compare des roles de maniere sure (chaine "1" ou nombre 1 -> 1).
const estRole = (karazana, role) => Number(karazana) === Number(role);

module.exports = { ADMIN, USER, LOCATAIRE, estRole };
