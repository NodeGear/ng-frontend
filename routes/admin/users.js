var models = require('../../models')

exports.router = function (app) {
	app.get('/admin/users', getUsers)
		.get('/admin/user/:id', getUser, showUser)
}

function getUsers (req, res) {
	models.User.find({}, function(err, users) {
		res.locals.users = users;
		
		res.render('admin/users')
	})
}

function getUser (req, res, next) {
	models.User.findById(req.params.id, function(err, user) {
		res.locals.aUser = user;
		next();
	});
}

function showUser (req, res) {
	res.render('admin/user')
}