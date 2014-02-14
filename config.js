var fs = require('fs')
	, mailer = require('nodemailer')

this.version = '0.0.3';
this.hash = '';
this.env = process.env.NODE_ENV == "production" ? "production" : "development";
this.transport = mailer.createTransport("Mandrill", {
	auth: {
		user: "matej@matej.me",
		pass: ""
	}
})

this.db_options = {
	auto_reconnect: true,
	native_parser: true,
	server: {
		auto_reconnect: true
	}
};
if (this.env == "production") {
	this.db_options.replset = {
		rs_name: "rs0"
	};
	var auth = "mongodb://nodegear:Jei4hucu5fohNgiengohgh8Pagh4fuacahQuiwee";
	this.db = auth+"@repl1.mongoset.castawaydev.com/nodegear,"+auth+"@repl2.mongoset.castawaydev.com";
	
	this.port = process.env.PORT || 80;
	this.droneLocation = "/var/ng_apps/";
	this.gitolite = "/var/ng_gitolite/";
	this.gitoliteKeys = this.gitolite+"keydir/";
	this.gitoliteConfig = this.gitolite+"conf/gitolite.conf";
} else {
	this.db = "mongodb://127.0.0.1/nodegear";
	
	this.port = process.env.PORT || 3000;
	this.droneLocation = process.env.HOME+"/ng_apps/";
	this.gitolite = process.env.HOME+"/dev/nodegear-gitolite/";
	this.gitoliteKeys = this.gitolite+"keydir/";
	this.gitoliteConfig = this.gitolite+"conf/gitolite.conf";
}

this.path = __dirname;

this.tmp = "/tmp/nodegear/";

fs.exists(this.tmp, function(exists) {
	if (!exists) {
		console.log("Creating tmp dir")
		fs.mkdir(self.tmp, function(err) {
			if (err) throw err;
		})
	}
})
fs.exists(this.droneLocation, function(exists) {
	if (!exists) {
		console.log("Creating drone location dir")
		fs.mkdir(self.droneLocation, function(err) {
			if (err) throw err;
		})
	}
})