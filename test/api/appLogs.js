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

describe('App Logs', function() {
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

	after(function (done) {
		models.Server.remove({}, done);
	});

	var process_id;
	it('creates a process', function (done) {
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
				request
					.post('/app/mocha/process')
					.accept('json')
					.send({
						process: {
							name: 'hello',
							server: servers[0]._id
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

	it('fetches logs', function (done) {
		request
			.get('/app/mocha/logs/'+process_id)
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(200);
				res.body.logs.should.be.an.Array;
				res.body.logs.should.have.lengthOf(0);

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

});