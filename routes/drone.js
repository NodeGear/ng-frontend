var http = require('http')

exports.install = function (req, res) {
	http.get({
		host: '127.0.0.1',
		port: 8017,
		path: '/assign/'+res.locals.app._id
	}, function (response) {
		console.log('STATUS: ' + response.statusCode);
		console.log('HEADERS: ' + JSON.stringify(response.headers));
		response.setEncoding('utf8');
		response.on('data', function (chunk) {
			console.log('BODY: ' + chunk);
			res.redirect('/app/'+res.locals.app._id)
		});
	}).on('error', function(e) {
		console.log(e);
	})
}

exports.start = function (req, res) {
	http.get({
		host: '127.0.0.1',
		port: 8017,
		path: '/start/'+res.locals.app._id
	}, function (response) {
		console.log('STATUS: ' + response.statusCode);
		console.log('HEADERS: ' + JSON.stringify(response.headers));
		response.setEncoding('utf8');
		response.on('data', function (chunk) {
			console.log('BODY: ' + chunk);
			res.redirect('/app/'+res.locals.app._id)
		});
	}).on('error', function(e) {
		console.log(e);
	})
}

exports.stop = function (req, res) {
	
}

exports.restart = function (req, res) {
	
}

exports.delete = function (req, res) {
	
}