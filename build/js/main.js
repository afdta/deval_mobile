import degradation from "../../../js-modules/degradation.js";
import format from "../../../js-modules/formats.js";

import {state_geos, state_mesh} from './state-geos.js';
import cbsa_geos from './cbsa-geos';
import layout from './layout.js';
import map from './map.js';

import palette from './palette.js';
import dashboard from './dashboard.js';

import {lookup, bar_scale, devaluation_scale, radius_scale, rscale, fill} from './data.js';

import {all_data} from './all-data.js';


//to do: split out bar chart for map

//main function
function main(){

  var outer_map_container = document.getElementById("mi-map-panel");

  var compat = degradation();

  var cbsa_geos2 = cbsa_geos.filter(function(d){return lookup.hasOwnProperty(d.cbsa)})
                            .sort(function(a,b){
                              var aval = Math.abs(lookup[a.cbsa].summary.zil_deval_blk50_3);
                              var bval = Math.abs(lookup[b.cbsa].summary.zil_deval_blk50_3);
                              return d3.descending(aval, bval);
                            });




  //browser degradation
  if(compat.browser(map_container)){

    //DOM ROOTS
    var map_layout = layout(outer_map_container);
    var map_container = map_layout.panels.map;
    var bar_container = map_layout.panels.side.style("background-color","#e0e0e0");;
    var dash_container = document.getElementById("mi-dash-panel");
    var mobile_panel = map_layout.panels.mobile.style("text-align","center").append("div")
                                  .style("display","inline-block").style("text-align","left");

    map_layout.panels.title.style("margin-bottom","25px").style("text-align","center");
    var title_wrap = map_layout.panels.title.append("div").style("display","block").style("text-align","center").style("border-bottom","1px solid #ffffff").style("padding-bottom","5px");
    
    title_wrap.append("p").classed("mi-title2",true).text("Devaluation of black homes").style("margin-bottom","5px");
    title_wrap.append("p").html("<em>Hover over a metro area for detail on the magnitude of its devaluation</em>")

    //LEGEND
    var side_panel = bar_container.append("div").style("padding","15px").style("border-left","1px solid #ffffff")
    side_panel.append("p").html("<strong>Comparing home values in majority black neighborhoods with those where less than 1% of residents are black</strong>")

    var devalued = side_panel.append("div").classed("c-fix",true).style("margin","10px 0px 30px 0px");
    devalued.append("div").style("width","30px").style("height","1.25em").style("float","left").style("background-color",palette.red).style("margin","0px 5px 0px 0px");
    devalued.append("p").html("<strong>Devaluation:</strong> Comparable homes in majority black neighborhoods are worth <strong>less ↘</strong>").style("margin","0px");
    
    var devalued_svg = devalued.append("svg").attr("width","170px").attr("height","50px").style("float","right");
    devalued_svg.append("path").attr("d","M0,34 l165,0 l-7,-7").attr("stroke", "#555555").attr("stroke-width","2").attr("fill","none").attr("stroke-linejoin","round")
    devalued_svg.append("text").text("Greater devaluation").style("font-size","13px").style("font-weight","bold").attr("y","49").attr("x",165).attr("text-anchor","end");
    
    var circlesD = devalued_svg.selectAll("circle").data([0.1, 0.2, 0.35, 0.6, 0.85]);
    circlesD.enter().append("circle").merge(circlesD).attr("cx", function(d,i){
        return (10 + (i*35) - i*(15-rscale(d)));
    }).attr("cy",function(d){return 27-rscale(d)})
    .attr("r", function(d,i){return rscale(d)})
    .attr("fill","none")
    .attr("stroke",palette.red)
    .attr("stroke-width","3");

    var appreciated = side_panel.append("div").classed("c-fix",true);
    appreciated.append("div").style("width","30px").style("height","1.25em").style("float","left").style("background-color",palette.green).style("margin","0px 5px 0px 0px");
    appreciated.append("p").html("<strong>Appreciation:</strong> Comparable homes in majority black neighborhoods are worth <strong>more ↗</strong>").style("margin","0px");

    var appreciated_svg = appreciated.append("svg").attr("width","170px").attr("height","50px").style("float","right");
    appreciated_svg.append("path").attr("d","M0,34 l165,0 l-7,-7").attr("stroke", "#555555").attr("stroke-width","2").attr("fill","none").attr("stroke-linejoin","round")
    appreciated_svg.append("text").text("Greater appreciation").style("font-size","13px").style("font-weight","bold").attr("y","49").attr("x",165).attr("text-anchor","end");
    
    var circlesA = appreciated_svg.selectAll("circle").data([0.1, 0.2, 0.35, 0.6, 0.85]);
    circlesA.enter().append("circle").merge(circlesA).attr("cx", function(d,i){
        return (10 + (i*35) - i*(15-rscale(d)));
    }).attr("cy",function(d){return 27-rscale(d)})
    .attr("r", function(d,i){return rscale(d)})
    .attr("fill","none")
    .attr("stroke",palette.green)
    .attr("stroke-width","3");

    side_panel.append("p").style("margin","20px 0px").style("color","#555555")
                        .html("<em>Metro area dots are sized according to relative devaluation, measured in percentage point differences</em>");

    //MAP LAYOUT
    var statemap = map(map_container.node());
    var state_layer = statemap.add_states(state_geos.features, function(d){return d.properties.geo_id}).attr({fill:"#ffffff", stroke:"#aaaaaa"});
    var cbsa_layer = statemap.add_points(cbsa_geos2, function(d){return d.cbsa}, function(d){return [d.lon, d.lat]}).attr({fill:"none", "stroke-width":"3", stroke:fill, r:radius_scale, "pointer-events":"all"});
    var map_panels = statemap.panels();

    //MAP TOOLTIPS
    cbsa_layer.tooltips(function(code, node){
    

      var dot = d3.select(node);
      var dots = map_panels.anno.selectAll("circle").data([0]);
          dots.enter().append("circle").merge(dots)
              .attr("fill", dot.attr("stroke")).attr("r", dot.attr("r"))
              .attr("cx", dot.attr("cx")).attr("cy", dot.attr("cy"))
              .style("pointer-events","none")
              ;

      var price_actual = lookup[code].summary.price_actual;
      var price_estimated = lookup[code].summary.price_estimated;
      var price_diff = price_actual==null || price_estimated==null ? null : price_actual - price_estimated;

      return '<p style="line-height:1.5em;margin-bottom:8px;"><strong>' + 
              lookup[code].summary.cbsaname + 
              '</strong><p>' + 
              '<p style="margin-bottom:8px;">Relative difference <br/>' +
              format.shch1(lookup[code].summary.zil_deval_blk50_3) + 
              '</p>' + 
              '<p>Price difference (language?)<br/>' + 
              format.fn(price_diff, "dollch0") + 
             '</p>';
    }, function(){

      map_panels.anno.selectAll("circle").remove();
    });

    setTimeout(function(){
      map_layout.dims();
      statemap.print();
    }, 0);

  
    //dashboards
    dashboard(dash_container, cbsa_geos2, lookup);

  }
  else{
    compat.alert(dash_container);
  }

} //close main()


