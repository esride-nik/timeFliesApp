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

class Btw2017 extends _WidgetBase {

    private renderer: SimpleRenderer;
    private config: any;
    private blutourFLayer: FeatureLayer;
/* 
    private partycolors: PartyProperties = {
        "afd": [0, 158, 224, 1.0],
        "cducsu": [0, 0, 0, 1.0],
        "fdp": [255, 237, 0, 1.0],
        "spd": [226, 0, 26, 1.0],
        "linke": [227, 6, 19, 1.0],
        "gruene": [31, 175, 18, 1.0]
        }
    private partyname: PartyProperties = {
        "afd":"AfD",
        "cducsu": "CDU/CSU",
        "fdp": "FDP",
        "spd":"SPD",
        "linke": "Die Linke",
        "gruene": "B90/Die Grünen"
        }
    private partymax: PartyProperties = {
        "afd": 36,
        "cducsu": 55,
        "fdp": 20,
        "spd": 38,
        "linke": 30,
        "gruene": 22
        } */
    
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

        var webscene = new WebScene({
            portalItem: { // autocasts as new PortalItem()
              id: "70e76c55c7bc4644999d0891af6eb9d4"
            }
          });
          console.log(webscene);

          //webscene.watch("allLayers", function(evt) 

        watchUtils.watch(webscene, "allLayers.length", evt => {
            console.log("watch webscene.allLayers", evt);
            var blutourLayer: Layer = webscene.layers.find(function(layer: Layer) {
                return layer.title === "verpasst_03_date_hfl";
                });
            this.blutourFLayer = blutourLayer as FeatureLayer;
            this.blutourFLayer.popupTemplate = this.defineInfoTemplate();
            
            var timeFlies = new TimeFlies({
                flightLayer: this.blutourFLayer,
                dateFieldName: "date",
                sceneView: sceneView,
                zoomInLevel: 10,
                zoomOutLevel: 7
            });
            sceneView.ui.add(timeFlies, "bottom-left");
        });


    
            // The clipping extent for the scene
            let btwExtent = { // autocasts as new Extent()
                xmin: 653028.001899999,
                ymin: 5986277.1178,
                xmax: 1674447.2595,
                ymax: 7373205.4343,
                spatialReference: { // autocasts as new SpatialReference()
                    wkid: 102100
                }
            } as Extent;   // TS definitions don't support Extent autocast in ArcGIS JS 4.5 yet
    
            var sceneView = this.createSceneView(webscene, btwExtent);
    
            sceneView.then(function(evt: any) {
/*                 var legend = new Legend({
                    view: sceneView,
                    layerInfos: [{
                    layer: blutourFLayer,
                    title: "Ergebnis pro Partei"
                    }]
                });
                sceneView.ui.add(legend, "bottom-right"); */
        
                var cameraStatus = new CameraStatus({
                    sceneView: sceneView
                });
                sceneView.ui.add(cameraStatus, "top-right");
    
                // Set up a home button for resetting the viewpoint to the intial extent
                var homeBtn = new Home({
                    view: sceneView,
                    container: "homeDiv"
                });
            });

        //});
    }

    defineInfoTemplate(): PopupTemplate {
        var infoTemplate = new PopupTemplate({
            title: "{location / veranstaltung}, {ort}",
            content: '<iframe src="{video}&output=embed" width="100%" height="100%"></iframe>'
            //content: '<iframe src="https://drive.google.com/file/d/0B71_N8y_7NupZkRhdWdkUnhSSlU/preview" width="100%" height="100%"></iframe>'
        });

        return infoTemplate;
    }
/* 
    createBlutourLayer() {
        var party = "cducsu";

        var btwLayer: FeatureLayer = new FeatureLayer({
            url: "https://services.arcgis.com/OLiydejKCZTGhvWg/arcgis/rest/services/Wahlkreise_2017_amtlichesErgebnis/FeatureServer/0",
            renderer: this.defineRenderer(party),
            popupTemplate: this.defineInfoTemplate(party),
            outFields: ["*"],
        });

        // ToDo: This was supposed to remove the loader when the 3D layer is rendered in the client and show it when the renderer is changed. But it doesn't do that.
        var handle = btwLayer.watch('loadStatus', function(newValue, oldValue, property, object) {
            console.log("loadStatus New value: ", newValue);      // The new value of the property
            console.log("loadStatus Old value: ", oldValue);  // The previous value of the changed property
            console.log("loadStatus Watched Property: ", property); 
            console.log("loadStatus Watched Object: ", object);

            if (newValue==="loaded") {
                domClass.remove(dom.byId("loader"), "is-active");
            }
            else if (newValue==="loading") {
                domClass.add(dom.byId("loader"), "is-active");
            }
           });

        // Define elevationInfo and set it on the layer
        var currentElevationInfo = {
            mode: "relative-to-ground",
            offset: 150,
            featureExpressionInfo: {
            expression: "Geometry($feature).z * 10"
            },
            unit: "meters"
        };

        btwLayer.elevationInfo = currentElevationInfo;

        return btwLayer;
    } */

/*     createMap(btwLayer: FeatureLayer) {
        var esrimap = new EsriMap({
            layers: [btwLayer]
        });

        var tiledLayer = new WebTileLayer({
            urlTemplate:
              "http://{subDomain}.tile.stamen.com/toner/{level}/{col}/{row}.png",
            subDomains: ["a", "b", "c", "d"],
            copyright:
              'Map tiles by <a href="http://stamen.com/">Stamen Design</a>, ' +
              'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. ' +
              'Data by <a href="http://openstreetmap.org/">OpenStreetMap</a>, ' +
              'under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
          });
        
          esrimap.add(tiledLayer);

        return esrimap;
    } */

    createSceneView(esrimap: EsriMap, btwExtent: Extent) {
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
                    latitude: 38.95,
                    longitude: 10.23,
                    z: 677567.35,
                    spatialReference: {wkid: 3857}
                },
                heading: 0.0,
                tilt: 67.25
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
            
    postCreate() {
        console.log("postCreate");
    }
    
    defineRenderer(party: string) {
        var vvSize = {
        type: "size",
        valueExpression: "($feature.btw17_WKR_" + party + "_zweit - $feature.btw17_WKR_" + party + "_zweit13) / $feature.btw17_WKR_" + party + "_zweit13 *100", //Arcade Expression
        valueExpressionTitle: "Gewinn/Verlust",
        stops: [
        {
            value: -150,
            size: -200000,
            label: "-150%"
        },
        {
            value: 150,
            size: 200000,
            label: "+150%"
        }]
        };

        var vvColor = {
            type: "color",
            field: "btw17_WKR_" + party + "_zweitp",
            legendOptions: {
                title: this.partyname[party]
            },
            stops: [
            {
                value: 0,
                color: [255, 255, 255, 0.6],
                label: "0%"
            },
            {
                value: this.partymax[party],
                color: this.partycolors[party],
                label: this.partymax[party]+"%"
            }]
            };

            var renderer = new SimpleRenderer({
            symbol: new PolygonSymbol3D({
            symbolLayers: [new ExtrudeSymbol3DLayer()]
            }),
            visualVariables: [vvSize, vvColor]
        });
        return renderer;
    }
}

interface PartyProperties {
    [propName: string]: string | number | number[];
}

// startup class
let btw2017 = new Btw2017();
