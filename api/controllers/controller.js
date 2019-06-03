var Curl = require('node-libcurl').Curl;
var mongoose = require('mongoose'),
    Data = mongoose.model('Data');
const request = require("request");

require("../../config/db");

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
    //console.log(body);
    res.json(body);
  });
};


exports.stream_live_meters = function (req, res, next) {
    curlGrab('https://10.0.10.220/api/meters/aggregates?callback=data', function(thisJSON) {
        if (thisJSON != null) {
            res.json(thisJSON);
            //this.close();

        } else {
            res.json('204', '', '');
        }

    });
};
exports.stream_live_pwsm = function (req, res, next) {
    curlGrab('https://10.0.10.220/api/sitemaster', function(thisJSON) {
        if (thisJSON != null) {
            res.json(thisJSON);
            //this.close();
        } else {
            res.json('204', '', '');
        }

    });
};
exports.stream_live_grid = function (req, res, next) {
    curlGrab('https://10.0.10.220/api/system_status/grid_status', function(thisJSON) {
        if (thisJSON != null) {
            res.json(thisJSON);
            //this.close();
        } else {
            res.json('204', '', '');
        }

    });
};
exports.stream_live_soe = function (req, res, next) {
    curlGrab('https://10.0.10.220/api/system_status/soe', function(thisJSON) {
        if (thisJSON != null) {
            res.json(thisJSON);
            //this.close();
        } else {
            res.json('204', '', '');
        }

    });
};

exports.list_all_data = function (req, res, next) {
    Data.find({}, function (err, data) {
        if (err)
            res.send(err);
        res.json(data);

        return;
    });
};

exports.create_data = function (req, res, next) {
    var new_data = new Data(req.body);
    new_data.save(function (err, data) {
        if (err)
            res.send(err);
        res.json(data);

        return;
    });
};
exports.read_some_data = function (req, res, next) {
    var query = Data.find({});
    query.sort({
        'Created_date': -1
    });
    var queryInt = parseInt(req.params.int);
    query.limit(queryInt);
    query.exec(function (err, data) {
        if (err)
            res.send(err);
        res.json(data);

        return;
    });
};
exports.list_today_data = function (req, res, next) {
    var query = Data.find({
        "Created_date": {
            $lt: new Date(),
            $gte: new Date(new Date().setDate(new Date().getDate() - 1))
        }
    });
    query.exec(function (err, data) {
        if (err)
            res.send(err);
        res.json(data);

        return;
    });
};
exports.list_time_data = function (req, res, next) {
    var timeFrame = req.params.timeFrame;
    var now = new Date();
    var then = '';
    if(timeFrame == "day"){
      then = new Date(new Date().setDate(new Date().getDate() - 1))
    }else if(timeFrame == "week"){
      then = new Date(new Date().setDate(new Date().getDate() - 7))
    }else if(timeFrame == "month"){
      // set the day
      var d = new Date();
      d.setDate(12);
      // set the month
      var m = new Date();
      var thisM = m.getMonth();
      var lastM = thisM - 1;
      // set the year
      var y = new Date();
      var thisY = y.getFullYear();
      if (lastM == 12) {
        thisY = thisY - 1;
      }
      // compute days between last bill
      var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
      var firstDate = new Date(thisY , d , lastM);
      var secondDate = new Date();
      var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));

      then = new Date(new Date().setDate(new Date().getDate() - diffDays));
    }else {
      then = new Date(timeFrame + ' 00:00:00');
      now = new Date(timeFrame + ' 23:59:59');
    }

    var query = Data.find({
        "Created_date": {
            $lt: now,
            $gte: then
        }
    });
    query.exec(function (err, data) {
        if (err)
            res.send(err);
        res.json(data);

        return;
    });
};
exports.read_data = function (req, res, next) {
    Data.findById(req.params.dataId, function (err, data) {
        if (err)
            res.send(err);
        res.json(data);

        return;
    });

};
exports.update_data = function (req, res, next) {
    Data.findOneAndUpdate({
            _id: req.params.dataId
        }, req.body, {
            new: true
        },
        function (err, data) {
            if (err)
                res.send(err);
            res.json(data);

            return;
        });
};
exports.delete_data = function (req, res, next) {
    Data.remove({
        _id: req.params.dataId
    }, function (err, data) {
        if (err)
            res.send(err);
        res.json({
            message: 'Data successfully deleted'
        });

        return;
    });
};

function curlGrab(thisURL, callback) {
    var curl = new Curl(),
        url = thisURL;
    curl.setOpt(Curl.option.URL, url);
    curl.setOpt(Curl.option.FOLLOWLOCATION, true);
    curl.setOpt(Curl.option.SSL_VERIFYHOST, 0);
    curl.setOpt(Curl.option.SSL_VERIFYPEER, 0);
    curl.perform();
    curl.on('end', function (statusCode, body, headers) {
        var thisData = JSON.parse(body);
        if (statusCode == 200) {
            return( callback(thisData) );
        } else {
            var thisError = {
                "starusCode": statusCode,
                "headers": headers,
                "body": body
            };
            console.log(thisError);
            return null;
        }
    });
    curl.on('error', curl.close.bind(curl));
}
