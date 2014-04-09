module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		bump: {
			options: {
				files: ['package.json', 'public/js/ng.js', 'public/js/ng_auth.js'],
				pushTo: "origin"
			}
		}
	});

	grunt.loadNpmTasks('grunt-bump');
};