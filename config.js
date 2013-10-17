var fs = require('fs')

module.exports = new (function() {
	var self = this;
	
	this.env = process.env.NODE_ENV == "production" ? "production" : "development";
	
	if (this.env == "production") {
		this.db = "mongodb://nodecloud:Jei4hucu5fohNgiengohgh8Pagh4fuacahQuiwee@127.0.0.1/nodecloud";
		this.port = process.env.PORT || 80;
		this.droneLocation = "/var/cloudapps/";
		this.gitolite = "/var/gitolite/";
		this.gitoliteKeys = this.gitolite+"keydir/";
		this.gitoliteConfig = this.gitolite+"conf/gitolite.conf";
	} else {
		this.db = "mongodb://127.0.0.1/nodecloud";
		this.port = process.env.PORT || 3000;
		this.droneLocation = process.env.HOME+"/cloudapps/";
		this.gitolite = process.env.HOME+"/dev/gitolite-admin/";
		this.gitoliteKeys = this.gitolite+"keydir/";
		this.gitoliteConfig = this.gitolite+"conf/gitolite.conf";
	}
	
	this.tmp = "/tmp/nodecloud/";
	
	fs.exists(this.tmp, function(exists) {
		if (!exists) {
			console.log("Creating tmp dir")
			fs.mkdir(self.tmp, function(err) {
				if (err) throw err;
			})
		}
	})
})()