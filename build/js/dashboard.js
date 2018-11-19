import {state_geos} from './state-geos.js';
import map from './map.js';
import {neighborhood_bars, neighborhood_legend} from './bar-chart-module';
import {lookup} from './data.js';
import format from "../../../js-modules/formats.js";

export default function dashboard(container, cbsas, lookup){
    var wrap = d3.select(container);

    //console.log(cbsas);

    var header = wrap.append("div").classed("c-fix",true).style("border-bottom","1px solid #ffffff");;

    var select_wrap = header.append("div").classed("select-wrap",true)
                                          .style("float","right");

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

    var title_box = header.append("div")
                        .classed("c-fix",true)
                        .style("float","none")
                        .style("padding-bottom","15px");

    var panels = body.append("div").classed("c-fix mi-split",true).style("margin","32px 0px");
    
    var left_panel = panels.append("div");
    var right_panel = panels.append("div");


    var map_wrap = title_box.append("div").style("width", "130px")
                            .style("margin-right","15px")
                            .style("float","left")
                            .classed("mi-desktop-view",true);
    
    var highlight_map = map(map_wrap.node());
        highlight_map.add_states(state_geos.features, function(d){return d.properties.geo_id}).attr({fill:"#ffffff", stroke:"#ff96bc", "stroke-width":"0.5px"});
        
    var cbsa_layer = highlight_map.add_points(cbsas, function(d){return d.cbsa}, function(d){return [d.lon, d.lat]}).attr({r:"3"});

    var title = title_box.append("p").classed("mi-title1",true)
                        .style("margin","0px 0px 0px 0px");



    //left_panel.append("p").text("Summary metrics here").classed("mi-title3");

    right_panel.append("p").classed("mi-title3",true).text("Neighborhood characteristics by share of the population that is black");
    right_panel.append("p").html("<em>Subtitle here, if helpful. NEED: Cleaned up variable titles and reorder. POSSIBLE: Add definitions on hover.</em>")


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

        cbsa_layer.attr({fill:function(d){return d==scope.cbsa ? "#9b4061" : "none"}, 
                         r:"5", 
                         stroke:function(d){return d==scope.cbsa ? "#ffffff" : "none"}
                        });
        highlight_map.print(130);

        title.html(lookup[scope.cbsa].summary.cbsaname);

        bar_updaters.forEach(function(fn){
            fn(scope.cbsa);
        });

        summary_stats(scope.cbsa);
    }

    //from david on summary stats

 
    // number, and gross wealth lost in the metro due to devaluation.

    function summary_stats(geo){
        
        var data;

        try{
            var D = lookup[geo].summary;
            data = [
                {
                    title:"Black share of metro area population",
                    value:format.fn(D.pct_black2012_2016, "num1") + "%",
                    footer:"Variable used: pct_black2012_2016 || rank here?"
                },
                {
                    title:"Dissimilarity index",
                    value:format.fn(D.dis, "num1"),
                    footer:"Variable used: dis || add note on how to interpret value"
                },
                {
                    title:"Median home value",
                    value:format.fn(D.price_actual, "doll0"),
                    footer:"Variable used: price_actual"
                },
                {
                    title:"Average devaluation of black homes",
                    value:format.fn(D.zil_deval_blk50_3, "shch1"),
                    footer:"Variable used: zil_deval_blk50_3 | percentage points"
                },
                {
                    title:"Gross wealth lost",
                    value:"Which variable?",
                    footer:"Notes"
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
        divs_enter.append("p").classed("mi-summary-card-value",true);
        divs_enter.append("p").classed("mi-summary-card-footer",true);

        var divs_final = divs_enter.merge(divs);

        divs_final.select("p.mi-summary-card-title").text(function(d){return d.title});
        divs_final.select("p.mi-summary-card-value").text(function(d){return d.value});
        divs_final.select("p.mi-summary-card-footer").text(function(d){return d.footer});

    }

    //initialize
    update();
}