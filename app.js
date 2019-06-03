// app.js
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const path = require('path');

const app = express();
const port = process.env.PORT || 3301;

app.use(function (req, res, next) {
    //Allow Any system to access your API (change this to whatever you need)
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(bodyParser.urlencoded({
    extended: true
}));
//app.use(bodyParser.json());
app.use(express.static('dash'));

var routes = require('./api/routes/appRoute'); //importing route
routes(app); //register the route

app.use(function (req, res) {
    res.status(404).send({
        url: req.originalUrl + ' not found'
    });
});



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
