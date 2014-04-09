module.exports = function(grunt) {
	var files = ['package.json'];

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