"use strict";
const mysql = require("mysql");

const dbConn = mysql.createPool({
  host: process.env.SUN_DB_HOST,
  user: process.env.SUN_DB_USER,
  password: process.env.SUN_DB_MDP,
  database: process.env.SUN_DB_NAME,
  connectionLimit: 10,
});

dbConn.getConnection((err, connection) => {
  if (err) throw err;
  console.log(
    `Connection au base de donnée '${process.env.SUN_DB_NAME}' reussi. `
  );
  connection.release();
});

module.exports = dbConn;
