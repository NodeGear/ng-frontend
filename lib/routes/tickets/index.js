var mongoose = require('mongoose'),
	models = require('ng-models'),
	config = require('../../config'),
	util = require('../../util');

var ticket = require('./ticket');

exports.unauthorized = function (app, template) {
	// Unrestricted -- non-authorized people can access!
	template([
		['tickets', 'tickets/tickets'],
		['ticket', 'tickets/ticket'],
		'tickets/add'
	]);
};

exports.router = function (app) {
	app.get('/tickets', viewTickets)
		.post('/tickets/add', createTicket);

	ticket.router(app);
};

function viewTickets (req, res) {
	models.Ticket.find({
		user: req.user._id
	}).sort('-created').exec(function(err, tickets) {
		if (err) throw err;
		
		res.send({
			tickets: tickets
		});
	});
}

function createTicket (req, res) {
	var ticket = req.body.ticket;
	
	var errs = [];

	if (!ticket) {
		return createCallback(req, res, ticket, ['Invalid Request']);
	}
	
	if (!ticket.subject || ticket.subject.length < 2) {
		errs.push("No Subject");
	}
	if (!ticket.message || ticket.message.length < 2) {
		errs.push("No Message");
	}
	if (!ticket.message || ticket.message.length > 1024) {
		errs.push("Message Too Long");
	}

	if (ticket.app) {
		var id = ticket.app;
		try {
			id = mongoose.Types.ObjectId(id);
		} catch (e) {
			errs.push("Invalid App");
			return createCallback(req, res, ticket, errs);
		}
		
		models.App.findOne({
			_id: id,
			user: req.user._id
		}, function(err, app) {
			if (err) throw err;
			
			if (!app) {
				// Invalid app...
				errs.push("Invalid App");
			}
			
			createCallback(req, res, ticket, errs, app);
		});
	} else {
		createCallback(req, res, ticket, errs);
	}
}

function createCallback (req, res, ticket, errs, app) {
	if (errs.length > 0) {
		return res.status(400).send({
			errs: errs,
			message: errs.join(', ')
		});
	}

	var t = new models.Ticket({
		subject: ticket.subject,
		message: ticket.message,
		urgent: ticket.urgent,
		user: req.user._id
	});

	if (typeof app !== 'undefined') {
		t.app = app._id;
	}
	
	t.save();
	
	if (config.transport_enabled) {
		// Email agents
		var sub = "New Ticket From "+req.user.name+": "+ticket.subject;
		if (t.urgent) {
			sub = "[URGENT] "+sub;
		}

		var msg = ticket.message;
		msg = msg.replace("<", "&lt;")
			.replace(">", "&gt;")
			.replace("&", "&amp;")
			.replace('\n', '<br/>');

		config.transport.sendMail({
			from: "NodeGear Ticket Gateway <tickets@nodegear.com>",
			to: "Alan Campbell <alan.campbell@castawaylabs.com>, "+
				"Matej Kramny <matej@nodegear.com>",
			subject: sub,
			html: ''+
	'<p>Subject: <strong>"+ticket.subject+"</strong><br/>' +
	'Urgent: "+(t.urgent ? "Yes" : "No")+"<br/>' +
	'Related App: "+ t.app +"<br/>' +
	'Message: <pre>"+msg+"</pre><br/>' +
	'</p>' +
	'<a href=\"http://"+req.hostname+"/tickets/"+t._id+"\">' +
	'Reply Here</a><br/><br/>Best,<br/>NodeGear Ticket Gateway.'
		}, function(err, response) {
			console.log("Email sent.." + response.message);
		});
	}
	
	res.send({
		message: 'Created.',
		_id: t._id
	});
}