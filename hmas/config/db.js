// db.js
const mysql = require("mysql2/promise");

const dbConn = mysql.createPool({
  host: process.env.SUN_DB_HOST,
  user: process.env.SUN_DB_USER,
  password: process.env.SUN_DB_MDP,
  database: process.env.SUN_DB_NAME,
  waitForConnections: true,  // Assure que la connexion est toujours prête
  connectionLimit: 10,       // Nombre maximum de connexions simultanées
  queueLimit: 0              // Pas de limite sur la file d'attente des connexions
});

dbConn.getConnection()
  .then(() => {
    console.log(`Connection au base de donnée '${process.env.SUN_DB_NAME}' réussie.`);
  })
  .catch((err) => {
    console.error("Erreur de connexion à la base de données :", err);
  });

module.exports = dbConn;
