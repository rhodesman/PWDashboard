module.exports = function (app) {
    var powerData = require('../controllers/controller');

    app.route('/')
        .get(function (req, res) {
            res.render('index');
        });
    app.route('/token')
        .get(powerData.get_token_data);
    // Power Data Routes
    app.route('/api')
        .get(powerData.list_all_data)
        .put(powerData.create_data);

    app.route('/api/stream/meters')
        .get(powerData.stream_live_meters);

    app.route('/api/stream/sitemaster')
        .get(powerData.stream_live_pwsm);

    app.route('/api/stream/grid_status')
        .get(powerData.stream_live_grid);

    app.route('/api/stream/system_status')
        .get(powerData.stream_live_soe);

    app.route('/api/buffer/:int')
        .get(powerData.read_some_data);
    app.route('/api/:timeFrame')
        .get(powerData.list_time_data);
};
