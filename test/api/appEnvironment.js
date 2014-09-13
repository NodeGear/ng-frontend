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

describe('App Environment', function() {
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

	it('creates an environment', function (done) {
		request
			.post('/app/mocha/environment')
			.accept('json')
			.send({
				env: {
					name: 'hello',
					value: 'world'
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
					.post('/app/mocha/environment')
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
					.post('/app/mocha/environment')
					.accept('json')
					.send({
						env: false
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

	it('adds 49 more domains', function (done) {
		async.times(49, function (n, next) {
			request
				.post('/app/mocha/environment')
				.accept('json')
				.send({
					env: {
						name: 'hello',
						value: 'world'
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

	it('does not allow >= 50 domains', function (done) {
		request
			.post('/app/mocha/environment')
			.accept('json')
			.send({
				env: {
					name: 'hello',
					value: 'world'
				}
			})
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(400);
				done();
			});
	});

	it('gets app environment', function (done) {
		request
			.get('/app/mocha/environment')
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(200);
				res.body.environment.should.be.an.Array;
				res.body.environment.should.have.lengthOf(50);

				done();
			});
	});

	it('gets a single environment', function (done) {
		async.waterfall([
			function getEnvironment (done) {
				request
					.get('/app/mocha/environment')
					.accept('json')
					.expect(200)
					.end(function (err, res) {
						should(err).be.null;

						res.body.status.should.be.equal(200);
						res.body.environment.should.be.an.Array;
						res.body.environment.should.have.lengthOf(50);

						done(null, res.body.environment);
					});
			},
			function getSingle (environment, done) {
				request
					.get('/app/mocha/environment/'+environment[0]._id)
					.accept('json')
					.expect(200)
					.end(done);
			}
		], done);
	});

	it('gets an environment with bad _id', function (done) {
		request
			.get('/app/mocha/environment/troll')
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(400);
				done();
			});
	});

	it('gets an environment with nonexisting _id', function (done) {
		request
			.get('/app/mocha/environment/53f00dfab11f563d005cf252')
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(404);
				done();
			});
	});

	it('does not create an invalid environment name', function (done) {
		request
			.post('/app/mocha/environment')
			.accept('json')
			.send({
				env: {
					name: 'hello-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop',
					value: 'asdasd'
				}
			})
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(400);
				done();
			});
	});

	it('does not create an invalid environment value', function (done) {
		request
			.post('/app/mocha/environment')
			.accept('json')
			.send({
				env: {
					value: 'hello-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop-world-stop',
					name: 'asdasd'
				}
			})
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(400);
				done();
			});
	});

	it('updates environment', function (done) {
		async.waterfall([
			function getEnvironment (done) {
				request
					.get('/app/mocha/environment')
					.accept('json')
					.expect(200)
					.end(function (err, res) {
						should(err).be.null;

						res.body.status.should.be.equal(200);
						res.body.environment.should.be.an.Array;
						res.body.environment.should.have.lengthOf(50);

						done(null, res.body.environment);
					});
			},
			function getSingle (environment, done) {
				request
					.put('/app/mocha/environment/'+environment[0]._id)
					.accept('json')
					.send({
						env: environment[0]
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

	it('deletes environment', function (done) {
		async.waterfall([
			function getEnvironment (done) {
				request
					.get('/app/mocha/environment')
					.accept('json')
					.expect(200)
					.end(function (err, res) {
						should(err).be.null;

						res.body.status.should.be.equal(200);
						res.body.environment.should.be.an.Array;
						res.body.environment.should.have.lengthOf(50);

						done(null, res.body.environment);
					});
			},
			function deleteEnvironment (environment, done) {
				async.each(environment, function (env, cb) {
					request
						.delete('/app/mocha/environment/'+env._id)
						.accept('json')
						.expect(200)
						.end(cb);
				}, done);
			},
			function verifyNoEnvironment (done) {
				request
					.get('/app/mocha/environment')
					.accept('json')
					.expect(200)
					.end(function (err, res) {
						should(err).be.null;

						res.body.status.should.be.equal(200);
						res.body.environment.should.be.an.Array;
						res.body.environment.should.have.lengthOf(0);

						done(null);
					});
			}
		], done);
	});
});