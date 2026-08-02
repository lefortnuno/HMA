"use strict";
/**
 * Migration : reglement interieur de la residence.
 *
 * Regles affichees sur l'accueil, visibles de tous (admin, utilisateurs et
 * locataires). L'admin les gere librement ; les autres peuvent en proposer,
 * sous reserve de validation.
 *
 * Idempotent : la table n'est semee que si elle est vide.
 * Usage : node scripts/migrate_reglement.js [local|prod]
 */
const mysql = require("mysql");
require("dotenv").config({ path: __dirname + "/../config/.env" });

const TARGETS = {
  local: {
    host: process.env.OFFLINE_DB_HOST,
    user: process.env.OFFLINE_DB_USER,
    password: process.env.OFFLINE_DB_MDP,
    database: process.env.OFFLINE_DB_NAME,
  },
  prod: {
    host: process.env.SUN_DB_HOST,
    user: process.env.SUN_DB_USER,
    password: process.env.SUN_DB_MDP,
    database: process.env.SUN_DB_NAME,
  },
};

// `icone` reprend une cle connue du frontend (voir components/reglement).
const REGLES = [
  {
    titre: "Loyer payable d'avance",
    texte:
      "Le loyer se règle comptant, en début de période, avant d'occuper le mois. " +
      "Aucun règlement à terme échu n'est accepté pour les nouvelles entrées.",
    icone: "loyer",
    ordre: 1,
  },
  {
    titre: "Caution d'un mois",
    texte:
      "Une caution équivalente à un mois de loyer est versée à l'entrée. " +
      "Elle est restituée au départ, déduction faite des éventuelles réparations.",
    icone: "caution",
    ordre: 2,
  },
  {
    titre: "Forfait JIRAMA de 10 000 Ar",
    texte:
      "L'eau et l'électricité sont facturées 10 000 Ar par mois. " +
      "Si votre compteur individuel dépasse ce forfait, le surplus relevé reste à votre charge.",
    icone: "jirama",
    ordre: 3,
  },
  {
    titre: "Préavis d'un mois",
    texte:
      "Prévenez le bailleur un mois à l'avance en cas de départ. " +
      "Ce délai permet de relouer la chambre et garantit la restitution de votre caution.",
    icone: "preavis",
    ordre: 4,
  },
  {
    titre: "Un reçu pour chaque versement",
    texte:
      "Tout paiement donne lieu à un reçu. Ne réglez jamais sans en recevoir un : " +
      "c'est votre preuve en cas de contestation.",
    icone: "recu",
    ordre: 5,
  },
  {
    titre: "Tapage Interdit",
    texte:
      "Musique, travaux et réunions bruyantes: merci de prévenir au moins 12 heures à l'avance. " +
      "Chacun a droit au calme/repos, qu'il soit étudiant ou travailleur.",
    icone: "calme",
    ordre: 6,
  },
  {
    titre: "Parties communes propres",
    texte:
      "Cour, couloirs et sanitaires sont laissés propres après chaque usage. " +
      "Les ordures sont déposées à l'endroit prévu, jamais devant les chambres.",
    icone: "proprete",
    ordre: 7,
  },
  {
    titre: "Visiteurs sous votre responsabilité",
    texte:
      "Vos invités sont les bienvenus et restent sous votre responsabilité. " +
      "Tout hébergement de plus de trois nuits demande l'accord du bailleur.",
    icone: "visiteurs",
    ordre: 8,
  },
  {
    titre: "Les équipements de la chambre y restent",
    texte:
      "Tringles, rideaux, ampoules, prises, portes et autres fournitures de base " +
      "appartiennent au logement : ils ne se démontent pas et ne quittent pas la chambre, " +
      "ni pendant le bail ni au départ. Toute pièce manquante est retenue sur la caution.",
    icone: "fourniture",
    ordre: 10,
  },
  {
    titre: "Dégradations à la charge de l'occupant",
    texte:
      "Toute dégradation constatée dans la chambre ou les parties communes est " +
      "réparée aux frais de son auteur. Signalez rapidement une panne : " +
      "réparée tôt, elle coûte moins cher à tout le monde.",
    icone: "degradation",
    ordre: 9,
  },
];

const q = (conn, sql, params) =>
  new Promise((resolve, reject) =>
    conn.query(sql, params, (err, res) => (err ? reject(err) : resolve(res))),
  );

(async () => {
  const cible = (process.argv[2] || "prod").toLowerCase();
  const cfg = TARGETS[cible];
  if (!cfg || !cfg.host) return console.log("Cible inconnue.");
  const conn = mysql.createConnection(cfg);
  console.log(`\n[${cible}] → ${cfg.user}@${cfg.host}/${cfg.database}`);
  try {
    await q(
      conn,
      `CREATE TABLE IF NOT EXISTS reglement (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titre VARCHAR(160) NOT NULL,
        texte TEXT NOT NULL,
        icone VARCHAR(40) DEFAULT NULL,
        ordre INT NOT NULL DEFAULT 0,
        actif TINYINT(1) NOT NULL DEFAULT 1,
        auteurNom VARCHAR(120) DEFAULT NULL,
        dateCreation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );
    console.log("   = table reglement prete");

    const [{ nb }] = await q(conn, "SELECT COUNT(*) nb FROM reglement");
    if (nb > 0) {
      console.log(`   = ${nb} regle(s) deja en base, aucun ajout`);
    } else {
      for (const r of REGLES) {
        await q(conn, "INSERT INTO reglement SET ?", {
          ...r,
          actif: 1,
          auteurNom: "Trofel",
        });
      }
      console.log(`   + ${REGLES.length} regles installees`);
    }

    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
})();
