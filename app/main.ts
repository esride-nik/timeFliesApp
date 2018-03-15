import esriConfig = require("esri/config");
import EsriMap = require("esri/Map");
import SceneView = require("esri/views/SceneView");
import WMSLayer = require("esri/layers/WMSLayer");
import ElevationLayer = require("esri/layers/ElevationLayer");
import SimpleRenderer = require("esri/renderers/SimpleRenderer");
import PolygonSymbol3D = require("esri/symbols/PolygonSymbol3D");
import ExtrudeSymbol3DLayer = require("esri/symbols/ExtrudeSymbol3DLayer");
import Legend = require("esri/widgets/Legend");
import Ground = require("esri/Ground");
import Layer = require("esri/layers/Layer");
import FeatureLayer = require("esri/layers/FeatureLayer");
import WebTileLayer = require("esri/layers/WebTileLayer");
import ObjectSymbol3DLayer = require("esri/symbols/ObjectSymbol3DLayer");
import IconSymbol3DLayer = require("esri/symbols/IconSymbol3DLayer");
import PointSymbol3D = require("esri/symbols/PointSymbol3D");
import QueryTask = require("esri/tasks/QueryTask");
import Query = require("esri/tasks/support/Query");
import Home = require("esri/widgets/Home");
import Basemap = require("esri/Basemap");
import PortalItem = require("esri/portal/PortalItem");
import Extent = require("esri/geometry/Extent");
import PopupTemplate = require("esri/PopupTemplate");
import WebScene = require("esri/WebScene");
import watchUtils = require("esri/core/watchUtils");
import parser = require("dojo/parser");
import Button = require("dijit/form/Button");
import dom = require("dojo/dom");
import domConstruct = require("dojo/dom-construct");
import domClass = require("dojo/dom-class");
import domStyle = require("dojo/dom-style");
import domAttr = require("dojo/dom-attr");
import declare = require("dojo/_base/declare");
import _WidgetBase = require("dijit/_WidgetBase");
import _AttachMixin = require("dijit/_AttachMixin");
import _WidgetsInTemplateMixin = require("dijit/_WidgetsInTemplateMixin");
import lang = require("dojo/_base/lang");
import array = require("dojo/_base/array");
import on = require("dojo/on");
import CameraStatus = require("./cameraStatus");
import TimeFlies = require("./TimeFlies");

class BluTour extends _WidgetBase {

    private renderer: SimpleRenderer;
    private config: any;
    private blutourFLayer: FeatureLayer;
    
    constructor(args?: Array<any>) {
        super(lang.mixin({baseClass: "jimu-blu"}, args));

        if (!esriConfig || !esriConfig.request || !esriConfig.request.corsEnabledServers) {
            esriConfig.request.corsEnabledServers = [];
        }
        esriConfig.request.corsEnabledServers.push(
            "a.tile.stamen.com",
            "b.tile.stamen.com",
            "c.tile.stamen.com",
            "d.tile.stamen.com"
          );

        console.log("constructor");
        this.initScene();
    }

    initScene() {
        console.log("initScene");

        // ToDo: implement setlist.fm search interface as an alternative to using a pre-defined WebScene
        var webscene = new WebScene({
            portalItem: { // autocasts as new PortalItem()
              id: "70e76c55c7bc4644999d0891af6eb9d4"
            }
          });
          console.log(webscene);

        watchUtils.watch(webscene, "allLayers.length", evt => {
            console.log("watch webscene.allLayers", evt);
            var blutourLayer: Layer = webscene.layers.find(function(layer: Layer) {
                return layer.title === "bluTour_hfl";
                });
            this.blutourFLayer = blutourLayer as FeatureLayer;
            this.blutourFLayer.popupTemplate = this.defineInfoTemplate();
            
            var timeFlies = new TimeFlies({
                flightLayer: this.blutourFLayer,
                dateFieldName: "date",
                sceneView: sceneView,
                zoomInLevel: 13,
                zoomOutLevel: 7,
                cameraTilt: 75,
                animationDurationMs: 4000
            });
            sceneView.ui.add(timeFlies, "bottom-left");
        });

        let btwExtent = {
            xmin: 653028.001899999,
            ymin: 5786277.1178,
            xmax: 1674447.2595,
            ymax: 7373205.4343,
            spatialReference: {
                wkid: 102100
            }
        } as Extent;   // TS definitions don't support Extent autocast in ArcGIS JS 4.5 yet

        var sceneView = this.createSceneView(webscene);
    

        sceneView.then(function(evt: any) {
    
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
    }

    defineInfoTemplate(): PopupTemplate {
        var infoTemplate = new PopupTemplate({
            title: "{location / veranstaltung}, {ort}",
            content: '<iframe src="{video}&output=embed" width="100%" height="100%"></iframe>'
        });

        return infoTemplate;
    }

    createSceneView(esrimap: EsriMap, btwExtent?: Extent) {
        var sceneViewProperties: __esri.SceneViewProperties = {
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
                    spatialReference: {wkid: 3857}
                },
                heading: 0.0,
                tilt: 75.00
            },
            highlightOptions: {
              color: [255, 241, 58],
              fillOpacity: 0.4
            },
            environment: {
                atmosphere: {
                    quality: "high"
                },
                starsEnabled: true
            }
        };

        return new SceneView(sceneViewProperties);
    }
}

// startup class
let bluTour = new BluTour();
