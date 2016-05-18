'use strict';

/*global require*/
// Every module required-in here must be a `dependency` in package.json, not just a `devDependency`,
// This matters if ever we have gulp tasks run from npm, especially post-install ones.
var gulp = require('gulp');
var gutil = require('gulp-util');
// var browserify = require('browserify');
// var jshint = require('gulp-jshint');
// var less = require('gulp-less');
// var uglify = require('gulp-uglify');
// var rename = require('gulp-rename');
// var sourcemaps = require('gulp-sourcemaps');
// var exorcist = require('exorcist');
// var buffer = require('vinyl-buffer');
// var transform = require('vinyl-transform');
// var source = require('vinyl-source-stream');
// var watchify = require('watchify');
// var NpmImportPlugin = require('less-plugin-npm-import');
// var jsoncombine = require('gulp-jsoncombine');
// var ejs = require('ejs');
// var child_exec = require('child_process').exec;  // child_process is built in to node
// var generateSchema = require('generate-terriajs-schema');
//
// var appJSName = 'nationalmap.js';
// var appCssName = 'nationalmap.css';
// var specJSName = 'nationalmap-tests.js';
// var appEntryJSName = './index.js';
// var terriaJSSource = 'node_modules/terriajs/wwwroot';
// var terriaJSDest = 'wwwroot/build/TerriaJS';
// var testGlob = './test/**/*.js';
//
// var watching = false; // if we're in watch mode, we try to never quit.
// var watchOptions = { poll:1000, interval: 1000 }; // time between watch intervals. OSX hates short intervals. Different versions of Gulp use different options.
//
// // Create the build directory, because browserify flips out if the directory that might
// // contain an existing source map doesn't exist.
//
// if (!fs.existsSync('wwwroot/build')) {
//     fs.mkdirSync('wwwroot/build');
// }
var path = require('path');

gulp.task('build', ['build-css', 'merge-datasources-aremi', 'copy-terriajs-assets', 'build-app']);
gulp.task('release', ['build-css', 'copy-terriajs-assets', 'release-app', 'make-editor-schema']);
gulp.task('watch', ['watch-css', 'watch-terriajs-assets', 'watch-app']);
gulp.task('default', ['lint', 'build']);

var watchOptions = {
    interval: 1000
};

gulp.task('build-app', ['write-version'], function(done) {
    var runWebpack = require('terriajs/buildprocess/runWebpack.js');
    var webpack = require('webpack');
    var webpackConfig = require('./buildprocess/webpack.config.js');

    runWebpack(webpack, webpackConfig, done);
});

gulp.task('release-app', ['write-version'], function(done) {
    var runWebpack = require('terriajs/buildprocess/runWebpack.js');
    var webpack = require('webpack');
    var webpackConfig = require('./buildprocess/webpack.config.js');

    runWebpack(webpack, Object.assign({}, webpackConfig, {
        plugins: [
            new webpack.optimize.UglifyJsPlugin(),
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.OccurrenceOrderPlugin()
        ].concat(webpackConfig.plugins || [])
    }), done);
});

gulp.task('watch-app', function(done) {
    var fs = require('fs');
    var watchWebpack = require('terriajs/buildprocess/watchWebpack');
    var webpack = require('webpack');
    var webpackConfig = require('./buildprocess/webpack.config.js');

    fs.writeFileSync('version.js', 'module.exports = \'Development Build\';');
    watchWebpack(webpack, webpackConfig, done);
});

gulp.task('build-css', function() {
    var less = require('gulp-less');
    var NpmImportPlugin = require('less-plugin-npm-import');
    var rename = require('gulp-rename');

    return gulp.src('./index.less')
        .on('error', onError)
        .pipe(less({
            plugins: [
                new NpmImportPlugin()
            ]
        }))
        .pipe(rename('nationalmap.css'))
        .pipe(gulp.dest('./wwwroot/build/'));
});

gulp.task('watch-css', ['build-css'], function() {
    var terriaStylesGlob = path.join(getPackageRoot('terriajs'), 'lib', 'Styles', '**', '*.less');
    var appStylesGlob = path.join(__dirname, 'lib', 'Styles', '**', '*.less');
    return gulp.watch(['./index.less', terriaStylesGlob, appStylesGlob], watchOptions, ['build-css']);
});

gulp.task('copy-terriajs-assets', function() {
    var terriaWebRoot = path.join(getPackageRoot('terriajs'), 'wwwroot');
    var sourceGlob = path.join(terriaWebRoot, '**');
    var destPath = path.resolve(__dirname, 'wwwroot', 'build', 'TerriaJS');

    return gulp
        .src([ sourceGlob ], { base: terriaWebRoot })
        .pipe(gulp.dest(destPath));
});

gulp.task('watch-terriajs-assets', ['copy-terriajs-assets'], function() {
    var terriaWebRoot = path.join(getPackageRoot('terriajs'), 'wwwroot');
    var sourceGlob = path.join(terriaWebRoot, '**');

    return gulp.watch(sourceGlob, watchOptions, [ 'copy-terriajs-assets' ]);
});

// Generate new schema for editor, and copy it over whatever version came with editor.
gulp.task('make-editor-schema', ['copy-editor'], function() {
    var generateSchema = require('generate-terriajs-schema');

    return generateSchema({
        source: getPackageRoot('terriajs'),
        dest: 'wwwroot/editor',
        noversionsubdir: true,
        editor: true,
        quiet: true
    });
});

gulp.task('copy-editor', function() {
    var glob = path.join(getPackageRoot('terriajs-catalog-editor'), '**');

    return gulp.src(glob)
        .pipe(gulp.dest('./wwwroot/editor'));
});

gulp.task('watch-datasource-aremi', function() {
    return gulp.watch('datasources/aremi/*.json', [ 'merge-datasources-aremi' ]);
});

gulp.task('lint', function() {
    var runExternalModule = require('terriajs/buildprocess/runExternalModule');

    runExternalModule('eslint/bin/eslint.js', [
        '-c', path.join(getPackageRoot('terriajs'), '.eslintrc'),
        '--ignore-pattern', 'lib/ThirdParty',
        '--max-warnings', '0',
        'index.js',
        'lib'
    ]);
});

gulp.task('write-version', function() {
    var fs = require('fs');
    var spawnSync = require('child_process').spawnSync;

    // Get a version string from "git describe".
    var version = spawnSync('git', ['describe']).stdout.toString().trim();
    var isClean = spawnSync('git', ['status', '--porcelain']).stdout.toString().length === 0;
    if (!isClean) {
        version += ' (plus local modifications)';
    }

    fs.writeFileSync('version.js', 'module.exports = \'' + version + '\';');
});

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
    process.exit(1);
}

function getPackageRoot(packageName) {
    return path.dirname(require.resolve(packageName + '/package.json'));
}