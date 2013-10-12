var http = require('http')

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
	sendGet('/assign/'+res.locals.app._id, function () {
		res.redirect('/app/'+res.locals.app._id)
	});
}

exports.start = function (req, res) {
	sendGet('/start/'+res.locals.app._id, function() {
		res.redirect('/app/'+res.locals.app._id)
	})
}

exports.stop = function (req, res) {
	sendGet('/stop/'+res.locals.app._id, function() {
		res.redirect('/app/'+res.locals.app._id)
	})
}

exports.restart = function (req, res) {
	sendGet('/restart/'+res.locals.app._id, function() {
		res.redirect('/app/'+res.locals.app._id)
	})
}

exports.delete = function (req, res) {
	// TODO stop, remove from server
	res.locals.app.deleted = true;
	res.locals.app.save();
	res.redirect('/apps');
}