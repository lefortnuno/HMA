"use strict";
/**
 * Sauvegarde complete de la base (schema + donnees) en fichier .sql,
 * sans dependre de mysqldump (pur Node).
 *
 * Usage : node scripts/backup_db.js [prod|local]
 * Sortie : hmas/backups/backup_<base>_<AAAA-MM-JJ>.sql
 *
 * Conserve les 12 dernieres sauvegardes (rotation automatique).
 */
const mysql = require("mysql");
const fs = require("fs");
const path = require("path");
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

const q = (conn, sql, params) =>
  new Promise((resolve, reject) =>
    conn.query(sql, params, (err, res) => (err ? reject(err) : resolve(res)))
  );

function sqlValue(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (v instanceof Date) {
    const p = (n) => String(n).padStart(2, "0");
    return `'${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())} ${p(v.getHours())}:${p(v.getMinutes())}:${p(v.getSeconds())}'`;
  }
  if (Buffer.isBuffer(v)) return `0x${v.toString("hex")}`;
  return `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r")}'`;
}

(async () => {
  const target = (process.argv[2] || "prod").toLowerCase();
  const cfg = TARGETS[target];
  if (!cfg || !cfg.host) {
    console.error(`Cible '${target}' inconnue ou non configuree.`);
    process.exit(1);
  }

  const conn = mysql.createConnection(cfg);
  const stamp = new Date().toISOString().slice(0, 10);
  const dir = path.join(__dirname, "..", "backups");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `backup_${cfg.database}_${stamp}.sql`);

  console.log(`Sauvegarde de ${cfg.database}@${cfg.host} → ${file}`);
  try {
    const lines = [
      `-- Sauvegarde HMA — base ${cfg.database} — ${new Date().toISOString()}`,
      "SET FOREIGN_KEY_CHECKS=0;",
      "",
    ];

    const tables = (await q(conn, "SHOW TABLES")).map((r) => Object.values(r)[0]);
    for (const table of tables) {
      const create = await q(conn, `SHOW CREATE TABLE \`${table}\``);
      lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
      lines.push(create[0]["Create Table"] + ";", "");

      const rows = await q(conn, `SELECT * FROM \`${table}\``);
      console.log(`  ${table} : ${rows.length} ligne(s)`);
      if (rows.length) {
        const cols = Object.keys(rows[0]).map((c) => `\`${c}\``).join(", ");
        for (let i = 0; i < rows.length; i += 100) {
          const chunk = rows.slice(i, i + 100);
          const values = chunk
            .map((r) => `(${Object.values(r).map(sqlValue).join(", ")})`)
            .join(",\n");
          lines.push(`INSERT INTO \`${table}\` (${cols}) VALUES\n${values};`);
        }
        lines.push("");
      }
    }
    lines.push("SET FOREIGN_KEY_CHECKS=1;");
    fs.writeFileSync(file, lines.join("\n"), "utf8");
    console.log(`✅ Sauvegarde terminee (${(fs.statSync(file).size / 1024).toFixed(1)} Ko).`);

    // Rotation : garde les 12 fichiers les plus recents.
    const backups = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith("backup_") && f.endsWith(".sql"))
      .sort()
      .reverse();
    for (const old of backups.slice(12)) {
      fs.unlinkSync(path.join(dir, old));
      console.log(`  rotation : ${old} supprime`);
    }
  } catch (e) {
    console.error(`❌ ${e.code || ""} ${e.message}`);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
})();
