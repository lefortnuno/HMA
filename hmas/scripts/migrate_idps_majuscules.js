"use strict";
/**
 * Migration : identifiants de connexion en MAJUSCULES, sans accent ni
 * caractere special. "Gaëlle" -> "GAELLE", "Ben Aly9" -> "BENALY9".
 *
 * Ne touche QUE les comptes locataires (karazana = 2) : les comptes admin et
 * utilisateur ont ete choisis a la main et servent a se connecter.
 *
 * En cas de collision (deux fiches menant au meme identifiant), le numero de
 * chambre puis un compteur sont ajoutes, comme a la creation d'un compte.
 *
 * Idempotent. Usage : node scripts/migrate_idps_majuscules.js [local|prod] [--dry]
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

const normalise = (v) =>
  String(v || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();

const q = (conn, sql, params) =>
  new Promise((resolve, reject) =>
    conn.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)))
  );

(async () => {
  const cible = (process.argv[2] || "prod").toLowerCase();
  const dry = process.argv.includes("--dry");
  const cfg = TARGETS[cible];
  if (!cfg || !cfg.host) return console.log("Cible inconnue.");
  const conn = mysql.createConnection(cfg);
  console.log(`\n[${cible}] → ${cfg.user}@${cfg.host}/${cfg.database}${dry ? "  (simulation)" : ""}`);
  try {
    const comptes = await q(
      conn,
      "SELECT u.id, u.idPS, u.nom, l.chambre FROM mpampiasa u" +
        " LEFT JOIN locataire l ON l.id = u.locataireId" +
        " WHERE u.karazana = 2 ORDER BY u.id"
    );
    const tous = await q(conn, "SELECT idPS FROM mpampiasa");
    const pris = new Set(tous.map((r) => String(r.idPS)));

    let modifies = 0;
    for (const c of comptes) {
      const base = normalise(c.idPS) || normalise(c.nom) || "LOCATAIRE";
      if (base === c.idPS) continue; // deja conforme

      // Le nouvel identifiant ne doit pas heurter un compte existant.
      let candidat = base;
      let essai = 0;
      while (pris.has(candidat) && candidat !== c.idPS) {
        essai += 1;
        candidat = essai === 1 && c.chambre ? `${base}${normalise(c.chambre)}` : `${base}${essai}`;
      }

      console.log(`   ${c.idPS}  →  ${candidat}`);
      if (!dry) await q(conn, "UPDATE mpampiasa SET idPS = ? WHERE id = ?", [candidat, c.id]);
      pris.delete(String(c.idPS));
      pris.add(candidat);
      modifies += 1;
    }

    console.log(
      modifies === 0
        ? "   = tous les identifiants sont deja conformes"
        : `   ${modifies} identifiant(s) ${dry ? "a normaliser" : "normalise(s)"}`
    );
    console.log(`[${cible}] ✅ migration terminee.`);
  } catch (e) {
    console.error(`[${cible}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
})();
