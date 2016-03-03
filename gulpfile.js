"use strict";

/*global require*/

var fs = require('fs');
var spawnSync = require('spawn-sync');
var glob = require('glob-all');
var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var exorcist = require('exorcist');
var buffer = require('vinyl-buffer');
var transform = require('vinyl-transform');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var NpmImportPlugin = require('less-plugin-npm-import');
var jsoncombine = require('gulp-jsoncombine');
var ejs = require('ejs');
var child_exec = require('child_process').exec;  // child_process is built in to node

var appJSName = 'nationalmap.js';
var appCssName = 'nationalmap.css';
var specJSName = 'nationalmap-tests.js';
var appEntryJSName = './index.js';
var terriaJSSource = 'node_modules/terriajs/wwwroot';
var terriaJSDest = 'wwwroot/build/TerriaJS';
var testGlob = './test/**/*.js';

var watching = false; // if we're in watch mode, we try to never quit.

// Create the build directory, because browserify flips out if the directory that might
// contain an existing source map doesn't exist.

if (!fs.existsSync('wwwroot/build')) {
    fs.mkdirSync('wwwroot/build');
}

gulp.task('build-app', ['prepare-terriajs'], function() {
    return build(appJSName, appEntryJSName, false);
});

gulp.task('build-specs', ['prepare-terriajs'], function() {
    return build(specJSName, glob.sync(testGlob), false);
});

gulp.task('build-css', function() {
    return gulp.src('./index.less')
        .on('error', onError)
        .pipe(less({
            plugins: [
                new NpmImportPlugin()
            ]
        }))
        .pipe(rename(appCssName))
        .pipe(gulp.dest('./wwwroot/build/'));
});

gulp.task('build', ['build-css', 'merge-datasources', 'merge-datasources-aremi', 'build-app', 'build-specs']);

gulp.task('release-app', ['prepare'], function() {
    return build(appJSName, appEntryJSName, true);
});

gulp.task('release-specs', ['prepare'], function() {
    return build(specJSName, glob.sync(testGlob), true);
});

// Generate new schema for editor, and copy it over whatever version came with editor.
gulp.task('make-editor-schema', ['copy-editor'], function(done) {
    child_exec('node node_modules/.bin/gen-schema --source node_modules/terriajs --dest wwwroot/editor --noversionsubdir', undefined, done);
});

gulp.task('copy-editor', function() {
    return gulp.src('./node_modules/terriajs-catalog-editor/**')
        .pipe(gulp.dest('./wwwroot/editor'));
});

gulp.task('release', ['build-css', 'merge-datasources', 'merge-datasources-aremi', 'release-app', 'release-specs', 'make-editor-schema']);

gulp.task('watch-app', ['prepare'], function() {
    return watch(appJSName, appEntryJSName, false);
    // TODO: make this automatically trigger when ./lib/Views/*.html get updated
});

gulp.task('watch-specs', ['prepare'], function() {
    return watch(specJSName, glob.sync(testGlob), false);
});

gulp.task('watch-css', ['build-css'], function() {
    return gulp.watch(['./index.less', './node_modules/terriajs/lib/Styles/*.less', './lib/Styles/*.less'], ['build-css']);
});

gulp.task('watch-datasource-groups', ['merge-groups'], function() {
    return gulp.watch('datasources/00_National_Data_Sets/*.json', [ 'merge-groups', 'merge-catalog' ]);
});

gulp.task('watch-datasource-catalog', ['merge-catalog'], function() {
    return gulp.watch('datasources/*.json', [ 'merge-catalog' ]);
});

gulp.task('watch-datasource-aremi', function() {
    return gulp.watch('datasources/aremi/*.json', [ 'merge-datasources-aremi' ]);
});

gulp.task('watch-datasources', ['watch-datasource-groups','watch-datasource-catalog','watch-datasource-aremi']);

gulp.task('watch-terriajs', ['prepare-terriajs'], function() {
    return gulp.watch(terriaJSSource + '/**', [ 'prepare-terriajs' ]);
});

