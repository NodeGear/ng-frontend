/*
// We can pass some configuration from karma to the browser..
var args = window.__karma__.config.args;
// Extend the window object
window.workbench_config = {};
for (var i = 0; i < args.length; i++) {
	var arg = args[i];
	// arrays are objects too.. It must be an object, but not an array
	if (typeof arg === 'object' && Object.prototype.toString.call(arg) != '[object Array]') {
		for (var x in arg) {
			if (!arg.hasOwnProperty(x)) continue;
			window.workbench_config[x] = arg[x];
		}
	}
}*/

var deps = [
	'jquery',
	'angular',
	'angular-mocks',
	'couchPotato',
	'uiRouter'
];

Object.keys(window.__karma__.files).forEach(function(file) {
	if (/test\/karma\/main.js$/.test(file)) return;
	
	if (false && /^\/base\/.*/.test(file)) {
		if (!(/.js$/.test(file))) {
			file = file.replace('/base/', '').replace('.js', '');
		}
	}

	if (/test\/karma\/.*/.test(file) || /public\/js\/.*/.test(file)) {
		if (/public\/js\/.*/.test(file)) {
			file = file.replace('/base/public/js/', '').replace('.js', '');
		}
		
		// Normalize paths to RequireJS module names.
		deps.push(file);
	}
});

require.config({
	baseUrl: '/base/public/js/',

	paths: {
		angular: '../vendor/angular/angular.min',
		uiRouter: '../vendor/angular-ui-router/release/angular-ui-router.min',
		jquery: '../vendor/jquery/dist/jquery.min',
		moment: '../vendor/moment/moment',
		bootstrap: '../vendor/bootstrap/dist/js/bootstrap.min',
		couchPotato: '../vendor/angular-couch-potato/dist/angular-couch-potato',
		bugsnag: '//d2wy8f7a9ursnm.cloudfront.net/bugsnag-2.min',
		socketio: '/socket.io/socket.io.js',
		d3: '../vendor/d3/d3.min',
		async: '../vendor/async/lib/async',
		'angular-mocks': '../vendor/angular-mocks/angular-mocks'
	},
	shim: {
		angular: {
			exports: 'angular'
		},
		bugsnag: {
			exports: 'Bugsnag'
		},
		uiRouter: {
			deps: ['angular']
		},
		bootstrap: ['jquery'],
		'angular-sanitize': ['angular'],
		'angular-mocks': ['angular'],
		socketio: {
			exports: 'io'
		},
		d3: {
			exports: 'd3'
		}
	},

	deps: deps,
	callback: window.__karma__.start
});
