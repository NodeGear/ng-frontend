var mongoose = require('mongoose')
	, models = require('../../models')
	, fs = require('fs')
	, config = require('../../config')
	, drone = require('./drone')
	, util = require('../../util')

exports.router = function (app) {
	app.get('/app/:id/log', viewLogs)
		.get('/app/:id/log/:lid', getLog)
		.get('/app/:id/log/:lid/*', getLog)
		.get('/app/:id/log/:lid', viewLog)
		.get('/app/:id/log/:lid/download', downloadLog)
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

function viewLogs (req, res) {
	res.render('app/logs')
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