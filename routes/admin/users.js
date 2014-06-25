var models = require('ng-models')

exports.router = function (app) {
	app.get('/admin/users', getUsers)
		.get('/admin/user/:id', getUser, showUser)
		.get('/admin/user/:id/edit', getUser, editUser)
		.put('/admin/user/:id', getUser, doEditUser)
}

function getUsers (req, res) {
	res.format({
		html: function () {
			res.render('admin/user/users')
		},
		json: function () {
			var sort = '-created';
			var limit = 20;
			var offset = 0;

			if (req.query.sorting) {
				sort = "";
				for (var s in req.query.sorting) {
					var desc = false;
					if (req.query.sorting[s] == 'desc') {
						desc = true;
					}

					sort += (desc ? '-' : '') + s + ' ';
				}
			}
			if (req.query.limit) {
				limit = parseInt(req.query.limit);
			}
			if (req.query.offset) {
				offset = parseInt(req.query.offset);
			}

			var query = {};
			if (req.query.filter) {
				query = req.query.filter;
				for (var q in query) {
					if (!isNaN(parseInt(query[q]))) {
						query[q] = parseInt(query[q]);
					} else {
						query[q] = new RegExp(query[q], 'gi');
					}
				}
			}

			models.User.find(query)
			.sort(sort)
			.limit(limit)
			.skip(offset)
			.lean()
			.exec(function(err, users) {
				if (err) throw err;

				for (var i = 0; i < users.length; i++) {
					var d = new Date(users[i].created);
					users[i].created = d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear() + ' ' + d.getHours() + ':' + d.getMinutes();
				}

				models.User.count({}, function(err, total) {
					res.send(200, {
						total: total,
						users: users
					})
				})
			})
		}
	})
}

function getUser (req, res, next) {
	models.User.findById(req.params.id, function(err, user) {
		res.locals.aUser = user;
		next();
	});
}

function showUser (req, res) {
	res.format({
		html: function () {
			res.render('admin/user/user')
		},
		json: function () {
			var u = res.locals.aUser.toObject();
			delete u.password;
			res.send(200, {
				user: u
			})
		}
	})
}

function editUser (req, res) {
	res.render('admin/user/edit')
}

function doEditUser (req, res) {
	var u = res.locals.aUser;
	var _u = req.body.user;

	u.name = _u.name;
	u.username = _u.username;
	u.usernameLowercase = _u.username.toLowerCase();
	u.email = _u.email;
	u.email_verified = _u.email_verified;
	u.stripe_customer = _u.stripe_customer;
	u.admin = _u.admin;
	u.disabled = _u.disabled;
	u.updatePassword = _u.updatePassword;

	if (u.tfa_enabled && !_u.tfa_enabled) {
		// is disabling TFA
		u.tfa_enabled = false;
		models.TFA.remove({
			_id: u.tfa
		}, function(err) {
			if (err) throw err;
		});
	}

	var balance = parseFloat(req.body.balance);
	if (!(balance < 0 || isNaN(balance))) {
		if (u.balance != balance) {
			// make a transaction
			var is_credit = u.balance < balance;
			var transaction = new models.Transaction({
				charges: [{
					is_app: false,
					name: "Admin "+ (is_credit ? "credit" : "debit"),
					description: "Account balance changed",
					total: balance - u.balance,
					has_hours: false
				}],
				paid: false,
				total: balance - u.balance,
				user: u._id,
				payment_method: null,
				status: 'complete',
				details: "Admin "+req.user._id+" ("+req.user.name+") changed your balance",
				type: 'manual',
				old_balance: u.balance,
				new_balance: balance
			});
			transaction.save();

			u.balance = balance;
		}
	}

	if (_u.password && _u.password.length > 0) {
		models.User.hashPassword(_u.password, function(hash) {
			u.password = hash;
			u.is_new_pwd = true;

			u.save();
		});
	} else {
		u.save();
	}

	res.send(200, {})
}