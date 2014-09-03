var models = require('ng-models');

exports.map = [{
	url: '/servers',
	call: get
}, {
	url: '/server/:server_id/limit',
	call: setLimit,
	method: 'put'
}];

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

function setLimit (req, res) {
	models.Server.findOne({
		_id: req.params.server_id
	}, function (err, server) {
		if (err) throw err;

		var limit = parseInt(req.body.limit);
		if (isNaN(limit) || limit <= 0) {
			return res.send(400);
		}

		server.appLimit = limit;
		server.save();

		res.send({});
	})
}