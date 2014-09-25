'use strict';

define(['app'], function (app) {
	beforeEach(function () {
		module('nodegear');
	});

	describe('hmm', function () {
		it('can count', function () {
			(1+2).should.equal(3);
		})
	})
});