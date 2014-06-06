var models = require('ng-models');

exports.router = function(router) {
	router.get('/admin/databases', get)
}

function get (req, res) {
	models.Database.find({}).populate('user').exec(function(err, databases) {
		if (err) throw err;
		
		res.locals.databases = databases;
		res.render('admin/databases')
	});
}