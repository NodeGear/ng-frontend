require('./prepare');

var app = require('../app');
var request = require('supertest').agent(app.app)

var stripe = require('../config').stripe

var should = require('should')
	, models = require('../models')

describe('Stripe & Payment', function() {
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

	var card_token = null, invalid_card_token = null;
	var card_id = null;

	describe('generate Stripe tokens', function() {
		this.timeout(0);

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
	});

	describe('manipulating payment methods', function() {
		this.timeout(10000);

		it('should reject adding the card (charge fails)', function(done) {
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
					body.status.should.not.be.equal(200);
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

		it('should retrieve 1 payment method, which is a default payment method', function(done) {
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

					// Check card properties
					var c = body.cards[0];
					c._id.should.not.be.empty;
					c.name.should.be.equal("Test Card");
					c.default.should.be.true;

					card_id = c._id;

					done();
				})
		})

		describe('modify card details', function(done) {
			it('shouldn\'t update card due to name', function(done) {
				request
					.put('/profile/card')
					.accept('json')
					.send({
						// name omitted
						cardholder: "Tester Testy",
						card: card_id,
						default: false
					})
					.expect(200)
					.end(function(err, req) {
						should(err).be.equal(null);

						var body = req.res.body;
						body.status.should.not.be.equal(200);
						body.message.should.not.be.empty;

						done();
					})
			})

			it('shouldn\'t update card due to cardholder', function(done) {
				request
					.put('/profile/card')
					.accept('json')
					.send({
						name: "Hello World",
						// cardholder omitted
						card: card_id,
						default: false
					})
					.expect(200)
					.end(function(err, req) {
						should(err).be.equal(null);

						var body = req.res.body;
						body.status.should.not.be.equal(200);
						body.message.should.not.be.empty;

						done();
					})
			})

			it('shouldn\'t update card due to invalid card id', function(done) {
				request
					.put('/profile/card')
					.accept('json')
					.send({
						// 'abcd'.split('').reverse().join('') == 'dcba'
						// effectively malforms the id, so should be !found
						card: card_id.split('').reverse().join('')
					})
					.expect(200)
					.end(function(err, req) {
						should(err).be.equal(null);

						var body = req.res.body;
						body.status.should.not.be.equal(200);
						body.message.should.not.be.empty;

						done();
					})
			})

			it('should verify integrity of card details', function(done) {
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

						// Check card properties
						var c = body.cards[0];
						c._id.should.not.be.empty;
						c._id.should.be.equal(card_id);
						c._id.should.not.be.empty;
						c.name.should.be.equal("Test Card");
						c.default.should.be.true;
						c.cardholder.should.be.equal("Mocha Tester");

						done();
					})
			})

			it('should update the card', function(done) {
				request
					.put('/profile/card')
					.accept('json')
					.send({
						name: "Card Two",
						cardholder: "Tester Testy",
						card: card_id,
						default: false
					})
					.expect(200)
					.end(function(err, req) {
						should(err).be.equal(null);

						var body = req.res.body;
						body.status.should.be.equal(200);

						done();
					})
			})

			it('should verify card details', function(done) {
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

						// Check card properties
						var c = body.cards[0];
						c._id.should.not.be.empty;
						c._id.should.be.equal(card_id);
						c.name.should.be.equal("Card Two");
						c.cardholder.should.be.equal("Tester Testy");
						c.default.should.be.false;

						card_id = c._id;

						done();
					})
			})
		})
	})

	describe('Charges', function() {
		this.timeout(10000);
		var transaction_id = null;

		it('should charge nothing (malformed value)', function(done) {
			request
				.post('/profile/billing/addCredits')
				.accept('json')
				.send({
					card: card_id,
					value: 'abcd',
				})
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);

					req.res.body.status.should.not.be.equal(200);
					req.res.body.message.should.not.be.empty;

					done();
				})
		})

		it('should charge nothing (invalid value)', function(done) {
			request
				.post('/profile/billing/addCredits')
				.accept('json')
				.send({
					card: card_id,
					value: 2000,
				})
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);

					req.res.body.status.should.not.be.equal(200);
					req.res.body.message.should.not.be.empty;

					done();
				})
		})

		it('should charge £5', function(done) {
			request
				.post('/profile/billing/addCredits')
				.accept('json')
				.send({
					card: card_id,
					value: 5,
				})
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);

					req.res.body.status.should.be.equal(200);

					done();
				})
		})

		it('should verify user has payment history', function(done) {
			request
				.get('/profile/billing/history')
				.accept('json')
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);

					var body = req.res.body;
					body.status.should.be.equal(200);
					body.transactions.should.be.instanceOf(Array);
					body.transactions.should.have.lengthOf(1);

					var t = body.transactions[0];
					t.total.should.be.equal(5);
					transaction_id = t._id;
					t.old_balance.should.be.equal(0);
					t.new_balance.should.be.equal(5);
					t.status.should.not.be.empty;
					t.type.should.not.be.empty;

					done();
				})
		})

		it('should retrieve transaction', function(done) {
			request
				.get('/profile/billing/transaction/'+transaction_id)
				.accept('json')
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);

					var body = req.res.body;
					body.status.should.be.equal(200);
					body.transaction.should.be.instanceOf(Object);
					body.transaction.should.not.be.empty;

					var t = body.transaction;
					t.total.should.be.equal(5);
					t.old_balance.should.be.equal(0);
					t.new_balance.should.be.equal(5);
					t.status.should.not.be.empty;
					t.type.should.not.be.empty;
					t.charges.should.not.be.empty;
					t.charges.should.have.lengthOf(1);
					t.charges[0].total.should.be.equal(5);

					done();
				})
		})

		it('should verify balance', function(done) {
			request
				.get('/profile/balance')
				.accept('json')
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);

					req.res.body.status.should.be.equal(200);
					req.res.body.balance.should.be.equal(5);

					done();
				})
		})
	})

	describe('removing a card', function() {
		this.timeout(10000);

		it('shouldn\'t delete a card', function(done) {
			request
				.del('/profile/card')
				.accept('json')
				.send({
					card: card_id.split('').reverse().join('')
				})
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);

					var body = req.res.body;
					body.status.should.be.not.equal(200);
					body.message.should.not.be.empty;

					done();
				})
		})

		it('should delete the card', function(done) {
			request
				.del('/profile/card')
				.accept('json')
				.send({
					card: card_id
				})
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);

					var body = req.res.body;
					body.status.should.be.equal(200);

					done();
				})
		})

		it('should find 0 cards', function(done) {
			request
				.get('/profile/cards')
				.accept('json')
				.expect(200)
				.end(function(err, req) {
					should(err).be.equal(null);

					var body = req.res.body;
					body.status.should.be.equal(200);
					body.cards.should.be.instanceOf(Array);
					body.cards.should.be.empty;

					done();
				})
		})
	})
})