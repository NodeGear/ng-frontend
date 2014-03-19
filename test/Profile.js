require('./prepare');

var app = require('../app');
var request = require('supertest').agent(app.app)

var should = require('should')
	, models = require('../models')

describe('Account', function() {
	var password, user;
	
	before(function () {
		password = "password";
		
		new models.User({
			username: "taken",
			name: "Taken User",
			email: "taken@test.nodegear.com",
			admin: false
		}).save();

		user = new models.User({
			username: "account",
			name: "Account Tester",
			email: "account@test.nodegear.com",
			admin: false,
			balance: 0,
			tfa_enabled: false,
			tfa: null
		});
		user.setPassword(password);
		user.save();
	});

	it('should log in', function(done) {
		request
			.post('/auth/password')
			.send({
				email: user.email,
				password: password
			})
			.accept('json')
			.expect(200)
			.end(function(err, req) {
				should(err).be.equal(null);
				
				var body = req.res.body;
				body.status.should.be.equal(200)
				
				done();
			})
	})
	
	it('should fetch user profile', function(done) {
		request
			.get('/profile/profile')
			.accept('json')
			.expect(200)
			.end(function(err, req) {
				should(err).be.equal(null);
				
				var body = req.res.body;
				body.status.should.be.equal(200)
				
				body.user.should.be.Object;
				body.user.name.should.equal(user.name);
				body.user.username.should.equal(user.username);
				body.user.email.should.equal(user.email);

				done()
			})
	})

	describe('does update profile', function() {
		it('should update user profile', function(done) {
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
				.end(function(err, req) {
					should(err).be.equal(null);

					var body = req.res.body;
					body.status.should.be.equal(200);

					done()
				})
		})

		it('should check user details have changed', function(done) {
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

	describe('does not update profile', function() {
		it('should not update user profile (taken email)', function(done) {
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
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);

					var body = req.res.body;
					body.status.should.not.be.equal(200);
					body.errs.should.be.instanceof(Array).and.have.lengthOf(1);

					done()
				})
		})

		it('should not update to user profile (username)', function(done) {
			request
				.put('/profile/profile')
				.accept('json')
				.send({
					user: {
						name: "Fuuuuuk",
						username: "taken",
						email: "taken@test..com"
					}
				})
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);

					var body = req.res.body;
					body.status.should.not.be.equal(200);
					body.errs.should.be.instanceof(Array).and.have.lengthOf(2);

					done()
				})
		})

		it('should verify no details have changed', function(done) {
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