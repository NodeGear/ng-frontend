var models = require('../../models')

exports.router = function (app) {
	app.get('/admin/users', getUsers)
}

function getUsers (req, res) {
	models.User.find({}, function(err, users) {
		res.locals.users = users;
		
		res.render('admin/users')
	})
}