module.exports = function(grunt) {
    grunt.initConfig({
    	copy: {
    		js: {
    			src: 'src/tinyscroll.js',
    			dest: 'dist/tinyscroll.js'
    		},
            css: {
                src: 'src/tinyscroll.css',
                dest: 'dist/tinyscroll.css'
            }
    	},

    	uglify: {
    		file: {
    			src: 'src/tinyscroll.js',
    			dest: 'dist/tinyscroll.min.js'
    		}
    	}
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('js', ['copy', 'uglify']);
    grunt.registerTask('default', ['js']);
};
