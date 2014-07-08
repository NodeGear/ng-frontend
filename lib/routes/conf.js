var config = require('../config');

exports.unauthorized = function (app, template) {
	template(['invitation_thanks']);
	
	app.get('/api/system/config', getConfig);
}

function getConfig (req, res) {
	res.send(200, config.public_config);
}