// src/server.js
require('dotenv').config();
const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}.`)
});