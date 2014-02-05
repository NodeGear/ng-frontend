var models = require('../../models')

exports.router = function (app) {
	app.get('/admin/tickets', getTickets)
}

function getTickets (req, res) {
	res.render('admin/tickets');
	
	/*
	models.X.find({}, function(err, tickets) {
		res.locals.tickets = tickets;
		
		res.render('admin/tickets')
	})*/
}