var models = require('../../models')

exports.router = function (app) {
	app.get('/admin/apps', getApps)
}

function getApps (req, res) {
	models.Drone.find({}).populate('user').exec(function(err, apps) {
		res.locals.apps = apps;
		
		res.render('admin/apps')
	})
}