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

describe('Apps', function() {
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
		], done);
	});
	
	describe('Creates Application', function() {
		it('should not create an app (invalid template)', function (done) {
			request
				.post('/apps/add')
				.accept('json')
				.send({
					name: 'mocha',
					template: 'uno'
				})
				.expect(400)
				.end(done)
		});

		it('should not create an app (invalid name & template)', function (done) {
			request
				.post('/apps/add')
				.accept('json')
				.send({
					name: '',
					template: ''
				})
				.expect(400)
				.end(done)
		});

		it('should create an application', function (done) {
			request
				.post('/apps/add')
				.accept('json')
				.send({
					name: 'mocha',
					template: 'ghost'
				})
				.expect(200)
				.end(function (err, res) {
					should(err).be.null;

					res.body.nameUrl.should.equal('mocha');
					done();
				});
		});

		it('should create another application (different name-url)', function (done) {
			request
				.post('/apps/add')
				.accept('json')
				.send({
					name: 'mocha',
					template: 'ghost'
				})
				.expect(200)
				.end(function (err, res) {
					should(err).be.null;

					res.body.nameUrl.should.equal('mocha-2');
					done();
				});
		});

		it('gets applications', function (done) {
			request
				.get('/apps')
				.accept('json')
				.expect(200)
				.end(function (err, res) {
					should(err).be.null;

					res.body.apps.should.be.an.Object;
					res.body.apps.should.have.lengthOf(2);

					done();
				});
		});

		it('should create nameURLs and fallback to _id', function (done) {
			async.retry(15, function (cb, results) {
				request
					.post('/apps/add')
					.accept('json')
					.send({
						name: 'mocha-name',
						template: 'ghost'
					})
					.expect(200)
					.end(function (err, res) {
						should(err).be.null;

						if (res.body.nameUrl == res.body.id) {
							return cb();
						}

						cb(new Error(""));
					});
			}, function (err) {
				done(err);
			});
		});
	});

	describe('into Application', function () {
		it('gets app by nameUrl', function (done) {
			request
				.get('/app/mocha')
				.accept('json')
				.expect(200)
				.end(done);
		});

		it('gets second app by nameUrl', function (done) {
			request
				.get('/app/mocha-2')
				.accept('json')
				.expect(200)
				.end(done);
		});

		it('gets app by _id', function (done) {
			models.App.findOne({
				nameUrl: 'mocha'
			}, function (e, app) {
				request
					.get('/app/'+app._id)
					.accept('json')
					.expect(200)
					.end(done);
			});
		});

		it('denies access to another user\'s app', function (done) {
			(new models.App({
				nameUrl: 'foreign',
				deleted: false
			})).save(function () {
				request
					.get('/app/foreign')
					.accept('json')
					.expect(404)
					.end(done);
			});
		});

		describe('events', function () {
			it('gets no events', function (done) {
				request
					.get('/app/mocha/events')
					.accept('json')
					.expect(200)
					.end(function (err, res) {
						should(err).be.null;

						res.body.events.should.be.an.Array;
						res.body.events.should.be.empty;

						done();
					});
			});
		});

		it('deletes application', function (done) {
			request
				.delete('/app/mocha-2')
				.accept('json')
				.expect(200)
				.end(function (err, res) {
					should(err).be.null;

					res.body.status.should.be.equal(200);

					done();
				});
		})
	});
});