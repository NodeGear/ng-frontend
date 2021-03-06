'use strict';

var mongoose = require('mongoose'),
	models = require('ng-models'),
	config = require('../../config'),
	stripe = config.stripe,
	bugsnag = require('bugsnag');

exports.unauthorized = function (template) {
	template('profile/billing');

	template([
		['history', 'profile/history'],
		['transaction', 'profile/transaction'],
		['credits', 'profile/credits'],
		['paymentMethods', 'profile/paymentMethods'],
		['paymentMethod', 'profile/paymentMethod'],
		['usage', 'profile/usage']
	], {
		prefix: 'profile/billing'
	});
};

exports.router = function (app) {
	app.get('/profile/billing/history', viewHistory)

		.get('/profile/billing/transaction/:tid', getTransaction)

		// Makes a payment..
		.post('/profile/billing/addCredits', createStripeCustomer, getUserCard,
			addCredits)

		.get('/profile/balance', getBalance)

		.get('/profile/billing/usage', getRecentUsage)

		// Card API
		.get('/profile/cards', getUserCards, getCards)
		.get('/profile/card/:card', getUserCard, getCard)
		.post('/profile/card', createStripeCustomer, getUserCards, createCard)
		.put('/profile/card', createStripeCustomer, getUserCard, updateCard)
		.delete('/profile/card', createStripeCustomer, getUserCard, deleteCard);
};

function getUserCards (req, res, next) {
	models.PaymentMethod.find({
		user: req.user._id,
		disabled: false,
	}, function(err, paymentMethods) {
		if (err) throw err;

		var ps = [];
		for (var i = 0; i < paymentMethods.length; i++) {
			var p = paymentMethods[i].toObject();

			if (req.user.default_payment_method &&
				req.user.default_payment_method.equals(p._id)) {
				p.default = true;
			} else {
				p.default = false;
			}

			ps.push(p);
		}

		res.locals.paymentMethods = ps;

		next();
	});
}

function getUserCard (req, res, next) {
	var card = req.body.card;
	if (!card) {
		card = req.params.card;
	}
	if (!card) {
		card = req.query._id;
	}

	try {
		card = mongoose.Types.ObjectId(card);
	} catch (e) {
		res.send({
			status: 400,
			message: 'Invalid Card'
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
				message: 'Card Not Found'
			});
			return;
		}

		res.locals.card = card;
		next();
	});
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
	}).select('created details total status type old_balance ' +
		'new_balance charges payment_method')
	.populate('payment_method').exec(function(err, transaction) {
		if (err) throw err;

		res.send({
			status: 200,
			transaction: transaction
		});
	});
}

function viewHistory (req, res) {
	models.Transaction.find({
		user: req.user._id
	}).select('created details total status type old_balance ' +
		'new_balance payment_method')
	.sort('-created')
	.populate('payment_method')
	.exec(function (err, transactions) {
		if (err) throw err;

		var ts = [];
		for (var i = 0; i < transactions.length; i++) {
			var t = transactions[i].toObject();
			var card = t.payment_method;
			delete t.payment_method;
			
			if (!card) {
				t.card = 'Deleted Card';
			} else {
				t.card = card.name + ' XXXX'+card.last4;
			}

			ts.push(t);
		}

		res.send({
			status: 200,
			transactions: ts
		});
	});
}

function getBalance (req, res) {
	// Get up to date usage..
	models.AppProcessUptime.find({
		paid: false,
		user: req.user._id
	}, function(err, usages) {
		if (err) throw err;

		var usage = 0;
		for (var i = 0; i < usages.length; i++) {
			var minutes = usages[i].minutes;
			if (!minutes && !usages[i].end) {
				minutes = (Date.now() - usages[i].start) / 1000 / 60;
			}

			var hours = minutes / 60;

			usage += (usages[i].price_per_hour * hours);
		}

		// Just rounding..
		usage = (Math.round(usage * 100) / 100).toFixed(2);
		var balance = (Math.round(req.user.balance * 100) / 100).toFixed(2);

		res.send({
			status: 200,
			balance: balance,
			usage: usage
		});
	});
}

function getRecentUsage (req, res) {
	models.AppProcessUptime.find({
		user: req.user._id
	})
	.populate('app process server')
	.sort('-created')
	.limit(10)
	.exec(function (err, usages) {
		if (err) throw err;

		res.send({
			status: 200,
			usages: usages
		});
	});
}

