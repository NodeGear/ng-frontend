
exports.router = function (app) {
	app.get('/admin', renderAdmin)
	
	var routes = ['./users', './apps', './tickets', './paymentMethods', './transactions', './requests', './databases', './servers']
	routes.forEach(function(route) {
		require(route).router(app);
	});
}

function renderAdmin (req, res) {
	res.render('admin/index')
}
