// app.js
const express = require("express");
const bodyParser = require("body-parser");
const Curl = require('node-libcurl').Curl;
const request = require("request");
const path = require('path');

// db instance connection
require("./config/db");

const app = express();

const port = process.env.PORT || 3301;

//Express Server Settings
app.use(function (req, res, next) {
    //Allow Any system to access your API (change this to whatever you need)
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static('dash'));

var routes = require('./api/routes/routes'); //importing route
routes(app); //register the route

app.use(function (req, res) {
    res.status(404).send({
        url: req.originalUrl + ' not found'
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    setInterval(storeData, 100);
    //storeData();
});

function storeData() {
    var powerWallURL = 'https://10.0.10.220/api/meters/aggregates?callback=data';
    apiConnect(powerWallURL, function(data) {
        if (data != null) {
            var options = {
                method: 'PUT',
                url: 'http://localhost:3301/api/',
                headers: {
                    "Content-Type": "application/json",
                    'cache-control': 'no-cache'
                },
                form: {
                    grid: data.site.instant_power,
                    battery: data.battery.instant_power,
                    house: data.load.instant_power,
                    solar: data.solar.instant_power
                }
            };
            request(options, function (error, response, body) {
                if (error) {
                    return console.error('upload failed:', error);
                }else {
                  data = null;
                  return;
                }
            });

        } else {
            console.log("nothing here");
        }
    });
    batteryData();
}
function batteryData() {
  var batteryLevel = 'https://10.0.10.220/api/system_status/soe';
  apiConnect(batteryLevel, function(data) {
    if (data != null) {
        var options = {
            method: 'PUT',
            url: 'http://localhost:3301/api/',
            headers: {
                "Content-Type": "application/json",
                'cache-control': 'no-cache'
            },
            form: {
              batteryLevel: data.percentage
            }
          };
          request(options, function (error, response, body) {
              if (error) {
                  return console.error('upload failed:', error);
              }else {
                data = null;
                return;
              }
          });
        }
  });
}
function apiConnect(thisURL, callback) {
    var thisData;
    var curl = new Curl(),
        url = thisURL;
    curl.setOpt(Curl.option.URL, url);
    curl.setOpt(Curl.option.FOLLOWLOCATION, true);
    curl.setOpt(Curl.option.SSL_VERIFYHOST, 0);
    curl.setOpt(Curl.option.SSL_VERIFYPEER, 0);
    curl.perform();
    curl.on('end', function (statusCode, body, headers) {
        thisData = JSON.parse(body);
        if (statusCode == 200) {
            return( callback(thisData) );
        } else {
            console.log('ERROR: ' + statusCode + headers + body);
            return null;
        }
    });
    curl.on('error', curl.close.bind(curl));
}
