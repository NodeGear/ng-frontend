var mongoose = require('mongoose')
	, models = require('../../models')
	, config = require('../../config')
	, util = require('../../util')
	, stripe = config.stripe

exports.router = function (app) {
	app.get('/profile/billing', util.authorized, viewBilling)
		.get('/profile/paymentMethods', util.authorized, viewPaymentMethods)
		.get('/profile/cards', util.authorized, getCards)
		.post('/profile/card', util.authorized, createStripeCustomer, createCard)
		.put('/profile/card', util.authorized, updateCard)
		.delete('/profile/card', util.authorized, deleteCard)
}


function viewPaymentMethods (req, res) {
	res.render('profile/paymentMethods');
}

function viewBilling (req, res) {
	res.render('profile/billing');
}

function getCards (req, res) {
	res.send({
		status: 200,
		cards: req.user.stripe_cards
	});
}

function createStripeCustomer (req, res, next) {
	if (req.user.stripe_customer && req.user.stripe_customer.length > 0) {
		return next();
	}
	
	stripe.customers.create({
		email: req.user.email,
		metadata: {
			id: req.user._id,
			name: req.user.name
		}
	}, function(err, customer) {
		if (err) throw err;
		
		req.user.stripe_customer = customer.id;
		console.log(customer)
		req.user.save();
		
		next()
	})
}

function createCard (req, res) {
	//TODO Validate
	
	stripe.customers.createCard(req.user.stripe_customer, {
		card: req.body.card_id
	}, function(err, card) {
		if (err) throw err;
		
		if (req.body.default == true) {
			for (var i = 0; i < req.user.stripe_cards.length; i++) {
				req.user.stripe_cards[i].default = false;
			}
		}
		
		req.user.stripe_cards.push({
			id: card.id,
			last4: card.last4,
			cardholder: card.name,
			default: req.body.default == true,
			name: req.body.name
		});
		req.user.save();
		
		res.send({
			status: 200
		})
	})
}

function updateCard (req, res) {
	var id = req.body._id;
	try {
		id = mongoose.Types.ObjectId(id);
	} catch (e) {
		// error.
		res.send({
			status: 400,
			message: "Invalid Card"
		});
		return;
	}
	
	var card = null;
	for (var i = 0; i < req.user.stripe_cards.length; i++) {
		if (req.user.stripe_cards[i]._id.equals(id)) {
			card = req.user.stripe_cards[i];
			break;
		}
	}
	
	if (!card) {
		res.send({
			status: 400,
			message: "Card Not Found"
		})
		return;
	}
	
	if (!req.body.name || req.body.name.length == 0) {
		res.send({
			status: 400,
			message: "Card Name is Invalid"
		})
		return;
	}
	if (!req.body.cardholder || req.body.cardholder.length == 0) {
		res.send({
			status: 400,
			message: "Cardholder is Invalid"
		})
		return;
	}
	
	if (!req.body.default) {
		req.body.default = false;
	}
	
	stripe.customers.updateCard(req.user.stripe_customer, card.id, {
		name: req.body.cardholder
	}, function(err, _card) {
		if (err) throw err;
		
		card.name = req.body.name;
		card.cardholder = req.body.cardholder;
		if (req.body.default == true) {
			for (var i = 0; i < req.user.stripe_cards.length; i++) {
				req.user.stripe_cards[i].default = false;
			}
		}
		
		card.default = req.body.default;
		
		req.user.save();
		
		res.send({
			status: 200
		})
	})
}

function deleteCard (req, res) {
	var id = req.query._id;
	try {
		id = mongoose.Types.ObjectId(id);
	} catch (e) {
		// error.
		res.send({
			status: 400,
			message: "Invalid Card"
		});
		return;
	}
	
	var card = null;
	for (var i = 0; i < req.user.stripe_cards.length; i++) {
		if (req.user.stripe_cards[i]._id.equals(id)) {
			card = req.user.stripe_cards[i];
			req.user.stripe_cards.splice(i, 1);
			// remove the card
			break;
		}
	}
	
	if (!card) {
		res.send({
			status: 400,
			message: "Card Not Found"
		})
		return;
	}
	
	stripe.customers.deleteCard(req.user.stripe_customer, card.id, function(err, confirm) {
		if (err) throw err;
		
		if (confirm.deleted) {
			req.user.save();
	
			res.send({
				status: 200
			});
		} else {
			res.send({
				status: 500,
				message: "Card failed to Delete"
			})
		}
	})
}