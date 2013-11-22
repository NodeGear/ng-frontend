var http = require('http'),
	util = require('../../util')

function sendGet (to, cb) {
	http.get({
		host: '127.0.0.1',
		port: 8017,
		path: to
	}, function (response) {
		console.log('STATUS: ' + response.statusCode);
		console.log('HEADERS: ' + JSON.stringify(response.headers));
		response.setEncoding('utf8');
		response.on('data', function (chunk) {
			console.log('BODY: ' + chunk);
			cb();
		});
	}).on('error', function(e) {
		console.log(e);
	})
}

exports.install = function (req, res) {
	if (util.isDemo) {
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
	
	sendGet('/assign/'+res.locals.app._id, function () {
		res.format({
			html: function() {
				res.redirect('/app/'+res.locals.app._id)
			},
			json: function() {
				res.send(200, {
				})
			}
		})
	});
}

exports.start = function (req, res) {
	if (util.isDemo) {
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
	
	sendGet('/start/'+res.locals.app._id, function() {
		res.format({
			html: function() {
				res.redirect('/app/'+res.locals.app._id)
			},
			json: function() {
				res.send(200, {
				})
			}
		})
	})
}

exports.stop = function (req, res) {
	if (util.isDemo) {
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
	
	sendGet('/stop/'+res.locals.app._id, function() {
		res.format({
			html: function() {
				res.redirect('/app/'+res.locals.app._id)
			},
			json: function() {
				res.send(200, {
				})
			}
		})
	})
}

exports.restart = function (req, res) {
	if (util.isDemo) {
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
	
	sendGet('/restart/'+res.locals.app._id, function() {
		res.format({
			html: function() {
				res.redirect('/app/'+res.locals.app._id)
			},
			json: function() {
				res.send(200, {
				})
			}
		})
	})
}

exports.delete = function (req, res) {
	if (util.isDemo) {
		res.locals.app.deleted = true;
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
	
	// TODO stop, remove from server
	res.locals.app.deleted = true;
	res.locals.app.save();
	res.redirect('/apps');
}