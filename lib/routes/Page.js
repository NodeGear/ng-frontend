function Page (obj) {
	this.obj = obj;
}

Page.prototype.route = function (app) {
	var obj = this.obj;

	var map = obj.map;

	this.map(app, map);
};

Page.prototype.map = function (app, map, baseURL) {
	var obj = this.obj;

	if (typeof baseURL === 'undefined') baseURL = '';

	for (var o in map) {
		if (!map.hasOwnProperty(o)) continue;

		var route = map[o];
		var middleware = [baseURL+route.url];
		var _middleware = route.middleware;
		if (!_middleware) _middleware = [];

		var method = route.method;
		if (!method) method = 'get';

		for (var i = 0; i < _middleware.length; i++) {
			var fn;
			if (typeof _middleware[i] === 'function') fn = _middleware[i];
			else if (typeof _middleware[i] === 'string') fn = obj[_middleware[i]];
			else throw new Error("Unknown Middleware method", _middleware[i]);

			middleware.push(fn);
		}

		if (route.params) {
			for (var p in route.params) {
				if (!route.params.hasOwnProperty(p)) continue;

				var param = route.params[p];
				if (typeof param === 'string') param = obj[route.params[i]];
				
				app.param(p, param);
			}
		}

		if (route.call) {
			var call;
			if (typeof route.call === 'function') call = route.call;
			else if (typeof route.call === 'string') call = obj[route.call];
			else throw new Error("Unknown Call method", route.call);

			middleware.push(call);
		}

		if (!route.call && _middleware.length > 0 && !route.method) {
			// Its just middleware, assume we want 'all';
			method = 'all';
		}

		if (middleware.length > 1) {
			app[method].apply(app, middleware);
		}

		//console.log('app.'+method, middleware);

		if (route.children) {
			// Recursively unroll the map..
			this.map(app, route.children, route.url);
		}
	}
};

module.exports = Page;