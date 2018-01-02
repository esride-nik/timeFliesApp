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
import dom = require("dojo/dom");
import domClass = require("dojo/dom-class");
import vis = require("http://visjs.org/dist/vis.js");
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
    _timeline: vis.Timeline;

    @property()
    _animationPlaying: boolean;

    @property()
    _currentFeature: number;

    @property()
    _features: Graphic[];

    @property()
    _goToTarget: any;

    @property()
    _goToOptions: any;

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
        this._animationPlaying = true;
        
        var query = new Query();
        query.where = "1=1";
        query.orderByFields = [this._dateFieldName + " desc"];
        query.returnGeometry = true;
        query.outFields = ["*"];
        console.log("TimeFlies Query", query);
        
        this._flightLayer.queryFeatures(query).then((results: FeatureSet) => {
          console.log("TimeFlies Result", results.features);
          this._features = results.features;
          this.initTimeline();
          this.iterateThroughFeaturesSynchronously(0);

          // ToDo: Create animation for alle features
          // ToDo: Open popups automatically
          // ToDo: Play videos automatically
          // ToDo: create route to all features, put into FL with ID corresponding to point and highlight route feature on each animation
        });
    }

    formatDateReadable(dateString: string) {
        var dateObj = new Date(dateString);
        return dateObj.getDate() + "." + (dateObj.getMonth()+1) + "." + dateObj.getFullYear();
    }

    formatDateYmd(dateString: string) {
        var dateObj = new Date(dateString);
        return dateObj.getFullYear() + "-" + (dateObj.getMonth()+1) + "-" + dateObj.getDate();
    }
    
    iterateThroughFeaturesSynchronously(i: number) {
        var features: Graphic[] = this._features;
        this._currentFeature = i;
        // don't iterate via features.map(), because this executes asynchonously and doesn't wait for the animation to finish
        if (features.length>i && this._animationPlaying) {
            this.fid = (features[i] as Graphic).attributes.FID;
            
            // Feature selection is not yet supported in JS4, so we can't select a feature on the layer and just display the popup. We need to care for the display ourselves instead.
            this.date = this.formatDateReadable((features[i] as Graphic).attributes.date);
            this.infos = (features[i] as Graphic).attributes.infos;
            this.location = (features[i] as Graphic).attributes.location___veranstaltung;
            this.nr = (features[i] as Graphic).attributes.nr_;
            this.ort = (features[i] as Graphic).attributes.ort;
            this.plz = (features[i] as Graphic).attributes.plz;
            this.stagetime = (features[i] as Graphic).attributes.stagetime;
            this.tagebuch = (features[i] as Graphic).attributes.tagebuch;
            this.video = (features[i] as Graphic).attributes.video;
            this.wochentag = (features[i] as Graphic).attributes.wochentag;
            
            this._timeline.setSelection([i+1], {
                focus: true
              });
            this.zoomAndCenterOnFeature(features[i]).then((evt: any) => {
                    i++;
                    this.iterateThroughFeaturesSynchronously(i);
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

        this._goToTarget = {
            zoom: this._zoomInLevel,
            center: [longitude, latitute],
            tilt: 75
        }
        this._goToOptions = {
            animate: true,
            duration: 4000,
            easing: "in-out-cubic"
        }

        return this._sceneView.goTo(this._goToTarget, this._goToOptions);
    }
    
    createMarkup() {
        return {__html: '<a target="_blank" href="http://www.colognenightofmusic.de">cologne night of music</a>'};
    }

    pauseFlight() {
        domClass.add(dom.byId("btnPause"), "is-active");
        domClass.remove(dom.byId("btnResume"), "is-active");
        this._animationPlaying = false;
    }

    resumeFlight() {
        domClass.add(dom.byId("btnResume"), "is-active");
        domClass.remove(dom.byId("btnPause"), "is-active");
        this._animationPlaying = true;
        if (this._currentFeature >= this._features.length) {
            this._currentFeature = 0;
        }
        this.iterateThroughFeaturesSynchronously(this._currentFeature);
    }

    toPrevious() {
        if (this._currentFeature >= this._features.length) {
            this._currentFeature = -1;
        }
        this.iterateThroughFeaturesSynchronously(this._currentFeature+1);
    }

    toNext() {
        if (this._currentFeature==0) {
            this._currentFeature = this._features.length+1; 
        }
        this.iterateThroughFeaturesSynchronously(this._currentFeature-1);
    }

    initTimeline() {
        console.log("initTimeline", this);

        // DOM element where the Timeline will be attached
        var container = document.getElementById('visualization');
            
        var itemsArray = this._features.map((graphic: Graphic) => {
            return {
                id: graphic.attributes.FID,
                content: '<a href="#">' + graphic.attributes.ort + '</a>',
                start: this.formatDateYmd(graphic.attributes.date)
            };
        });
        // Create a DataSet (allows two way data-binding)        
        var items = new vis.DataSet(itemsArray);
    
        // Configuration for the Timeline
        var options = {
            maxHeight: 100,
            width: 800
        };
    
        // Create a Timeline
        this._timeline = new vis.Timeline(container, items, options);
        this._timeline.fit();
        this._timeline.zoomIn(50);
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
                <div
                class="content"
              />
              <iframe class="popupvid" src={this.video} width='50%' height='50%' frameborder='0' gesture='media' allow='encrypted-media' allowfullscreen></iframe>
            
              <p class="popupcontent">
                <p class="popupbtn">
                    <button bind={this} onclick={this.toPrevious} class="btn" id="btnPrev"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" class="svg-icon"><path d="M25 28h-5L8 16 20 4h5L13 16l12 12z"/></svg></button>
                    <button bind={this} onclick={this.resumeFlight} class="btn is-active" id="btnResume"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" class="svg-icon"><path d="M6 0l22 16.002L6 32V0z"/></svg></button>
                    <button bind={this}  onclick={this.pauseFlight} class="btn" id="btnPause"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" class="svg-icon"><path d="M26 4v24h-6V4h6zM6 28h6V4H6v24z"/></svg></button>
                    <button bind={this} onclick={this.toNext} class="btn" id="btnNext"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" class="svg-icon"><path d="M7 4h5l12 12-12 12H7l12-12L7 4z"/></svg></button>
                </p>
                <i>#{this.nr}</i> {this.wochentag}, {this.date} / {this.stagetime}<br />
                <b>{this.ort} {this.plz}, {this.location}</b><br />
                {this.infos}<br />
                Tagebuch: {this.tagebuch}<br />
              </p>

                <link href="http://visjs.org/dist/vis.css" rel="stylesheet" type="text/css" />
                <div id="visualization"></div>
            </div>
        );    
    }
}

export = TimeFlies;