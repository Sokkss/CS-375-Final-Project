let express = require("express");
const appRoutes = require("./routes/appRoutes");

let app = express();

app.use(express.json());
app.use(express.static("public"));

app.use(appRoutes);

module.exports = app;