require('./prepare');

var app = require('../app');
var request = require('supertest').agent(app.app)

var should = require('should')
	, models = require('../models')

describe('Authentication', function() {
	var password, user;
	
	before(function () {
		password = "password";
	
		user = new models.User({
			username: "testuser",
			name: "Tester",
			email: "tester@nodegear.com",
			admin: false,
			balance: 0,
			tfa_enabled: false,
			tfa: null
		});
		user.setPassword(password);
		user.save();
	});
	
	describe('Login', function() {
		it('should not login', function(done) {
			request
				.post('/auth/password')
				.accept('json')
				.send({
					email: user.email,
					password: password+'something'
				})
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);
				
					var body = req.res.body;
					body.status.should.not.be.equal(200)
				
					done()
				})
		})
		it('should log in', function(done) {
			request
				.post('/auth/password')
				.accept('json')
				.send({
					email: user.email,
					password: password
				})
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);
					
					var body = req.res.body;
					body.status.should.be.equal(200)
					body.tfa.should.be.false;

					done();
				})
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
		})

		describe('Enable TFA', function() {
			it('should log in', function(done) {
				request
					.post('/auth/password')
					.accept('json')
					.send({
						email: user.email,
						password: password
					})
					.expect(200)
					.end(function(err, req) {
						should(err).be.equal(null);
						
						var body = req.res.body;
						body.status.should.be.equal(200)
						body.tfa.should.be.false;

						done();
					})
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
			})

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
			})

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
			})

			it('should disable tfa', function(done) {
				request
					.del('/auth/tfa')
					.accept('json')
					.expect(200)
					.end(done)
			})
		})
	});
})