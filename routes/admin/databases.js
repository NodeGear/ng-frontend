var models = require('ng-models');

exports.map = [{
	url: '/databases',
	call: get
}];

function get (req, res) {
	models.Database.find({}).populate('user').exec(function(err, databases) {
		if (err) throw err;
		
		res.locals.databases = databases;
		res.render('admin/databases')
	});
}