var async = require('async'),
	models = require('ng-models'),
	should = require('should'),
	config = require('../../../lib/config');

module.exports = function (request, done) {
	config.public_config.invitation_only = false;
	
	async.waterfall([
		function (done) {
			models.User.remove({}, function (e) { done(e) });
		},
		function (done) {
			models.Invitation.remove({}, function (e) { done(e) });
		},
		function (done) {
			models.EmailVerification.remove({}, function (e) { done(e) });
		},
		function (done) {
			request.get('/logout').end(function (e) { done(e) });
		},
		function registerUser (done) {
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
			.end(function (err) { done(err); });
		},
		function validateUser (done) {
			// Validate the user
			models.EmailVerification.findOne({
				email: 'hello@nodegear.com',
				verified: false
			}, function (err, verification) {
				should(err).be.null;
				should(verification).not.be.null;

				request
				.post('/auth/verifyEmail')
				.accept('json')
				.send({
					code: verification.code
				})
				.expect(200)
				.end(function (err, res) {
					should(err).be.null;

					res.body.status.should.equal(200)

					done();
				})
			});
		}
	], function (err) {
		if (err) return done(err);

		models.User.findOne({
			email: 'hello@nodegear.com'
		}, done);
	});
}