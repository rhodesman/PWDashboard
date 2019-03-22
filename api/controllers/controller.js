
var Curl = require('node-libcurl').Curl;
var mongoose = require('mongoose'),
    Data = mongoose.model('Data');

require("../../config/db");

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
    });
};

exports.create_data = function (req, res, next) {
    var new_data = new Data(req.body);
    new_data.save(function (err, data) {
        if (err)
            res.send(err);
        res.json(data);
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
    });
};
exports.read_data = function (req, res, next) {
    Data.findById(req.params.dataId, function (err, data) {
        if (err)
            res.send(err);
        res.json(data);
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
            callback(thisData);
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