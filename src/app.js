let express = require("express");
const createRoutes = require("./routes/appRoutes");

function createApp(pool) {
  let app = express();

  app.set('trust proxy', 1);

  app.use(express.json());
  app.use(express.static("public"));

  const routes = createRoutes(pool);
  app.use(routes);

  return app;
}

module.exports = createApp;
