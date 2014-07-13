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
		describe('fails malformed reqs', function () {
			it('an empty body', function (done) {
				request
					.post('/auth/password')
					.accept('json')
					.send({})
					.expect(400)
					.end(done);
			});
			it('a malformed req', function (done) {
				request
					.post('/auth/password')
					.accept('json')
					.expect(400)
					.end(done);
			});

			it('is not an email', function (done) {
				request
					.post('/auth/password')
					.accept('json')
					.send({
						auth: 'ab',
						password: 'hello'
					})
					.expect(400);
			});
		})

		it('should not login', function(done) {
			request
				.post('/auth/password')
				.accept('json')
				.send({
					email: 'hello@nodegear.com',
					password: 'test-test'
				})
				.expect(400)
				.end(done);
		});

		it('should register', function(done) {
			// Remove all previous users
			models.User.remove({
				email: 'hello@nodegear.com'
			}, {
				multi: true
			}, function (err) {
				if (err) throw err;

				// Register user
				request
					.post('/auth/register')
					.accept('json')
					.send({
						name: "NodeGear Mocha Tester",
						email: 'hello@nodegear.com',
						password: 'test-test',
						username: 'hello-nodegear'
					})
					.expect(200)
					.end(function (err, req) {
						// Validate the user
						models.User.update({
							email: 'hello@nodegear.com'
						}, {
							$set: {
								email_verified: true,
								invitation_complete: true
							}
						}, done);
					});
			});
		});

		it('should log in', function (done) {
			request
				.post('/auth/password')
				.accept('json')
				.send({
					email: 'hello@nodegear.com',
					password: 'test-test'
				})
				.expect(200)
				.end(done);
		})

		it('should log out', function(done) {
			request
				.get('/logout')
				.accept('json')
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);

					done()
				})
		});
	});
})