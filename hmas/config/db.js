"use strict";
const mysql = require("mysql2/promise");

const dbConn = mysql.createConnection({
  host: process.env.SUN_DB_HOST,
  user: process.env.SUN_DB_USER,
  password: process.env.SUN_DB_MDP,
  database: process.env.SUN_DB_NAME,
});

dbConn
  .then(() => {
    console.log(
      `Connection au base de donnée '${process.env.SUN_DB_NAME}' réussie.`
    );
  })
  .catch((err) => {
    console.error("Erreur de connexion à la base de données :", err);
  });
module.exports = dbConn;
