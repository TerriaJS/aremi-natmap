'use strict';

/*global require,window */

var terriaOptions = {
    baseUrl: 'build/TerriaJS'
};

// checkBrowserCompatibility('ui');
import GoogleAnalytics from 'terriajs/lib/Core/GoogleAnalytics';
import ShareDataService from 'terriajs/lib/Models/ShareDataService';
import OgrCatalogItem from 'terriajs/lib/Models/OgrCatalogItem';
import raiseErrorToUser from 'terriajs/lib/Models/raiseErrorToUser';
import registerAnalytics from 'terriajs/lib/Models/registerAnalytics';
import registerCatalogMembers from 'terriajs/lib/Models/registerCatalogMembers';
import registerCustomComponentTypes from 'terriajs/lib/ReactViews/Custom/registerCustomComponentTypes';
import Terria from 'terriajs/lib/Models/Terria';
import updateApplicationOnHashChange from 'terriajs/lib/ViewModels/updateApplicationOnHashChange';
import updateApplicationOnMessageFromParentWindow from 'terriajs/lib/ViewModels/updateApplicationOnMessageFromParentWindow';
import ViewState from 'terriajs/lib/ReactViewModels/ViewState';
import BingMapsSearchProviderViewModel from 'terriajs/lib/ViewModels/BingMapsSearchProviderViewModel.js';
import GazetteerSearchProviderViewModel from 'terriajs/lib/ViewModels/GazetteerSearchProviderViewModel.js';
import GnafSearchProviderViewModel from 'terriajs/lib/ViewModels/GnafSearchProviderViewModel.js';
import defined from 'terriajs-cesium/Source/Core/defined';
import render from './lib/Views/render';
import GnafAddressGeocoder from 'terriajs/lib/Map/GnafAddressGeocoder.js';
import ViewerMode from 'terriajs/lib/Models/ViewerMode.js';

// Tell the OGR catalog item where to find its conversion service.
OgrCatalogItem.conversionServiceBaseUrl = configuration.conversionServiceBaseUrl;

// Register all types of catalog members in the core TerriaJS.  If you only want to register a subset of them
// (i.e. to reduce the size of your application if you don't actually use them all), feel free to copy a subset of
// the code in the registerCatalogMembers function here instead.
registerCatalogMembers();
registerAnalytics();

terriaOptions.analytics = new GoogleAnalytics();
terriaOptions.batchGeocoder = new GnafAddressGeocoder();
terriaOptions.viewerMode = ViewerMode.CesiumEllipsoid;

// Construct the TerriaJS application, arrange to show errors to the user, and start it up.
var terria = new Terria(terriaOptions);

// Register custom components in the core TerriaJS.  If you only want to register a subset of them, or to add your own,
// insert your custom version of the code in the registerCustomComponentTypes function here instead.
registerCustomComponentTypes(terria);

// Create the ViewState before terria.start so that errors have somewhere to go.
const viewState = new ViewState({
    terria: terria
});

if (process.env.NODE_ENV === "development") {
    window.viewState = viewState;
}

// If we're running in dev mode, disable the built style sheet as we'll be using the webpack style loader.
// Note that if the first stylesheet stops being TerriaMap.css then this will have to change.
if (process.env.NODE_ENV !== "production" && module.hot) {
    document.styleSheets[0].disabled = true;
}

terria.filterStartDataCallback = function(startData) {
    if (startData.initSources) {
        // Do not allow share URLs to load old versions of the catalog that
        // are included in the initSources.
        startData.initSources = startData.initSources.filter(function(initSource) {
            if (typeof initSource === 'string') {
                return initSource.indexOf('static.nationalmap.nicta.com.au/init') < 0 &&
                    initSource.indexOf('init/nm.json') < 0;
            }
            return true;
        });

        // Backward compatibility for old ABS-ITT catalog items.  Go load an annex catalog that contains them.
        const containsAbsIttItems = startData.initSources.some(function(initSource) {
            return initSource.sharedCatalogMembers && Object.keys(initSource.sharedCatalogMembers).some(shareKey => initSource.sharedCatalogMembers[shareKey].type === 'abs-itt');
        });

        if (containsAbsIttItems) {
            terria.error.raiseEvent({
                title: 'Warning',
                message: 'The share link you just visited is using an old interface to the ABS census data that will stop working in a future version of NationalMap.  If this is your link, please update it to use the new ABS catalog items in the National Datasets section.'
            });
            startData.initSources.unshift('init/abs-itt.json');
        }
    }
};

module.exports = terria.start({
    // If you don't want the user to be able to control catalog loading via the URL, remove the applicationUrl property below
    // as well as the call to "updateApplicationOnHashChange" further down.
    applicationUrl: window.location,
    configUrl: 'config.json',
    shareDataService: new ShareDataService({
        terria: terria
    }),
    globalDisclaimerHtml: require('./lib/Views/GlobalDisclaimer.html'),
    developmentDisclaimerPreambleHtml: require('./lib/Views/DevelopmentDisclaimerPreamble.html')
}).otherwise(function(e) {
    raiseErrorToUser(terria, e);
}).always(function() {
    try {
        viewState.searchState.locationSearchProviders = [
            new BingMapsSearchProviderViewModel({
                terria: terria,
                key: terria.configParameters.bingMapsKey
            }),
            new GazetteerSearchProviderViewModel({terria}),
            new GnafSearchProviderViewModel({terria})
        ];

        // Automatically update Terria (load new catalogs, etc.) when the hash part of the URL changes.
        updateApplicationOnHashChange(terria, window);
        updateApplicationOnMessageFromParentWindow(terria, window);

        // Create the various base map options.
        var createAustraliaBaseMapOptions = require('terriajs/lib/ViewModels/createAustraliaBaseMapOptions');
        var createGlobalBaseMapOptions = require('terriajs/lib/ViewModels/createGlobalBaseMapOptions');
        var createExtraBaseMapOptions = require('./lib/ViewModels/createExtraBaseMapOptions');
        var selectBaseMap = require('terriajs/lib/ViewModels/selectBaseMap');

        var australiaBaseMaps = createAustraliaBaseMapOptions(terria);
        var globalBaseMaps = createGlobalBaseMapOptions(terria, terria.configParameters.bingMapsKey);
        var extraBaseMaps = createExtraBaseMapOptions(terria);

        var allBaseMaps = australiaBaseMaps.concat(globalBaseMaps.concat(extraBaseMaps));
        var toRemove = ["Bing Maps Roads", "Natural Earth II", "NASA Black Marble"];
        allBaseMaps = allBaseMaps.filter(basemap => toRemove.indexOf(basemap.catalogItem.name) < 0);
        selectBaseMap(terria, allBaseMaps, 'Positron (Light)', true);

        // Add the disclaimer, if specified
        if (defined(terria.configParameters.globalDisclaimer)) {
            var disclaimer = terria.configParameters.globalDisclaimer;
            if (defined(disclaimer.enabled) && disclaimer.enabled) {
                var message = '';
                /* disabling the dev disclaimer for the UX testing
                if (location.hostname.indexOf('nationalmap.gov.au') === -1) {
                    message += fs.readFileSync(__dirname + '/lib/Views/DevelopmentDisclaimer.html', 'utf8');
                }
                */
                message += require('./lib/Views/GlobalDisclaimer.html');
                var options = {
                    message: message
                };

                viewState.notifications.push(options);
            }
        }

        render(terria, allBaseMaps, viewState);
    } catch (e) {
        console.error(e);
        console.error(e.stack);
    }
});
