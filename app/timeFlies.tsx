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

    // Feature selection is not yet supported in JS4, so we can't select a feature on the layer and just display the popup. We need to care for the display ourselves instead.
    @property()
    @renderable()
    fid: number;

    @property()
    @renderable()
    date: string;

    @property()
    @renderable()
    infos: string;

    @property()
    @renderable()
    location: string;

    @property()
    @renderable()
    nr: number;

    @property()
    @renderable()
    ort: string;

    @property()
    @renderable()
    plz: string;

    @property()
    @renderable()
    stagetime: string;

    @property()
    @renderable()
    tagebuch: string;
    
    @property()
    @renderable()
    video: string;

    @property()
    @renderable()
    wochentag: string;

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
            this.fid = (features[i] as Graphic).attributes.FID;
            
            // Feature selection is not yet supported in JS4, so we can't select a feature on the layer and just display the popup. We need to care for the display ourselves instead.
            var dateObj = new Date((features[i] as Graphic).attributes.date);
            this.date = dateObj.getDate() + "." + (dateObj.getMonth()+1) + "." + dateObj.getFullYear();
            this.infos = (features[i] as Graphic).attributes.infos;
            this.location = (features[i] as Graphic).attributes.location___veranstaltung;
            this.nr = (features[i] as Graphic).attributes.nr_;
            this.ort = (features[i] as Graphic).attributes.ort;
            this.plz = (features[i] as Graphic).attributes.plz;
            this.stagetime = (features[i] as Graphic).attributes.stagetime;
            this.tagebuch = (features[i] as Graphic).attributes.tagebuch;
            this.video = (features[i] as Graphic).attributes.video;
            this.wochentag = (features[i] as Graphic).attributes.wochentag;
            
            this.zoomAndCenterOnFeature(features[i]).then((evt: any) => {
                    i++;
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
                Gig No.: <b>{this.nr}<br />
                {this.wochentag}, {this.date}<br />
                {this.location}<br />
                Ort: {this.ort}</b><br />
                Infos: {this.infos}<br />
                PLZ: {this.plz}<br />
                Stagetime: {this.stagetime}<br />
                Tagebuch: {this.tagebuch}<br />
                Video: <iframe src={this.video} width='100%' height='100%' frameborder='0' gesture='media' allow='encrypted-media' allowfullscreen></iframe>
            </div>
        );    
    }
}

export = TimeFlies;