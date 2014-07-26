var app = require('../lib/app');
var request = require('supertest').agent(app.app)

var should = require('should')
	, models = require('ng-models')

if (!process.env.NG_TEST) {
	console.log("\nNot in TEST environment. Please export NG_TEST variable\n");
}

should(process.env.NG_TEST).be.ok;

describe('Tickets', function() {
	before(function () {
		models.User.remove({}, function(err) {
			if (err) throw err;
		});
		models.Ticket.remove({}, function (err) {
			if (err) throw err;
		});
	});

	it('prepare', function(done) {
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
				}, function (err) {
					if (err) throw err;

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
			});
	});

	it('fails malformed request', function (done) {
		request
			.post('/tickets/add')
			.accept('json')
			.expect(400)
			.end(done);
	});

	it('fails missing subject', function (done) {
		request
			.post('/tickets/add')
			.send({
				ticket: {
					message: 'hello',
					urgent: false
				}
			})
			.accept('json')
			.expect(400)
			.end(done);
	});

	it('fails missing message', function (done) {
		request
			.post('/tickets/add')
			.send({
				ticket: {
					subject: 'hello',
					urgent: false
				}
			})
			.accept('json')
			.expect(400)
			.end(done);
	});

	it('fails malformed app object id', function (done) {
		request
			.post('/tickets/add')
			.send({
				ticket: {
					subject: 'hello',
					message: 'hello',
					app: 'lol',
					urgent: false
				}
			})
			.accept('json')
			.expect(400)
			.end(done);
	});

	it('fails nonexisting app id', function (done) {
		request
			.post('/tickets/add')
			.send({
				ticket: {
					subject: 'hello',
					message: 'hello',
					app: '53af49703975335c0192eeaa',
					urgent: false
				}
			})
			.accept('json')
			.expect(400)
			.end(done);
	});
	
	it('should create a ticket', function(done) {
		var subject = 'Hello World';
		var message = 'A Message';
		var urgent = true;

		request
			.post('/tickets/add')
			.send({
				ticket: {
					subject: subject,
					message: message,
					app: '',
					urgent: urgent
				}
			})
			.accept('json')
			.expect(200)
			.end(function(err, req) {
				should(err).be.equal(null);
				
				var body = req.res.body;
				
				body._id.should.be.String;
				
				request
					.get('/tickets/'+body._id)
					.accept('json')
					.expect(200)
					.end(function (err, req) {
						should(err).be.equal(null);

						var ticket = req.res.body.ticket;

						should(ticket.urgent).be.equal(urgent);
						should(ticket.subject).be.equal(subject);
						should(ticket.message).be.equal(message);
						should(ticket.app).not.exist;

						done();
					})
			});
	});
})