"use strict";
/**
 * Cree le bien VILLA ANTRANOSOALAZA (appartement mono-locataire).
 * Idempotent : ne cree pas de doublon si le titre existe deja.
 *
 * Usage : node scripts/seed_antranosoalaza.js [local|prod|both]
 */
const mysql = require("mysql");
require("dotenv").config({ path: __dirname + "/../config/.env" });

const TITRE = "VILLA ANTRANOSOALAZA";
const BIEN = {
  type: "VILLA",
  titre: TITRE,
  description:
    "Villa de 8 pièces : 3 chambres à l'étage, 1 salon au rez-de-chaussée, " +
    "2 cuisines, 1 douche et 1 toilette. Eau chaude (chauffe-eau), 2 terrasses " +
    "et 1 cour fermée par des remparts. Très propre. Louée en entier à un seul locataire.",
  prix: 200000,
  surface: null,
  localisation: "Antranosoalaza",
  disponible: 0, // déjà réservée (occupée à partir du 15 juillet)
  nbChambres: 3,
  nbPieces: 8,
  photos: JSON.stringify([]),
  caracteristiques: JSON.stringify([
    "3 chambres à l'étage",
    "1 salon au rez-de-chaussée",
    "2 cuisines",
    "1 douche",
    "1 toilette",
    "Eau chaude (chauffe-eau)",
    "2 terrasses",
    "Cour fermée par des remparts",
    "Très propre",
  ]),
};

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

const q = (conn, sql, params) =>
  new Promise((resolve, reject) =>
    conn.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)))
  );

async function seedOne(name, cfg) {
  if (!cfg.host) {
    console.log(`\n[${name}] ⏭  ignore (config absente).`);
    return;
  }
  const conn = mysql.createConnection(cfg);
  console.log(`\n[${name}] → ${cfg.user}@${cfg.host}/${cfg.database}`);
  try {
    const existing = await q(conn, "SELECT id FROM bien_immo WHERE titre = ? LIMIT 1", [TITRE]);
    if (existing.length) {
      console.log(`   = "${TITRE}" existe deja (id ${existing[0].id}), rien a faire.`);
    } else {
      const r = await q(conn, "INSERT INTO bien_immo SET ?", BIEN);
      console.log(`   + "${TITRE}" cree (id ${r.insertId}).`);
    }
  } catch (e) {
    console.error(`[${name}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
}

(async () => {
  const arg = (process.argv[2] || "both").toLowerCase();
  const names = arg === "both" ? ["local", "prod"] : [arg];
  for (const n of names) await seedOne(n, TARGETS[n]);
  console.log("\nTermine.");
})();
