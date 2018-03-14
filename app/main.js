var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "esri/config", "esri/views/SceneView", "esri/widgets/Home", "esri/PopupTemplate", "esri/WebScene", "esri/core/watchUtils", "dijit/_WidgetBase", "dojo/_base/lang", "./TimeFlies"], function (require, exports, esriConfig, SceneView, Home, PopupTemplate, WebScene, watchUtils, _WidgetBase, lang, TimeFlies) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var BluTour = /** @class */ (function (_super) {
        __extends(BluTour, _super);
        function BluTour(args) {
            var _this = _super.call(this, lang.mixin({ baseClass: "jimu-blu" }, args)) || this;
            if (!esriConfig || !esriConfig.request || !esriConfig.request.corsEnabledServers) {
                esriConfig.request.corsEnabledServers = [];
            }
            esriConfig.request.corsEnabledServers.push("a.tile.stamen.com", "b.tile.stamen.com", "c.tile.stamen.com", "d.tile.stamen.com");
            console.log("constructor");
            _this.initScene();
            return _this;
        }
        BluTour.prototype.initScene = function () {
            var _this = this;
            console.log("initScene");
            var webscene = new WebScene({
                portalItem: {
                    id: "70e76c55c7bc4644999d0891af6eb9d4"
                }
            });
            console.log(webscene);
            //webscene.watch("allLayers", function(evt) 
            watchUtils.watch(webscene, "allLayers.length", function (evt) {
                console.log("watch webscene.allLayers", evt);
                var blutourLayer = webscene.layers.find(function (layer) {
                    return layer.title === "bluTour_hfl";
                });
                _this.blutourFLayer = blutourLayer;
                _this.blutourFLayer.popupTemplate = _this.defineInfoTemplate();
                var timeFlies = new TimeFlies({
                    flightLayer: _this.blutourFLayer,
                    dateFieldName: "date",
                    sceneView: sceneView,
                    zoomInLevel: 13,
                    zoomOutLevel: 7
                });
                sceneView.ui.add(timeFlies, "bottom-left");
            });
            // The clipping extent for the scene
            var btwExtent = {
                xmin: 653028.001899999,
                ymin: 5786277.1178,
                xmax: 1674447.2595,
                ymax: 7373205.4343,
                spatialReference: {
                    wkid: 102100
                }
            }; // TS definitions don't support Extent autocast in ArcGIS JS 4.5 yet
            var sceneView = this.createSceneView(webscene); //, btwExtent);
            sceneView.then(function (evt) {
                /*             var legend = new Legend({
                                view: sceneView,
                                layerInfos: [{
                                layer: this.blutourFLayer,
                                title: "Ergebnis pro Partei"
                                }]
                            });
                            sceneView.ui.add(legend, "bottom-right"); */
                /*             var cameraStatus = new CameraStatus({
                                sceneView: sceneView
                            });
                            sceneView.ui.add(cameraStatus, "top-right"); */
                // Set up a home button for resetting the viewpoint to the intial extent
                var homeBtn = new Home({
                    view: sceneView,
                    container: "homeDiv"
                });
            });
        };
        BluTour.prototype.defineInfoTemplate = function () {
            var infoTemplate = new PopupTemplate({
                title: "{location / veranstaltung}, {ort}",
                content: '<iframe src="{video}&output=embed" width="100%" height="100%"></iframe>'
            });
            return infoTemplate;
        };
        BluTour.prototype.createSceneView = function (esrimap, btwExtent) {
            var sceneViewProperties = {
                container: "viewDiv",
                map: esrimap,
                // Indicates to create a local scene
                viewingMode: "local",
                // Use the exent defined in clippingArea to define the bounds of the scene
                clippingArea: btwExtent,
                extent: btwExtent,
                // Allows for navigating the camera below the surface
                constraints: {
                    collision: {
                        enabled: false
                    },
                    tilt: {
                        max: 179.99
                    }
                },
                camera: {
                    position: {
                        latitude: 33.83,
                        longitude: 9.92,
                        z: 611856.12,
                        spatialReference: { wkid: 3857 }
                    },
                    heading: 0.0,
                    tilt: 75.00
                },
                environment: {
                    atmosphere: {
                        quality: "high"
                    },
                    starsEnabled: true
                }
            };
            return new SceneView(sceneViewProperties);
        };
        return BluTour;
    }(_WidgetBase));
    // startup class
    var bluTour = new BluTour();
});
//# sourceMappingURL=main.js.map