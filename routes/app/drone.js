var http = require('http'),
	util = require('../../util'),
	app = require('../../app')

exports.install = function (req, res) {
	app.backend.publish("app_assign", JSON.stringify({
		id: res.locals.app._id
	}));
	
	res.format({
		html: function() {
			res.redirect('/app/'+res.locals.app._id)
		},
		json: function() {
			res.send(200, {
			})
		}
	})
}

exports.start = function (req, res) {
	app.backend.publish('app_start', JSON.stringify({
		id: res.locals.app._id
	}));
	
	res.format({
		html: function() {
			res.redirect('/app/'+res.locals.app._id)
		},
		json: function() {
			res.send(200, {
			})
		}
	})
}

exports.stop = function (req, res) {
	app.backend.publish('app_stop', JSON.stringify({
		id: res.locals.app._id
	}));
	
	res.format({
		html: function() {
			res.redirect('/app/'+res.locals.app._id)
		},
		json: function() {
			res.send(200, {
			})
		}
	})
}

exports.restart = function (req, res) {
	app.backend.publish('app_restart', JSON.stringify({
		id: res.locals.app._id
	}));
	
	res.format({
		html: function() {
			res.redirect('/app/'+res.locals.app._id)
		},
		json: function() {
			res.send(200, {
			})
		}
	})
}

exports.delete = function (req, res) {
	// TODO stop, remove from server
	res.locals.app.deleted = true;
	res.locals.app.save();
	res.redirect('/apps');
}

exports.scale = function (req, res) {
	var _app = res.locals.app;
	
	_app.processes = req.body.processes;
	if (_app.processes < 1) _app.processes = 1;
	if (_app.processes > 10) _app.processes = 10;
	
	if (app.running) {
		app.backend.publish('app_scale', JSON.stringify({
			id: _app._id,
			scale: _app.processes
		}));
	}
	
	_app.save();
	res.format({
		html: function() {
			redirect('back');
		},
		json: function() {
			res.send(200, {})
		}
	});
}