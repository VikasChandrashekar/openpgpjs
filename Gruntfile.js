module.exports = function(grunt) {

  var version = grunt.option('release');
  var fs = require('fs');
  var browser_capabilities;

  if (process.env.SELENIUM_BROWSER_CAPABILITIES !== undefined) {
    browser_capabilities = JSON.parse(process.env.SELENIUM_BROWSER_CAPABILITIES);
  }

  var getSauceKey = function getSaucekey () {
    return '60ffb656-2346-4b77-81f3-bc435ff4c103';
  };

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      openpgp: {
        files: {
          'dist/openpgp.js': ['./src/index.js']
        },
        options: {
          browserifyOptions: {
            standalone: 'openpgp'
          },
          // Don't bundle these packages with openpgp.js
          external: ['crypto', 'zlib', 'node-localstorage', 'node-fetch', 'asn1.js'],
          transform: [
            ["babelify", {
              global: true,
              // Only babelify asmcrypto in node_modules
              only: /^(?:.*\/node_modules\/asmcrypto\.js\/|(?!.*\/node_modules\/)).*$/,
              plugins: ["transform-async-to-generator",
                        "syntax-async-functions",
                        "transform-regenerator",
                        "transform-runtime"],
              ignore: ['*.min.js'],
              presets: ["env"]
            }]
          ],
          plugin: ['browserify-derequire']
        }
      },
      openpgp_debug: {
        files: {
          'dist/openpgp_debug.js': ['./src/index.js']
        },
        options: {
          browserifyOptions: {
            fullPaths: true,
            debug: true,
            standalone: 'openpgp'
          },
          external: ['crypto', 'zlib', 'node-localstorage', 'node-fetch', 'asn1.js'],
          transform: [
            ["babelify", {
              global: true,
              // Only babelify asmcrypto in node_modules
              only: /^(?:.*\/node_modules\/asmcrypto\.js\/|(?!.*\/node_modules\/)).*$/,
              plugins: ["transform-async-to-generator",
                        "syntax-async-functions",
                        "transform-regenerator",
                        "transform-runtime"],
              ignore: ['*.min.js'],
              presets: ["env"]
            }]
          ],
          plugin: ['browserify-derequire']
        }
      },
      worker: {
        files: {
          'dist/openpgp.worker.js': ['./src/worker/worker.js']
        }
      },
      unittests: {
        files: {
          'test/lib/unittests-bundle.js': ['./test/unittests.js']
        },
        options: {
          external: ['buffer', 'openpgp', '../../dist/openpgp', '../../../dist/openpgp'],
          transform: [
            ["babelify", {
              global: true,
              // Only babelify chai-as-promised in node_modules
              only: /^(?:.*\/node_modules\/chai-as-promised\/|(?!.*\/node_modules\/)).*$/,
              plugins: ["transform-async-to-generator",
                        "syntax-async-functions",
                        "transform-regenerator",
                        "transform-runtime",
                        "transform-remove-strict-mode"],
              ignore: ['*.min.js'],
              presets: ["env"]
            }]
          ]
        }
      }
    },
    replace: {
      openpgp: {
        src: ['dist/openpgp.js'],
        dest: ['dist/openpgp.js'],
        replacements: [{
          from: /OpenPGP.js VERSION/g,
          to: 'OpenPGP.js v<%= pkg.version %>'
        }]
      },
      openpgp_debug: {
        src: ['dist/openpgp_debug.js'],
        dest: ['dist/openpgp_debug.js'],
        replacements: [{
          from: /OpenPGP.js VERSION/g,
          to: 'OpenPGP.js v<%= pkg.version %>'
        }]
      },
      openpgp_min: {
        src: ['dist/openpgp.min.js'],
        dest: ['dist/openpgp.min.js'],
        replacements: [{
          from: "openpgp.worker.js",
          to: "openpgp.worker.min.js"
        }]
      },
      worker_min: {
        src: ['dist/openpgp.worker.min.js'],
        dest: ['dist/openpgp.worker.min.js'],
        replacements: [{
          from: "openpgp.js",
          to: "openpgp.min.js"
        }]
      }
    },
    uglify: {
      openpgp: {
        files: {
          'dist/openpgp.min.js' : ['dist/openpgp.js'],
          'dist/openpgp.worker.min.js' : ['dist/openpgp.worker.js']
        }
      },
      options: {
        banner: '/*! OpenPGP.js v<%= pkg.version %> - ' +
          '<%= grunt.template.today("yyyy-mm-dd") %> - ' +
          'this is LGPL licensed code, see LICENSE/our website <%= pkg.homepage %> for more information. */'
      }
    },
    jsbeautifier: {
      files: ['src/**/*.js'],
      options: {
        indent_size: 2,
        preserve_newlines: true,
        keep_array_indentation: false,
        keep_function_indentation: false,
        wrap_line_length: 120
      }
    },
    eslint: {
      target: ['src/**/*.js'],
      options: { configFile: '.eslintrc.js' }
    },
    jsdoc: {
      dist: {
        src: ['README.md', 'src'],
        options: {
          configure: '.jsdocrc.js',
          destination: 'doc',
          recurse: true
        }
      }
    },
    mocha_istanbul: {
      coverage: {
        src: 'test',
        options: {
          root: '.',
          timeout: 240000
        }
      }
    },
    mochaTest: {
      unittests: {
        options: {
          reporter: 'spec',
          timeout: 120000
        },
        src: ['test/unittests.js']
      }
    },
    copy: {
      browsertest: {
        expand: true,
        flatten: true,
        cwd: 'node_modules/',
        src: ['mocha/mocha.css', 'mocha/mocha.js'],
        dest: 'test/lib/'
      },
      bzip2: {
        expand: true,
        cwd: 'node_modules/compressjs/bin/',
        src: ['bzip2.build.js'],
        dest: 'src/compression/'
      }
    },
    clean: ['dist/'],
    connect: {
      dev: {
        options: {
          port: 3001,
          base: '.',
          keepalive: true
        }
      },
      test: {
        options: {
          port: 3000,
          base: '.'
        }
      }
    },
    'saucelabs-mocha': {
      all: {
        options: {
          username: 'openpgpjs',
          key: getSauceKey,
          urls: ['http://127.0.0.1:3000/test/unittests.html'],
          build: process.env.TRAVIS_BUILD_ID,
          testname: 'Sauce Unit Test for openpgpjs',
          browsers: [browser_capabilities],
          public: "public",
          maxRetries: 3,
          throttled: 2,
          pollInterval: 4000,
          'max-duration': 360,
          statusCheckAttempts: 200
        }
      }
    },
    watch: {
      src: {
        files: ['src/**/*.js'],
        tasks: ['browserify:openpgp', 'browserify:worker']
      },
      test: {
        files: ['test/*.js', 'test/crypto/**/*.js', 'test/general/**/*.js', 'test/worker/**/*.js'],
        tasks: ['browserify:unittests']
      }
    }
  });

  // Load the plugin(s)
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify-es');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-jsbeautifier');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('gruntify-eslint');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-saucelabs');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('set_version', function() {
    if (!version) {
      throw new Error('You must specify the version: "--release=1.0.0"');
    }

    patchFile({
      fileName: 'package.json',
      version: version
    });

    patchFile({
      fileName: 'npm-shrinkwrap.json',
      version: version
    });

    patchFile({
      fileName: 'bower.json',
      version: version
    });
  });

  function patchFile(options) {
    var path = './' + options.fileName,
      file = require(path);

    if (options.version) {
      file.version = options.version;
    }

    fs.writeFileSync(path, JSON.stringify(file, null, 2) + '\n');
  }

  // Build tasks
  grunt.registerTask('version', ['replace:openpgp', 'replace:openpgp_debug']);
  grunt.registerTask('replace_min', ['replace:openpgp_min', 'replace:worker_min']);
  grunt.registerTask('default', ['clean', 'copy:bzip2', 'browserify', 'version', 'uglify', 'replace_min']);
  grunt.registerTask('documentation', ['jsdoc']);
  // Test/Dev tasks
  grunt.registerTask('test', ['eslint', 'mochaTest']);
  grunt.registerTask('coverage', ['mocha_istanbul:coverage']);
  grunt.registerTask('saucelabs', ['default', 'copy:browsertest', 'connect:test', 'saucelabs-mocha']);
  grunt.registerTask('browsertest', ['default', 'copy:browsertest', 'connect:test', 'watch']);

};