function addCredits (req, res) {
	var card = res.locals.card;

	var value = parseInt(req.body.value);
	if (!(value == 5 || value == 10 || value == 25 || value == 50 ||
		value == 100) || isNaN(value)) {
		res.send({
			status: 400,
			message: 'Invalid Payment Value'
		});
		return;
	}

	var transaction = new models.Transaction({
		charges: [{
			is_app: false,
			name: 'Credit $'+value,
			description: 'Adding Credits to Account',
			total: value
		}],
		user: req.user._id,
		paid: false,
		total: value,
		payment_method: card._id,
		status: 'created',
		details: 'Manual Transaction',
		type: 'manual',
		old_balance: req.user.balance,
		new_balance: req.user.balance,
	});

	stripe.charges.create({
		customer: req.user.stripe_customer,
		card: card.id,
		description: transaction.details,
		amount: transaction.total * 100,
		currency: config.currency,
	}, function(err, charge) {
		if (err) {
			var message = '';
			switch (err.type) {
				case 'StripeCardError':
					// A declined card error
					// => e.g. "Your card's expiration year is invalid."
					message = err.message;
					break;
				case 'StripeInvalidRequestError':
				case 'StripeAPIError':
				case 'StripeConnectionError':
				case 'StripeAuthenticationError':
				//default:
					message = 'Server Error. We have been notified, '+
						'and are working on it. Please try again later.';
					bugsnag.notify(new Error('Card Processing Error: ' + err.type), {
						error: err,
						user: req.user._id
					});
			}

			transaction.paid = false;
			transaction.status = 'failed';
			transaction.details = message;
			transaction.save();

			req.user.sendEmail('NodeGear Payment Gateway <payments@nodegear.com>',
				'Payment Failed', 'emails/billing/failed.jade', {
				user: req.user,
				transaction: transaction
			});

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
			message: 'Thanks for your payment! A confirmation email '+
				'was sent to '+req.user.email
		});

		req.user.sendEmail('NodeGear Payment Gateway <payments@nodegear.com>',
			'Payment Confirmation', 'emails/billing/confirm.jade', {
			user: req.user,
			transaction: transaction
		});

		// Does this in case a race condition happens
		// and balance is updated [somewhere]..
		models.User.findById(req.user._id, function (err, user) {
			transaction.old_balance = user.balance;
			user.balance += value;
			transaction.new_balance = user.balance;
			transaction.save();

			if (user.appLimit == 1) {
				// Raise to 10
				user.appLimit = 10;
			}
			
			user.save();
		});
	});
}

function getCards (req, res) {
	res.send({
		status: 200,
		cards: res.locals.paymentMethods
	});
}

function getCard (req, res) {
	var card = res.locals.card.toObject();

	if (req.user.default_payment_method &&
		req.user.default_payment_method.equals(card._id)) {
		card.default = true;
	} else {
		card.default = false;
	}

	res.send({
		status: 200,
		paymentMethod: card
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

		req.user.save();
		
		next();
	});
}

function createCard (req, res) {
	if (!req.body.card_id || !req.body.name ||
		typeof req.body.default === 'undefined' || req.body.default === null) {
		res.send({
			status: 400,
			message: 'Missing Parameters'
		});
		return;
	}

	stripe.customers.createCard(req.user.stripe_customer, {
		card: req.body.card_id
	}, function(err, card) {
		if (err) {
			var message = '';
			switch (err.type) {
				case 'StripeCardError':
					// A declined card error
					// => e.g. "Your card's expiration year is invalid."
					message = err.message;
					break;
				case 'StripeInvalidRequestError':
				case 'StripeAPIError':
				case 'StripeConnectionError':
				case 'StripeAuthenticationError':
				//default:
					message = 'Server Error. We have been notified, ' +
						'and are working on it. Please try again later.';
					bugsnag.notify(new Error('Card Processing Error: ' + err.type), {
						error: err,
						user: req.user._id
					});
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

		if (req.body.default === true) {
			req.user.default_payment_method = paymentMethod._id;
			req.user.save();
		}

		req.user.sendEmail('NodeGear Billing Dept. <billing@nodegear.com>',
			'Payment Method Added', 'emails/billing/addedPaymentMethod.jade', {
			user: req.user,
			paymentMethod: paymentMethod
		});

		res.send({
			status: 200
		});
	});
}

function updateCard (req, res) {
	if (!req.body.name || req.body.name.length === 0) {
		res.send({
			status: 400,
			message: 'Card Name is Invalid'
		});
		return;
	}
	if (!req.body.cardholder || req.body.cardholder.length === 0) {
		res.send({
			status: 400,
			message: 'Cardholder is Invalid'
		});
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
			var message = '';
			switch (err.type) {
				case 'StripeCardError':
					// A declined card error
					// => e.g. "Your card's expiration year is invalid."
					message = err.message;
					break;
				case 'StripeInvalidRequestError':
				case 'StripeAPIError':
				case 'StripeConnectionError':
				case 'StripeAuthenticationError':
				//default:
					message = 'Server Error. We have been notified, '+
						'and are working on it. Please try again later.';
					bugsnag.notify(new Error('Card Processing Error: ' + err.type), {
						error: err,
						user: req.user._id
					});
			}
			
			res.send({
				status: 400,
				message: message
			});
			return;
		}
		
		card.name = req.body.name;
		card.cardholder = req.body.cardholder;
		if (req.user.default_payment_method &&
			req.user.default_payment_method.equals(card._id) &&
			req.body.default === false) {
			// is default but user doesn't want it default
			req.user.default_payment_method = null;
		}

		if (req.body.default === true) {
			req.user.default_payment_method = card._id;
		}
		
		card.save();
		req.user.save();
		
		res.send({
			status: 200
		});
	});
}

function deleteCard (req, res) {
	var card = res.locals.card;
	card.disabled = true;

	// Delete stripe card
	stripe.customers.deleteCard(req.user.stripe_customer, card.id,
		function (err, confirm) {
		if (err) {
			bugsnag.notify(err);

			res.send({
				status: 500,
				message: 'Cannot Delete Card due to Server Error'
			});

			return;
		}
		
		if (confirm.deleted) {
			card.save();
			req.user.save();
	
			res.send({
				status: 200
			});
		} else {
			res.send({
				status: 500,
				message: 'Card failed to Delete'
			});
		}
	});
}