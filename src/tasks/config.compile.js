'use strict';

var config = require('./../build.config.js').getConfig();
var utils = require('./../utils/common.js');
var cacheBusting = require('./../utils/cacheBusting.js');
var path = require('path');

var compileTasksConfig = {

  copy: {
    compile_css: {
      options: {
        outRelative: 'main.css',
        out: config.build.compile.outdir + '/<%= copy.compile_css.options.outRelative %>'
      },
      files: [{
        src: '<%= concat.prepare_css.options.out %>',
        dest: '<%= copy.compile_css.options.out %>'
      }]
    },
    compile_translations: {
      options: {
        out: config.build.compile.outdir
      },
      files: [
        {
          expand: true,
          cwd: '<%= copy.prepare_app_translations.options.out %>',
          src: config.app.files.translations,
          dest: '<%= copy.compile_translations.options.out %>'
        }
      ]
    },

    compile_templates: {
      files: [
        {
          expand: true,
          cwd: '<%= copy.prepare_app_templates.options.out %>',
          src: [
            config.app.files.templates,
            config.common.files.templates
          ],
          dest: config.build.compile.outdir
        }
      ]
    },
    compile_assets: {
      files: [
        {
          expand: true,
          cwd: config.build.prepare.outdir + '/assets',
          src: [ '**' ],
          dest: config.build.compile.outdir + '/assets/'
        }
      ]
    },
    compile_cacheBusting: {
      options: {
        out: config.build.compile.outdir + '/' + config.build.compile.cacheBustingDir
      },
      files: [{
        expand: true,
        cwd: config.build.compile.outdir,
        src: [ '**', '!index.html'],
        dest: '<%= copy.compile_cacheBusting.options.out %>'
      }]
    }
  },

  clean: {
    compile_cacheBusting: [
      config.build.compile.outdir + '/*',
      '!' + config.build.compile.outdir + '/index.html',
      '!<%= copy.compile_cacheBusting.options.out %>/**'
    ]
  },

  concat: {
    /**
     * The `compile_js` target is the concatenation of our application source
     * code and all specified vendor source code into a single file.
     */
    compile_js: {
      options: {
        outRelative: 'main.js',
        out: config.build.compile.outdir + '/<%= concat.compile_js.options.outRelative %>'
      },
      files: [{
        nosort: true,
        src: (function () {
          return [].concat(
            config.vendor.files.js.map(utils.addCwdToPattern('<%= copy.prepare_vendor_js.options.out %>')),
            path.normalize(__dirname + './../snippets/module.prefix'),
            config.common.files.js.map(utils.addCwdToPattern('<%= copy.prepare_common_js.options.out %>')),
            config.app.files.js.map(utils.addCwdToPattern('<%= copy.prepare_app_js.options.out %>')),
            '<%= html2js.compile_templates.options.out %>',
            '<%= translations2js.prepare.options.out %>',
            path.normalize(__dirname + './../snippets/module.suffix')
          );
        })(),
        dest: '<%= concat.compile_js.options.out %>'
      }]
    }
  },

  /**
   * `ng-min` annotates the sources before minifying. That is, it allows us
   * to code without AngularJS's array syntax for dependency injection.
   */
  ngmin: {
    compile: {
      files: [
        {
          expand: true,
          cwd: '<%= copy.prepare_app_js.options.out %>',
          src: config.app.files.js,
          dest: '<%= copy.prepare_app_js.options.out %>'
        },
        {
          expand: true,
          cwd: '<%= copy.prepare_common_js.options.out %>',
          src: config.common.files.js,
          dest: '<%= copy.prepare_common_js.options.out %>'
        }
      ]
    }
  },

  cssmin: {
    compile: {
      options: {
        banner: '<%= meta.banner %>'
      },
      src: [ '<%= copy.compile_css.options.out %>' ],
      dest: '<%= copy.compile_css.options.out %>'
    }
  },

  /**
   * Minify the sources!
   */
  uglify: {
    compile: {
      options: {
        banner: '<%= meta.banner %>'
      },
      files: [{
        '<%= concat.compile_js.options.out %>': '<%= concat.compile_js.options.out %>'
      }]
    }
  },

  minjson: {
    compile_translations: {
      files: [{
        expand: true,
        cwd: '<%= copy.compile_translations.options.out %>',
        src: config.app.files.translations,
        dest: '<%= copy.compile_translations.options.out %>'
      }]
    }
  },

  indexHtml: {
    /**
     * When it is time to have a completely compiled application, we can
     * alter the above to include only a single JavaScript and a single CSS
     * file.
     */
    compile: {
      options: {
        base: [
          config.build.prepare.outdir,
          config.build.compile.outdir
        ],
        dir: config.build.compile.outdir,
        angular_module: config.app.angular_module.regular
      },
      files: [{
        src: [
          '<%= concat.compile_js.options.out %>',
          '<%= concat.prepare_css.options.out %>'
        ]
      }]
    }
  },

  htmlmin: {
    compile_templates: {
      files: [
        {
          expand: true,
          cwd: '<%= copy.prepare_app_templates.options.out %>',
          src: config.app.files.templates,
          dest: '<%= copy.prepare_app_templates.options.out %>'
        },
        {
          expand: true,
          cwd: '<%= copy.prepare_common_templates.options.out %>',
          src: config.common.files.templates,
          dest: '<%= copy.prepare_app_templates.options.out %>'
        }
      ]
    },
    compile_index: {
      files: [{
        src: config.build.compile.outdir + '/index.html',
        dest: config.build.compile.outdir + '/index.html'
      }]
    }
  },

  html2js: {
    compile_templates: {
      options: {
        base: '<%= copy.prepare_app_templates.options.out %>',
        module: config.app.angular_module.templates,
        out: config.build.prepare.outdir + '/js/templates.js'
      },
      files: [
        {
          expand: true,
          cwd: '<%= copy.prepare_app_templates.options.out %>',
          src: [
            config.common.files.templates2js,
            config.app.files.templates2js
          ],
          // task requires a dir as dest so we must use the rename function to place all templates into one js file
          dest: config.build.prepare.outdir,
          rename: function () {
            return '<%= html2js.compile_templates.options.out %>';
          }
        }
      ]
    }
  },

  updateConfig: {
    replace_compile_cacheBusting: {
      update: {
        'replace.compile_cacheBusting.options.patterns': cacheBusting.compilePatterns
      }
    }
  },

  replace: {
    compile_cacheBusting: {
      options: {
        prefix: '',
        // will be set by updateConfig:compile_cacheBusting
        patterns: []
      },
      files: [
        {
          expand: true,
          cwd: config.build.compile.outdir,
          src: [
            'index.html',
            config.build.compile.cacheBustingDir + '/main.js'
            /**
             * do not replace paths within main.css because they have to be relative to the css file,
             * which already is located under the cache busting dir
             */
          ],
          dest: config.build.compile.outdir
        },
        {
          expand: true,
          cwd: config.build.compile.outdir + '/' + config.build.compile.cacheBustingDir,
          src: [
            config.app.files.templates,
            config.common.files.templates
          ],
          dest: config.build.compile.outdir + '/' + config.build.compile.cacheBustingDir
        }
      ]
    }
  }

};

module.exports = compileTasksConfig;