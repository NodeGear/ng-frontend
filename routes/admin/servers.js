var models = require('ng-models');

exports.router = function(router) {
	router.get('/admin/servers', get)
}

function get (req, res) {
	res.format({
		json: function() {
			models.Server.find({}, function(err, servers) {
				if (err) throw err;
				
				res.send(200, {
					servers: servers
				})
			});
		},
		html: function() {
			res.render('admin/servers')
		}
	})
}