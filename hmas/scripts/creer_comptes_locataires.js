"use strict";
/**
 * Cree un compte de connexion pour chaque locataire actif qui n'en a pas.
 *
 *  - identifiant : le prenom/nom du locataire (unique, suffixe au besoin)
 *  - code        : 4 chiffres tires au hasard (cryptographiquement sur)
 *  - role        : LOCATAIRE (2) -> acces limite a son seul espace
 *  - mdpTemporaire = 1 : changement de code obligatoire a la 1re connexion
 *
 * Idempotent : un locataire deja rattache a un compte est ignore.
 * Les codes ne sont affiches QU'UNE FOIS (ils sont hashes en base).
 *
 * Usage : node scripts/creer_comptes_locataires.js [local|prod] [--reset]
 *   --reset : regenere aussi le code des comptes existants (si code perdu)
 */
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
require("dotenv").config({ path: __dirname + "/../config/.env" });

const LOCATAIRE = Number(process.env.xLOCATAIRE ?? 2);

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

// Code a 4 chiffres, tirage uniforme et non predictible.
function codeAleatoire() {
  return String(crypto.randomInt(0, 10000)).padStart(4, "0");
}

// Identifiant de connexion : lettres/chiffres uniquement, sans accent.
function identifiantDe(nom) {
  return (
    String(nom)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9]/g, "") || "Locataire"
  );
}

async function creerPour(name, cfg, reset) {
  if (!cfg.host) return console.log(`\n[${name}] ⏭  ignore.`);
  const conn = mysql.createConnection(cfg);
  console.log(`\n[${name}] → ${cfg.user}@${cfg.host}/${cfg.database}`);
  const resultats = [];
  try {
    const locs = await q(
      conn,
      "SELECT id, nom, prenom, chambre, etage, tel FROM locataire WHERE actif = 1 ORDER BY etage, FIELD(chambre,'1','2','3','4','5','6','7','8','9','10','I','II','III','IV','V','VI','VII','VIII','IX','X')"
    );

    for (const loc of locs) {
      const existant = await q(
        conn,
        "SELECT id, idPS FROM mpampiasa WHERE locataireId = ? LIMIT 1",
        [loc.id]
      );

      const code = codeAleatoire();
      const hash = bcrypt.hashSync(code, 10);

      if (existant.length) {
        if (!reset) {
          console.log(`   = ch.${loc.chambre} ${loc.nom} : compte deja cree (${existant[0].idPS})`);
          continue;
        }
        await q(
          conn,
          "UPDATE mpampiasa SET pwd = ?, mdpTemporaire = 1 WHERE id = ?",
          [hash, existant[0].id]
        );
        resultats.push({ ...loc, idPS: existant[0].idPS, code, statut: "code regenere" });
        console.log(`   ~ ch.${loc.chambre} ${loc.nom} : code regenere`);
        continue;
      }

      // Identifiant unique
      let base = identifiantDe(loc.nom);
      let idPS = base;
      let n = 1;
      while ((await q(conn, "SELECT 1 FROM mpampiasa WHERE idPS = ?", [idPS])).length) {
        idPS = `${base}${loc.chambre}`.replace(/\s/g, "");
        if (n > 1) idPS = `${base}${loc.chambre}${n}`;
        n++;
        if (n > 20) { idPS = `${base}${Date.now() % 1000}`; break; }
      }

      await q(conn, "INSERT INTO mpampiasa SET ?", {
        nom: loc.nom,
        prenom: loc.prenom || "",
        idPS,
        pwd: hash,
        karazana: LOCATAIRE,
        locataireId: loc.id,
        mdpTemporaire: 1,
      });
      resultats.push({ ...loc, idPS, code, statut: "cree" });
      console.log(`   + ch.${loc.chambre} ${loc.nom} : compte ${idPS}`);
    }

    if (resultats.length) {
      console.log("\n" + "=".repeat(64));
      console.log("  CODES A COMMUNIQUER (affiches une seule fois)");
      console.log("=".repeat(64));
      console.log("  Chambre | Locataire   | Identifiant     | Code | Telephone");
      console.log("  " + "-".repeat(60));
      resultats.forEach((r) =>
        console.log(
          `  ${String(r.chambre).padEnd(7)} | ${String(r.nom).padEnd(11)} | ${String(r.idPS).padEnd(15)} | ${r.code} | ${r.tel || "—"}`
        )
      );
      console.log("=".repeat(64));
      console.log("  Le locataire devra changer ce code a sa premiere connexion.");
    } else {
      console.log("\n   Aucun nouveau compte a creer.");
    }
  } catch (e) {
    console.error(`[${name}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
}

(async () => {
  const args = process.argv.slice(2);
  const cible = (args.find((a) => !a.startsWith("--")) || "prod").toLowerCase();
  const reset = args.includes("--reset");
  await creerPour(cible, TARGETS[cible], reset);
  console.log("\nTermine.");
})();
