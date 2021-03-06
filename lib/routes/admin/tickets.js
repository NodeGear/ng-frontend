var models = require('ng-models');

exports.map = [{
	url: '/tickets',
	call: getTickets
}];

function getTickets (req, res) {
	models.Ticket.find({})
	.populate('user app message.user')
	.exec(function (err, tickets) {
		res.locals.tickets = tickets;
		
		res.render('admin/tickets');
	});
}