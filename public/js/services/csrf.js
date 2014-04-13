define([
	'angular',
	'app'
], function(angular, app) {
	app.service('csrf', function() {
		var self = this;

		self.csrf = $('meta[name=_csrf]').attr('content');

		return self;
	});
});