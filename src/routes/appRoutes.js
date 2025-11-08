const express = require('express');

// citation: largely from Professor Long's sample code
function createRoutes(pool) {
    const router = express.Router();

    router.post("/datum", (req, res) => {
        let { datum } = req.body;
        if (datum === undefined) {
            return res.status(400).send({});
        }
        pool.query("INSERT INTO foo (datum) VALUES ($1)", [datum]).then(result => {
            return res.send({});
        }).catch(error => {
            console.log(error);
            return res.status(500).send({});
        })
    });

    router.get("/data", (req, res) => {
        pool.query("SELECT * FROM foo").then(result => {
            return res.send({data: result.rows});
        }).catch(error => {
            console.log(error);
            return res.status(500).send({data: []});
        })
    });

  return router;
}

module.exports = createRoutes;
