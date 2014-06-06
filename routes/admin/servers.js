var models = require('ng-models');

exports.router = function(router) {
	router.get('/admin/servers', get)
}

function get (req, res) {
	models.Server.find({}, function(err, servers) {
		if (err) throw err;
		
		res.locals.servers = servers;
		res.render('admin/servers')
	});
}