gulp.task('watch', ['watch-app', 'watch-specs', 'watch-css', 'watch-datasources', 'watch-terriajs']);

gulp.task('lint', function(){
    return gulp.src(['index.js'])
        .on('error', onError)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('prepare', ['prepare-terriajs']);

gulp.task('prepare-terriajs', function() {
    return gulp
        .src([ terriaJSSource + '/**' ], { base: terriaJSSource })
        .pipe(gulp.dest(terriaJSDest));
});

gulp.task('merge-groups', function() {
    var jsonspacing=0;
    return gulp.src("./datasources/00_National_Data_Sets/*.json")
    .on('error', onError)
    .pipe(jsoncombine("00_National_Data_Sets.json", function(data) {
        // be absolutely sure we have the files in alphabetical order
        var keys = Object.keys(data).slice().sort();
        for (var i = 1; i < keys.length; i++) {
            data[keys[0]].catalog[0].items.push(data[keys[i]].catalog[0].items[0]);
        }
        return new Buffer(JSON.stringify(data[keys[0]], null, jsonspacing));
    }))
    .pipe(gulp.dest("./datasources"));
});

gulp.task('merge-catalog', ['merge-groups'], function() {
    var jsonspacing=0;
    return gulp.src("./datasources/*.json")
        .on('error', onError)
        .pipe(jsoncombine("nm.json", function(data) {
        // be absolutely sure we have the files in alphabetical order, with 000_settings first.
        var keys = Object.keys(data).slice().sort();
        data[keys[0]].catalog = [];

        for (var i = 1; i < keys.length; i++) {
            data[keys[0]].catalog.push(data[keys[i]].catalog[0]);
        }
        return new Buffer(JSON.stringify(data[keys[0]], null, jsonspacing));
    }))
    .pipe(gulp.dest("./wwwroot/init"));
});

gulp.task('merge-datasources', ['merge-catalog', 'merge-groups']);

// AREMI uses the EJS template engine to build the AREMI init file
gulp.task('merge-datasources-aremi', function() {
    var fn = 'datasources/aremi/root.ejs';
    var template = fs.readFileSync(fn,'utf8');
    // use EJS to process
    var result = ejs.render(template, null, {filename: fn});
    // remove all newlines - makes it possible to nicely format data descriptions etc
    var noNewlines = result.replace(/(?:\r\n|\r|\n)/g, '');

    var jsDatasources = eval('('+noNewlines+')');
    var noIdChildrenPaths = getChildrenWithNoIds(jsDatasources.catalog, '');

    if (noIdChildrenPaths.length) {
        console.error('Datasources have catalog items without ids: \n' + noIdChildrenPaths.join('\n'));
        process.exit(1);
    }

    var idIndex = indexAgainstId(jsDatasources.catalog, '');
    var duplicateIds = Object.keys(idIndex).filter(function(id) {
        return idIndex[id].length > 1;
    });

    if (duplicateIds.length > 0) {
        console.error('Datasources have duplicate ids for: ');
        console.error(duplicateIds.reduce(function(soFar, id) {
            return soFar + id + ': ' + JSON.stringify(idIndex[id]) + '\n';
        }, ''));
        process.exit(1);
    }

    // eval JSON string into object and minify
    var buf = new Buffer(JSON.stringify(jsDatasources, null, 0));
    fs.writeFileSync('wwwroot/init/aremi.json', buf);
});

/**
 * Recurses through a tree of data sources and checks that all the items (not groups) have ids specified
 * @param {Object[]} children The children to check in the format specified in the datasource json.
 * @param pathSoFar The path that the paths of offending children will be concatenated to.
 * @returns {String[]} The paths (names joined by '/') of items that had no id as a flat array.
 */
function getChildrenWithNoIds(children, pathSoFar) {
    return children.reduce(function(soFar, child) {
        var path = pathSoFar + '/' + (child.name || '[no name]');
        var childIsInvalid = !child.id && child.type !== 'group';

        return soFar
            .concat(childIsInvalid ? [path] : [])
            .concat(getChildrenWithNoIds(child.items || [], path));
    }, []);
}

/**
 * Recursively goes through a JSON catalog, indexing all the items, and all the items inside those items, in the form of
 * the items' ids against an array of paths of items that had that id. E.g. { aergaerg: ['Group 1/Name, 'Group 1/Othername'].
 *
 * @param {Object[]} items The items to index
 * @param {String} pathSoFar The path to append new paths to
 * @returns {Object} An index of ids to paths.
 */
function indexAgainstId(items, pathSoFar) {
    return items.reduce(function(soFar, child) {
        var path = pathSoFar + '/' + (child.name || '[no name]');

        if (child.id) {
            if (!soFar[child.id]) {
                soFar[child.id] = [];
            }
            soFar[child.id].push(path);
        }

        return combine(soFar, indexAgainstId(child.items || [], path));
    }, {});
}

/** Combines two objects together - assumes all values in the object are arrays. If both objects have a value for a
 * certain key, then the result object with have both of those values concatenated together */
function combine(object1, object2) {
    return Object.keys(object1).concat(Object.keys(object2)).reduce(function(soFar, key) {
        soFar[key] = (object1[key] || []).concat(object2[key] || []);
        return soFar;
    }, {});
}

gulp.task('default', ['lint', 'build']);

function onError(e) {
    if (e.code === 'EMFILE') {
        console.error('Too many open files. You should run this command:\n    ulimit -n 2048');
        process.exit(1);
    } else if (e.code === 'ENOSPC') {
        console.error('Too many files to watch. You should run this command:\n' +
                    '    echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p');
        process.exit(1);
    }
    gutil.log(e.message);
    if (!watching) {
        process.exit(1);
    }
}

var bundle = function(name, bundler, minify) {
    // Get a version string from "git describe".
    var version = spawnSync('git', ['describe']).stdout.toString().trim();
    var isClean = spawnSync('git', ['status', '--porcelain']).stdout.toString().length === 0;
    if (!isClean) {
        version += ' (plus local modifications)';
    }

    fs.writeFileSync('version.js', 'module.exports = \'' + version + '\';');

    // Combine main.js and its dependencies into a single file.
    var result = bundler.bundle();

    result = result
        .on('error', onError)
        .pipe(source(name))
        .pipe(buffer());

    if (minify) {
        // Minify the combined source.
        // sourcemaps.init/write maintains a working source map after minification.
        // "preserveComments: 'some'" preserves JSDoc-style comments tagged with @license or @preserve.
        result = result
            .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(uglify({preserveComments: 'some', mangle: true, compress: true}))
            .pipe(sourcemaps.write());
    }

    result = result
        // Extract the embedded source map to a separate file.
        .pipe(transform(function () { return exorcist('wwwroot/build/' + name + '.map'); }))
        // Write the finished product.
        .pipe(gulp.dest('wwwroot/build'));

    return result;
};

function build(name, files, minify) {
    return bundle(name, browserify({
        entries: files,
        debug: true // generate source map
    }), minify);
}

function watch(name, files, minify) {
    watching = true;
    var bundler = watchify(browserify({
        entries: files,
        debug: true, // generate source map
        cache: {},
        packageCache: {}
    }), { poll: 1000 } );

    function rebundle(ids) {
        // Don't rebundle if only the version changed.
        if (ids && ids.length === 1 && /\/version\.js$/.test(ids[0])) {
            return;
        }

        var start = new Date();

        var result = bundle(name, bundler, minify);

        result.on('end', function() {
            gutil.log('Rebuilt \'' + gutil.colors.cyan(name) + '\' in', gutil.colors.magenta((new Date() - start)), 'milliseconds.');
        });

        return result;
    }

    bundler.on('update', rebundle);

    return rebundle();
}