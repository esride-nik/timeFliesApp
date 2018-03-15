import Widget = require("esri/widgets/Widget");
import FeatureLayer = require("esri/layers/FeatureLayer");
import Query = require("esri/tasks/support/Query");
import FeatureSet = require("esri/tasks/support/FeatureSet");
import SceneView = require("esri/views/SceneView");
import LayerView = require("esri/views/layers/LayerView");
import Graphic = require("esri/Graphic");
import Geometry = require("esri/geometry/Geometry");
import Point = require("esri/geometry/Point");
import Symbol = require("esri/symbols/Symbol");
import SpatialReference = require("esri/geometry/SpatialReference");
import Accessor = require("esri/core/Accessor");
import Deferred = require("dojo/Deferred");
import dom = require("dojo/dom");
import domClass = require("dojo/dom-class");
import domConstruct = require("dojo/dom-construct");
import vis = require("https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.js");
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
    cameraTilt: number;
    animationDurationMs: number;
}

@subclass("esride.widgets.TimeFlies")
class TimeFlies extends declared(Widget) {

    @property()
    _timeline: vis.Timeline;

    @property()
    _animationPlaying: boolean;

    @property()
    _animateOnce: boolean;

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
    _lyrView: LayerView;

    @property()
    _highlightSelect: any;

    @property()
    _zoomInLevel: number;

    @property()
    _zoomOutLevel: number;

    @property()
    _cameraTilt: number;

    @property()
    _animationDurationMs: number;

    @property()
    _highlightSymbol: Symbol;

    // Feature selection is not yet supported in JS4, so we can't select a feature on the layer and just display the popup. We need to care for the display ourselves instead.
    @property()
    @renderable()
    fid: number;

    @property()
    @renderable()
    date: string;

    @property()
    @renderable()
    infos: HTMLElement;

    @property()
    @renderable()
    veranstaltung: HTMLElement;

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
        this._cameraTilt = params.cameraTilt;
        this._animationDurationMs = params.animationDurationMs;
        this._animationPlaying = true;
        
        var query = new Query();
        query.where = "1=1";
        query.orderByFields = [this._dateFieldName + " desc"];
        query.returnGeometry = true;
        query.outFields = ["*"];
        console.log("TimeFlies Query", query);
        
        // highlight is set on the layerView. 
        // Todo: layerView takes pretty long to load, so the first gig is never highlighted. We could wait for it to begin the animation, but is it worth it?
        var whenLayerView = this._sceneView.whenLayerView(this._flightLayer).then(function(lyrView) {
            console.log(lyrView);
        });   
        
