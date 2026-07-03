"use strict";
/**
 * Seed des locataires — VILLA KINYA
 * -----------------------------------------------------------------------------
 * Insere (ou met a jour) les locataires dans la base locale ET/OU prod.
 * Idempotent : identifie un locataire par (chambre, etage) -> pas de doublon.
 *
 * Usage :
 *   node scripts/seed_locataires.js local
 *   node scripts/seed_locataires.js prod
 *   node scripts/seed_locataires.js both
 *
 * Les "libre" (chambres vides) ne sont PAS inseres.
 * "les nom qui s'affichent seront les nom de famille" -> valeur mise dans `nom`.
 */
const mysql = require("mysql");
require("dotenv").config({ path: __dirname + "/../config/.env" });

// ── Locataires VILLA KINYA ───────────────────────────────────────────────────
const LOYER_RDC = 150000;
const LOYER_1ER = 200000;

const LOCATAIRES = [
  // Rez-de-chaussee : chambres "1".."10"
  { chambre: "1",  etage: "RDC", nom: "Trecy",    tel: "+261346832198" },
  { chambre: "2",  etage: "RDC", nom: "Louisa",   tel: null },
  { chambre: "3",  etage: "RDC", nom: "Canddis",  tel: null },
  { chambre: "4",  etage: "RDC", nom: "Dimby",    tel: "+261348438787" },
  { chambre: "5",  etage: "RDC", nom: "Sendrah",  tel: "+261388670326" },
  { chambre: "6",  etage: "RDC", nom: "Judianne", tel: null },
  { chambre: "7",  etage: "RDC", nom: "Derick",   tel: "+261340476182" },
  { chambre: "8",  etage: "RDC", nom: "Nasser",   tel: null },
  { chambre: "9",  etage: "RDC", nom: "Ben Aly",  tel: null },
  { chambre: "10", etage: "RDC", nom: "Mioty",    tel: null },
  // 1er etage : chambres "I".."X" (III, VII, X = libres -> absents)
  { chambre: "I",    etage: "1ER", nom: "Francia",  tel: null },
  { chambre: "II",   etage: "1ER", nom: "Gaëlle",   tel: "+261349380215" },
  { chambre: "IV",   etage: "1ER", nom: "Tony",     tel: null },
  { chambre: "V",    etage: "1ER", nom: "Lanja",    tel: null },
  { chambre: "VI",   etage: "1ER", nom: "Maeva",    tel: "+261388115501" },
  { chambre: "VIII", etage: "1ER", nom: "Narfai",   tel: null },
  { chambre: "IX",   etage: "1ER", nom: "Tantely",  tel: "+261331205820" },
].map((l) => ({
  ...l,
  prenom: null,
  loyer: l.etage === "RDC" ? LOYER_RDC : LOYER_1ER,
  email: null,
  dateEntree: null,
  actif: 1,
}));

// ── Cibles DB ────────────────────────────────────────────────────────────────
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
    console.log(`\n[${name}] ⏭  ignore (config DB absente dans .env)`);
    return;
  }
  const conn = mysql.createConnection(cfg);
  console.log(`\n[${name}] → ${cfg.user}@${cfg.host}/${cfg.database}`);
  try {
    await q(conn, "SELECT 1");
    let inserted = 0,
      updated = 0;
    for (const l of LOCATAIRES) {
      const existing = await q(
        conn,
        "SELECT id FROM locataire WHERE chambre = ? AND etage = ? LIMIT 1",
        [l.chambre, l.etage]
      );
      if (existing.length) {
        await q(conn, "UPDATE locataire SET ? WHERE id = ?", [l, existing[0].id]);
        updated++;
        console.log(`   ~ maj    ch.${l.chambre} (${l.etage})  ${l.nom}`);
      } else {
        await q(conn, "INSERT INTO locataire SET ?", l);
        inserted++;
        console.log(`   + ajout  ch.${l.chambre} (${l.etage})  ${l.nom}`);
      }
    }
    console.log(`[${name}] ✅ ${inserted} ajout(s), ${updated} mise(s) a jour.`);
  } catch (e) {
    console.error(`[${name}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
}

(async () => {
  const arg = (process.argv[2] || "both").toLowerCase();
  const names = arg === "both" ? ["local", "prod"] : [arg];
  if (names.some((n) => !TARGETS[n])) {
    console.error("Usage: node scripts/seed_locataires.js [local|prod|both]");
    process.exit(1);
  }
  for (const n of names) await seedOne(n, TARGETS[n]);
  console.log("\nTermine.");
})();
