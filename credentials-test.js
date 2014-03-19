exports.redis_key = "ahShii3ahyoo0OhJa1ooG4yoosee8me9EvahW0ae";

exports.stripe_keys = {
	pub: "pk_test_YmJEMIhaSRCwfxuoKEJzt7z0",
	secret: "sk_test_mmZnb9OiVoxdrFj6wuQGvMvP"
};

exports.transport = {
	auth: {
		user: "matej@matej.me",
		pass: "eELIT9FIJIU52NaWvrMrPg"
	}
}

exports.db = "mongodb://127.0.0.1/nodegear-test";
exports.port = process.env.PORT || 3000;

exports.droneLocation = process.env.HOME+"/ng_apps_test/";
exports.gitolite = process.env.HOME+"/dev/nodegear-gitolite-test/";
exports.gitoliteKeys = exports.gitolite + "keydir/";
exports.gitoliteConfig = exports.gitolite + "conf/gitolite.conf";

exports.db_options = null;