var app = require('../../lib/app');
var request = require('supertest').agent(app.app)

var should = require('should')
	, models = require('ng-models')

describe('Authentication', function() {
	before(function () {
		models.User.remove({}, function(err) {
			if (err) throw err;
		});
	});

	describe('Login', function() {
		it('empty body', function (done) {
			request
				.post('/auth/password')
				.accept('json')
				.send({})
				.expect(400)
				.end(done)
		});
	});
})