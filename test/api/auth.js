var app = require('../../lib/app')
	, request = require('supertest').agent(app.app)
	, config = require('../../lib/config')
	, should = require('should')
	, models = require('ng-models')
	, async = require('async');

if (!process.env.TEST) {
	console.log("\nNot in TEST environment. Please export TEST variable\n");
	process.exit(-1);
}

describe('Authentication', function () {
	describe('Login', function() {
		before(function (done) {
			config.public_config.invitation_only = false;

			async.each(['User', 'EmailVerification'], function (table, cb) {
				models[table].remove({}, cb);
			}, done);
		});

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
		})

		describe('login attempts', function () {
			it('should not login', function (done) {
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
				// Register user
				async.waterfall([
					function registerUser (done) {
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
						.end(function (err) { done(err); });
					},
					function validateUser (done) {
						// Validate the user
						models.EmailVerification.findOne({
							email: 'hello@nodegear.com',
							verified: false
						}, function (err, verification) {
							should(verification).be.not.null;

							request
							.post('/auth/verifyEmail')
							.accept('json')
							.send({
								code: verification.code
							})
							.expect(200)
							.end(function (err, res) {
								should(err).be.null;

								res.body.status.should.equal(200)

								done();
							})
						});
					}
				], done);
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

			it('should not be allowed to access /admin', function (done) {
				request
					.get('/admin')
					.accept('json')
					.expect(404)
					.end(done)
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
					.end(done)
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
					.end(function (err, res) {
						should(err).be.equal(null);

						var body = res.body;
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
					.end(function(err, res) {
						should(err).be.equal(null);
						
						var body = res.body;
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
					.end(function(err, res) {
						should(err).be.equal(null);
						
						var body = res.body;
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
	
	describe('Register', function () {
		before(function (done) {
			config.public_config.invitation_only = false;

			async.each(['User', 'EmailVerification'], function (table, cb) {
				models[table].remove({}, cb);
			}, done);
		});

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

						req.res.body.fields.should.have.property('email', true);
						req.res.body.fields.should.have.property('username', true);
						req.res.body.fields.should.have.property('password', true);
						req.res.body.fields.should.have.property('name', true);

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

						req.res.body.fields.should.have.property('email', false);
						req.res.body.fields.should.have.property('username', true);
						req.res.body.fields.should.have.property('password', true);
						req.res.body.fields.should.have.property('name', true);

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

						req.res.body.fields.should.have.property('email', true);
						req.res.body.fields.should.have.property('username', false);
						req.res.body.fields.should.have.property('password', true);
						req.res.body.fields.should.have.property('name', true);

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

						req.res.body.fields.should.have.property('email', true);
						req.res.body.fields.should.have.property('username', true);
						req.res.body.fields.should.have.property('password', true);
						req.res.body.fields.should.have.property('name', false);

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

						req.res.body.fields.should.have.property('email', true);
						req.res.body.fields.should.have.property('username', true);
						req.res.body.fields.should.have.property('password', false);
						req.res.body.fields.should.have.property('name', true);

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

						req.res.body.fields.should.have.property('email', true);
						req.res.body.fields.should.have.property('username', false);
						req.res.body.fields.should.have.property('password', true);
						req.res.body.fields.should.have.property('name', true);

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

						req.res.body.fields.should.have.property('email', true);
						req.res.body.fields.should.have.property('username', false);
						req.res.body.fields.should.have.property('password', true);
						req.res.body.fields.should.have.property('name', true);

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

						req.res.body.fields.should.have.property('email', true);
						req.res.body.fields.should.have.property('username', false);
						req.res.body.fields.should.have.property('password', true);
						req.res.body.fields.should.have.property('name', true);

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

						req.res.body.fields.should.have.property('email', true);
						req.res.body.fields.should.have.property('username', false);
						req.res.body.fields.should.have.property('password', true);
						req.res.body.fields.should.have.property('name', true);

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

						req.res.body.fields.should.have.property('email', true);
						req.res.body.fields.should.have.property('username', true);
						req.res.body.fields.should.have.property('password', true);
						req.res.body.fields.should.have.property('name', true);

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

						req.res.body.fields.should.have.property('email', true);
						req.res.body.fields.should.have.property('username', true);
						req.res.body.fields.should.have.property('password', true);
						req.res.body.fields.should.have.property('name', true);

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

						req.res.body.fields.should.have.property('email', true);
						req.res.body.fields.should.have.property('username', true);
						req.res.body.fields.should.have.property('password', true);
						req.res.body.fields.should.have.property('name', true);

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

						req.res.body.fields.should.have.property('email', true);
						req.res.body.fields.should.have.property('username', true);
						req.res.body.fields.should.have.property('password', true);
						req.res.body.fields.should.have.property('name', true);

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