//bar chart draw/redraw
function draw_bars(svg, bars_main, bar_scale, devaluation_scale, mobile_swatches){

  var zero = bar_scale(0);

  var width = function(d){
      var v = d.value;
      var w;
      var xpos = bar_scale(v);
      if(v >= 0){
          w = xpos - zero;
      }
      else{
          w = zero - xpos;
      }
      return w + "%";
  }

  var bar_group_data = all_data.map(function(d){
      var val = d.summary.zil_deval_blk50_3;
      return {value: val, cbsa: d.summary.cbsa, color: devaluation_scale(val)}
  });

  var bar_groups = d3.nest().key(function(d){return d.color}).entries(bar_group_data)
                          .map(function(d){
                              if(d.values.length > 1){
                                  var extent = d3.extent(d.values, function(d){return d.value});
                                  var minfmt = format.shch1(extent[0]);
                                  var maxfmt = format.shch1(extent[1]);
                                  var label = minfmt===maxfmt ? maxfmt : minfmt + " to " + maxfmt;
                                  var min = extent[0];
                              }
                              else{
                                  var min = d.values[0].value;
                                  label = format.shch1(min);
                              }
                              return {
                                  label: label,
                                  n: d.values.length,
                                  min: min,
                                  bars: d.values.sort(function(a,b){
                                      return d3.ascending(a.value, b.value);
                                  })
                              }
                          })
                          .sort(function(a,b){return a.min - b.min});

  var prior_bars = 0;
  bar_groups.forEach(function(d){
      d.prior_bars = prior_bars;
      prior_bars = prior_bars + d.bars.length;
  });

    //draw bar chart
    var top_pad = 30;
    var bot_pad = 10;
    var group_pad = 25;        
    var bar_height = 2;
    
    //final height
    var height = (bar_height * all_data.length) + top_pad + bot_pad + group_pad*bar_groups.length;
    svg.attr("height",height+"px");

    //bar groups
    var bars_u = bars_main.selectAll("g.bar").data(bar_groups);
    bars_u.exit().remove();
    var bars_e = bars_u.enter().append("g").classed("bar",true);
    bars_e.append("text");
    var bars = bars_e.merge(bars_u).attr("transform", function(d,i){
        return "translate(0," + (top_pad + (i+1)*group_pad + d.prior_bars*bar_height) + ")";
    });


    //actual rectangles
    var b_u = bars.selectAll("rect.bar").data(function(d){return d.bars});
    b_u.exit().remove();
    var b_e = b_u.enter().append("rect").classed("bar",true);
    var b = b_e.merge(b_u);

    b.attr("width", width)
        .attr("height", bar_height-0)
        .attr("x", function(d){return d.value < 0 ? bar_scale(d.value)+"%" : zero+"%"}) 
        .attr("y",function(d,i){return i*bar_height})
        .attr("fill", function(d){return d.color})
        .attr("stroke", bar_height > 5 ? "#ffffff" : "none")
        .style("shape-rendering", bar_height > 3 ? "crispEdges" : null)
        ;

    //per-group y-axis
    var bax_u = bars.selectAll("line.bax").data(function(d){
      var height = d.n*bar_height;
      var x = zero + "%";
      return [{x1:x, x2:x, y1:-3, y2:height+2}]
    });
    bax_u.exit().remove();
    var bax_e = bax_u.enter().append("line").classed("bax",true);
    var bax = bax_e.merge(bax_u);

    bax.attr("x1", function(d){return d.x1}).attr("x2", function(d){return d.x2})
       .attr("y1", function(d){return d.y1}).attr("y2", function(d){return d.y2})
       .attr("stroke", palette.mediumgray)
       .style("shape-rendering", "crispEdges")
       ;

    //highlight dots
    var dot_u = bars.selectAll("circle.bar").data(function(d){return d.bars});
    dot_u.exit().remove();
    var dot_e = dot_u.enter().append("circle").classed("bar",true);
    var dot = dot_e.merge(dot_u);

    dot.attr("r", "2")
        .attr("cx", function(d){return bar_scale(d.value)+"%"}) 
        .attr("cy",function(d,i){return i*bar_height})
        .attr("transform", function(d){return d.value <= 0 ? "translate(-3,1)" : "translate(3,1)"})
        .attr("fill", function(d){
          return palette.mediumgray;
          return d.color;
        })
        .attr("stroke", "none")
        .style("visibility", "hidden")
        ;

    //group labels (ranges)
    var labels_u = bars.selectAll("text.label").data(function(d,i){
        var lab = d.label + " (" + d.n + ")";
        return [lab];
    });
    labels_u.exit().remove();
    var labels_e = labels_u.enter().append("text").classed("label",true);
    var labels = labels_e.merge(labels_u);

    labels.attr("x", zero+"%") 
        .attr("text-anchor", zero > 30 && zero < 60 ? "middle" : "start")
        .attr("y",function(d,i){return 0})
        .attr("dy","-5")
        .attr("dx","3")
        .text(function(d){return d})
        .attr("fill","#555555")
        .attr("stroke", function(d,i){return i==1 ? "#ffffff" : null})
        .attr("stroke-width", function(d,i){return i==1 ? 3 : null})
        .style("font-size","13px")
        .style("font-style","italic")
        ;

    //draw (mobile) legend swatches
    var swatches_up = mobile_swatches.selectAll("div.legend-swatch").data(bar_groups);
    swatches_up.exit().remove();
    var swatches_enter = swatches_up.enter().append("div").classed("legend-swatch",true).style("clear", function(d,i){return i==3 ? "left" : "none"});
    swatches_enter.append("div");
    swatches_enter.append("p");

    var swatches = swatches_enter.merge(swatches_up);

    swatches.select("div").style("background-color", function(d){return d.bars[0].color});
    swatches.select("p").html(function(d){return d.label});


    return dot;
}
//end draw_bars()

document.addEventListener("DOMContentLoaded", main);
