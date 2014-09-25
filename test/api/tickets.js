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

describe('Tickets', function() {
	before(function (done) {
		async.parallel([
			function (done) {
				login(request, done);
			},
			function (done) {
				async.each(['Ticket'], function (table, cb) {
					models[table].remove({}, cb);
				}, done);
			}
		], done);
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