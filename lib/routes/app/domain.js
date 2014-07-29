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
	if (!req.body.domain || !req.body.domain.domain) {
		res.send(400, {
			status: 400,
			message: "Invalid Request"
		});

		return;
	}

	var domain = req.body.domain;

	domain.domain = domain.domain.toLowerCase();

	if (res.locals.domain && res.locals.domain.domain == domain.domain) {
		saveCallback(res.locals.domain, req, res, domain);

		return;
	}

	if (domain.domain && (domain.domain.length == 0 || domain.domain.length >= 253)) {
		res.send({
			status: 400,
			message: "Invalid Domain Name"
		});

		return;
	}

	models.AppDomain.findOne({
		domain: domain.domain
	}, function(err, aDomain) {
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
				}), req, res, domain);
			})
		} else {
			saveCallback(d, req, res, domain);
		}
	})
}

function saveCallback (d, req, res, domain) {
	d.domain = domain.domain;
	d.ssl = domain.ssl;
	d.ssl_only = domain.ssl_only;
	
	if (d.ssl_only && !d.ssl) {
		d.ssl = true;
	}

	if (!d.ssl_only) {
		d.certificate = "";
		d.certificate_key = "";
	} else {
		d.certificate = req.body.domain.certificate;
		d.certificate_key = req.body.domain.certificate_key;
	}

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