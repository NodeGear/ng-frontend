/*
 * Inspiration: http://www.senchalabs.org/connect/logger.html, newrelic & co.
 */

var config = require('./config');
var metrics = config.metrics;

module.exports = function() {
	var self = {};

	self.logger = function(req, res) {
		var now = new Date;
		
		var ms = now - req._monitor_startTime;
		var len = parseInt(res.getHeader('Content-Length'), 10);
		if (isNaN(len)) {
			len = 0;
		}
		var status = res.statusCode;
		var method = req.method;

		var timer = method+'.'+status+'.contentType.'+res.getHeader('Content-Type');
		metrics.timing('frontend.req.time.'+timer, ms);
		metrics.timing('frontend.req.length.'+timer, len);
		metrics.gauge(timer, len);
		
		var user = req.user;
		if (!req.user) user = null;
		else user = user._id;

		/*var perf = new models.NetworkPerformanceRaw({
			responseTime: ms,
			responseLength: len,
			responseStatus: status,
			responseMethod: method,
			requestPath: req.url,
			user: user,
			requestTime: now,
			unix_seconds: Math.round(now / 1000)
		});

		perf.save(function(err) {
			if (err) throw err;
		});*/
	}

	self.middleware = function(req, res, next) {
		var sock = req.socket;
		req._monitor_startTime = new Date;
		
		config.metrics.set('frontend.active.ips', req.ip);
		
		function logRequest(){
			res.removeListener('finish', logRequest);
			res.removeListener('close', logRequest);

			self.logger(req, res);
		};

		res.on('finish', logRequest);
		res.on('close', logRequest);

		next();
	}

	return self.middleware;
}
