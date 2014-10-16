/*
 * Inspiration: http://www.senchalabs.org/connect/logger.html, newrelic & co.
 */

var config = require('./config');
var metrics = config.metrics;

module.exports = function() {
	var self = {};

	self.logger = function(req, res) {
		var now = new Date();
		var route = req.url;

		if (req.route && req.route.path) {
			route = req.route.path;
		}

		if (route === "/") {
			route = "root";
		}

		route = route.replace(/:/, '-')
			.replace(/^\/|\/$/g, "")
			.replace(/\//, '_');
		
		var ms = now - req._monitor_startTime;
		var len = parseInt(res.getHeader('Content-Length'), 10);
		if (isNaN(len)) {
			len = 0;
		}
		var status = res.statusCode;
		var method = req.method;

		var url = route+'.'+method+'.'+status;

		var m = {};
		m['frontend.req.url.' + url] = ms+'|ms';
		m['frontend.req.length.' + url] = len+'|ms';

		metrics.send(m);
		
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

		perf.save(function (err) {
			if (err) throw err;
		});*/
	};

	self.middleware = function(req, res, next) {
		req._monitor_startTime = new Date();
		
		metrics.set('frontend.active.ips', req.ip);
		
		function logRequest () {
			res.removeListener('finish', logRequest);
			res.removeListener('close', logRequest);

			self.logger(req, res);
		}

		res.on('finish', logRequest);
		res.on('close', logRequest);

		next();
	};

	return self.middleware;
};
