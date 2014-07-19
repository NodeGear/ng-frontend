exports.router = function (app) {
	app.get('/tickets/:tid', getTicket, showTicket)
		.put('/tickets/:tid', getTicket, updateTicket)
		.get('/tickets/:tid/close', closeTicket)
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
	res.send({
		ticket: res.locals.ticket
	})
}

function updateTicket (req, res) {
	if (!req.body.message || req.body.message.length < 2) {
		res.send({
			status: 400,
			message: "Reply invalid"
		});
		return;
	}
	
	var ticket = res.locals.ticket;
	ticket.messages.push({
		user: req.user._id,
		message: req.body.message
	})
	ticket.save();
	
	// Email agents
	var sub = "Ticket Update From "+req.user.name+": "+ticket.subject;
	if (ticket.urgent) {
		sub = "[URGENT] "+sub;
	}
	var msg = ticket.message;
	for (var i = 0; i < ticket.messages.length; i++) {
		msg += "\n\n---> New Message\n";
		msg += "Created "+ticket.messages[i].created+"\n";
		msg += "Sent by: "+ticket.messages[i].user.name+"\n";
		msg += "Message: "+ticket.messages[i].message;
	}
	
	msg = msg.replace("<", "&lt;").replace(">", "&gt;").replace("&", "&amp;").replace('\n', '<br/>');
	config.transport.sendMail({
		from: "NodeGear Ticket Gateway <tickets@eventmost.com>",
		to: "Alan Campbell <alan.campbell@castawaylabs.com>, Matej Kramny <ng@matej.me>",
		subject: sub,
		html: "\
<p>Subject: <strong>"+ticket.subject+"</strong><br/>\
Urgent: "+(ticket.urgent ? "Yes" : "No")+"<br/>\
Related App: "+ ticket.app +"<br/>\
Message: <pre>"+msg+"</pre><br/>\
</p>\
<a href=\"http://"+req.hostname+"/tickets/"+ticket._id+"\">Reply Here</a><br/><br/>Best,<br/>NodeGear Ticket Gateway."
	}, function(err, response) {
		if (err) throw err;
	
		console.log("Email sent.."+response.message)
	})
	
	res.send({
		status: 200
	})
}

function closeTicket (req, res) {
	
}