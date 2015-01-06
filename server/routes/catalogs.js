/*
** Module dependencies
*/
var catalogs = require('../controllers/catalogs');
var services = require('../controllers/services');

module.exports = function(app) {

    // Routes
    app.route('/catalogs')
        .get(catalogs.list);

    app.route('/catalogs/:serviceId')
        .get(services.show);

    app.route('/catalogs/:serviceId/sync')
        .post(services.sync);

    app.route('/catalogs/:serviceId/synchronizations')
        .get(services.listSyncs);

    // app.route('/services/by-protocol/:protocol/sync-all')
    //     .post(services.syncAllByProtocol);

};
