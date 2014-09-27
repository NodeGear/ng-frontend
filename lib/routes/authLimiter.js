'use strict';

var Limiter = require('ratelimiter'),
	app = require('../app'),
	config = require('../config');

var limit = function (req, res, next, l) {
	if (config.testing) {
		return next();
	}

	l.get(function (err, l) {
		if (err) return next(err);

		if (l.remaining) return next();

		var delta = (l.reset * 1000) - Date.now() | 0;
		var after = l.reset - (Date.now() / 1000) | 0;
		res.set('Retry-After', after);

		res.status(429).send({
			retry: delta,
			message: 'Rate limit exceeded.'
		});
	});
};

// Restricts IP:id and applies the rate
exports.restrict = function (rate, id) {
	return function (req, res, next) {
		limit(req, res, next, new Limiter({
			id: req.ip+':'+id,
			db: app.backend,
			max: rate,
			duration: 3600000
		}));
	};
};

exports.auth = function (rate) {
	return function (req, res, next) {
		if (!req.body.auth) {
			return next();
		}

		limit(req, res, next, new Limiter({
			id: 'auth:'+req.body.auth,
			db: app.backend,
			max: rate,
			duration: 3600000
		}));
	};
};

exports.verifyEmail = function (rate) {
	return function (req, res, next) {
		limit(req, res, next, new Limiter({
			id: 'emailVerification:'+req.user._id,
			db: app.backend,
			max: rate,
			duration: 3600000
		}));
	};
};