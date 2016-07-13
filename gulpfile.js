'use strict';

/*global require*/
// Every module required-in here must be a `dependency` in package.json, not just a `devDependency`,
// This matters if ever we have gulp tasks run from npm, especially post-install ones.
var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var path = require('path');

var minNode = require('./package.json').engines.node;
if (!require('semver').satisfies(process.version, minNode)) {
    console.log('Terria requires Node.js ' + minNode + ' to build. Please update your version of Node.js, delete your node_modules directory' +
        ', then run npm install and gulp again.');
    process.exit();
}

gulp.task('build', ['clean', 'merge-datasources', 'copy-terriajs-assets', 'build-app']);
gulp.task('release', ['clean', 'merge-datasources', 'copy-terriajs-assets', 'release-app']);
gulp.task('watch', ['watch-datasource-aremi', 'watch-app']);

gulp.task('default', ['lint', 'build']);

var watchOptions = {
    interval: 1000
};

gulp.task('build-app', ['write-version'], function(done) {
    var runWebpack = require('terriajs/buildprocess/runWebpack.js');
    var webpack = require('webpack');
    var webpackConfig = require('./buildprocess/webpack.config.js')(true);

    runWebpack(webpack, webpackConfig, done);
});

gulp.task('release-app', ['write-version'], function(done) {
    var runWebpack = require('terriajs/buildprocess/runWebpack.js');
    var webpack = require('webpack');
    var webpackConfig = require('./buildprocess/webpack.config.js')(false);

    runWebpack(webpack, Object.assign({}, webpackConfig, {
        plugins: [
            new webpack.optimize.UglifyJsPlugin(),
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.OccurrenceOrderPlugin(),
        ].concat(webpackConfig.plugins || [])
    }), done);
});

