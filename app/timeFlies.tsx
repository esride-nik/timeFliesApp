import Widget = require("esri/widgets/Widget");
import FeatureLayer = require("esri/layers/FeatureLayer");
import Query = require("esri/tasks/support/Query");
import Accessor = require("esri/core/Accessor");
import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";

const CSS = {
    base: "esri-widget",
    esrideTimeFlies: "esride-time-flies"
  };

interface TimeFliesParams {
    flightLayer: FeatureLayer;
    dateFieldName: string;
}

@subclass("esride.widgets.TimeFlies")
class TimeFlies extends declared(Widget) {

    @property()
    _flightLayer: FeatureLayer;

    @property()
    _dateFieldName: string;

    @property()
    @renderable()
    fieldOfView: number = 0;

    @property()
    @renderable()
    heading: number = 0;

    @property()
    @renderable()
    tilt: number = 0;

    @property()
    @renderable()
    latitude: number = 0;

    @property()
    @renderable()
    longitude: number = 0;

    @property()
    @renderable()
    altitude: number = 0;

    constructor(params: TimeFliesParams) {
        super();
        this._flightLayer = params.flightLayer;
        this._dateFieldName = params.dateFieldName;
        
        var query = new Query();
        query.where = "1=1";
        query.orderByFields = [this._dateFieldName + " desc"];
        query.returnGeometry = false;
        query.outFields = ["*"];
        console.log("TimeFlies Query", query);
        
        this._flightLayer.queryFeatures(query).then(function(results){
          console.log("TimeFlies Result", results.features);  // prints the array of features to the console
          // ToDo: Zoom to first feature (look up what the feature action in the popup is doing)
          // ToDo: Create animation for alle features
          // ToDo: Open popups automatically
          // ToDo: Play videos automatically
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
                Field of view: {this.fieldOfView.toFixed(2)}<br/>
                Heading: {this.heading.toFixed(2)}<br/>
                Tilt: {this.tilt.toFixed(2)}<br/>
                Latitude: {this.latitude.toFixed(2)}<br/>
                Longitude: {this.longitude.toFixed(2)}<br/>
                Altitude: {this.altitude.toFixed(2)}<br/>
            </div>
        );    
    }
}

export = TimeFlies;