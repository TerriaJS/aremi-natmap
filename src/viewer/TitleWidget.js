"use strict";

/*global require*/
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var getElement = require('../../third_party/cesium/Source/Widgets/getElement');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var TitleWidgetViewModel = require('./TitleWidgetViewModel');

/**
 *
 * @param options.container
 * @constructor
 */
var TitleWidget = function(options) {
    var container = getElement(options.container);
    var viewModel = new TitleWidgetViewModel({
        menuItems : options.menuItems
    });

    var wrapper = document.createElement('div');
    wrapper.className = 'ausglobe-title-area';
    wrapper.innerHTML = '\
        <div style="background: rgb(130,94,51); border-radius: 5px; text-align: center; padding: 5px; color: #ffffff; font-size: 110%"\
            class="ausglobe-title-image">\
            <strong>Australian Renewable Energy</strong><br/>\
            Mapping Infrastructure\
        </div>\
        <div class="ausglobe-title-image"><img src="images/brands_title.png" width="353" height="40" /></div>\
        <div class="ausglobe-title-middle">\
            <div id="ausglobe-title-position" class="ausglobe-title-position"></div>\
            <div id="ausglobe-title-scale" class="ausglobe-title-scale">\
                <div id="ausglobe-title-scale-label" class="ausglobe-title-scale-label">1000 m</div>\
                <div id="ausglobe-title-scale-bar" class="ausglobe-title-scale-bar"></div>\
            </div>\
        </div>\
        <div class="ausglobe-title-credits"></div>\
        <div class="ausglobe-title-menu" data-bind="foreach: menuItems">\
            <span data-bind="if: typeof svg !== \'undefined\'"><a class="ausglobe-title-menuItem" data-bind="cesiumSvgPath: { path: svg.path, width: svg.width, height: svg.height }, attr: { href: uri, target: target, title: tooltip }, click: $parent.selectMenuItem"></a></span>\
            <span data-bind="if: typeof label !== \'undefined\'"><a class="ausglobe-title-menuItem" data-bind="html: label, attr: { href: uri, target: target, title: tooltip }, click: $parent.selectMenuItem"></a></span>\
        </div>';
    container.appendChild(wrapper);

    this._middeContainer = document.getElementById('ausglobe-title-middle');

    knockout.applyBindings(viewModel, wrapper);
};

defineProperties(TitleWidget.prototype, {
    middleContainer : {
        get : function() {
            return this._middleContainer;
        }
    }
});

module.exports = TitleWidget;
