exports.router = function (app) {
	app.get('/admin', renderAdmin)
	
	require('./users').router(app)
	require('./apps').router(app)
	require('./tickets').router(app)
}

function renderAdmin (req, res) {
	res.render('admin/index')
}
