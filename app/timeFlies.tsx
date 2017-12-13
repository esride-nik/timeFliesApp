import Widget = require("esri/widgets/Widget");
import FeatureLayer = require("esri/layers/FeatureLayer");
import Query = require("esri/tasks/support/Query");
import FeatureSet = require("esri/tasks/support/FeatureSet");
import SceneView = require("esri/views/SceneView");
import Graphic = require("esri/Graphic");
import Geometry = require("esri/geometry/Geometry");
import Point = require("esri/geometry/Point");
import SpatialReference = require("esri/geometry/SpatialReference");
import Accessor = require("esri/core/Accessor");
import Deferred = require("dojo/Deferred");
import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

const CSS = {
    base: "esri-widget",
    esrideTimeFlies: "esride-time-flies"
  };

interface TimeFliesParams {
    flightLayer: FeatureLayer;
    dateFieldName: string;
    sceneView: SceneView;
    zoomInLevel: number;
    zoomOutLevel: number;
}

@subclass("esride.widgets.TimeFlies")
class TimeFlies extends declared(Widget) {

    @property()
    _flightLayer: FeatureLayer;

    @property()
    _dateFieldName: string;

    @property()
    _sceneView: SceneView;

    @property()
    _zoomInLevel: number;

    @property()
    _zoomOutLevel: number;

    @property()
    @renderable()
    fid: number;

    constructor(params: TimeFliesParams) {
        super();
        this._flightLayer = params.flightLayer;
        this._dateFieldName = params.dateFieldName;
        this._sceneView = params.sceneView;
        this._zoomInLevel = params.zoomInLevel;
        this._zoomOutLevel = params.zoomOutLevel;
        
        var query = new Query();
        query.where = "1=1";
        query.orderByFields = [this._dateFieldName + " desc"];
        query.returnGeometry = true;
        query.outFields = ["*"];
        console.log("TimeFlies Query", query);
        
        this._flightLayer.queryFeatures(query).then((results: FeatureSet) => {
          console.log("TimeFlies Result", results.features);
          this.iterateThroughFeaturesSynchronously(results.features, 0);

          // ToDo: Create animation for alle features
          // ToDo: Open popups automatically
          // ToDo: Play videos automatically
          // ToDo: create route to all features, put into FL with ID corresponding to point and highlight route feature on each animation
        });
    }

    iterateThroughFeaturesSynchronously(features: Graphic[], i: number) {
        // don't iterate via features.map(), because this executes asynchonously and doesn't wait for the animation to finish
        if (features.length>i) {
            this.zoomAndCenterOnFeature(features[i]).then((evt: any) => {
                    console.log("zoomAndCenterOnFeature then", evt);
                    i++;
                    this.fid = (features[i] as Graphic).attributes.FID;
                    this.iterateThroughFeaturesSynchronously(features, i);
                }
            );
        }
        else {
            console.log("Iteration finished.");
        }
    }

    zoomAndCenterOnFeature(feature: Graphic): Deferred {
        console.log("centering on feature", feature, feature.attributes.ort, feature.attributes.infos);

        var latitute: number = 0;
        var longitude: number = 0;

        // ToDo: Zoom to first feature (feature action "zoom" zooms in four LODs and centers on the selected feature)
        if (feature.geometry.type==="point") {
            latitute = (feature.geometry as Point).latitude;
            longitude = (feature.geometry as Point).longitude;
        }

        return this._sceneView.goTo({
            zoom: this._zoomInLevel,
            center: [longitude, latitute],
            tilt: 75
        }, {
            animate: true,
            duration: 4000,
            easing: "in-out-cubic"
        });
    }

    render() {
        const classes = {
            [CSS.base]: true,
            [CSS.esrideTimeFlies]: true
        };
        return (
            <div bind={this}
                class={CSS.base}
                classes={classes}>
                Feature No.: {this.fid}<br/>
            </div>
        );    
    }
}

export = TimeFlies;