require('./prepare');

var app = require('../app');
var request = require('supertest').agent(app.app)

var stripe = require('../config').stripe

var should = require('should')
	, models = require('../models')

describe('Stripe', function() {
	var password, user;
	
	before(function () {
		password = "password";
		
		user = new models.User({
			username: "stripe-tester",
			name: "Stripe Tester",
			email: "stripe@test.nodegear.com",
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

	describe('payment method', function() {
		var card_token = null, invalid_card_token = null;

		it('should add a card to Stripe', function(done) {
			stripe.tokens.create({
				card: {
					name: "Mocha Tester",
					number: '4242424242424242',
					exp_month: 12,
					exp_year: 2015,
					cvc: '123'
				}
			}, function(err, token) {
				should(err).be.equal(null);

				card_token = token.id;

				done()
			})
		})

		it('should add an invalid card to Stripe', function(done) {
			stripe.tokens.create({
				card: {
					name: "Mocha Invalid Tester",
					number: '4000000000000002',
					exp_month: 12,
					exp_year: 2015,
					cvc: '123'
				}
			}, function(err, token) {
				should(err).be.equal(null);

				invalid_card_token = token.id;

				done()
			})
		})

		it('should reject adding the card', function(done) {
			request
				.post('/profile/card')
				.accept('json')
				.send({
					card_id: invalid_card_token,
					name: "Invalid Test Card",
					default: true
				})
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);

					var body = req.res.body;
					body.status.should.be.equal(400);
					body.message.should.not.be.empty;

					done();
				})
		})

		it('should add a new payment method', function(done) {
			request
				.post('/profile/card')
				.accept('json')
				.send({
					card_id: card_token,
					name: "Test Card",
					default: true
				})
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);

					var body = req.res.body;
					body.status.should.be.equal(200);

					done();
				})
		})

		it('should retrieve payment methods', function(done) {
			request
				.get('/profile/cards')
				.accept('json')
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);

					var body = req.res.body;
					body.status.should.be.equal(200);
					body.cards.should.not.be.empty;
					body.cards.should.be.instanceOf(Array);
					body.cards.should.have.length(1);

					done();
				})
		})
	})
})