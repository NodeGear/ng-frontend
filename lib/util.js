exports.authorized = function (req, res, next) {
	if (res.locals.loggedIn) {
		next()
	} else {
		res.format({
			html: function() {
				res.render('auth');
			},
			json: function() {
				res.send(403, {
					message: "Unauthorized"
				})
			}
		})
	}
}

exports.authorizedPassTFA = function (req, res, next) {
	if (res.locals.requiresTFA) {
		next();
		
		return;
	}
	
	exports.authorized(req, res, next);
}

exports.authorizedPassEmail = function(req, res, next) {
	if (req.user && !res.locals.requiresTFA) {
		next();

		return;
	}

	exports.authorized(req, res, next);
};

exports.mustBeAdmin = function (req, res, next) {
	if (req.user && req.user.admin && !req.session.pretending) {
		next();
	} else {
		res.format({
			html: function() {
				res.redirect('/');
			},
			json: function() {
				res.send(404);
			}
		})
	}
}