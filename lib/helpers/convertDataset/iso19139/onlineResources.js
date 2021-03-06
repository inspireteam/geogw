/* Module dependencies */
var URI = require('urijs');
var ipaddr = require('ipaddr.js');
const { forEach, pick } = require('lodash');
var _s = require('underscore.string');
var tld = require('tldjs');


function cleanLocation(location) {
    // Replace tabulations and line breaks by spaces
    location = location.replace(/(\r\n|\n|\r|\t)/gm, ' ');
    // Trim spaces and dashes
    location = _s.trim(location, '- ');
    return location;
}


function OnlineResource(onlineResource) {
    this.name = onlineResource.name;
    this.sourceLocation = onlineResource.href;
    this.sourceProtocol = onlineResource.protocol;
    this.description = onlineResource.description;

    this.location = this.parseLocation();
    this.query = this.parseAndNormalizeQuery();
}

OnlineResource.prototype.parseLocation = function () {
    if (!this.sourceLocation) throw new Error('location must be defined');
    var cleanedLocation = cleanLocation(this.sourceLocation);

    var uri = new URI(cleanedLocation);

    if (!uri.is('url')) throw new Error('Location must be an url');
    if (uri.is('relative')) throw new Error('Location must be absolute');
    if (uri.protocol() !== 'http' && uri.protocol() !== 'https') throw new Error('Location protocol must be http ou https');
    if (!uri.is('ip') && !uri.is('name')) throw new Error('Location must contain an IP address or a hostname');

    if (uri.is('ip')) {
        var addr = ipaddr.parse(uri.hostname());
        var range = addr.range();
        var rangesToExclude = [
            'unspecified',
            'broadcast',
            'multicast',
            'linkLocal',
            'loopback',
            'private',
            'reserved'
        ];
        if (range && rangesToExclude.include(range)) throw new Error('IP address must be public');
    }

    if (uri.is('name')) {

        // TODO: Add a warning for that
        if (uri.hostname() === 'atom.geo-ide.application.i2') {
            uri.hostname('atom.geo-ide.developpement-durable.gouv.fr');
        }

        if (!tld.tldExists(uri.hostname())) throw new Error('Hostname must be a valid TLD');
        if (_s.endsWith(uri.hostname(), 'ader.gouv.fr')) throw new Error('Hostname must be publicly accessible');
    }

    return uri;
};

OnlineResource.prototype.parseAndNormalizeQuery = function () {
    var query = {};

    // Ensure query string param names are lower-cased
    forEach(this.location.search(true), function (val, key) {
        query[key.toLowerCase()] = val;
    });

    return query;
};

OnlineResource.prototype.isWfsFeatureType = function () {
    var sourceProtocolContainsWfs = (this.sourceProtocol || '').toLowerCase().indexOf('wfs') >= 0;
    var sourceLocationIsWfsQuery = (this.query.service || '').toLowerCase() === 'wfs';
    const sourceLocationContainsWfs = (this.sourceLocation || '').toLowerCase().includes('wfs');

    var detectWfsProtocol = sourceProtocolContainsWfs || sourceLocationIsWfsQuery || sourceLocationContainsWfs;

    // Ensure we drop well-formed query of other OGC protocols (e.g. WMS)
    if (('service' in this.query) && this.query.service.toLowerCase() !== 'wfs') return false;

    if (!detectWfsProtocol) return false;

    var typeNameInQuery = this.query.typename || this.query.typenames || this.query.layers;
    var typeNameFromName = (sourceProtocolContainsWfs || sourceLocationIsWfsQuery) && this.name;

    this.typeNameFound = typeNameInQuery || typeNameFromName;

    return !!this.typeNameFound;
};

OnlineResource.prototype.getFeatureTypeName = function () {
    return this.typeNameFound;
};

OnlineResource.prototype.getNormalizedWfsServiceLocation = function () {
    var location = this.location.clone();
    // map is used by MapServer
    // port is used by Business Geographic proxy
    location.search(pick(this.query, 'map', 'port'));
    location.fragment('').normalize();
    return location.valueOf();
};

OnlineResource.prototype.getNormalizedString = function () {
    return this.location.clone().fragment('').normalize().valueOf();
};

OnlineResource.prototype.getNormalizedStringWithFragment = function () {
    return this.location.clone().normalize().valueOf();
};

OnlineResource.prototype.isWmsLayer = function () {
    var sourceProtocolContainsWms = (this.sourceProtocol || '').toLowerCase().indexOf('wms') >= 0;
    var sourceLocationIsWmsQuery = (this.query.service || '').toLowerCase() === 'wms';

    var detectWmsProtocol = sourceProtocolContainsWms || sourceLocationIsWmsQuery;

    return detectWmsProtocol;
};

exports.OnlineResource = OnlineResource;
