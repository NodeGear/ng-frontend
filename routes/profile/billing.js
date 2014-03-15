var mongoose = require('mongoose')
	, models = require('../../models')
	, config = require('../../config')
	, util = require('../../util')
	, stripe = config.stripe
	, bugsnag = require('bugsnag')

exports.router = function (app) {
	app.get('/profile/billing', util.authorized, viewBilling)
		.get('/profile/billing/paymentMethods', util.authorized, viewPaymentMethods)
		.get('/profile/billing/history', util.authorized, viewHistory)
		.get('/profile/billing/credits', util.authorized, viewCredits)

		// Makes a payment..
		.post('/profile/billing/addCredits', util.authorized, createStripeCustomer, addCredits)

		.get('/profile/balance', util.authorized, getBalance)

		// Card API
		.get('/profile/cards', util.authorized, getCards)
		.post('/profile/card', util.authorized, createStripeCustomer, createCard)
		.put('/profile/card', util.authorized, createStripeCustomer, updateCard)
		.delete('/profile/card', util.authorized, deleteCard)
}

function viewPaymentMethods (req, res) {
	res.render('profile/paymentMethods');
}

function viewBilling (req, res) {
	res.render('profile/billing');
}

function viewHistory (req, res) {
	if (req.query.partial) {
		res.render('profile/history');
		return;
	}

	models.Transaction.find({
		user: req.user._id
	}).sort('-created').select('total type details status created card').exec(function(err, transactions) {
		if (err) throw err;

		// sort out cards..
		var ts = [];
		for (var i = 0; i < transactions.length; i++) {
			var t = transactions[i].toObject();

			if (!t.card) {
				t.card = "Unknown Card";

				ts.push(t);
				continue;
			}

			var found = false;
			for (var c = 0; c < req.user.stripe_cards.length; c++) {
				if (req.user.stripe_cards[c]._id.equals(t.card)) {
					t.card = req.user.stripe_cards[c].name + ' XXXX'+req.user.stripe_cards[c].last4;
					if (t.default) {
						t.card = '(Default) ' + t.card;
					}

					found = true;
					break;
				}
			}

			if (!found) {
				t.card = "Deleted Card";
			}

			ts.push(t);
		}

		res.send({
			status: 200,
			transactions: ts
		});
	})
}

function getBalance (req, res) {
	res.send({
		status: 200,
		balance: req.user.balance
	})
}

function viewCredits (req, res) {
	res.render('profile/credits');
}

function addCredits (req, res) {
	var card = req.body.card;

	try {
		card = mongoose.Types.ObjectId(card);
	} catch (e) {
		res.send({
			status: 400,
			message: "Invalid Card Selected"
		});

		return;
	}

	var value = parseInt(req.body.value);
	if (!(value == 5 || value == 10 || value == 25 || value == 50 || value == 100) || isNaN(value)) {
		res.send({
			status: 400,
			message: "Invalid Payment Value"
		});
		return;
	}

	// Find the real card.
	var found = false;
	for (var i = 0; i < req.user.stripe_cards.length; i++) {
		if (req.user.stripe_cards[i]._id.equals(card)) {
			card = req.user.stripe_cards[i];
			found = true;
			break;
		}
	}
	if (!found) {
		res.send({
			status: 400,
			message: "Card Not Found"
		});
		return;
	}

	var transaction = new models.Transaction({
		user: req.user._id,
		total: value,
		details: "Adding Credits £"+value,
		type: 'manual',
		card: card._id
	});

	stripe.charges.create({
		customer: req.user.stripe_customer,
		card: card.id,
		description: transaction.details,
		amount: transaction.total * 100,
		currency: "GBP",
	}, function(err, charge) {
		if (err) {
			console.log(err);
			
			transaction.status = 'failed';
			transaction.message = err.toString();
			transaction.save();

			var message = "";
			switch (err.type) {
				case 'StripeCardError':
					// A declined card error
					message = err.message; // => e.g. "Your card's expiration year is invalid."
					break;
				case 'StripeInvalidRequestError':
				case 'StripeAPIError':
				case 'StripeConnectionError':
				case 'StripeAuthenticationError':
				default:
					message = "Server Error. We have been notified, and are working on it. Please try again later.";
					bugsnag.notify(new Error("Card Processing Error: "+err.type), {
						error: err,
						user: req.user._id
					})
			}
			
			res.send({
				status: 400,
				message: message
			});
			
			return;
		}
		
		console.log(charge);
		
		transaction.payment_id = charge.id;
		transaction.status = 'complete';
		transaction.save();
		
		res.send({
			status: 200,
			message: "Thanks for your payment! A confirmation email was sent to "+req.user.email
		});

		// TODO Send confirmation email

		// Does this in case a race condition happens and balance is updated [somewhere]..
		models.User.findById(req.user._id, function(err, user) {
			transaction.old_balance = user.balance;
			user.balance += value;
			transaction.new_balance = user.balance;
			transaction.save();

			user.save();
		})
	});
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
	if (!req.body.card_id || !req.body.name || typeof req.body.default === 'undefined' || req.body.default == null) {
		res.send({
			status: 400,
			message: "Missing Parameters"
		});
		return;
	}

	stripe.customers.createCard(req.user.stripe_customer, {
		card: req.body.card_id
	}, function(err, card) {
		if (err) {
			console.log(err);
			
			var message = "";
			switch (err.type) {
				case 'StripeCardError':
					// A declined card error
					message = err.message; // => e.g. "Your card's expiration year is invalid."
					break;
				case 'StripeInvalidRequestError':
				case 'StripeAPIError':
				case 'StripeConnectionError':
				case 'StripeAuthenticationError':
				default:
					message = "Server Error. We have been notified, and are working on it. Please try again later.";
					bugsnag.notify(new Error("Card Processing Error: "+err.type), {
						error: err,
						user: req.user._id
					})
			}
			
			res.send({
				status: 400,
				message: message
			});
			return;
		}
		
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
		if (err) {
			console.log(err);
			
			var message = "";
			switch (err.type) {
				case 'StripeCardError':
					// A declined card error
					message = err.message; // => e.g. "Your card's expiration year is invalid."
					break;
				case 'StripeInvalidRequestError':
				case 'StripeAPIError':
				case 'StripeConnectionError':
				case 'StripeAuthenticationError':
				default:
					message = "Server Error. We have been notified, and are working on it. Please try again later.";
					bugsnag.notify(new Error("Card Processing Error: "+err.type), {
						error: err,
						user: req.user._id
					})
			}
			
			res.send({
				status: 400,
				message: message
			});
			return;
		}
		
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