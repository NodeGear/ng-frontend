// Inspiration: http://www.senchalabs.org/connect/logger.html, newrelic & co.

var config = require('./config');
var models = require('./models');
var toobusy = require('toobusy-js');

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

		var user = req.user;
		if (!req.user) user = null;
		else user = user._id;
		
		var perf = new models.NetworkPerformanceRaw({
			responseTime: ms,
			responseLength: len,
			responseStatus: status,
			responseMethod: method,
			requestPath: req.url,
			user: user,
			lag: lag,
			requestTime: now,
			unix_seconds: Math.round(now / 1000)
		});

		perf.save(function(err) {
			if (err) throw err;
		});
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