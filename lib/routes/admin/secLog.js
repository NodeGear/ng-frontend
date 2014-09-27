var models = require('ng-models'),
	mongoose = require('mongoose');

exports.map = [{
	url: '/securityLogs',
	call: getAll
}];

function getAll (req, res) {
	res.format({
		html: function () {
			res.render('admin/securityLog');
		},
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
					if (q == 'pretender' || q == 'victim') {
						try {
							query[q] = mongoose.Types.ObjectId(query[q]);
						} catch (e) {
							query[q] = null;
						}
					} else if (!isNaN(parseInt(query[q]))) {
						query[q] = parseInt(query[q]);
					} else {
						query[q] = new RegExp(query[q], 'gi');
					}
				}
			}

			console.log(query);
			models.SecurityLog.find(query)
			.sort(sort)
			.limit(limit)
			.skip(offset)
			.populate({
				path: 'victim',
				select: 'name',
				options: {
					lean: true
				}
			})
			.populate({
				path: 'pretender',
				select: 'name',
				options: {
					lean: true
				}
			})
			.lean()
			.exec(function(err, logs) {
				if (err) throw err;

				for (var i = 0; i < logs.length; i++) {
					var d = new Date(logs[i].created);
					logs[i].created = d.getDate() + '/' + (d.getMonth()+1) + '/' +
						d.getFullYear() + ' ' + d.getHours() + ':' + d.getMinutes();
				}

				models.SecurityLog.count({}, function(err, total) {
					res.send(200, {
						total: total,
						logs: logs
					});
				});
			});
		}
	});
}