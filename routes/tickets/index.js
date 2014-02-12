var mongoose = require('mongoose')
	, models = require('../../models')
	, config = require('../../config')
	, util = require('../../util')

exports.router = function (app) {
	app.get('/tickets', util.authorized, viewTickets)
		.get('/tickets/tickets', util.authorized, viewTicketsTemplate)
		.get('/tickets/ticket', util.authorized, viewTicketTemplate)
		.get('/tickets/:tid', util.authorized, getTicket, showTicket);
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
	})
}

function showTicket (req, res) {
	res.send({
		ticket: res.locals.ticket
	})
}