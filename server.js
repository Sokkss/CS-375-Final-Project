let app = require("./src/app");
const db = require("./src/config/database");

let hostname = "0.0.0.0";
let port = process.env.PORT || 3000;

db.testConnection()
  .then(() => {
    console.log("Database connection verified successfully");
  })
  .catch((error) => {
    console.error("Database connection test failed:", error.message);
  });

app.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
});