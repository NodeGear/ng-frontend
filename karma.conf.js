module.exports = function (config) {
  config.set({
	// base path that will be used to resolve all patterns (eg. files, exclude)
	basePath: '',
	frameworks: ['mocha', 'requirejs', 'chai'],
	files: [
		'test/karma/main.js',
		{ pattern: 'public/vendor/**/*.js', included: false, serve: true },
		{ pattern: 'public/js/**/*.js', included: false, serve: true },
		{ pattern: 'test/karma/**/*.js', included: false, serve: true }
	],
	exclude: [
		'public/js/ng.js',
		'public/js/ng_auth.js',
		'public/js/vendor/*',
		'public/js/controllers/admin/*'
	],
	// preprocess matching files before serving them to the browser
	// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
	preprocessors: {
		'public/js/**/*.js': ['coverage']
	},
	reporters: ['progress', 'coverage'],
	port: 9876,
	colors: true,

	logLevel: config.LOG_WARN,
	autoWatch: false,

	// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
	browsers: ['Chrome'],//, 'Firefox'],
	singleRun: true,

	coverageReporter: {
		type: 'html',
		dir: 'coverage-browser/'
	}
  });
};
