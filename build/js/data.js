import {all_data, names} from './all-data.js';
import palette from './palette.js';
 
var lookup = {};
all_data.forEach(function(d,i){
    var c = d.summary.cbsa;
    var h = d.neighborhood;
    lookup[c] = d;

    if(h.Less1.X1 != h.B1_5.X1 || h.B1_5.X1 != h.B5_10.X1 || 
        h.B10_20.X1 != h.B20_50.X1 || h.B20_50.X1 != h.Major.X1 ||
        c != h.Major.X1){
            //console.warn("Invalid merge");
            //console.log(d);
            //2 obs (Muncie, Shreveport) fail this test: data not available for all levels -- need to handle nulls
    }
});


//scales for map and accompanying bar chart
var extent = d3.extent(all_data, function(d){return d.summary.zil_deval_blk50_3});
var absmax0 = d3.max(all_data, function(d){return Math.abs(d.summary.zil_deval_blk50_3)});
var absmax = 0.6; //manually clip off extremes
var redscale = d3.scaleQuantize().domain([0, absmax]).range(palette.reds);
var greenscale = d3.scaleQuantize().domain([0, absmax]).range(palette.greens);
var rscale = d3.scaleSqrt().domain([0, absmax0]).range([0,15]);

var bar_scale = d3.scaleLinear().domain(extent).range([5,85]).nice();
var devaluation_scale = function(v){
    if(v != null){
        return v >= 0 ? greenscale(v) : redscale(Math.abs(v));
    }
    else{
        return palette.na;
    }
}

var radius_scale = function(cbsa){
    var v = lookup[cbsa].summary.zil_deval_blk50_3;
    if(v != null){
        return(rscale(Math.abs(v)));
    }
    else{
        return 0;
    }
}

var fill = function(cbsa){
    if(lookup.hasOwnProperty(cbsa)){
        var d = lookup[cbsa].summary.zil_deval_blk50_3;
        var c = devaluation_scale(d);
        return c;
    }
    else{
        return palette.na;
    }
}


export {lookup, devaluation_scale, radius_scale, fill, bar_scale};