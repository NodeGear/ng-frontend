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

describe('App Processes', function() {
	before(function (done) {
		async.parallel([
			function (done) {
				login(request, done);
			},
			function (done) {
				async.each(['', 'Domain', 'Environment', 'Event', 'Process', 'ProcessUptime'], function (table, cb) {
					models['App'+table].remove({}, cb);
				}, done);
			},
			function (done) {
				models.Server.remove({}, done);
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

	it('fetches processes', function (done) {
		request
			.get('/app/mocha/processes?includeDeleted=false')
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(200);
				res.body.processes.should.be.an.Array;
				res.body.processes.should.have.lengthOf(0);

				done();
			});
	});

	it('fetches 404 process', function (done) {
		request
			.get('/app/mocha/process/wtf')
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(404);
				
				done();
			});
	});

	it('fetches invalid _id process', function (done) {
		request
			.get('/app/mocha/process/53f00dfab11f563d005cf252')
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(404);
				
				done();
			});
	});

	var process_id;
	var server_id;
	it('adds a process', function (done) {
		async.waterfall([
			function addServer (done) {
				(new models.Server({})).save(function () { done() });
			},
			function getServers (done) {
				request
					.get('/servers')
					.expect(200)
					.end(function (err, res) {
						done(err, res.body.servers);
					});
			},
			function addProcess (servers, done) {
				server_id = servers[0]._id;

				request
					.post('/app/mocha/process')
					.accept('json')
					.send({
						process: {
							name: 'hello',
							server: server_id
						}
					})
					.expect(200)
					.end(function (err, res) {
						should(err).be.null;

						res.body.status.should.be.equal(200);
						process_id = res.body.process;

						done();
					});
			}
		], done);
	});

	it('gets the process', function (done) {
		request
			.get('/app/mocha/process/'+process_id)
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.process.should.be.an.Object;

				done();
			})
	});

	it('updates the process', function (done) {
		request
			.put('/app/mocha/process/'+process_id)
			.accept('json')
			.send({
				process: {
					name: 'hello world',
					server: server_id
				}
			})
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(200);
				res.body.process.should.be.an.String;

				done();
			});
	});

	it('[pseudo] starts the process', function (done) {
		request
			.post('/app/mocha/process/'+process_id+'/start')
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(200);

				done();
			});
	});

	it('[pseudo] stops the process', function (done) {
		request
			.post('/app/mocha/process/'+process_id+'/stop')
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(200);

				done();
			});
	});

	it('deletes the process', function (done) {
		request
			.delete('/app/mocha/process/'+process_id)
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.equal(200);

				done();
			});
	});

	it('cannot fool the process create by sending invalid requests', function (done) {
		async.parallel([
			function (cb) {
				request
					.post('/app/mocha/process')
					.accept('json')
					.expect(400)
					.expect({
						status: 400,
						message: "Invalid Request"
					})
					.end(cb)
			},
			function (cb) {
				request
					.post('/app/mocha/process')
					.accept('json')
					.send({
						process: {
							name: ''
						}
					})
					.expect(200)
					.expect({
						status: 400,
						message: "Invalid Process Name"
					})
					.end(cb)
			},
			function (cb) {
				request
					.post('/app/mocha/process')
					.accept('json')
					.send({
						process: {
							name: 'asd',
							server: 'mogwais'
						}
					})
					.expect(200)
					.expect({
						status: 400,
						message: "Bad Server"
					})
					.end(cb)
			},
			function (cb) {
				request
					.post('/app/mocha/process')
					.accept('json')
					.send({
						process: {
							name: 'asd',
							server: '53f00dfab11f563d005cf252'
						}
					})
					.expect(200)
					.expect({
						status: 400,
						message: "Invalid Server"
					})
					.end(cb)
			}
		], done)
	});
	
});