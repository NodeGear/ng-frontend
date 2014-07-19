var mongoose = require('mongoose')
	, models = require('ng-models')
	, config = require('../../config')
	, util = require('../../util');

var ticket = require('./ticket');

exports.unauthorized = function (app, template) {
	// Unrestricted -- non-authorized people can access!
	template([
		['tickets', 'tickets/tickets'],
		['ticket', 'tickets/ticket'],
		'tickets/add'
	])
}

exports.router = function (app) {
	app.get('/tickets', viewTickets)
		.post('/tickets/add', createTicket)
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
		
		// Email agents
		var sub = "New Ticket From "+req.user.name+": "+ticket.subject;
		if (t.urgent) {
			sub = "[URGENT] "+sub;
		}
		var msg = ticket.message;
		msg = msg.replace("<", "&lt;").replace(">", "&gt;").replace("&", "&amp;").replace('\n', '<br/>');
		config.transport.sendMail({
			from: "NodeGear Ticket Gateway <tickets@eventmost.com>",
			to: "Alan Campbell <alan.campbell@castawaylabs.com>, Matej Kramny <ng@matej.me>",
			subject: sub,
			html: "\
	<p>Subject: <strong>"+ticket.subject+"</strong><br/>\
	Urgent: "+(t.urgent ? "Yes" : "No")+"<br/>\
	Related App: "+ t.app +"<br/>\
	Message: <pre>"+msg+"</pre><br/>\
	</p>\
	<a href=\"http://"+req.hostname+"/tickets/"+t._id+"\">Reply Here</a><br/><br/>Best,<br/>NodeGear Ticket Gateway."
		}, function(err, response) {
			if (err) throw err;
		
			console.log("Email sent.."+response.message)
		})
		
		res.send({
			status: errs.length > 0 ? 400 : 200,
			message: errs.length > 0 ? errs.join(', ') : 'Created.',
			_id: t._id
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
		
		models.App.findOne({
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