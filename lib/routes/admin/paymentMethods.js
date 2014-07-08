var models = require('ng-models')

exports.map = [{
	url: '/paymentMethods',
	call: getPaymentMethods
}, {
	url: '/paymentMethod/:payment_method',
	params: {
		payment_method: getPM
	},
	children: [{
		url: '',
		call: viewPM
	}]
}]

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

function getPM (req, res, next, id) {
	models.PaymentMethod.findOne({
		_id: id
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