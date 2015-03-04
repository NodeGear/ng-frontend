var models = require('ng-models');

exports.map = [{
	url: '/apps',
	call: getApps
}, {
	url: '/app/:app_id',
	params: {
		app_id: getApp
	},
	children: [{
		url: '',
		call: showApp
	}, {
		url: '/snapshots',
		call: getSnapshots
	}]
}];

function getApps (req, res) {
	res.format({
		json: function () {
			var sort = '-created';
			var limit = 25;
			var offset = 0;

			if (req.query.sorting) {
				sort = "";
				for (var s in req.query.sorting) {
					var desc = false;
					if (req.query.sorting[s] == 'desc') {
						desc = true;
					}

					sort += (desc ? '-' : '') + s + ' ';
				}
			}
			if (req.query.count) {
				limit = parseInt(req.query.count);
			}
			if (req.query.page) {
				offset = (parseInt(req.query.page) - 1) * limit;
			}

			var query = {};
			if (req.query.filter) {
				query = req.query.filter;
				for (var q in query) {
					if (!isNaN(parseInt(query[q]))) {
						query[q] = parseInt(query[q]);
					} else {
						query[q] = new RegExp(query[q], 'gi');
					}
				}
			}

			models.App.find(query)
			.sort(sort)
			.limit(limit)
			.skip(offset)
			.lean()
			.populate('user')
			.exec(function(err, apps) {
				if (err) throw err;

				models.App.count({}, function (err, total) {
					res.send({
						total: total,
						apps: apps
					});
				});
			});
		},
		html: function () {
			res.render('admin/app/apps');
		}
	});
}

function getApp (req, res, next, id) {
	models.App.findById(id)
	.populate('user')
	.exec(function (err, app) {
		res.locals.app = app;
		next();
	});
}

function showApp (req, res) {
	res.format({
		json: function () {
			res.send({
				app: res.locals.app
			});
		},
		html: function () {
			res.render('admin/app/app');
		}
	});
}

function getSnapshots (req, res) {
	models.AppProcessDataSnapshot.find({
		app: res.locals.app._id
	})
	.sort('-created')
	.populate('originProcess originServer')
	.exec(function (err, snapshots) {
		if (err) throw err;

		res.locals.snapshots = snapshots;
		res.render('admin/app/snapshots');
	});
}
