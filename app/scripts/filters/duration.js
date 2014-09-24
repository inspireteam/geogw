var moment = require('moment');

module.exports = function () {
    return function (value) {
        if (!value) return '';
        return moment.duration(value).humanize();
    };
};