// Inspiration: http://www.senchalabs.org/connect/logger.html, newrelic & co.

var config = require('./config');
var models = require('./models');
var toobusy = require('toobusy');

module.exports = function() {
	var self = this;

	this.logger = function(req, res) {
		var now = new Date;
		var ms = now - req._monitor_startTime;
		var len = parseInt(res.getHeader('Content-Length'), 10);
		if (isNaN(len)) {
			len = 0;
		}
		var status = res.statusCode;
		var method = req.method;
		var lag = toobusy.lag();

		var perf = new models.NetworkPerformanceRaw({
			responseTime: ms,
			responseLength: len,
			responseStatus: status,
			responseMethod: method,
			lag: lag,
			date: now,
			seconds: Math.round(now / 1000)
		});
		perf.save();
	}

	this.middleware = function(req, res, next) {
		var sock = req.socket;
		req._monitor_startTime = new Date;
		
		function logRequest(){
			res.removeListener('finish', logRequest);
			res.removeListener('close', logRequest);

			self.logger(req, res);
		};

		res.on('finish', logRequest);
		res.on('close', logRequest);

		next();
	}

	return this.middleware;
}