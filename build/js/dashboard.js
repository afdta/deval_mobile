import {state_geos} from './state-geos.js';
import map from './map.js';
import {neighborhood_bars, neighborhood_legend} from './bar-chart-module';
import format from "../../../js-modules/formats.js";
import palette from './palette.js';

export default function dashboard(container, cbsas, lookup){
    var wrap = d3.select(container);
    
    var dashboard_keys = ["X14", "X15", "X17", "X16", "X19", "X18", "X11", "X13", "X10", "X9", "X7"];

    var header = wrap.append("div").classed("c-fix",true).style("border-bottom","0px solid #ffffff")
            .style("background-color","#ffffff").style("padding","20px").style("margin-top","32px")
            .style("border-radius","5px");
    
    var title_box = header.append("div")
                        .classed("c-fix",true)
                        .style("float","none")
                        .style("clear","both")
                        ;



    var map_wrap = title_box.append("div").style("width", "110px")
                        .style("margin-right","15px")
                        .style("float","left")
                        .classed("mi-desktop-view",true);

    var title = title_box.append("p").classed("mi-title1",true)
                        .style("margin","0px 0px 0px 0px")
                        .style("float","left")
                        .style("display","inline-block")
                        .style("vertical-align","bottom");

    var highlight_map = map(map_wrap.node());
        highlight_map.add_states(state_geos.features, function(d){return d.properties.geo_id})
                    .attr({fill:"#666666", stroke:"#ffffff", "stroke-width":"0.5px"});
        
    var cbsa_layer = highlight_map.add_points(cbsas, function(d){return d.cbsa}, function(d){return [d.lon, d.lat]}).attr({r:"3"});

    var select_wrap = header.append("div").classed("select-wrap",true);
    
    select_wrap.append("svg").attr("width","20px").attr("height","20px").style("position","absolute").style("top","45%").style("right","0px")
               .append("path").attr("d", "M0,0 L5,5 L10,0").attr("fill","none").attr("stroke", "#aaaaaa").attr("stroke-width","2px");

    var select = select_wrap.append("select");
    select.append("option").text("Select a metropolitan area").attr("disabled","yes").attr("selected","1").attr("hidden","1");

    var options = select.selectAll("option.cbsa-option")
                        .data(cbsas.slice(0).sort(function(a,b){return d3.ascending(a.name, b.name)} ))
                        .enter().append("option").classed("cbsa-option",true)
                        .text(function(d){return d.name})
                        .attr("value", function(d){return d.cbsa})
                        ;

    var scope = {
        cbsa: "10420"
    }

    var body = wrap.append("div").classed("c-fix",true).style("margin-top","24px").style("padding","0px 0px");

    var panels = body.append("div").classed("c-fix mi-split",true).style("margin","2% 0px");
    
    var left_panel = panels.append("div");
    var right_panel = panels.append("div");


    left_panel.append("p").text("Summary metrics").classed("mi-title2",true);

    right_panel.append("p").classed("mi-title2",true).style("margin-left","0px")
                        .text("Neighborhood characteristics");

    //X6 - X19
    var bar_updaters = [];
    var rp1 = right_panel.append("div").classed("grid-container",true);

    neighborhood_legend(rp1.append("div").node());

    var dash_panels = rp1.selectAll("div.dash-panel").data(dashboard_keys).enter().append("div").classed("dash-panel",true);
    dash_panels.each(function(d){
        var that = this;
        bar_updaters.push(neighborhood_bars(that, d));
    });


    select.on("change", function(){
        scope.cbsa = this.value+"";
        update();
    });

    //update

    function update(cbsa_){
        if(arguments.length > 0){
            scope.cbsa = cbsa_;
        }

        cbsa_layer.attr({fill:function(d){return d==scope.cbsa ? palette.red : "none"}, 
                         r:"4", 
                         stroke:function(d){return d==scope.cbsa ? "#ffffff" : "none"}
                        });
        highlight_map.print(110);

        title.html(lookup[scope.cbsa].summary.cbsaname);

        bar_updaters.forEach(function(fn){
            fn(scope.cbsa);
        });

        summary_stats(scope.cbsa);
    }

    function summary_stats(geo){
        
        var data;

        try{
            var D = lookup[geo].summary;
            data = [
                {
                    title:"Median home value in majority black neighborhoods",
                    value:format.fn(D.price_actual, "doll0"),
                    footer:""
                },
                {
                    title:"Estimated median home value in majority black neighborhoods, in absence of devaluation",
                    value:format.fn(D.price_estimated, "doll0"),
                    footer:""
                },
                {
                    title:"Average devaluation of homes in majority black neighborhoods",
                    value:format.fn(D.zil_deval_blk50_3, "pct1"),
                    footer:""
                },
                {
                    title:"Black share of metro area population",
                    value:format.fn(D.pct_black2012_2016, "num1") + "%",
                    footer:""
                },
                {
                    title:"Dissimilarity index",
                    value:format.fn(D.dis, "num2"),
                    footer:format.fn(D.dis, "sh0") + " of the white population would need to move to a different neighborhood for the white and black population to be distributed evenly."
                }

            ];
        }
        catch(e){
            //console.log(e);
            data = [];
        }

        var divs = left_panel.selectAll("div.mi-summary-card").data(data);

        divs.exit().remove();

        var divs_enter = divs.enter().append("div").classed("mi-summary-card",true);
        divs_enter.append("p").classed("mi-summary-card-title",true);
        divs_enter.append("p").classed("mi-summary-card-value mi-title2",true);
        divs_enter.append("p").classed("mi-summary-card-footer",true);

        var divs_final = divs_enter.merge(divs);

        divs_final.select("p.mi-summary-card-title").text(function(d){return d.title});
        divs_final.select("p.mi-summary-card-value").text(function(d){return d.value});
        divs_final.select("p.mi-summary-card-footer").text(function(d){return d.footer});

    }

    //initialize
    update();
}