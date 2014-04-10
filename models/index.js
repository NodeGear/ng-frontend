module.exports = {};

[
	'Analytic',
	'App',
	'AppDomain',
	'AppEnvironment',
	'AppEvent',
	'AppLog',
	'AppProcess',
	'EmailVerification',
	'ForgotNotification',
	'NetworkPerformanceRaw',
	'PaymentMethod',
	'PublicKey',
	'Server',
	'TFA',
	'Ticket',
	'Transaction',
	'Usage',
	'User'
].forEach(function(model) {
	module.exports[model] = require('./'+model);
});