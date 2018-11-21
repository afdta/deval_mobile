import degradation from "../../../js-modules/degradation.js";
import format from "../../../js-modules/formats.js";

import {state_geos, state_mesh} from './state-geos.js';
import cbsa_geos from './cbsa-geos';
import layout from './layout.js';
import map from './map.js';

import palette from './palette.js';
import dashboard from './dashboard.js';

import {lookup, dashboard_keys, radius_scale, rscale, fill} from './data.js';

import {all_data} from './all-data.js';

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
                                  .style("text-align","left");

    map_layout.panels.title.style("margin-bottom","25px").style("text-align","center");
    var title_wrap = map_layout.panels.title.append("div").style("display","block").style("text-align","center").style("border-bottom","1px solid #ffffff").style("padding-bottom","5px");
    
    title_wrap.append("p").classed("mi-title2",true).text("Devaluation of black homes").style("margin-bottom","5px");
    title_wrap.append("p").html("<em>113 metropolitan areas with at least one majority black neighborhood</em>")

    //LEGEND
    var side_panel = bar_container.append("div").style("padding","15px").style("border-left","1px solid #ffffff")
    side_panel.append("p").html("<strong>Comparing home values in majority black neighborhoods with those where less than 1% of residents are black</strong>").style("margin-bottom","20px")

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

    side_panel.append("p").style("margin","20px 0px 30px 0px").style("color","#555555")
                        .html("<em>Devaluation and appreciation are represented by percent difference between comparable homes. Hover over metro areas for detail on the magnitude of devaluation.</em>");

    //end desktop legend

    mobile_panel.append("p").html("<strong>Comparing home values in majority black neighborhoods with those where less than 1% of residents are black</strong>");
    mobile_panel.append("p").text("Mobile version of legend to be added");

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
              '<p style="margin-bottom:8px;">Percent difference <br/>' +
              format.pct1(lookup[code].summary.zil_deval_blk50_3) + 
              '</p>' + 
              '<p>Absolute price difference<br/>' + 
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
    dashboard(dash_container, cbsa_geos2, lookup, dashboard_keys);

  }
  else{
    compat.alert(dash_container);
  }

} //close main()


document.addEventListener("DOMContentLoaded", main);
