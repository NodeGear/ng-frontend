var config = require('../config');
var app = require('../app');
var request = require('supertest').agent(app.app)

var should = require('should'),
	models = require('../models')

if (!process.env.NG_TEST) {
	console.log("\nNot in TEST environment. Please export NG_TEST variable\n");
}

should(process.env.NG_TEST).be.ok;

it('clean the database', function(done) {
	require('async').parallel([
		function(cb) {
			models.Analytic.remove(cb)
		},
		function(cb) {
			models.Drone.remove(cb)
		},
		function(cb) {
			models.Event.remove(cb)
		},
		function(cb) {
			models.PaymentMethod.remove(cb)
		},
		function(cb) {
			models.PublicKey.remove(cb)
		},
		function(cb) {
			models.TFA.remove(cb)
		},
		function(cb) {
			models.Ticket.remove(cb)
		},
		function(cb) {
			models.Transaction.remove(cb)
		},
		function(cb) {
			models.Usage.remove(cb)
		},
		function(cb) {
			models.User.remove(cb)
		}
	], done)
})