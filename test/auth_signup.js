var app = require('../lib/app');
var request = require('supertest').agent(app.app)
var config = require('../lib/config');

var should = require('should')
	, models = require('ng-models')

if (!process.env.NG_TEST) {
	console.log("\nNot in TEST environment. Please export NG_TEST variable\n");
}

should(process.env.NG_TEST).be.ok;

describe('Authentication', function() {
	before(function () {
		models.User.remove({}, function(err) {
			if (err) throw err;
		});
	});

	describe('Registration', function() {
		describe('fails malformed reqs', function () {
			it('an empty body', function (done) {
				request
					.post('/auth/register')
					.accept('json')
					.send({})
					.expect(400)
					.end(done);
			});
			it('a malformed req', function (done) {
				request
					.post('/auth/register')
					.accept('json')
					.expect(400)
					.end(done);
			});

			it('user object isnt an object', function (done) {
				request
					.post('/auth/register')
					.accept('json')
					.send({
						user: 'hello'
					})
					.expect(400)
					.end(done);
			});
		});

		describe('error fields', function (done) {
			it('no valid fields', function (done) {
				request
					.post('/auth/register')
					.accept('json')
					.send({
						user: {
							email: 'ab',
							password: 'hello'
						}
					})
					.expect(400)
					.end(function (err, req) {
						should(err).be.equal(null);

						req.res.body.errors.should.have.property('email', true);
						req.res.body.errors.should.have.property('username', true);
						req.res.body.errors.should.have.property('password', true);
						req.res.body.errors.should.have.property('name', true);

						done()
					});
			});

			it('valid field - email', function (done) {
				request
					.post('/auth/register')
					.accept('json')
					.send({
						user: {
							email: 'ab@nodegear.com',
							password: 'hello'
						}
					})
					.expect(400)
					.end(function (err, req) {
						should(err).be.equal(null);

						req.res.body.errors.should.have.property('email', false);
						req.res.body.errors.should.have.property('username', true);
						req.res.body.errors.should.have.property('password', true);
						req.res.body.errors.should.have.property('name', true);

						done()
					});
			});

			it('valid field - username', function (done) {
				request
					.post('/auth/register')
					.accept('json')
					.send({
						user: {
							username: 'nodegear',
						}
					})
					.expect(400)
					.end(function (err, req) {
						should(err).be.equal(null);

						req.res.body.errors.should.have.property('email', true);
						req.res.body.errors.should.have.property('username', false);
						req.res.body.errors.should.have.property('password', true);
						req.res.body.errors.should.have.property('name', true);

						done()
					});
			});

			it('valid field - name', function (done) {
				request
					.post('/auth/register')
					.accept('json')
					.send({
						user: {
							name: 'Thomas'
						}
					})
					.expect(400)
					.end(function (err, req) {
						should(err).be.equal(null);

						req.res.body.errors.should.have.property('email', true);
						req.res.body.errors.should.have.property('username', true);
						req.res.body.errors.should.have.property('password', true);
						req.res.body.errors.should.have.property('name', false);

						done()
					});
			});

			it('valid field - password', function (done) {
				request
					.post('/auth/register')
					.accept('json')
					.send({
						user: {
							password: 'mocha-test'
						}
					})
					.expect(400)
					.end(function (err, req) {
						should(err).be.equal(null);

						req.res.body.errors.should.have.property('email', true);
						req.res.body.errors.should.have.property('username', true);
						req.res.body.errors.should.have.property('password', false);
						req.res.body.errors.should.have.property('name', true);

						done()
					});
			});
		});

		describe('username variations', function () {
			it('allows - some-user', function (done) {
				request
					.post('/auth/register')
					.accept('json')
					.send({
						user: {
							username: 'some-user'
						}
					})
					.expect(400)
					.end(function (err, req) {
						should(err).be.equal(null);

						req.res.body.errors.should.have.property('email', true);
						req.res.body.errors.should.have.property('username', false);
						req.res.body.errors.should.have.property('password', true);
						req.res.body.errors.should.have.property('name', true);

						done()
					});
			});

			it('allows - some-some_user', function (done) {
				request
					.post('/auth/register')
					.accept('json')
					.send({
						user: {
							username: 'some-some_user'
						}
					})
					.expect(400)
					.end(function (err, req) {
						should(err).be.equal(null);

						req.res.body.errors.should.have.property('email', true);
						req.res.body.errors.should.have.property('username', false);
						req.res.body.errors.should.have.property('password', true);
						req.res.body.errors.should.have.property('name', true);

						done()
					});
			});

			it('allows - someuser', function (done) {
				request
					.post('/auth/register')
					.accept('json')
					.send({
						user: {
							username: 'someuser'
						}
					})
					.expect(400)
					.end(function (err, req) {
						should(err).be.equal(null);

						req.res.body.errors.should.have.property('email', true);
						req.res.body.errors.should.have.property('username', false);
						req.res.body.errors.should.have.property('password', true);
						req.res.body.errors.should.have.property('name', true);

						done()
					});
			});

			it('allows - some34good', function (done) {
				request
					.post('/auth/register')
					.accept('json')
					.send({
						user: {
							username: 'some34good'
						}
					})
					.expect(400)
					.end(function (err, req) {
						should(err).be.equal(null);

						req.res.body.errors.should.have.property('email', true);
						req.res.body.errors.should.have.property('username', false);
						req.res.body.errors.should.have.property('password', true);
						req.res.body.errors.should.have.property('name', true);

						done()
					});
			});

			it('deny utf8 - someuse♥', function (done) {
				request
					.post('/auth/register')
					.accept('json')
					.send({
						user: {
							username: 'someuse♥'
						}
					})
					.expect(400)
					.end(function (err, req) {
						should(err).be.equal(null);

						req.res.body.errors.should.have.property('email', true);
						req.res.body.errors.should.have.property('username', true);
						req.res.body.errors.should.have.property('password', true);
						req.res.body.errors.should.have.property('name', true);

						done()
					});
			});

			it('deny non az-AZ-09 chars - hacker4>', function (done) {
				request
					.post('/auth/register')
					.accept('json')
					.send({
						user: {
							username: 'hacker4>'
						}
					})
					.expect(400)
					.end(function (err, req) {
						should(err).be.equal(null);

						req.res.body.errors.should.have.property('email', true);
						req.res.body.errors.should.have.property('username', true);
						req.res.body.errors.should.have.property('password', true);
						req.res.body.errors.should.have.property('name', true);

						done()
					});
			});

			it('deny too long (over 15)', function (done) {
				request
					.post('/auth/register')
					.accept('json')
					.send({
						user: {
							username: 'mocha-test_mocha-test'
						}
					})
					.expect(400)
					.end(function (err, req) {
						should(err).be.equal(null);

						req.res.body.errors.should.have.property('email', true);
						req.res.body.errors.should.have.property('username', true);
						req.res.body.errors.should.have.property('password', true);
						req.res.body.errors.should.have.property('name', true);

						done()
					});
			});

			it('deny too short (under 3)', function (done) {
				request
					.post('/auth/register')
					.accept('json')
					.send({
						user: {
							username: 'mo'
						}
					})
					.expect(400)
					.end(function (err, req) {
						should(err).be.equal(null);

						req.res.body.errors.should.have.property('email', true);
						req.res.body.errors.should.have.property('username', true);
						req.res.body.errors.should.have.property('password', true);
						req.res.body.errors.should.have.property('name', true);

						done()
					});
			});
		});

		describe('registration attempts', function () {
			describe('verification email', function () {
				it('should register', function(done) {
					config.public_config.invitation_only = false;

					// Remove all previous users
					models.User.remove({
						email: 'hello@nodegear.com'
					}, function (err) {
						if (err) throw err;

						// Register user
						request
							.post('/auth/register')
							.accept('json')
							.send({
								user: {
									name: "NodeGear Mocha Tester",
									email: 'hello@nodegear.com',
									password: 'test-test',
									username: 'hello-nodegear'
								}
							})
							.expect(200)
							.end(done);
					});
				});

				it('should log in', function (done) {
					request
						.post('/auth/password')
						.accept('json')
						.send({
							auth: 'hello@nodegear.com',
							password: 'test-test'
						})
						.expect(200)
						.end(done);
				});

				it('should not be logged in - verification needed', function (done) {
					request
						.get('/apps')
						.accept('json')
						.expect(403)
						.end(done);
				});

				it('should verify email', function(done) {
					models.User.findOne({
						email: 'hello@nodegear.com'
					}, function (err, user) {
						models.EmailVerification.findOne({
							user: user._id
						}, function (err, verification) {
							request
								.post('/auth/verifyEmail')
								.accept('json')
								.send({
									code: verification.code
								})
								.expect(200)
								.end(done)
						});
					})
				});

				it('should be logged in', function (done) {
					request
						.get('/apps')
						.accept('json')
						.expect(200)
						.end(done);
				});
			});
		});
	});
})