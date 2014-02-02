// SSH Keys
var mongoose = require('mongoose')
	, schema = mongoose.Schema
	, ObjectId = schema.ObjectId
	, config = require('../config')
	, fs = require('fs')
	, User = require('./User')
	, async = require('async')
	, exec = require('child_process').exec
	, util = require('../util')
	
var s = schema({
	key: String,
	user: { type: ObjectId, ref: 'User' },
	created: Date
})

s.statics.updateConfig = function (cb) {
	var base = "repo gitolite-admin\n\
    RW+     =   matej root\n\
\n";
	
	require('./User').find({}).select('email').exec(function(err, users) {
		if (err) throw err;
		
		for (var i = 0; i < users.length; i++) {
			var user = users[i];
			if (!user.email) {
				console.log("Undefined email address for "+user._id)
				continue;
			}
			
			base += "repo "+user.email+"/..*\n\
    C     =   "+user._id+"\n\
    RW+   =   CREATOR\n\
\n";
		}
		
		if (util.isDemo) {
			cb()
		} else {
			fs.writeFile(config.gitoliteConfig, base, function(err) {
				if (err) throw err;
			
				cb()
			})
		}
	})
	
}

s.methods.updateFile = function (cb) {
	var self = this;
	
	if (util.isDemo) {
		cb()
		return;
	}
	
	var keyfile = config.gitoliteKeys+self.user+".pub"
	
	if (self.key.length == 0) {
		// delete the key
		fs.exists(keyfile, function(exists) {
			if (exists) {
				fs.unlink(keyfile, function(err) {
					if (err) throw err;
					
					cb()
				})
			}
		})
		return;
	}
	
	// Procedure:
	// Write temp file
	// Check ssh-keygen verification for the file
	// Unlink temp file
	// Write file to repo
	// Write config to repo
	// run updatePublicKey.sh
	var tempKey = config.tmp+"pub_"+Date.now()
	async.series([
		function(done) {
			fs.writeFile(tempKey, self.key, done)
		},
		function(done) {
			exec('ssh-keygen -lf '+tempKey).on('close', function(code) {
				if (code === 0) {
					done(null)
					return;
				}
				
				self.key = "";
				done("Verification failed")
			})
		},
		function(done) {
			fs.unlink(tempKey, done)
		},
		function(done) {
			fs.writeFile(keyfile, self.key, done)
		},
		function(done) {
			module.exports.updateConfig(function() {
				done(null)
			})
		},
		function(done) {
			var update = exec(__dirname+"/../scripts/updatePublicKey.sh "+config.gitolite)
			update.on('close', function(code) {
				console.log(code);
				if (code === 0) done(null)
				else done("Did not update key")
			})
			update.stdout.on('data', function(data) {
				console.log(data)
			})
			update.stderr.on('data', function(data) {
				console.log(data)
			})
		}
	], function(err, results) {
		if (err) {
			console.log(err);
			
			cb(err);
			return;
		}
		
		cb()
	})
}

module.exports = mongoose.model("PublicKey", s);