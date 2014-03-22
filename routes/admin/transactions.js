var models = require('../../models')

exports.router = function (app) {
	app.get('/admin/transactions', getTransactions)
		.get('/admin/transaction/:id', getTransaction, viewTransaction)
}

function getTransactions (req, res) {
	var sort = '-created';
	if (req.query.sort) {
		sort = req.query.sort;
	}

	models.Transaction.find({}).sort(sort).populate('payment_method user').exec(function(err, transactions) {
		res.locals.transactions = transactions;
		
		res.render('admin/transaction/transactions')
	})
}

function getTransaction (req, res, next) {
	models.Transaction.findOne({
		_id: req.params.id
	}).populate('user payment_method').exec(function(err, transaction) {
		res.locals.transaction = transaction;

		next();
	})
}

function viewTransaction (req, res) {
	res.render('admin/transaction/transaction')
}