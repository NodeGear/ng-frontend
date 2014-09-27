var models = require('ng-models');
var csv = require('csv'),
	async = require('async');

exports.map = [{
	url: '/tools',
	call: getTools,
	children: [{
		url: '/userExport',
		call: userExport
	}]
}];

function getTools (req, res) {
	res.render('admin/tools');
}

function userExport (req, res) {
	var q = req.query.q;
	try {
		q = JSON.parse(q);
	} catch (e) {
		return res.send(400, 'Invalid JSON mate.');
	}

	models.User.find(q)
	.select('name email -_id')
	.exec(function (err, users) {
		if (err) {
			return res.send(400, 'Invalid Query!');
		}

		async.map(users, function (user, cb) {
			var name = user.name;

			var userArr = [];
			userArr.push(user.email);

			var fname = "", lname = "";
			if (name) {
				name = name.split(' ');

				if (name.length > 0) {
					fname = name[0];
				}
				if (name.length > 1) {
					lname = name[name.length - 1];
				}
			}

			userArr.push(fname, lname);

			cb(null, userArr);
		}, function (err, users) {
			users.splice(0, 0, ['Email', 'First Name', 'Last Name']);
			
			csv.stringify(users, function (err, data) {
				res.set({
					'Content-Type': 'text/csv',
					'Content-Disposition': 'attachment;filename=nodegear_user_export.csv'
				});

				res.send(data);
			});
		});
	});
}