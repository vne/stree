module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= pkg.version %> // <%= grunt.template.today("dd.mm.yyyy") %> // <%= pkg.author %> // <%= pkg.homepage %> */\n',
				mangle: true,
				compress: true,
				preserveComments: false
			},
			build: {
				src: 'stree.js',
				dest: 'stree.min.js'
			}
		},
		simplemocha: {
			options: {
				globals: ['should'],
				timeout: 3000,
				ignoreLeaks: false,
				ui: 'bdd',
				reporter: 'tap'
			},
			all: {
				src: ["test.js"]
			}
		},
		markdown: {
			all: {
				expand: true,
				src: '*.md',
				dest: '.',
				ext: '.html'
			}
		},

	});
	// grunt.loadNpmTasks('grunt-mkdir');
	// grunt.loadNpmTasks('grunt-contrib-clean');
	// grunt.loadNpmTasks('grunt-natural-docs');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-simple-mocha');

	grunt.loadNpmTasks('grunt-markdown');

	grunt.registerTask('test', ['simplemocha']);
	// grunt.registerTask('docs', ['mkdir', 'natural_docs', 'clean']);
	grunt.registerTask('build', ['uglify', /*'markdown'*/]);
	grunt.registerTask('benchmark', ["execute"]);

	grunt.registerTask('default', ['test', 'build']);
}