let app = require("./src/app");

let hostname = "0.0.0.0";
let port = 3000;

app.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
});