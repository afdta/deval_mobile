import degradation from "../../../js-modules/degradation.js";
import format from "../../../js-modules/formats.js";

import {state_geos} from './state-geos.js';
import cbsa_geos from './cbsa-geos';
import layout from './layout.js';
import map from './map.js';

import dashboard from './dashboard.js';

import {lookup, radius_scale, fill} from './data.js';

import render_legend from './render-legend.js';

//main function
function main(){

  var outer_map_container = document.getElementById("mi-map-panel");

  var compat = degradation(outer_map_container);

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

    //add legends
    render_legend(bar_container.node());
    render_legend(mobile_panel.node(), true);

    //MAP LAYOUT
    var statemap = map(map_container.node());
    var state_layer = statemap.add_states(state_geos.features, function(d){return d.properties.geo_id}).attr({fill:"#ffffff", stroke:"#aaaaaa"});
    var cbsa_layer = statemap.add_points(cbsa_geos2, function(d){return d.cbsa}, function(d){return [d.lon, d.lat]}).attr({fill:"none", "stroke-width":"3", stroke:fill, r:radius_scale, "pointer-events":"all"});
    var map_panels = statemap.panels();

    //MAP TOOLTIPS FUNCTION
    cbsa_layer.tooltips(function(code, node){
      //show...
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
    }, 
    function(){
      //hide...
      map_panels.anno.selectAll("circle").remove();
    });

    setTimeout(function(){
      map_layout.dims().callback(function(){
        var width = this.widths.map;
        console.log(width);
        statemap.print(width);
      });
      statemap.print();
    }, 0);

  
    //dashboards
    dashboard(dash_container, cbsa_geos2, lookup);

  }
  else{
    compat.alert(dash_container);
  }

} //close main()


document.addEventListener("DOMContentLoaded", main);
