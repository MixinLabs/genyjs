Handlebars = require 'handlebars'

module.exports = (grunt) ->
  
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')
    jshint:
      all: ['lib/**/*.js']
      jshintrc: '.jshintrc'
    mochaTest:
      test:
        src: ['test/**/*.js']
    watch:
      files: ['<%= jshint.all %>']
      tasks: ['mochaTest']

  # Load Grunt.js plugins
  grunt.loadNpmTasks 'grunt-contrib-jshint'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-mocha-test'

  # Custom tasks
  grunt.registerTask 'readme', ->
    readmePath = "#{__dirname}/README.md"
    tmpl = grunt.file.read "#{readmePath}.hbs"
    tmpl = Handlebars.compile tmpl
    grunt.file.write readmePath, tmpl(grunt.config 'pkg')

  grunt.registerTask 'test', ['readme', 'mochaTest']
  grunt.registerTask 'default', ['jshint', 'readme', 'mochaTest']