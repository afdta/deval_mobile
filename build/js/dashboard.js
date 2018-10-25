import {state_geos} from './state-geos.js';
import map from './map.js';

export default function dashboard(container, cbsas, lookup){
    var wrap = d3.select(container);

    console.log(cbsas);

    var header = wrap.append("div").classed("c-fix",true);

    var select_wrap = header.append("div").classed("select-wrap",true);

    select_wrap.append("svg").attr("width","20px").attr("height","20px").style("position","absolute").style("top","45%").style("right","0px")
               .append("path").attr("d", "M0,0 L5,5 L10,0").attr("fill","none").attr("stroke", "#aaaaaa").attr("stroke-width","2px");

    var select = select_wrap.append("select");
    select.append("option").text("Select a metropolitan area").attr("disabled","yes").attr("selected","1").attr("hidden","1");

    var options = select.selectAll("option")
                        .data(cbsas.slice(0).sort(function(a,b){return d3.ascending(a.name, b.name)} ))
                        .enter().append("option")
                        .text(function(d){return d.name})
                        .attr("value", function(d){return d.cbsa})
                        ;

    var scope = {
        cbsa: "10420"
    }

    var body = wrap.append("div").classed("c-fix",true).style("margin-top","24px").style("padding","0px 0px");

    var title_box = body.append("div").classed("c-fix",true).style("border","1px solid #ffffff").style("border-width","0px 0px 1px 0px").style("padding","10px 0px");
    var map_wrap = title_box.append("div").style("float","left").style("width", "130px").style("height", "50px").style("margin-right","15px");
    var highlight_map = map(map_wrap.node()).responsive(false);
        highlight_map.draw_states(state_geos.features, {fill:"#ffffff", stroke:"#dddddd", "stroke-width":"1px"}, function(d){return d.properties.geo_id});
        
    var cbsa_layer = highlight_map.draw_points(cbsas, {r:"3"}, function(d){return d.cbsa}, function(d){return [d.lon, d.lat]});
    var title = title_box.append("p").classed("mi-title2",true).style("float","left").style("margin","15px 0px");

    var panels = body.append("div").classed("c-fix mi-split",true).style("margin","32px 0px");
    
    var left_panel = panels.append("div");
    var right_panel = panels.append("div");

    left_panel.append("p").classed("mi-title3",true).text("Summary data here");
    left_panel.append("p").text("Which indicators?");
    right_panel.append("p").classed("mi-title3",true).text("Neighborhood level data here");
    right_panel.append("p").text("Which indicators?");


    select.on("change", function(){
        scope.cbsa = this.value+"";
        update();
    });

    //update

    function update(cbsa_){
        if(arguments.length > 0){
            scope.cbsa = cbsa_;
        }

        cbsa_layer.attrs({stroke:function(d){return d==scope.cbsa ? "#333333" : "none"}, r:"3", fill:"none"});

        title.html(lookup[scope.cbsa].summary.cbsaname);
    }

    //initialize
    update();
}