gulp.task('watch-app', function(done) {
    var fs = require('fs');
    var watchWebpack = require('terriajs/buildprocess/watchWebpack');
    var webpack = require('webpack');
    var webpackConfig = require('./buildprocess/webpack.config.js')(true, false);

    fs.writeFileSync('version.js', 'module.exports = \'Development Build\';');
    watchWebpack(webpack, webpackConfig, done);
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

gulp.task('styleguide', function(done) {
    var childExec = require('child_process').exec;
    childExec('./node_modules/kss/bin/kss-node ./node_modules/terriajs/lib/Sass ./wwwroot/styleguide --template ./wwwroot/styleguide-template --css ./../build/nationalmap.css', undefined, done);
});

gulp.task('watch-datasource-aremi', function() {
    return gulp.watch('datasources/aremi/*.json', [ 'merge-datasources' ]);
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
gulp.task('merge-datasources', function() {
    var fs = require('fs');
    var ejs = require('ejs');
    var fn = 'datasources/aremi/root.ejs';
    var fs = require('fs');
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

gulp.task('diagnose', function() {
    console.log('Have you run `npm install` at least twice?  See https://github.com/npm/npm/issues/10727');

    var terriajsStat = fs.lstatSync('./node_modules/terriajs');
    var terriajsIsLinked = terriajsStat.isSymbolicLink();

    if (terriajsIsLinked) {
        console.log('TerriaJS is linked.  Have you run `npm install` at least twice in your TerriaJS directory?');

        var terriaPackageJson = JSON.parse(fs.readFileSync('./node_modules/terriajs/package.json'));

        var terriaPackages = fs.readdirSync('./node_modules/terriajs/node_modules');
        terriaPackages.forEach(function(packageName) {
            var terriaPackage = path.join('./node_modules/terriajs/node_modules', packageName);
            var appPackage = path.join('./node_modules', packageName);
            if (packageName === '.bin' || !fs.existsSync(appPackage)) {
                return;
            }

            var terriaPackageStat = fs.lstatSync(terriaPackage);
            var appPackageStat = fs.lstatSync(appPackage);

            if (terriaPackageStat.isSymbolicLink() !== appPackageStat.isSymbolicLink()) {
                console.log('Problem with package: ' + packageName);
                console.log('  The application ' + (appPackageStat.isSymbolicLink() ? 'links' : 'does not link') + ' to the package.');
                console.log('  TerriaJS ' + (terriaPackageStat.isSymbolicLink() ? 'links' : 'does not link') + ' to the package.');
            }

            // Verify versions only for packages required by TerriaJS.
            if (typeof terriaPackageJson.dependencies[packageName] === 'undefined') {
                return;
            }

            var terriaDependencyPackageJsonPath = path.join(terriaPackage, 'package.json');
            var appDependencyPackageJsonPath = path.join(appPackage, 'package.json');

            var terriaDependencyPackageJson = JSON.parse(fs.readFileSync(terriaDependencyPackageJsonPath));
            var appDependencyPackageJson = JSON.parse(fs.readFileSync(appDependencyPackageJsonPath));

            if (terriaDependencyPackageJson.version !== appDependencyPackageJson.version) {
                console.log('Problem with package: ' + packageName);
                console.log('  The application has version ' + appDependencyPackageJson.version);
                console.log('  TerriaJS has version ' + terriaDependencyPackageJson.version);
            }
        });
    } else {
        console.log('TerriaJS is not linked.');

        try {
            var terriajsModules = fs.readdirSync('./node_modules/terriajs/node_modules');
            if (terriajsModules.length > 0) {
                console.log('./node_modules/terriajs/node_modules is not empty.  This may indicate a conflict between package versions in this application and TerriaJS, or it may indicate you\'re using an old version of npm.');
            }
        } catch (e) {
        }
    }
});

gulp.task('make-package', function() {
    var argv = require('yargs').argv;
    var fs = require('fs-extra');
    var spawnSync = require('child_process').spawnSync;

    var packageName = argv.packageName || (process.env.npm_package_name + '-' + spawnSync('git', ['describe']).stdout.toString().trim());
    var packagesDir = path.join('.', 'deploy', 'packages');

    if (!fs.existsSync(packagesDir)) {
        fs.mkdirSync(packagesDir);
    }

    var packageFile = path.join(packagesDir, packageName + '.tar.gz');

    var workingDir = path.join('.', 'deploy', 'work');
    if (fs.existsSync(workingDir)) {
        fs.removeSync(workingDir);
    }

    fs.mkdirSync(workingDir);

    var copyOptions = {
        preserveTimestamps: true
    };

    fs.copySync('wwwroot', path.join(workingDir, 'wwwroot'), copyOptions);
    fs.copySync('node_modules', path.join(workingDir, 'node_modules'), copyOptions);

    if (argv.serverConfigOverride) {
        var serverConfig = JSON.parse(fs.readFileSync('devserverconfig.json', 'utf8'));
        var serverConfigOverride = JSON.parse(fs.readFileSync(argv.serverConfigOverride, 'utf8'));
        var productionServerConfig = mergeConfigs(serverConfig, serverConfigOverride);
        fs.writeFileSync(path.join(workingDir, 'productionserverconfig.json'), JSON.stringify(productionServerConfig, undefined, '  '));
    } else {
        fs.writeFileSync(path.join(workingDir, 'productionserverconfig.json'), fs.readFileSync('devserverconfig.json', 'utf8'));
    }

    if (argv.clientConfigOverride) {
        var clientConfig = JSON.parse(fs.readFileSync(path.join('wwwroot', 'config.json'), 'utf8'));
        var clientConfigOverride = JSON.parse(fs.readFileSync(argv.clientConfigOverride, 'utf8'));
        var productionClientConfig = mergeConfigs(clientConfig, clientConfigOverride);
        fs.writeFileSync(path.join(workingDir, 'wwwroot', 'config.json'), JSON.stringify(productionClientConfig, undefined, '  '));
    }

    var tarResult = spawnSync('tar', [
        'czvf',
        path.join('..', 'packages', packageName + '.tar.gz')
    ].concat(fs.readdirSync(workingDir)), {
        cwd: workingDir,
        stdio: 'inherit',
        shell: false
    });
    if (tarResult.status !== 0) {
        throw new gutil.PluginError('tar', 'External module exited with an error.', { showStack: false });
    }
});

gulp.task('clean', function() {
    var fs = require('fs-extra');

    // // Remove build products
    fs.removeSync(path.join('wwwroot', 'build'));
});

function mergeConfigs(original, override) {
    var result = Object.assign({}, original);

    if (typeof original === 'undefined') {
        original = {};
    }

    for (var name in override) {
        if (!override.hasOwnProperty(name)) {
            continue;
        }

        if (Array.isArray(override[name])) {
            result[name] = override[name];
        } else if (typeof override[name] === 'object') {
            result[name] = mergeConfigs(original[name], override[name]);
        } else {
            result[name] = override[name];
        }
    }

    return result;
}
