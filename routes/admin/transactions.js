var models = require('ng-models')

exports.map = [{
	url: '/transactions',
	call: 'getAll'
}, {
	url: '/transaction/:id',
	middleware: ['middleware'],
	children: [{
		url: '',
		call: 'get'
	}]
}];

exports.getAll = function (req, res) {
	var sort = '-created';
	if (req.query.sort) {
		sort = req.query.sort;
	}

	models.Transaction.find({}).sort(sort).populate('payment_method user').exec(function(err, transactions) {
		res.locals.transactions = transactions;
		
		res.render('admin/transaction/transactions')
	})
}

exports.middleware = function (req, res, next) {
	models.Transaction.findOne({
		_id: req.params.id
	}).populate('user payment_method').exec(function(err, transaction) {
		res.locals.transaction = transaction;

		next();
	})
}

exports.get = function (req, res) {
	res.render('admin/transaction/transaction')
}