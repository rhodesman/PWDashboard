module.exports = function (app) {
    var dataStream = require('../controllers/appController');

    app.route('/')
        .get(function (req, res) {
            res.render('index');
        });
    app.route('/api/token')
        .get(dataStream.get_token_data);

    app.route('/api/products/:token')
        .get(dataStream.get_products);

    app.route('/api/tesla/:token/:product/:id/:type')
        .get(dataStream.get_api_data);
};
