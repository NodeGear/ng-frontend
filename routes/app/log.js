var mongoose = require('mongoose')
	, models = require('ng-models')
	, fs = require('fs')
	, config = require('../../config')
	, util = require('../../util')
	, Tail = require('tail').Tail
	, ansi2html = new (require('ansi-to-html'))
	, app = require('../../app')

exports.httpRouter = function (app) {
	app.get('/app/:id/logs/:pid/:lid/download', getProcess, getLogId, downloadLog);
}

exports.router = function (app) {
	app.get('/app/:id/logs/:pid', getProcess, getLogs)
		.get('/app/:id/logs/:pid/*', getProcess)
		.get('/app/:id/logs/:pid/:lid', getLogId, getLog)
		.get('/app/:id/logs/:pid/:lid/download', getLogId, downloadLog)
}

exports.socket = function (socket) {
}
exports.socketDisconnect = function (socket) {
}

function getProcess (req, res, next) {
	var pid = req.params.pid;
	
	try {
		pid = mongoose.Types.ObjectId(pid);
	} catch (ex) {
		res.send({
			status: 400,
			logs: []
		});
		return;
	}

	models.AppProcess.findOne({
		_id: pid,
		app: res.locals.app._id
	}, function(err, process) {
		if (err) throw err;

		if (!process) {
			res.send({
				status: 404,
				message: "Not Found"
			});
			return;
		}

		res.locals.process = process;

		next();
	});
}

function getLogs (req, res) {
	var pid = res.locals.process._id;

	app.backend.lrange('pm:app_process_logs_'+pid, 0, -1, function(err, logs) {
		if (err) throw err;

		res.send({
			status: 200,
			logs: logs
		})
	})
}

function getLogId (req, res, next) {
	var lid = req.params.lid;
	var pid = req.params.pid;

	// Gets the log id for Latest.. Also checks if the log belongs to the process.

	if (lid == 'Latest') {
		app.backend.lindex('pm:app_process_logs_'+pid, 0, function(err, latest) {
			if (err) throw err;

			res.locals.lid = latest;
			next();
		});

		return;
	}

	if (lid.indexOf(pid+'_') == -1) {
		// Not this process' log file
		res.send({
			status: 400
		});

		return;
	}

	res.locals.lid = lid;
	next();
}

function getLog (req, res) {
	app.backend.lrange('pm:app_process_log_'+res.locals.lid, 0, 100, function(err, entries) {
		if (err) throw err;

		res.send({
			status: 200,
			entries: entries
		})
	})
}

function downloadLog (req, res) {
	app.backend.lrange('pm:app_process_log_'+res.locals.lid, 0, -1, function(err, entries) {
		if (err) throw err;

		res.set({
			'Content-Type': 'application/octet-stream',
			'Content-Disposition': 'attachment; filename="'+res.locals.app.nameUrl+'-'+res.locals.lid+'.log"'
		})
		res.send(entries.reverse().join(''));
	});
}