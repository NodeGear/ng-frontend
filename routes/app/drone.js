var http = require('http'),
	util = require('../../util'),
	app = require('../../app')

exports.install = function (req, res) {
	if (res.locals.app._id.toString() != "5293dfc8d2e0794750000003" && util.isDemo == true) {
		res.locals.app.installedOn = "demo";
		res.locals.app.isInstalled = true;
		res.locals.app.save();
		res.format({
			html: function() {
				res.redirect('/app/'+res.locals.app._id)
			},
			json: function() {
				res.send(200, {
				})
			}
		})
		return;
	}
	
	app.backend.emit('assign', {
		id: res.locals.app._id
	});
	
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
	if (res.locals.app._id.toString() != "5293dfc8d2e0794750000003" && util.isDemo == true) {
		res.locals.app.isRunning = true;
		res.locals.app.save();
		res.format({
			html: function() {
				res.redirect('/app/'+res.locals.app._id)
			},
			json: function() {
				res.send(200, {
				})
			}
		})
		return;
	}
	
	app.backend.emit('start', {
		id: res.locals.app._id
	});
	
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
	if (res.locals.app._id.toString() != "5293dfc8d2e0794750000003" && util.isDemo == true) {
		res.locals.app.isRunning = false;
		res.locals.app.save();
		res.format({
			html: function() {
				res.redirect('/app/'+res.locals.app._id)
			},
			json: function() {
				res.send(200, {
				})
			}
		})
		return;
	}
	
	app.backend.emit('stop', {
		id: res.locals.app._id
	});
	
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
	if (res.locals.app._id.toString() != "5293dfc8d2e0794750000003" && util.isDemo == true) {
		res.locals.app.isRunning = true;
		res.locals.app.save();
		res.format({
			html: function() {
				res.redirect('/app/'+res.locals.app._id)
			},
			json: function() {
				res.send(200, {
				})
			}
		})
		return;
	}
	
	app.backend.emit('restart', {
		id: res.locals.app._id
	});
	
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
	if (util.isDemo == true) {
		res.format({
			html: function() {
				res.redirect('/app/'+res.locals.app._id)
			},
			json: function() {
				res.send(200, {
				})
			}
		})
		return;
	}
	
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
	
	app.backend.emit('scale', {
		scale: _app.processes,
		id: _app._id
	});
	
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