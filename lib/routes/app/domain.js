var mongoose = require('mongoose')
	, models = require('ng-models')
	, config = require('../../config')
	, util = require('../../util')
	, app = require('../../app');

exports.router = function(_app) {
	_app.all('/app/:id/domain/:did', getDomain)
		.all('/app/:id/domain/:did/*', getDomain)
		
		.get('/app/:id/domains', getDomains)
		.post('/app/:id/domain', saveDomain)
		.get('/app/:id/domain/:did', viewDomain)
		.put('/app/:id/domain/:did', saveDomain)
		.delete('/app/:id/domain/:did', deleteDomain)
}

function getDomains (req, res) {
	models.AppDomain.find({
		app: res.locals.app._id
	}, function(err, domains) {
		if (err) throw err;

		res.send({
			status: 200,
			domains: domains
		})
	})
}

function getDomain (req, res, next) {
	var did = req.params.did;

	try {
		did = mongoose.Types.ObjectId(did);
	} catch (e) {
		res.send({
			status: 400,
			message: "Invalid ID"
		});
		return;
	}

	models.AppDomain.findOne({
		_id: did
	}, function(err, domain) {
		if (err) throw err;

		if (!domain) {
			res.send({
				status: 404,
				message: "Not found"
			});
			return;
		}

		res.locals.domain = domain;
		next();
	})
}

function saveDomain (req, res) {
	if (!req.body.domain) {
		res.send(400, {
			status: 400,
			message: "Invalid Request"
		});

		return;
	}

	var domain = req.body.domain.domain;
	var is_subdomain = req.body.domain.is_subdomain;

	if (res.locals.domain &&
		res.locals.domain.domain == domain && res.locals.domain.is_subdomain == is_subdomain) {
		// Nothing changed?.
		// Just pretend we saved this
		res.send({
			status: 200
		});

		return;
	}

	if (domain && (domain.length == 0 || domain.length >= 253)) {
		res.send({
			status: 400,
			message: "Invalid Domain Name"
		});

		return;
	}

	if (is_subdomain) {
		domain += '-' + req.user.usernameLowercase;
	}

	var query = {
		domain: domain,
		is_subdomain: is_subdomain
	};
	// Subdomains are individual
	if (is_subdomain) {
		query.user = req.user._id;
	}

	models.AppDomain.findOne(query, function(err, aDomain) {
		if (err) throw err;

		if (aDomain) {
			res.send({
				status: 400,
				message: "Domain Name Taken"
			});
			return;
		}

		var d = res.locals.domain;
		if (!d) {
			// Creating a domain

			// Check domain limit
			models.AppDomain.count({
				app: res.locals.app._id,
				user: req.user._id
			}, function (err, domainCount) {
				if (err) throw err;

				if (domainCount >= 5) {
					return res.send({
						status: 400,
						message: "Domain Limit Exceeded"
					});
				}

				saveCallback(new models.AppDomain({
					app: res.locals.app._id,
					user: req.user._id
				}), req, res, domain, is_subdomain);
			})
		} else {
			saveCallback(d, req, res, domain, is_subdomain);
		}
	})
}

function saveCallback (d, req, res, domain, is_subdomain) {
	d.domain = domain;
	d.is_subdomain = is_subdomain;

	d.save();

	res.send({
		status: 200
	});
}

function viewDomain (req, res) {
	res.send({
		status: 200,
		domain: res.locals.domain
	})
}

function deleteDomain (req, res) {
	var domain = res.locals.domain;
	
	models.AppDomain.remove({
		_id: domain._id
	}, function(err) {
		if (err) throw err;

		res.send({
			status: 200,
			message: ""
		});
	})
}