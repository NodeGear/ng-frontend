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
					.expect(400)
					.end(done);
			});
		})

		describe('login attempts', function () {
			it('should not login', function(done) {
				request
					.post('/auth/password')
					.accept('json')
					.send({
						auth: 'hello@nodegear.com',
						password: 'test-test'
					})
					.expect(400)
					.end(done);
			});

			it('should register', function(done) {
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
						auth: 'hello@nodegear.com',
						password: 'test-test'
					})
					.expect(200)
					.end(done);
			});

			it('should be logged in', function (done) {
				request
					.get('/apps')
					.accept('json')
					.expect(200)
					.end(done);
			});

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

			it('should not be logged in', function (done) {
				request
					.get('/apps')
					.accept('json')
					.expect(403)
					.end(done);
			});
		});

		describe('invitation only', function () {
			it('should log in when invitations are on and account isnt authorized', function (done) {
				models.User.update({
					email: 'hello@nodegear.com'
				}, {
					$set: {
						invitation_complete: false
					}
				}, function (err) {
					config.public_config.invitation_only = true;

					request
						.post('/auth/password')
						.accept('json')
						.send({
							auth: 'hello@nodegear.com',
							password: 'test-test'
						})
						.expect(200)
						.end(function (err, req) {
							should(err).be.equal(null);

							var body = req.res.body;
							body.should.have.property('redirect_invitation', true);

							done();
						})
				});
			});

			it('should not be able to access anything (logout state)', function (done) {
				request
					.get('/apps')
					.accept('json')
					.expect(403)
					.end(done);
			});

			it('should log in when invitations are off and account isnt authorized', function (done) {
				models.User.update({
					email: 'hello@nodegear.com'
				}, {
					$set: {
						invitation_complete: false
					}
				}, function (err) {
					config.public_config.invitation_only = false;

					request
						.post('/auth/password')
						.accept('json')
						.send({
							auth: 'hello@nodegear.com',
							password: 'test-test'
						})
						.expect(200)
						.end(function (err, req) {
							should(err).be.equal(null);

							var body = req.res.body;
							body.should.not.have.property('redirect_invitation');
							body.should.have.property('tfa', false);
							body.should.have.property('email_verification', true);
							body.should.have.property('passwordUpdateRequired', false);

							done();
						})
				});
			});

			it('should be logged in', function (done) {
				request
					.get('/apps')
					.accept('json')
					.expect(200)
					.end(done);
			});

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

			it('should log in when invitations are on and account is authorized', function (done) {
				models.User.update({
					email: 'hello@nodegear.com'
				}, {
					$set: {
						invitation_complete: true
					}
				}, function (err) {
					config.public_config.invitation_only = true;

					request
						.post('/auth/password')
						.accept('json')
						.send({
							auth: 'hello@nodegear.com',
							password: 'test-test'
						})
						.expect(200)
						.end(function (err, req) {
							should(err).be.equal(null);

							var body = req.res.body;
							body.should.not.have.property('redirect_invitation');
							body.should.have.property('tfa', false);
							body.should.have.property('email_verification', true);
							body.should.have.property('passwordUpdateRequired', false);

							done();
						})
				});
			});

			it('should be logged in', function (done) {
				request
					.get('/apps')
					.accept('json')
					.expect(200)
					.end(done);
			});
		});

		describe('two factor authentication', function () {
			it('should log in', function (done) {
				config.public_config.invitation_only = true;

				request
					.post('/auth/password')
					.accept('json')
					.send({
						auth: 'hello@nodegear.com',
						password: 'test-test'
					})
					.expect(200)
					.end(function (err, req) {
						should(err).be.equal(null);

						var body = req.res.body;
						body.should.not.have.property('redirect_invitation');
						body.should.have.property('tfa', false);
						body.should.have.property('email_verification', true);
						body.should.have.property('passwordUpdateRequired', false);

						done();
					});
			});

			it('has to report that tfa is disabled', function(done) {
				request
					.get('/auth/tfa')
					.accept('json')
					.expect(200)
					.end(function(err, req) {
						should(err).be.equal(null);
						
						var body = req.res.body;
						body.status.should.be.equal(404)
						
						done();
					})
			});

			var token = '';
			it('should enable tfa', function(done) {
				request
					.put('/auth/tfa')
					.accept('json')
					.expect(200)
					.end(function(err, req) {
						should(err).be.equal(null);
						
						var body = req.res.body;
						body.status.should.be.equal(200)
						body.qr.should.be.a.String;
						body.qr.should.not.be.empty;

						// Enabled in test mode only
						body.token.should.be.a.String;
						token = body.token;

						done();
					})
			});

			it('has to report that tfa is partially enabled', function(done) {
				request
					.get('/auth/tfa')
					.accept('json')
					.expect(200)
					.end(function(err, req) {
						should(err).be.equal(null);
						
						var body = req.res.body;
						body.status.should.be.equal(200)
						body.full_enabled.should.be.false;
						body.confirmed.should.be.false;
						body.enabled.should.be.true;
						
						done();
					})
			})

			it('should confirm tfa', function(done) {
				request
					.post('/auth/tfa')
					.accept('json')
					.send({
						token: token
					})
					.expect(200)
					.end(function(err, req) {
						should(err).be.equal(null);
						
						var body = req.res.body;
						body.status.should.be.equal(200)
						
						done();
					})
			});

			it('should log out', function (done) {
				request
					.get('/logout')
					.accept('json')
					.expect(200)
					.end(function(err, req) {
						should(err).be.equal(null);

						done()
					});
			});

			it('should log in', function (done) {
				config.public_config.invitation_only = true;

				request
					.post('/auth/password')
					.accept('json')
					.send({
						auth: 'hello@nodegear.com',
						password: 'test-test'
					})
					.expect(200)
					.end(function (err, req) {
						should(err).be.equal(null);

						var body = req.res.body;
						body.should.not.have.property('redirect_invitation');
						body.should.have.property('tfa', true);
						body.should.have.property('email_verification', true);
						body.should.have.property('passwordUpdateRequired', false);

						done();
					});
			});

			it('should not be logged in', function (done) {
				request
					.get('/apps')
					.accept('json')
					.expect(403)
					.end(done);
			});

			it('should confirm tfa authentication', function (done) {
				request
					.post('/auth/tfa')
					.accept('json')
					.send({
						token: token
					})
					.expect(200)
					.end(function(err, req) {
						should(err).be.equal(null);
						
						var body = req.res.body;
						body.status.should.be.equal(200)
						
						done();
					});
			});

			it('should be logged in', function (done) {
				request
					.get('/apps')
					.accept('json')
					.expect(200)
					.end(done);
			});

			it('should disable tfa', function(done) {
				request
					.del('/auth/tfa')
					.accept('json')
					.expect(200)
					.end(done)
			});
		});
	});
})