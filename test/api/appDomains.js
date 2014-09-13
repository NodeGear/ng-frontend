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

describe('App Domains', function() {
	before(function (done) {
		async.parallel([
			function (done) {
				login(request, done);
			},
			function (done) {
				async.each(['', 'Domain', 'Environment', 'Event', 'Process', 'ProcessUptime'], function (table, cb) {
					models['App'+table].remove({}, cb);
				}, done);
			}
		], function (err) {
			if (err) return done(err);

			request
				.post('/apps/add')
				.accept('json')
				.send({
					name: 'mocha',
					template: 'ghost'
				})
				.expect(200)
				.end(done);
		});
	});

	it('creates a domain', function (done) {
		request
			.post('/app/mocha/domain')
			.accept('json')
			.send({
				domain: {
					domain: 'hello-world',
					ssl: false,
					ssl_only: false,
					certificate: '',
					certificate_key: ''
				}
			})
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(200);
				done();
			});
	});

	it('no body / malformed request', function (done) {
		async.parallel([
			function (done) {
				request
					.post('/app/mocha/domain')
					.accept('json')
					.expect(400)
					.end(function (err, res) {
						should(err).be.null;

						res.body.status.should.be.equal(400);
						done();
					});
			},
			function (done) {
				request
					.post('/app/mocha/domain')
					.accept('json')
					.send({
						domain: false
					})
					.expect(400)
					.end(function (err, res) {
						should(err).be.null;

						res.body.status.should.be.equal(400);
						done();
					});
			}
		], done);
	});

	it('creates a domain', function (done) {
		request
			.post('/app/mocha/domain')
			.accept('json')
			.send({
				domain: {
					domain: 'hello-worlds',
					ssl: false,
					ssl_only: true,
					certificate: '',
					certificate_key: ''
				}
			})
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(200);
				done();
			});
	});

	it('creates a domain with certificate', function (done) {
		request
			.post('/app/mocha/domain')
			.accept('json')
			.send({
				domain: {
					domain: 'hello-world-ssl',
					ssl: false,
					ssl_only: true,
					certificate: 'certificate',
					certificate_key: 'certificate_key'
				}
			})
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(200);
				done();
			});
	});

	it('adds 2 more domains', function (done) {
		async.times(2, function (n, next) {
			request
				.post('/app/mocha/domain')
				.accept('json')
				.send({
					domain: {
						domain: 'hello-world-'+n,
						ssl: false,
						ssl_only: true,
						certificate: '',
						certificate_key: ''
					}
				})
				.expect(200)
				.end(function (err, res) {
					should(err).be.null;

					res.body.status.should.be.equal(200);
					next();
				});
		}, function () {
			done();
		});
	});

	it('does not allow > 5 domains', function (done) {
		request
			.post('/app/mocha/domain')
			.accept('json')
			.send({
				domain: {
					domain: 'hello-world-6',
					ssl: false,
					ssl_only: false,
					certificate: '',
					certificate_key: ''
				}
			})
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(400);
				done();
			});
	});

	it('gets list of domains', function (done) {
		request
			.get('/app/mocha/domains')
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(200);
				res.body.domains.should.be.an.Array;
				res.body.domains.should.have.lengthOf(5);

				done();
			});
	});

	it('gets a single domain', function (done) {
		async.waterfall([
			function getDomains (done) {
				request
					.get('/app/mocha/domains')
					.accept('json')
					.expect(200)
					.end(function (err, res) {
						should(err).be.null;

						res.body.status.should.be.equal(200);
						res.body.domains.should.be.an.Array;
						res.body.domains.should.have.lengthOf(5);

						done(null, res.body.domains);
					});
			},
			function getDomain (domains, done) {
				request
					.get('/app/mocha/domain/'+domains[0]._id)
					.accept('json')
					.expect(200)
					.end(done);
			}
		], done);
	});

	it('gets a domain with bad _id', function (done) {
		request
			.get('/app/mocha/domain/troll')
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(400);
				done();
			});
	});

	it('gets a domain with nonexisting _id', function (done) {
		request
			.get('/app/mocha/domain/53f00dfab11f563d005cf252')
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(404);
				done();
			});
	});

	it('does not create an invalid domain', function (done) {
		request
			.post('/app/mocha/domain')
			.accept('json')
			.send({
				domain: {
					domain: 'hello-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop',
					ssl: false,
					ssl_only: true,
					certificate: 'certificate',
					certificate_key: 'certificate_key'
				}
			})
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(400);
				done();
			});
	});

	it('does not create a taken domain', function (done) {
		request
			.post('/app/mocha/domain')
			.accept('json')
			.send({
				domain: {
					domain: 'hello-world',
					ssl: false,
					ssl_only: true,
					certificate: '',
					certificate_key: ''
				}
			})
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(400);
				done();
			});
	});

	it('updates a domain', function (done) {
		async.waterfall([
			function getDomains (done) {
				request
					.get('/app/mocha/domains')
					.accept('json')
					.expect(200)
					.end(function (err, res) {
						should(err).be.null;

						res.body.status.should.be.equal(200);
						res.body.domains.should.be.an.Array;
						res.body.domains.should.have.lengthOf(5);

						done(null, res.body.domains);
					});
			},
			function getDomain (domains, done) {
				request
					.put('/app/mocha/domain/'+domains[0]._id)
					.accept('json')
					.send({
						domain: domains[0]
					})
					.expect(200)
					.end(function (err, res) {
						should(err).be.null;

						res.body.status.should.equal(200);
						done();
					});
			}
		], done);
	});

	it('deletes a domain', function (done) {
		async.waterfall([
			function getDomains (done) {
				request
					.get('/app/mocha/domains')
					.accept('json')
					.expect(200)
					.end(function (err, res) {
						should(err).be.null;

						res.body.status.should.be.equal(200);
						res.body.domains.should.be.an.Array;
						res.body.domains.should.have.lengthOf(5);

						done(null, res.body.domains);
					});
			},
			function getDomain (domains, done) {
				request
					.delete('/app/mocha/domain/'+domains[0]._id)
					.accept('json')
					.expect(200)
					.end(done);
			}
		], done);
	});
});