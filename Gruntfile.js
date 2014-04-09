module.exports = function(grunt) {
	var files = ['package.json', 'public/js/ng.js', 'public/js/ng_auth.js'];

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		bump: {
			options: {
				files: files,
				pushTo: 'origin',
				commitFiles: files
			}
		}
	});

	grunt.loadNpmTasks('grunt-bump');
};