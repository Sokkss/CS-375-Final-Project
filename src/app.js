let express = require("express");

let app = express();

app.use(express.json());
app.use(express.static("public"));

module.exports = app;