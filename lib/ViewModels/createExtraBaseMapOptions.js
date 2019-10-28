"use strict";

/*global require*/
var BaseMapViewModel = require("terriajs/lib/ViewModels/BaseMapViewModel");
var OpenStreetMapCatalogItem = require("terriajs/lib/Models/OpenStreetMapCatalogItem");

var createExtraBaseMapOptions = function(terria) {
  var result = [];

  var voyager = new OpenStreetMapCatalogItem(terria);
  voyager.name = "Voyager";
  voyager.url = "//global.ssl.fastly.net/rastertiles/voyager/";

  // https://cartodb.com/basemaps/ gives two different attribution strings. In any case HTML gets swallowed, so we have to adapt.
  // 1 '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy;
  //   <a href="http://cartodb.com/attributions">CartoDB</a>'
  // 2 Map tiles by <a href="http://cartodb.com/attributions#basemaps">CartoDB</a>, under <a href="https://creativecommons.org/licenses/by/3.0/">
  //   CC BY 3.0</a>. Data by <a href="http://www.openstreetmap.org/">OpenStreetMap</a>, under ODbL.
  voyager.attribution =
    "© OpenStreetMap contributors ODbL, © CartoDB CC-BY 3.0";

  voyager.opacity = 1.0;
  voyager.subdomains = [
    "cartodb-basemaps-a",
    "cartodb-basemaps-b",
    "cartodb-basemaps-c",
    "cartodb-basemaps-d"
  ];
  result.push(
    new BaseMapViewModel({
      image: require("../../wwwroot/images/voyager.png"),
      catalogItem: voyager,
      contrastColor: "#000000"
    })
  );

  return result;
};

module.exports = createExtraBaseMapOptions;
