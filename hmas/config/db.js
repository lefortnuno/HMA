"use strict";
const mysql = require("mysql");

/**
 * Connexion a la base.
 *
 * Tout ce qui est horodate circule en UTC, du serveur MySQL jusqu'au JSON
 * renvoye au navigateur ; la conversion vers l'heure de Madagascar se fait
 * au dernier moment, a l'affichage (voir hmac/src/config/dates.js).
 *
 * Sans cela trois fuseaux se disputaient la meme valeur : celui du serveur
 * MySQL (alwaysdata, UTC+2), celui du processus Node (Render, UTC) et celui
 * du navigateur. Un journal saisi a 9 h 30 s'affichait a 11 h 30.
 *
 *   timezone: "Z"  -> le driver lit et ecrit les dates comme de l'UTC
 *   SET time_zone  -> MySQL les rend en UTC plutot qu'en heure serveur
 *
 * Les colonnes DATE (dateEntree, datePaiement, dateFacture...) ne sont pas
 * concernees : MySQL ne leur applique aucune conversion de fuseau, et c'est
 * bien ce qu'on veut. Un loyer regle le 15 aout l'est partout.
 */
const dbConn = mysql.createPool({
  host: process.env.SUN_DB_HOST,
  user: process.env.SUN_DB_USER,
  password: process.env.SUN_DB_MDP,
  database: process.env.SUN_DB_NAME,
  connectionLimit: 10,
  timezone: "Z",
});

// Chaque connexion du pool annonce a MySQL qu'elle parle UTC. A poser sur la
// connexion elle-meme : une variable de session ne se propage pas d'une
// connexion du pool a l'autre.
dbConn.on("connection", (connection) => {
  connection.query("SET time_zone = '+00:00'");
});

dbConn.getConnection((err, connection) => {
  if (err) throw err;
  console.log(
    `Connection au base de donnée '${process.env.SUN_DB_NAME}' reussi. `
  );
  connection.release();
});

module.exports = dbConn;
