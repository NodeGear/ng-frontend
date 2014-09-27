var models = require('ng-models');

module.exports = function () {
	var self = this;

	this.logger = function(req, res) {
		var status = res.statusCode;
		
		var sec = new models.SecurityLog({
			pretender: req.session.pretender,
			victim: req.user._id,
			requestBody: req.body,
			url: req.url,
			method: req.method,
			statusCode: status,
			ip: req.ip
		});

		sec.save(function(err) {
			if (err) throw err;
		});
	};

	this.middleware = function (req, res, next) {
		res.locals.pretending = false;
		if (req.session.pretending === true) {
			res.locals.pretending = true;

			// Load the original user.
			models.User.findById(req.session.pretender).exec(function(err, user) {
				if (err) throw err;

				res.locals.pretender = user;
				res.locals.requiresTFA = false;
				res.locals.loggedIn = true;

				// Log the action to SecurityLog db
				function logRequest () {
					res.removeListener('finish', logRequest);
					res.removeListener('close', logRequest);

					self.logger(req, res);
				}
				
				res.on('finish', logRequest);
				res.on('close', logRequest);

				next();
			});

			return;
		}

		next();
	};

	return this.middleware;
};