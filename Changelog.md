### AREMI Changelog

#### Changes to be included in the next version
* Updated the "Topography -> Elevation -> SRTM 1 sec DEM Image" layer to a new version deployed by Geoscience Australia.
* Merged in the latest [NationalMap 2015-12-15](https://github.com/NICTA/nationalmap/blob/2015-12-15/CHANGES.md) and [TerriaJS jsonTreeview-1.0.50](https://github.com/TerriaJS/terriajs/blob/jsonTreeview-1.0.50/CHANGES.md) releases.
* Improved feature info name and layout for layers in the group "Electricity Inf. -> Generation -> Current Power Generation - NEM".
* Added the new layer "Renewable Energy -> Annual climatology of daily exposure - Direct Normal Exposure" from the Bureau of Meteorology.
* Added Zoom To boundaries for the "Electricity Inf. -> Generation" layers in "Current Power Generation - NEM", "Current Solar PV - APVI", and "Small Scale Installations - CER".
* Updated the "Population -> Population Density" layer to use the new Geoscience Australia service for it.
* Corrected the Data Custodian on the "Infrastructure -> Radio Licenses - ACMA" to be the ACMA.
* Added a WFS data URL on the info page for the "Infrastructure -> Radio Licenses - ACMA" layer.
* Added the new Department of Environment layer "Boundaries -> Environmental Areas -> Conservation Management Zones".


#### Version 2015-11-17b
* Fix legends from Landgate not loading.


#### Version 2015-11-17
* Added `ignoreUnknownTileErrors` to all WMS and ArcGIS layers in order to avoid one tile breaking the entire layer.
* Added `clipToRectangle` and specified a `rectangle` with bounds for Australia for the majority of layers where this makes sense.
* Added feature info templates for Topography -> Water -> Water Observations from Space layers to make it easier to understand the data.


#### Version 2015-11-16
* Merged in the latest [NationalMap 2015-11-16b](https://github.com/NICTA/nationalmap/blob/2015-11-16b/CHANGES.md) and [TerriaJS jsonTreeview-1.0.48](https://github.com/TerriaJS/terriajs/blob/jsonTreeview-1.0.48/CHANGES.md) releases.
* Added a number of Department of Environment layers in the Boundaries section.
* Added the Land and Property Information NSW Cadastre service to Boundaries -> Cadastre and Land Tenure.
* Made the version number in the AREMI banner link to the tagged version of the Changelog.
* Created a Boundaries -> Cadastre and Land Tenure subcategory and moved layers into it.
* Put in a simple feature info template for the Electricity Inf. -> Transmission -> Distance to Trans Lines layer to show a sentence with the distance.
* Updated the Electricity Inf. -> Generation -> Small Scale Installations data and layer info pages.
* Added the Google URL Shortener for the Share feature.
* Added the ABS 2011 Census layers to the Population category.
* Adjusted the home view for all layers in the Boundary category.
* Added the ACMA Radio Licenses layer to the Infrastructure -> Communications category.
* Added the Geoscience Australia Northern Australia Land Tenure layers to the Boundaries category.
* Renamed and reorded some entries in the catalog.
* Added the Landgate Western Australia Electricity and Cadastre layer.
* Changed to the Data61 logo.
* Added a development system disclaimer when the app detects that it is not hosted on a nationalmap.gov.au host.
* Replaced the old 'Topography -> Infrastructure -> Gas Pipelines' layer two separate new Geoscience Australia layers - Gas Pipelines and Oil Pipelines.
* Added the layer 'Solar Station Historical Observations' to the 'Renewable Energy -> Solar' and the new 'Weather' categories.
* Reordered, refactored, added Renewable layer to the Electricity -> Generation -> Live NEM category.
* Fixed Legends and info pages, set opacity=100 and ignoreUnknownTileErrors=true for Boundaries -> Defence Restricted Areas layers.
* Refactored DANCE2 info pages, fixing some problems masked by HTML-leniency.


#### Version 2015-09-25
* Added the Institute for Sustainable Futures DANCE modelling project.
* Added the Geoscience Australia hosted Department of Environment Protected Areas services.
* Switched the Tasmanian Cadastre layer to their public Esri MapServer as it has better layer metadata.
* Switch default basemap to Positron (Light) in order to have some extra definition, remove OpenStreetMap simple basemaps from basemap controls.
* Merged in the latest NationalMap [2015-09-17](https://github.com/NICTA/nationalmap/blob/2015-09-17/CHANGES.md) and Terria [1.0.43](https://github.com/TerriaJS/terriajs/blob/1.0.43/CHANGES.md) releases.
* Default to 3D-smooth mode to increase performance, and to avoid current Cesium native feature parallax issues.
* Turn off autoplaying of timeseries data (requires Terria support).
* Generate the AREMI init file using the EJS template engine.
* Moved License links when they were the only thing in Description sections to their own Licensing sections.
* Tasmania Cadastral: Removed duplicated info page Data Description text, fixed order of info blocks.


#### Version 2015-08-26
* Added Geoscience Australia Substations layer, improved metadata for Transmission Lines layer.
* Improved look and feel, legend, of the CER Small Generation Unit data.
* Tweaked the Waste Management Facilities layer further: switched back to WMS, removed info duplicated info we now harvest from the service metadata, adjusted rectangle to match home camera.


#### Version 2015-08-25
* Replaced the Geoscience Australia - Australian Solar Energy Information System (ASEIS) layers with the new Bureau of Meteorology Solar Climatology services.
* Removed missing legend messages from GA and NICTA geothermal raster layers.
* Update APVI layer look and feel now that apvi-webservice has new columns.
* Updated the Waste Management Facilities layer since the WMS version seemed broken with Terria.
* Merged in the latest changes from NationalMap tag 2015-08-18.
* Improved Tasmanian Cadastral Parcels metadata.
* Added Global Disclaimer that is optionally mandatory to accept before continuing.
* Added the Feedback Survey link to the front page.


Changes older than this were not recorded in the changelog.
