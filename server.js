let app = require("./src/app");

let hostname = "localhost";
let port = 3000;

app.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
});