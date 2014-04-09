var config = require('./config')

module.exports = function() {
	var staticFolders = [];

	['js', 'css', 'img', 'fonts'].forEach(function(folder) {
		staticFolders.push(
			new RegExp('/'+folder+'/'+config.version+'/.*')
		);
	});

	var replace = new RegExp('/'+config.version+'/');

	this.middleware = function(req, res, next) {
		// Versioning of static files
		for (var folder in staticFolders) {
			if (!staticFolders.hasOwnProperty(folder)) {
				continue;
			}

			if (req.url.match(staticFolders[folder])) {
				req.path = req.url = req.url.replace(replace, '/');

				break;
			}
		}

		next();
	}

	return this.middleware;
}