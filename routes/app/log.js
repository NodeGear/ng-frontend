var mongoose = require('mongoose')
	, models = require('ng-models')
	, fs = require('fs')
	, config = require('../../config')
	, util = require('../../util')
	, Tail = require('tail').Tail
	, ansi2html = new (require('ansi-to-html'))

exports.router = function (app) {
	app.get('/app/:id/log/:lid', getLog)
		.get('/app/:id/log/:lid/*', getLog)
		.get('/app/:id/log/:lid', viewLog)
		.get('/app/:id/log/:lid/download', downloadLog)
}

exports.socket = function (socket) {
	socket.on('app:watchLog', watchLog)
}
exports.socketDisconnect = function (socket) {
	cleanupWatchers(socket);
}

function getLog (req, res, next) {
	var app = res.locals.app
	var lid = req.params.lid;
	
	var log;
	if (!lid || lid == 'latest') {
		log = app.logs[0]
	} else {
		try {
			lid = mongoose.Types.ObjectId(lid);
			for (var i = 0; i < app.logs.length; i++) {
				if (app.logs[i]._id.equals(lid)) {
					log = app.logs[i]
					break;
				}
			}
		} catch (ex) {
			res.redirect('/app/'+res.locals.app._id+'/logs')
			return;
		}
	}
	
	res.locals.log = log;
	
	next()
}

function viewLog (req, res) {
	res.locals.app.getLog(res.locals.log, -1, function(log) {
		res.send({
			log: log
		})
	});
}

function downloadLog (req, res) {
	console.log(res.locals.log)
	res.locals.app.getLog(res.locals.log, -1, false, function(log) {
		console.log(log)
		res.set({
			'Content-Type': 'application/octet-stream',
			'Content-Disposition': 'attachment; filename="'+res.locals.app.name+' - '+log.created+'".log'
		})
		res.send(log.content)
	});
}

function watchLog (data) {
	var socket = this;
	
	var appId = data.app;
	var lid = data.log;
	var watch = Boolean(data.watch);
	try {
		appId = mongoose.Types.ObjectId(appId);
		lid = mongoose.Types.ObjectId(lid)
	} catch (e) {
		// invalid app id
		return;
	}
	
	models.App.findOne({
		_id: appId,
		user: socket.handshake.user._id
	}, function(err, drone) {
		if (err) throw err;
		
		if (!drone) {
			// user doesn't have privileges
			return;
		}
		
		var found = false;
		for (var i = 0; i < drone.logs.length; i++) {
			if (drone.logs[i]._id.equals(lid)) {
				found = drone.logs[i];
				break;
			}
		}
		
		if (!found) return;
		
		socket.get('app_logWatchers', function(err, watchers) {
			if (err) throw err;
			
			if (!watchers) {
				watchers = [];
			}
			
			var watcher = false;
			for (var i = 0; i < watchers.length; i++) {
				if (watchers[i].app.equals(appId) && watchers[i].log.equals(lid)) {
					watcher = i;
					break;
				}
			}
			
			if (watch) {
				// Start watching
				
				if (watcher === false) {
					console.log(found.location)
					
					var tail = new Tail(found.location);
					tail.on("line", function(data) {
						socket.emit('app:logdata', {
							app: appId,
							log: lid,
							data: ansi2html.toHtml(data)+"<br/>"
						});
					});
					
					watchers.push({
						app: appId,
						log: lid,
						tail: tail
					});
					
				} else {
					console.log("Already watching??")
				}
			} else {
				if (watcher === false) {
					console.log("not Watching??")
					return;
				}
				
				watchers[watcher].tail.unwatch();
				watchers.splice(watcher, 1);
			}
			
			socket.set('app_logWatchers', watchers);
		})
	})
}

function cleanupWatchers(socket) {
	socket.get('app_logWatchers', function(err, watchers) {
		if (err) throw err;
		
		if (!watchers) {
			return;
		}
		
		for (var i = 0; i < watchers.length; i++) {
			watchers[i].tail.unwatch();
		}
		
		watchers = [];
		return;
	})
}