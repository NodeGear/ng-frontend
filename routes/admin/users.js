var models = require('ng-models')

exports.router = function (app) {
	app.get('/admin/users', getUsers)
		.get('/admin/user/:id', getUser, showUser)
		.get('/admin/user/:id/edit', getUser, editUser)
		.post('/admin/user/:id/edit', getUser, doEditUser)
}

function getUsers (req, res) {
	var sort = '-created';
	if (req.query.sort) {
		sort = req.query.sort;
	}

	models.User.find({}).sort(sort).exec(function(err, users) {
		res.locals.users = users;
		
		res.render('admin/user/users')
	})
}

function getUser (req, res, next) {
	models.User.findById(req.params.id, function(err, user) {
		res.locals.aUser = user;
		next();
	});
}

function showUser (req, res) {
	res.render('admin/user/user')
}

function editUser (req, res) {
	res.render('admin/user/edit')
}

function doEditUser (req, res) {
	var u = res.locals.aUser;

	u.name = req.body.name;
	u.username = req.body.username;
	u.email = req.body.email;

	if (req.body.password && req.body.password.length > 0) {
		u.setPassword(req.body.password);
	}
	
	if (u.tfa_enabled && !req.body.tfa_enabled) {
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
				details: "Admin "+req.user._id+" changed your balance",
				type: 'manual',
				old_balance: u.balance,
				new_balance: balance
			});
			transaction.save();

			u.balance = balance;
		}
	}

	u.stripe_customer = req.body.stripe_customer;

	u.save();

	res.redirect('/admin/user/'+u._id);
}