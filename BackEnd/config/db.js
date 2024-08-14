"use strict";
const mysql = require("mysql");

const dbConn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: "root",
  password: "",
  database: process.env.DB_NAME,
});

dbConn.connect(function (err) {
  if (err) throw err;
  console.log(`Connection au base de donnée ..... : ..... reussi. `);
});

module.exports = dbConn;
