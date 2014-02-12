var mongoose = require('mongoose')
	, models = require('../../models')
	, config = require('../../config')
	, util = require('../../util')

exports.router = function (app) {
	app.get('/tickets', util.authorized, viewTickets)
		.all('/tickets/*', util.authorized)
		.get('/tickets/tickets', viewTicketsTemplate)
		.get('/tickets/ticket', viewTicketTemplate)
		.get('/tickets/add', addTicket)
		.post('/tickets/add', createTicket)
		.get('/tickets/:tid', getTicket, showTicket);
}

function viewTickets (req, res) {
	models.Ticket.find({
		user: req.user._id
	}).exec(function(err, tickets) {
		if (err) throw err;
		
		res.send({
			tickets: tickets
		})
	})
}
function viewTicketsTemplate (req, res) {
	res.render('tickets/tickets')
}
function viewTicketTemplate (req, res) {
	res.render('tickets/ticket')
}

function addTicket (req, res) {
	res.render('tickets/add')
}

function createTicket (req, res) {
	var ticket = req.body.ticket;
	
	var errs = [];
	
	function cb(errs, app) {
		var t = new models.Ticket({
			subject: ticket.subject,
			message: ticket.message,
			urgent: ticket.urgent,
			user: req.user._id
		})
		if (typeof app !== 'undefined') {
			t.app = app;
		}
		
		t.save();
		
		res.send({
			status: errs.length > 0 ? 400 : 200,
			message: errs.length > 0 ? errs.join(', ') : 'Created.'
		});
	}
	
	if (!ticket.subject || ticket.subject.length < 2) {
		errs.push("No Subject")
	}
	if (!ticket.message || ticket.message.length < 2) {
		errs.push("No Message")
	}
	if (ticket.app) {
		var id = ticket.app;
		try {
			id = mongoose.Types.ObjectId(id)
		} catch (e) {
			errs("Invalid App");
			return cb(errs);
		}
		
		models.Drone.findOne({
			_id: id,
			user: req.user._id
		}, function(err, drone) {
			if (err) throw err;
			
			if (!drone) {
				// Invalid app...
				errs.push("Invalid App");
			}
			
			cb(errs, drone._id);
		})
	} else {
		cb(errs)
	}
}

function getTicket (req, res, next) {
	var tid = req.params.tid;
	
	try {
		tid = mongoose.Types.ObjectId(tid);
	} catch (e) {
		res.format({
			json: function() {
				res.send(404, {});
			},
			html: function() {
				res.redirect('back')
			}
		});
		return;
	}
	
	models.Ticket.findById(tid).populate('user app messages.user').exec(function(err, ticket) {
		if (err) throw err;
		
		if (!ticket) {
			res.format({
				json: function() {
					res.send(404, {});
				},
				html: function() {
					res.redirect('back')
				}
			});
			return;
		}
		
		res.locals.ticket = ticket;
		next()
	})
}

function showTicket (req, res) {
	console.log(res.locals.ticket)
	res.send({
		ticket: res.locals.ticket
	})
}