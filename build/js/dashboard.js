import {state_geos} from './state-geos.js';
import map from './map.js';
import {neighborhood_bars, neighborhood_legend} from './bar-chart-module';

export default function dashboard(container, cbsas, lookup){
    var wrap = d3.select(container);

    //console.log(cbsas);

    var header = wrap.append("div").classed("c-fix",true).style("border-bottom","1px solid #ffffff");;

    var select_wrap = header.append("div").classed("select-wrap",true).style("float","right");

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

    var title_box = header.append("div").classed("c-fix",true).style("float","none");

    var panels = body.append("div").classed("c-fix mi-split",true).style("margin","32px 0px");
    
    var left_panel = panels.append("div");
    var right_panel = panels.append("div");


    var map_wrap = title_box.append("div").style("width", "110px").style("height", "50px").style("margin-right","15px").style("display","inline-block");
    
    var highlight_map = map(map_wrap.node());
        highlight_map.add_states(state_geos.features, function(d){return d.properties.geo_id}).attr({fill:"#ffffff", stroke:"#dddddd", "stroke-width":"1px"});
        
    var cbsa_layer = highlight_map.add_points(cbsas, function(d){return d.cbsa}, function(d){return [d.lon, d.lat]}).attr({r:"3"});

    var title = title_box.append("p").classed("mi-title1",true).style("display","inline-block").style("margin","15px 0px");



left_panel.append("p").text("...")

    right_panel.append("p").classed("mi-title3",true).text("Neighborhood characteristics by share of the population that is black");



    //X6 - X19
    var bar_updaters = [];
    var rp1 = right_panel.append("div").classed("grid-container",true);

    neighborhood_legend(rp1.append("div").node());

    var X = 5;
    while(++X <= 19){
        bar_updaters.push(neighborhood_bars(rp1.append("div").node(), "X"+X));
    }

    select.on("change", function(){
        scope.cbsa = this.value+"";
        update();
    });

    //update

    function update(cbsa_){
        if(arguments.length > 0){
            scope.cbsa = cbsa_;
        }

        cbsa_layer.attr({stroke:function(d){return d==scope.cbsa ? "#333333" : "none"}, r:"3", fill:"none"});
        highlight_map.print(110);

        title.html(lookup[scope.cbsa].summary.cbsaname);

        bar_updaters.forEach(function(fn){
            fn(scope.cbsa);
        });
    }

    //initialize
    update();
}