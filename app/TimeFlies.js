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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define(["require", "exports", "esri/widgets/Widget", "esri/layers/FeatureLayer", "esri/tasks/support/Query", "esri/views/SceneView", "esri/symbols/Symbol", "dojo/dom", "dojo/dom-class", "dojo/dom-construct", "https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.js", "esri/core/accessorSupport/decorators", "esri/widgets/support/widget"], function (require, exports, Widget, FeatureLayer, Query, SceneView, Symbol, dom, domClass, domConstruct, vis, decorators_1, widget_1) {
    "use strict";
    var CSS = {
        base: "esri-widget",
        esrideTimeFlies: "esride-time-flies"
    };
    var TimeFlies = /** @class */ (function (_super) {
        __extends(TimeFlies, _super);
        function TimeFlies(params) {
            var _this = _super.call(this) || this;
            _this._flightLayer = params.flightLayer;
            _this._dateFieldName = params.dateFieldName;
            _this._sceneView = params.sceneView;
            _this._zoomInLevel = params.zoomInLevel;
            _this._zoomOutLevel = params.zoomOutLevel;
            _this._animationPlaying = true;
            var query = new Query();
            query.where = "1=1";
            query.orderByFields = [_this._dateFieldName + " desc"];
            query.returnGeometry = true;
            query.outFields = ["*"];
            console.log("TimeFlies Query", query);
            _this._flightLayer.queryFeatures(query).then(function (results) {
                console.log("TimeFlies Result", results.features);
                _this._features = results.features;
                _this.initTimeline();
                _this.iterateThroughFeaturesSynchronously(0);
                // ToDo: Play videos automatically
                // ToDo: create route to all features, put into FL with ID corresponding to point and highlight route feature on each animation
            });
            return _this;
        }
        TimeFlies.prototype.formatDateReadable = function (dateString) {
            var dateObj = new Date(dateString);
            return dateObj.getDate() + "." + (dateObj.getMonth() + 1) + "." + dateObj.getFullYear();
        };
        TimeFlies.prototype.formatDateYmd = function (dateString) {
            var dateObj = new Date(dateString);
            return dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1) + "-" + dateObj.getDate();
        };
        TimeFlies.prototype.iterateThroughFeaturesSynchronously = function (i) {
            var _this = this;
            var features = this._features;
            this._currentFeature = i;
            // don't iterate via features.map(), because this executes asynchonously and doesn't wait for the animation to finish
            if (features.length > i && (this._animationPlaying || this._animateOnce)) {
                this.fid = features[i].attributes.FID;
                // Feature selection is not yet supported in JS4, so we can't select a feature on the layer and just display the popup. We need to care for the display ourselves instead.
                this.date = this.formatDateReadable(features[i].attributes.date);
                this.infos = domConstruct.toDom(features[i].attributes.infos);
                this.veranstaltung = domConstruct.toDom(features[i].attributes.veranstaltung);
                this.nr = features[i].attributes.nr_;
                this.ort = features[i].attributes.ort;
                this.plz = features[i].attributes.plz;
                this.stagetime = features[i].attributes.stagetime;
                this.tagebuch = features[i].attributes.tagebuch;
                this.video = features[i].attributes.video;
                this.wochentag = features[i].attributes.wochentag;
                this._timeline.setSelection([i + 1], {
                    focus: true
                });
                this.zoomAndCenterOnFeature(features[i]).then(function (evt) {
                    i++;
                    if (_this._animationPlaying) {
                        _this.iterateThroughFeaturesSynchronously(i);
                    }
                });
            }
            else {
                console.log("Iteration finished.");
            }
        };
        TimeFlies.prototype.zoomAndCenterOnFeature = function (feature) {
            console.log("centering on feature", feature, feature.attributes.ort, feature.attributes.infos);
            this._highlightSymbol = this._flightLayer.renderer.symbol;
            this._highlightSymbol.color = [255, 0, 0, 1];
            feature.symbol = this._highlightSymbol;
            var latitute = 0;
            var longitude = 0;
            // ToDo: Zoom to first feature (feature action "zoom" zooms in four LODs and centers on the selected feature)
            if (feature.geometry.type === "point") {
                latitute = feature.geometry.latitude;
                longitude = feature.geometry.longitude;
            }
            this._goToTarget = {
                zoom: this._zoomInLevel,
                center: [longitude, latitute],
                tilt: 75
            };
            this._goToOptions = {
                animate: true,
                duration: 4000,
                easing: "in-out-cubic"
            };
            return this._sceneView.goTo(this._goToTarget, this._goToOptions);
        };
        TimeFlies.prototype.pauseFlight = function () {
            domClass.add(dom.byId("btnPause"), "is-active");
            domClass.remove(dom.byId("btnResume"), "is-active");
            this._animationPlaying = false;
        };
        TimeFlies.prototype.resumeFlight = function () {
            this.activatePlay();
            if (this._currentFeature >= this._features.length) {
                this._currentFeature = 0;
            }
            this.iterateThroughFeaturesSynchronously(this._currentFeature);
        };
        TimeFlies.prototype.activatePlay = function () {
            domClass.add(dom.byId("btnResume"), "is-active");
            domClass.remove(dom.byId("btnPause"), "is-active");
            this._animationPlaying = true;
        };
        TimeFlies.prototype.reverse = function () {
            this._animateOnce = true;
            if (this._currentFeature >= this._features.length + 10) {
                this._currentFeature = -1;
            }
            this.iterateThroughFeaturesSynchronously(this._currentFeature + 10);
        };
        TimeFlies.prototype.toPrevious = function () {
            this._animateOnce = true;
            if (this._currentFeature >= this._features.length) {
                this._currentFeature = -1;
            }
            this.iterateThroughFeaturesSynchronously(this._currentFeature + 1);
        };
        TimeFlies.prototype.toNext = function () {
            this._animateOnce = true;
            if (this._currentFeature == 0) {
                this._currentFeature = this._features.length + 1;
            }
            this.iterateThroughFeaturesSynchronously(this._currentFeature - 1);
        };
        TimeFlies.prototype.forward = function () {
            this._animateOnce = true;
            if (this._currentFeature - 10 <= 0) {
                this._currentFeature = this._features.length + 1;
            }
            this.iterateThroughFeaturesSynchronously(this._currentFeature - 10);
        };
        TimeFlies.prototype.initTimeline = function () {
            var _this = this;
            console.log("initTimeline", this);
            // DOM element where the Timeline will be attached
            var container = document.getElementById('visualization');
            var itemsArray = this._features.map(function (graphic) {
                return {
                    id: graphic.attributes.FID,
                    content: '<a href="#">' + graphic.attributes.ort + '</a>',
                    start: _this.formatDateYmd(graphic.attributes.date)
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
        };
        TimeFlies.prototype.createLinkElement = function (htmlElement, key) {
            return widget_1.tsx("a", { href: htmlElement.href, target: htmlElement.target, key: key }, htmlElement.textContent);
        };
        TimeFlies.prototype.analyzeHtmlElement = function (htmlElement, key) {
            var jsxElement = "";
            if (htmlElement) {
                if (htmlElement.nodeName === "A") {
                    jsxElement = this.createLinkElement(htmlElement, "veranstaltung");
                }
                else if (htmlElement.nodeName === "#document-fragment" && htmlElement.hasChildNodes()) {
                    var returnValue = [];
                    for (var i = 0; i < htmlElement.childNodes.length; i++) {
                        if (i > 0) {
                            returnValue.push(" ");
                        }
                        returnValue.push(this.analyzeHtmlElement(htmlElement.childNodes[i], key));
                    }
                    return returnValue;
                }
                else if (htmlElement.nodeName === "#text" && htmlElement.textContent && htmlElement.textContent != "null") {
                    jsxElement = widget_1.tsx("div", { key: key }, htmlElement.textContent);
                }
            }
            return jsxElement;
        };
        TimeFlies.prototype.render = function () {
            var classes = (_a = {},
                _a[CSS.base] = true,
                _a[CSS.esrideTimeFlies] = true,
                _a);
            var numberElement = "";
            if (this.nr) {
                numberElement = widget_1.tsx("i", { key: "number" },
                    "#",
                    this.nr);
            }
            var dayAndDateElement = "";
            if (this.wochentag && this.wochentag.length > 0 && this.date && this.date.length > 0) {
                dayAndDateElement = widget_1.tsx("div", { key: "dayAndDate" },
                    this.wochentag,
                    ", ",
                    this.date);
            }
            var tagebuchElement = "";
            if (this.tagebuch && this.tagebuch.length > 0)
                tagebuchElement = widget_1.tsx("div", { key: "tagebuch" },
                    widget_1.tsx("a", { href: this.tagebuch, target: "_blank" }, "Tagebuch"));
            var stagetimeElement = "";
            if (this.stagetime && this.stagetime.length > 0) {
                stagetimeElement = widget_1.tsx("div", { key: "stagetime" },
                    "/ ",
                    this.stagetime);
            }
            var videoElement = "";
            if (this.video) {
                videoElement = widget_1.tsx("iframe", { class: "popupvid", src: this.video, frameborder: "0", allow: "autoplay; encrypted-media", allowfullscreen: "true" });
            }
            else {
                videoElement = widget_1.tsx("img", { class: "popupvid", src: "pics/blulogo43.png" });
            }
            var infosElement = this.analyzeHtmlElement(this.infos, "infos");
            var veranstaltungElement = this.analyzeHtmlElement(this.veranstaltung, "veranstaltung");
            return (widget_1.tsx("div", { class: CSS.base },
                widget_1.tsx("div", { classes: classes },
                    videoElement,
                    widget_1.tsx("p", { class: "popupcontent" },
                        numberElement,
                        widget_1.tsx("br", null),
                        dayAndDateElement,
                        " ",
                        stagetimeElement,
                        widget_1.tsx("br", null),
                        widget_1.tsx("div", null,
                            widget_1.tsx("b", null,
                                this.plz,
                                " ",
                                this.ort,
                                " ",
                                veranstaltungElement)),
                        widget_1.tsx("br", null),
                        infosElement,
                        widget_1.tsx("br", null),
                        tagebuchElement),
                    widget_1.tsx("p", { class: "popupbtn" },
                        widget_1.tsx("button", { bind: this, onclick: this.reverse, class: "btn", id: "btnRev" },
                            widget_1.tsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "32", height: "32", viewBox: "0 0 32 32", class: "svg-icon" },
                                widget_1.tsx("path", { d: "M18 6v20L4 16.002 18 6zm8 0h-4v20h4V6z" }))),
                        widget_1.tsx("button", { bind: this, onclick: this.toPrevious, class: "btn", id: "btnPrev" },
                            widget_1.tsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "32", height: "32", viewBox: "0 0 32 32", class: "svg-icon" },
                                widget_1.tsx("path", { d: "M25 28h-5L8 16 20 4h5L13 16l12 12z" }))),
                        widget_1.tsx("button", { bind: this, onclick: this.resumeFlight, class: "btn is-active", id: "btnResume" },
                            widget_1.tsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "32", height: "32", viewBox: "0 0 32 32", class: "svg-icon" },
                                widget_1.tsx("path", { d: "M6 0l22 16.002L6 32V0z" }))),
                        widget_1.tsx("button", { bind: this, onclick: this.pauseFlight, class: "btn", id: "btnPause" },
                            widget_1.tsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "32", height: "32", viewBox: "0 0 32 32", class: "svg-icon" },
                                widget_1.tsx("path", { d: "M26 4v24h-6V4h6zM6 28h6V4H6v24z" }))),
                        widget_1.tsx("button", { bind: this, onclick: this.toNext, class: "btn", id: "btnNext" },
                            widget_1.tsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "32", height: "32", viewBox: "0 0 32 32", class: "svg-icon" },
                                widget_1.tsx("path", { d: "M7 4h5l12 12-12 12H7l12-12L7 4z" }))),
                        widget_1.tsx("button", { bind: this, onclick: this.forward, class: "btn", id: "btnForward" },
                            widget_1.tsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "32", height: "32", viewBox: "0 0 32 32", class: "svg-icon" },
                                widget_1.tsx("path", { d: "M28 16.002L14 26V6l14 10.002zM6 26h4V6H6v20z" }))))),
                widget_1.tsx("link", { href: "https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.css", rel: "stylesheet", type: "text/css" }),
                widget_1.tsx("div", { id: "visualization" })));
            var _a;
        };
        __decorate([
            decorators_1.property(),
            __metadata("design:type", typeof (_a = (typeof vis !== "undefined" && vis).Timeline) === "function" && _a || Object)
        ], TimeFlies.prototype, "_timeline", void 0);
        __decorate([
            decorators_1.property(),
            __metadata("design:type", Boolean)
        ], TimeFlies.prototype, "_animationPlaying", void 0);
        __decorate([
            decorators_1.property(),
            __metadata("design:type", Boolean)
        ], TimeFlies.prototype, "_animateOnce", void 0);
        __decorate([
            decorators_1.property(),
            __metadata("design:type", Number)
        ], TimeFlies.prototype, "_currentFeature", void 0);
        __decorate([
            decorators_1.property(),
            __metadata("design:type", Array)
        ], TimeFlies.prototype, "_features", void 0);
        __decorate([
            decorators_1.property(),
            __metadata("design:type", Object)
        ], TimeFlies.prototype, "_goToTarget", void 0);
        __decorate([
            decorators_1.property(),
            __metadata("design:type", Object)
        ], TimeFlies.prototype, "_goToOptions", void 0);
        __decorate([
            decorators_1.property(),
            __metadata("design:type", FeatureLayer)
        ], TimeFlies.prototype, "_flightLayer", void 0);
        __decorate([
            decorators_1.property(),
            __metadata("design:type", String)
        ], TimeFlies.prototype, "_dateFieldName", void 0);
        __decorate([
            decorators_1.property(),
            __metadata("design:type", SceneView)
        ], TimeFlies.prototype, "_sceneView", void 0);
        __decorate([
            decorators_1.property(),
            __metadata("design:type", Number)
        ], TimeFlies.prototype, "_zoomInLevel", void 0);
        __decorate([
            decorators_1.property(),
            __metadata("design:type", Number)
        ], TimeFlies.prototype, "_zoomOutLevel", void 0);
        __decorate([
            decorators_1.property(),
            __metadata("design:type", Symbol)
        ], TimeFlies.prototype, "_highlightSymbol", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable(),
            __metadata("design:type", Number)
        ], TimeFlies.prototype, "fid", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable(),
            __metadata("design:type", String)
        ], TimeFlies.prototype, "date", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable(),
            __metadata("design:type", HTMLElement)
        ], TimeFlies.prototype, "infos", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable(),
            __metadata("design:type", HTMLElement)
        ], TimeFlies.prototype, "veranstaltung", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable(),
            __metadata("design:type", Number)
        ], TimeFlies.prototype, "nr", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable(),
            __metadata("design:type", String)
        ], TimeFlies.prototype, "ort", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable(),
            __metadata("design:type", String)
        ], TimeFlies.prototype, "plz", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable(),
            __metadata("design:type", String)
        ], TimeFlies.prototype, "stagetime", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable(),
            __metadata("design:type", String)
        ], TimeFlies.prototype, "tagebuch", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable(),
            __metadata("design:type", String)
        ], TimeFlies.prototype, "video", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable(),
            __metadata("design:type", String)
        ], TimeFlies.prototype, "wochentag", void 0);
        TimeFlies = __decorate([
            decorators_1.subclass("esride.widgets.TimeFlies"),
            __metadata("design:paramtypes", [Object])
        ], TimeFlies);
        return TimeFlies;
        var _a;
    }(decorators_1.declared(Widget)));
    return TimeFlies;
});
//# sourceMappingURL=TimeFlies.js.map