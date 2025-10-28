let express = require("express");

let hostname = "localhost";
let port = 3000;
let app = express();

app.use(express.json());
app.use(express.static("public"));

app.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
});