        this._flightLayer.queryFeatures(query).then((results: FeatureSet) => {
          console.log("TimeFlies Result", results.features);
          this._features = results.features;
          this.initTimeline();
          this.iterateThroughFeaturesSynchronously(0);

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
        if (features.length>i && (this._animationPlaying || this._animateOnce)) {
            this.fid = (features[i] as Graphic).attributes.FID;
            
            // Feature selection is not yet supported in JS4, so we can't select a feature on the layer and just display the popup. We need to care for the display ourselves instead.
            this.date = this.formatDateReadable((features[i] as Graphic).attributes.date);
            this.infos = domConstruct.toDom((features[i] as Graphic).attributes.infos);
            this.veranstaltung = domConstruct.toDom((features[i] as Graphic).attributes.veranstaltung);
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
                    if (this._animationPlaying) {
                        this.iterateThroughFeaturesSynchronously(i);
                    }
                }
            );
        }
        else {
            console.log("Iteration finished.");
        }
    }

    zoomAndCenterOnFeature(feature: Graphic): Deferred {
        console.log("centering on feature", feature, feature.attributes.ort, feature.attributes.infos);
        
        // use the objectID to highlight the feature
        if (this._sceneView.layerViews.items.length > 0) {
            if (this._highlightSelect) {
                this._highlightSelect.remove();
            };
            this._highlightSelect = this._sceneView.layerViews.items[0].highlight(feature.attributes["FID"]);
        }

        var latitute: number = 0;
        var longitude: number = 0;

        // ToDo: refine animation. Camera should pan to next feature => adjust heading over time.
        if (feature.geometry.type==="point") {
            latitute = (feature.geometry as Point).latitude;
            longitude = (feature.geometry as Point).longitude;
        }

        this._goToTarget = {
            zoom: this._zoomInLevel,
            center: [longitude, latitute],
            tilt: this._cameraTilt
        }
        this._goToOptions = {
            animate: true,
            duration: this._animationDurationMs,
            easing: "in-out-cubic"
        }

        return this._sceneView.goTo(this._goToTarget, this._goToOptions);
    }

    pauseFlight() {
        domClass.add(dom.byId("btnPause"), "is-active");
        domClass.remove(dom.byId("btnResume"), "is-active");
        this._animationPlaying = false;
    }

    resumeFlight() {
        this.activatePlay();
        if (this._currentFeature >= this._features.length) {
            this._currentFeature = 0;
        }
        this.iterateThroughFeaturesSynchronously(this._currentFeature);
    }

    activatePlay() {
        domClass.add(dom.byId("btnResume"), "is-active");
        domClass.remove(dom.byId("btnPause"), "is-active");
        this._animationPlaying = true;
    }

    reverse() {
        this._animateOnce = true;
        if (this._currentFeature >= this._features.length+10) {
            this._currentFeature = -1;
        }
        this.iterateThroughFeaturesSynchronously(this._currentFeature+10);
    }

    toPrevious() {
        this._animateOnce = true;
        if (this._currentFeature >= this._features.length) {
            this._currentFeature = -1;
        }
        this.iterateThroughFeaturesSynchronously(this._currentFeature+1);
    }

    toNext() {
        this._animateOnce = true;
        if (this._currentFeature==0) {
            this._currentFeature = this._features.length+1; 
        }
        this.iterateThroughFeaturesSynchronously(this._currentFeature-1);
    }

    forward() {
        this._animateOnce = true;
        if (this._currentFeature-10<=0) {
            this._currentFeature = this._features.length+1; 
        }
        this.iterateThroughFeaturesSynchronously(this._currentFeature-10);
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
        // ToDo: Get start and end date from layer
        var options = {
            maxHeight: 100,
            width: '100%',
            start: '2003-09-01 00:00:00',
            end: '2018-01-31 00:00:00'
        };
    
        // Create a Timeline
        this._timeline = new vis.Timeline(container, items, options);
    }

    createLinkElement(htmlElement: HTMLAnchorElement, key: string): JSX.Element {
        return <a href={htmlElement.href} target={htmlElement.target} key={key}>{htmlElement.textContent}</a>
    }

    analyzeHtmlElement(htmlElement: HTMLElement, key: string): JSX.Element {
        var jsxElement: JSX.Element = "";
        if (htmlElement) {
            if (htmlElement.nodeName==="A") {
                jsxElement = this.createLinkElement(htmlElement as HTMLAnchorElement, "veranstaltung");
            }
            else if (htmlElement.nodeName==="#document-fragment" && htmlElement.hasChildNodes()) {
                var returnValue = [];
                for (var i = 0; i < htmlElement.childNodes.length; i++) {
                    if (i>0) {
                        returnValue.push(" ");
                    }
                    returnValue.push(this.analyzeHtmlElement(htmlElement.childNodes[i] as HTMLElement, key));
                  }
                return returnValue;
            }
            else if (htmlElement.nodeName==="#text" && htmlElement.textContent && htmlElement.textContent!="null") {
                jsxElement = <div key={key}>{htmlElement.textContent}</div>;
            }
        }
        return jsxElement;
    }

    render() {
        const classes = {
            [CSS.base]: true,
            [CSS.esrideTimeFlies]: true
        };

        var numberElement: JSX.Element = "";
        if (this.nr) {
            numberElement = <i key="number">#{this.nr}</i>;
        }

        var dayAndDateElement: JSX.Element = "";
        if (this.wochentag && this.wochentag.length>0 && this.date && this.date.length>0) {
            dayAndDateElement = <div key="dayAndDate">{this.wochentag}, {this.date}</div>;
        }

        var tagebuchElement: JSX.Element = "";
        if (this.tagebuch && this.tagebuch.length>0)
            tagebuchElement = <div key="tagebuch"><a href={this.tagebuch} target="_blank">Tagebuch</a></div>;

        var stagetimeElement: JSX.Element = "";
        if (this.stagetime && this.stagetime.length>0) {
            stagetimeElement = <div key="stagetime">/ {this.stagetime}</div>;
        }

        var videoElement: JSX.Element = "";
        if (this.video) {
            videoElement = <iframe class="popupvid" src={this.video} frameborder="0" allow="autoplay; encrypted-media" allowfullscreen="true"></iframe>
        }
        else {
            videoElement = <img class="popupvid" src="pics/blulogo43.png" />
        }

        var infosElement: JSX.Element = this.analyzeHtmlElement(this.infos, "infos");
        var veranstaltungElement: JSX.Element = this.analyzeHtmlElement(this.veranstaltung, "veranstaltung");

        return (
            <div class={CSS.base}>
                <div classes={classes}>
                    {videoElement}

                    <p class="popupcontent">
                        {numberElement}<br />
                        {dayAndDateElement} {stagetimeElement}<br />
                        <div><b>{this.plz} {this.ort} {veranstaltungElement}</b></div><br />
                        {infosElement}<br />
                        {tagebuchElement}
                    </p>
                
                    <p class="popupbtn">
                        <button bind={this} onclick={this.reverse} class="btn" id="btnRev"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" class="svg-icon"><path d="M18 6v20L4 16.002 18 6zm8 0h-4v20h4V6z"/></svg></button><button bind={this} onclick={this.toPrevious} class="btn" id="btnPrev"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" class="svg-icon"><path d="M25 28h-5L8 16 20 4h5L13 16l12 12z"/></svg></button><button bind={this} onclick={this.resumeFlight} class="btn is-active" id="btnResume"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" class="svg-icon"><path d="M6 0l22 16.002L6 32V0z"/></svg></button><button bind={this} onclick={this.pauseFlight} class="btn" id="btnPause"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" class="svg-icon"><path d="M26 4v24h-6V4h6zM6 28h6V4H6v24z"/></svg></button><button bind={this} onclick={this.toNext} class="btn" id="btnNext"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" class="svg-icon"><path d="M7 4h5l12 12-12 12H7l12-12L7 4z"/></svg></button><button bind={this} onclick={this.forward} class="btn" id="btnForward"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" class="svg-icon"><path d="M28 16.002L14 26V6l14 10.002zM6 26h4V6H6v20z"/></svg></button>
                    </p>
                </div>
                <link href="https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.css" rel="stylesheet" type="text/css" />
                <div id="visualization"></div>
            </div>
        );    
    }
}

export = TimeFlies;