"use strict";
/**
 * Fixe la date d'entree des locataires de VILLA KINYA (bienId 0).
 * Par defaut 2026-06-01, sauf les chambres 3, 5, 6 et 9 arrivees le 2026-06-15.
 *
 * Usage : node scripts/set_dates_entree.js [local|prod|both]
 */
const mysql = require("mysql");
require("dotenv").config({ path: __dirname + "/../config/.env" });

const DATE_DEFAUT = "2026-06-01";
const DATE_TARDIVE = "2026-06-15";
const CHAMBRES_TARDIVES = ["3", "5", "6", "9"];

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

async function majUne(name, cfg) {
  if (!cfg.host) return console.log(`\n[${name}] ⏭  ignore.`);
  const conn = mysql.createConnection(cfg);
  console.log(`\n[${name}] → ${cfg.user}@${cfg.host}/${cfg.database}`);
  try {
    const tardifs = CHAMBRES_TARDIVES.map(() => "?").join(",");

    const r1 = await q(
      conn,
      `UPDATE locataire SET dateEntree = ? WHERE bienId = 0 AND chambre IN (${tardifs})`,
      [DATE_TARDIVE, ...CHAMBRES_TARDIVES]
    );
    console.log(`   ${DATE_TARDIVE} → ${r1.affectedRows} locataire(s) (chambres ${CHAMBRES_TARDIVES.join(", ")})`);

    const r2 = await q(
      conn,
      `UPDATE locataire SET dateEntree = ? WHERE bienId = 0 AND chambre NOT IN (${tardifs})`,
      [DATE_DEFAUT, ...CHAMBRES_TARDIVES]
    );
    console.log(`   ${DATE_DEFAUT} → ${r2.affectedRows} locataire(s) (tous les autres)`);

    const lignes = await q(
      conn,
      "SELECT chambre, etage, nom, DATE_FORMAT(dateEntree, '%d/%m/%Y') AS d FROM locataire WHERE bienId = 0 ORDER BY etage, FIELD(chambre,'1','2','3','4','5','6','7','8','9','10','I','II','III','IV','V','VI','VII','VIII','IX','X')"
    );
    console.log("\n   --- Verification ---");
    lignes.forEach((l) => console.log(`   ${l.etage.padEnd(4)} ch.${String(l.chambre).padEnd(5)} ${l.nom.padEnd(10)} ${l.d}`));
    console.log(`[${name}] ✅ termine.`);
  } catch (e) {
    console.error(`[${name}] ❌ ${e.code || ""} ${e.message}`);
  } finally {
    conn.end();
  }
}

(async () => {
  const arg = (process.argv[2] || "both").toLowerCase();
  const names = arg === "both" ? ["local", "prod"] : [arg];
  for (const n of names) await majUne(n, TARGETS[n]);
  console.log("\nTermine.");
})();
