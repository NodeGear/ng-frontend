var app = require('../../lib/app')
	, request = require('supertest').agent(app.app)
	, config = require('../../lib/config')
	, should = require('should')
	, models = require('ng-models')
	, async = require('async')
	, login = require('./fixtures/login');

if (!process.env.TEST) {
	console.log("\nNot in TEST environment. Please export TEST variable\n");
	process.exit(-1);
}

describe('Miscellaneous stuff', function() {
	before(function (done) {
		async.parallel([
			function (done) { login(request, done); },
			function (done) { models.Server.remove({}, done); }
		], done);
	});

	it('pings authenticated', function (done) {
		request
			.get('/ping')
			.expect('pong')
			.end(done);
	});

	it('gets servers', function (done) {
		request
			.get('/servers')
			.expect(200)
			.expect({
				status: 200,
				servers: []
			})
			.end(done)
	});

	it('logs out', function (done) {
		request
			.get('/logout')
			.expect(200)
			.end(done);
	});

	it('pings unauthenticated', function (done) {
		request
			.get('/ping')
			.expect('pong')
			.end(done);
	});
});
