module.exports = function (app) {
    var powerData = require('../controllers/controller');

    app.route('/')
        .get(function (req, res) {
            res.render('index');
        });
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

    app.route('/api/today')
        .get(powerData.list_today_data);

    app.route('/api/:dataId')
        .get(powerData.read_data)
        .put(powerData.update_data)
        .delete(powerData.delete_data);
};