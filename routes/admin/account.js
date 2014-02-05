var models = require('../../models')

exports.router = function (app) {
	app.get('/admin/account', getAccount)
		.post('/admin/account', saveAccount)
}

function getAccount (req, res) {
	res.render('admin/account')
}

function saveAccount (req, res) {
	if (req.body.password.length == 0) {
		res.redirect('/admin/account')
		return;
	}
	
	req.user.setPassword(req.body.password);
	req.user.save()
	
	req.session.flash.push("Account Saved")
	res.redirect('/admin/account');
}