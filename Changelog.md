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
