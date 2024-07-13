// src/db/db.js
require('dotenv').config();
const { Client } = require("pg");

const DB_URI = process.env.NODE_ENV === "test" ? process.env.TEST_DB_URI : process.env.DB_URI;

const db = new Client({
    connectionString: DB_URI
  });

db.connect(err => {
    if (err) {
      console.error("Connection error", err.stack);
    } else {
      console.log("Connected to database:", DB_URI);
    }
  });

module.exports = db;