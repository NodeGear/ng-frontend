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

describe('App Settings', function() {
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

	it('updates app settings', function (done) {
		request
			.put('/app/mocha')
			.accept('json')
			.send({
				name: 'name',
				location: 'location',
				branch: 'branch'
			})
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(200);
				done();
			});
	});

	it('verifies saved data', function (done) {
		request
			.get('/app/mocha')
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.app.name.should.equal('name');
				res.body.app.location.should.equal('location');
				res.body.app.branch.should.equal('branch');
				
				done();
			});
	});

	it('no body / malformed request', function (done) {
		request
			.put('/app/mocha')
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(400);
				done();
			});
	});

	it('tests invalid app settings', function (done) {
		request
			.put('/app/mocha')
			.accept('json')
			.send({
				name: '',
				location: '',
				branch: ''
			})
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.status.should.be.equal(400);
				done();
			});
	});

	it('checks no data changed', function (done) {
		request
			.get('/app/mocha')
			.accept('json')
			.expect(200)
			.end(function (err, res) {
				should(err).be.null;

				res.body.app.name.should.equal('name');
				res.body.app.location.should.equal('location');
				res.body.app.branch.should.equal('branch');
				
				done();
			});
	});
});