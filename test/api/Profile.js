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

describe('Account', function() {
	var email, password, user;
	email = 'hello@nodegear.com';
	password = 'test-test';
	
	before(function (done) {
		login(request, function (err, _user) {
			user = _user;

			done(err);
		});
	});
	
	it('should fetch user profile', function (done) {
		request
			.get('/profile/profile')
			.accept('json')
			.expect(200)
			.end(function(err, res) {
				should(err).be.equal(null);
				
				var body = res.body;
				body.status.should.be.equal(200)
				
				body.user.should.be.Object;
				body.user.name.should.equal(user.name);
				body.user.username.should.equal(user.username);
				body.user.email.should.equal(user.email);

				done()
			})
	})

	describe('does update profile', function() {
		it('should update user profile', function (done) {
			request
				.put('/profile/profile')
				.accept('json')
				.send({
					user: {
						name: "Hello Tester",
						username: "free",
						email: "free@test.nodegear.com"
					}
				})
				.expect(200)
				.end(done)
		})

		it('should check user details have changed', function (done) {
			models.User.findOne({
				_id: user._id
			}, function(err, u) {
				should(err).be.equal(null);

				u.name.should.be.equal("Hello Tester");
				u.username.should.be.equal("free");
				u.email.should.be.equal("free@test.nodegear.com");

				user = u;
				done();
			})
		})
	})

	describe('changes user password', function() {
		it('should not update user profile (current password wrong)', function (done) {
			request
				.put('/profile/profile')
				.accept('json')
				.send({
					user: {
						name: "Hello Tester",
						username: "free",
						email: "free@test.nodegear.com",
						password: password+'sss',
						newPassword: "newPassword"
					}
				})
				.expect(400)
				.end(function(err, res) {
					should(err).be.null;

					var body = res.body;
					body.message.should.not.be.empty;

					done()
				})
		})

		it('should not change user password (password length)', function (done) {
			request
				.put('/profile/profile')
				.accept('json')
				.send({
					user: {
						name: "Hello Tester",
						username: "free",
						email: "free@test.nodegear.com",
						password: password,
						newPassword: "short"
					}
				})
				.expect(400)
				.end(done);
		});

		it('should check user password has not changed', function (done) {
			models.User.findOne({
				_id: user._id
			}, function(err, u) {
				should(err).be.equal(null);

				u.name.should.be.equal("Hello Tester");
				u.username.should.be.equal("free");
				u.email.should.be.equal("free@test.nodegear.com");
				u.comparePassword(password, function (same) {
					should(same).be.true;
					done();
				});
			});
		})

		it('should change user password', function (done) {
			request
				.put('/profile/profile')
				.accept('json')
				.send({
					user: {
						name: "Hello Tester",
						username: "free",
						email: "free@test.nodegear.com",
						password: password,
						newPassword: "newpassword"
					}
				})
				.expect(200)
				.end(done)
			password = 'newpassword';
		})

		it('should check user password has changed', function (done) {
			models.User.findOne({
				_id: user._id
			}, function(err, u) {
				should(err).be.equal(null);

				u.name.should.be.equal("Hello Tester");
				u.username.should.be.equal("free");
				u.email.should.be.equal("free@test.nodegear.com");
				u.comparePassword(password, function (same) {
					should(same).be.true;
					done();
				});
			})
		})
	})

	describe('does not update profile', function() {
		it('should not update user profile (taken email)', function (done) {
			(new models.User({
				email: 'taken@test.nodegear.com',
				username: 'taken',
				usernameLowercase: 'taken'
			})).save(function () {
				request
					.put('/profile/profile')
					.accept('json')
					.send({
						user: {
							name: "Hello Tester",
							username: "free",
							email: "taken@test.nodegear.com"
						}
					})
					.expect(400)
					.end(function(err, res) {
						should(err).be.equal(null);

						var body = res.body;
						body.errs.should.be.instanceof(Array).and.have.lengthOf(1);

						done()
					})
			})
		})

		it('should not update user profile (username taken)', function (done) {
			request
				.put('/profile/profile')
				.accept('json')
				.send({
					user: {
						name: "Fuuuuuk",
						username: "taken",
						email: "taken@test.com"
					}
				})
				.expect(400)
				.end(function(err, req) {
					should(err).be.equal(null);

					var body = req.res.body;
					body.errs.should.be.instanceof(Array).and.have.lengthOf(1);

					done()
				})
		})

		it('should verify no details have changed', function (done) {
			models.User.findOne({
				_id: user._id
			}, function(err, u) {
				should(err).be.equal(null);

				u.name.should.be.equal(user.name);
				u.username.should.be.equal(user.username);
				u.email.should.be.equal(user.email);

				done();
			})
		})
	})
})