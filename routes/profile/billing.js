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

		.get('/profile/billing/transaction', util.authorized, getTransactionView)
		.get('/profile/billing/transaction/:tid', util.authorized, getTransaction)

		// Makes a payment..
		.post('/profile/billing/addCredits', util.authorized, createStripeCustomer, getUserCard, addCredits)

		.get('/profile/balance', util.authorized, getBalance)

		// Card API
		.get('/profile/cards', util.authorized, getUserCards, getCards)
		.post('/profile/card', util.authorized, createStripeCustomer, getUserCards, createCard)
		.put('/profile/card', util.authorized, createStripeCustomer, getUserCard, updateCard)
		.delete('/profile/card', util.authorized, getUserCard, deleteCard)
}

function getUserCards (req, res, next) {
	models.PaymentMethod.find({
		user: req.user._id,
		disabled: false,
	}, function(err, paymentMethods) {
		if (err) throw err;

		var ps = [];
		for (var i = 0; i < paymentMethods.length; i++) {
			var p = paymentMethods[i].toObject();

			if (req.user.default_payment_method && req.user.default_payment_method.equals(p._id)) {
				p.default = true;
			} else {
				p.default = false;
			}

			ps.push(p)
		};

		res.locals.paymentMethods = ps;

		next();
	})
}

function getUserCard (req, res, next) {
	var card = req.body.card;

	try {
		card = mongoose.Types.ObjectId(card);
	} catch (e) {
		res.send({
			status: 400,
			message: "Invalid Card"
		});

		return;
	}

	// Find the real card.
	models.PaymentMethod.findOne({
		_id: card,
		disabled: false
	}, function(err, card) {
		if (err) throw err;

		if (!card) {
			res.send({
				status: 400,
				message: "Card Not Found"
			});
			return;
		}

		res.locals.card = card;
		next();
	})
}

function getTransaction (req, res) {
	var tid = req.params.tid;

	try {
		tid = mongoose.Types.ObjectId(tid);
	} catch (e) {
		res.send({
			status: 404,
			transaction: null
		});
		return;
	}


	models.Transaction.findOne({
		_id: tid
	}).select('created details total status type old_balance new_balance charges payment_method')
		.populate('payment_method').exec(function(err, transaction) {
			if (err) throw err;

			res.send({
				status: 200,
				transaction: transaction
			});
	})
}

function getTransactionView (req, res) {
	res.render('profile/transaction')
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
	}).select('created details total status type old_balance new_balance payment_method').sort('-created').populate('payment_method').exec(function(err, transactions) {
		if (err) throw err;

		var ts = [];
		for (var i = 0; i < transactions.length; i++) {
			var t = transactions[i].toObject();
			var card = t.payment_method;
			delete t.payment_method;
			
			if (!card) {
				t.card = "Deleted Card";
			} else {
				t.card = card.name + ' XXXX'+card.last4;
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
	var card = res.locals.card;

	var value = parseInt(req.body.value);
	if (!(value == 5 || value == 10 || value == 25 || value == 50 || value == 100) || isNaN(value)) {
		res.send({
			status: 400,
			message: "Invalid Payment Value"
		});
		return;
	}

	var transaction = new models.Transaction({
		charges: [{
			is_app: false,
			name: "Credit £"+value,
			description: "Adding Credits to Account",
			total: value
		}],
		user: req.user._id,
		paid: false,
		total: value,
		payment_method: card._id,
		status: 'created',
		details: "Manual Transaction",
		type: 'manual',
		old_balance: req.user.balance,
		new_balance: req.user.balance,
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

			transaction.paid = false;
			transaction.status = 'failed';
			transaction.details = message;
			transaction.save();

			// Todo email customer

			res.send({
				status: 400,
				message: message
			});
			
			return;
		}

		transaction.paid = true;
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
		cards: res.locals.paymentMethods
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

		var paymentMethod = new models.PaymentMethod({
			type: 'card',
			id: card.id,
			name: req.body.name,
			cardholder: card.name,
			last4: card.last4,
			disabled: false,
			user: req.user._id
		});
		paymentMethod.save();

		if (req.body.default == true) {
			req.user.default_payment_method = paymentMethod._id;
			req.user.save()
		}

		res.send({
			status: 200
		});
	})
}

function updateCard (req, res) {
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
	
	var card = res.locals.card;

	stripe.customers.updateCard(req.user.stripe_customer, card.id, {
		name: req.body.cardholder
	}, function(err, _card) {
		if (err) {
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
		if (req.user.default_payment_method && req.user.default_payment_method.equals(card._id) && req.body.default == false) {
			// is default but user doesn't want it default
			req.user.default_payment_method = null;
		}

		if (req.body.default == true) {
			req.user.default_payment_method = card._id;
		}
		
		card.save();
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
			card.disabled = true;

			if (card.default && req.user.stripe_cards.length > 1) {
				var ii = 0;
				if (i = 0) ii = 1;

				// New default card
				req.user.stripe_cards[ii].default = true;
			}

			card.default = false;
			// disable the card
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
	
	// Delete stripe card
	stripe.customers.deleteCard(req.user.stripe_customer, card.id, function(err, confirm) {
		if (err) {
			bugsnag.notify(err);

			res.send({
				status: 500,
				message: "Cannot Delete Card due to Server Error"
			});

			return;
		}
		
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