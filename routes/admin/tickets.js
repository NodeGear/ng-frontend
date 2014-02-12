var models = require('../../models')

exports.router = function (app) {
	app.get('/admin/tickets', getTickets)
}

function getTickets (req, res) {
	models.Ticket.find({}).populate('user app message.user').exec(function(err, tickets) {
		res.locals.tickets = tickets;
		
		res.render('admin/tickets')
	})
}