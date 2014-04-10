var models = require('ng-models')

exports.router = function (app) {
	app.get('/admin/paymentMethods', getPaymentMethods)
		.get('/admin/paymentMethod/:id', getPM, viewPM)
}

function getPaymentMethods (req, res) {
	var sort = '-created';
	if (req.query.sort) {
		sort = req.query.sort;
	}

	models.PaymentMethod.find({}).sort(sort).populate('user').exec(function(err, paymentMethods) {
		res.locals.paymentMethods = paymentMethods;
		
		res.render('admin/paymentMethod/viewAll');
	})
}

function getPM (req, res, next) {
	models.PaymentMethod.findOne({
		_id: req.params.id
	}).populate('user').exec(function(err, paymentMethod) {
		if (err) throw err;

		if (!paymentMethod) {
			return res.redirect('back');
		}

		res.locals.paymentMethod = paymentMethod;

		next();
	})
}

function viewPM (req, res) {
	res.render('admin/paymentMethod/viewSingle');
}