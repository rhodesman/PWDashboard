const request = require("request");

exports.get_token_data = function (req, res, next) {
  var options = {
    method: 'POST',
    url: 'https://owner-api.teslamotors.com/oauth/token',
    headers: {
       Host: 'owner-api.teslamotors.com',
       'Cache-Control': 'no-cache',
       Accept: '*/*',
       'User-Agent': 'Powerwall Dashboard',
       'Content-Type': 'application/json',
       'authorization': 'Bearer ${auth}'
    },
    formData: {
       grant_type: 'password',
       client_id: '81527cff06843c8634fdc09e8ac0abefb46ac849f38fe1e431c2ef2106796384',
       client_secret: 'c7257eb71a564034f9419ee651c7d0e5f7aa6bfbd18bafb5c5c033b093bb2fa3',
       email: '[insert tesla username/email here]',
       password: '[insert tesla password here]'
     }
   };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    res.send(body);
  });
};
exports.get_products = function (req, res, next) {
  var token = "Bearer " + req.params.token;
  var options = {
    "url": "https://owner-api.teslamotors.com/api/1/products",
    "method": "GET",
    "headers": {
      Host: 'owner-api.teslamotors.com',
      'Cache-Control': 'no-cache',
      Accept: '*/*',
      'User-Agent': 'Powerwall Dashboard',
      'Content-Type': 'application/json',
      Authorization: token
    }
  };
  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    res.send(body);
  });
};
exports.get_api_data = function (req, res, next) {
  //:product/:id/:type/:token
  var token = "Bearer " + req.params.token;
  var product = req.params.product;
  var prodID = req.params.id;
  var dataType = req.params.type;
  var teslaUrl = 'https://owner-api.teslamotors.com/api/1/';
  if(dataType != null) {
    teslaUrl = teslaUrl + '/' + product + '/' + prodID + '/' + dataType;
  }else {
    teslaUrl = teslaUrl + '/' + product + '/' + prodID
  }
  var options = {
    "url": teslaUrl,
    "method": "GET",
    "headers": {
      Host: 'owner-api.teslamotors.com',
      'Cache-Control': 'no-cache',
      Accept: '*/*',
      'User-Agent': 'Powerwall Dashboard',
      'Content-Type': 'application/json',
      Authorization: token
    }
  };
  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    res.send(body);
  });
};
