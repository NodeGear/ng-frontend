var express = require('express')
	, Page = require('../Page');

exports.router = function (app) {
	var admin = express.Router();
	admin.get('/', renderAdmin);

	var pages = ['transactions', 'users', 'apps', 'tickets', 'paymentMethods', 'requests', 'databases', 'servers', 'secLog'];
	pages.forEach(function (page) {
		(new Page(require('./'+page))).route(admin);
	})

	admin.use(function (req, res, next) {
		res.format({
			json: function () {
				res.send(404);
			},
			html: function () {
				res.render('404');
			}
		})
	});

	app.use('/admin', admin);
}

function renderAdmin (req, res) {
	res.render('admin/index')
}
