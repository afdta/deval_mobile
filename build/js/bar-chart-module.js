import {all_data, names} from './all-data.js';
import {lookup} from './data.js';
import format from "../../../js-modules/formats.js";
import palette from "./palette.js";

function neighborhood_bar_scope(){
    var scope = {
        bar_height: 12,
        types: ["Less1", "B1_5", "B5_10", "B10_20", "B20_50", "Major"],
        type_fill: ['#ff96bc', '#e3759c', '#bf597d', '#9b4061', '#762b46', '#4f192d'],
        type_labels:  {
            Less1:"Less than 1%",
            B1_5:"1%–5%",
            B5_10:"5%–10%",
            B10_20:"10%–20%",
            B20_50:"20%–50%",
            Major:"50%+",
        },
        formats : {
            X6: format.fn0("num1"),
            X7: format.fn0("num1"),
            X8: format.fn0("num1"),
            X9: format.fn0("num1"),
            X10: format.fn0("num1"),
            X11: format.fn0("num1"),
            X12: function(v){return format.fn(v, "num1") + "%"},
            X13: function(v){return format.fn(v, "num1") + "%"},
            X14: format.fn0("num0"),
            X15: format.fn0("num0"),
            X16: format.fn0("doll0"),
            X17: format.fn0("doll0"),
            X18: format.fn0("num1"),
            X19: format.fn0("num1")
        }
    }

    scope.fill = d3.scaleOrdinal().domain(scope.types).range(scope.type_fill).unknown("#dddddd");

    return scope;
}

function neighborhood_bars(container, indicator){

    var scope = neighborhood_bar_scope();

    var wrap = d3.select(container);

    var all_ = all_data.map(function(d){
        return scope.types.map(function(t){
            return d.neighborhood[t][indicator];
        }) 
    })
    var all = [].concat.apply([], all_);
    var extent_ = d3.extent(all);
    var extent = [extent_[0] < 0 ? extent_[0] : 0, extent_[1] > 0 ? extent_[1] : 0];
    var range = [extent[0] == 0 ? 0 : 10, extent[1] == 0 ? 100 : 90];

    var scale = d3.scaleLinear().domain(extent).range(range);
    var zero = scale(0);

    var width = function(v){
        if(v!=null){
            return v >= 0 ? scale(v) - zero : zero - scale(v);
        }
        else{
            return 0;
        }
    }

    var x = function(v){
        if(v!=null){
            return v >= 0 ? zero : zero - scale(v);
        }
        else{
            return 0;
        }
    }

    var title_wrap = wrap.append("div").classed("c-fix",true);

    title_wrap.append("p").text(names[indicator]).style("margin","0px 0px 5px 0px")
                .style("font-weight","bold");

    var svg = wrap.append("svg")
                  .attr("width","100%")
                  .attr("height", (15+(scope.types.length*scope.bar_height))+"px");

    function update(cbsa){
        if(lookup.hasOwnProperty(cbsa)){
            var data = scope.types.map(function(t){
                return {type: t, val: lookup[cbsa].neighborhood[t][indicator]}
            });
            var bars = svg.selectAll("rect").data(data);
            bars.exit().remove();
            bars.enter().append("rect").merge(bars)
                .attr("x", function(d){return x(d.val) + "%"})
                .attr("y", function(d,i){return 5 + (i * (scope.bar_height + 1))})
                .attr("height", scope.bar_height)
                .attr("fill", function(d){return scope.fill(d.type)})
                .transition().duration(700)
                .attr("width", function(d){return width(d.val) + "%"});

            var labels = svg.selectAll("text").data(data);
                labels.exit().remove();
                labels.enter().append("text").merge(labels)
                    .attr("y", function(d,i){return 5 + (i * (scope.bar_height + 1))})
                    .attr("dy", 10)
                    .attr("dx", 3)
                    .style("font-size","13px")
                    .text(function(d){return scope.formats[indicator](d.val)})
                    .transition().duration(700)
                    .attr("x", function(d){return (x(d.val) + width(d.val)) + "%"});
        }
        else{
            svg.selectAll("*").remove();
        }
    }

    return update;
}

function neighborhood_legend(container){

    var scope = neighborhood_bar_scope();

    var wrap = d3.select(container).style("border-color", palette.red);

    var tab = wrap.append("svg").attr("width","20px").attr("height","20px").style("position","absolute")
                .style("left","-1px").style("top","-1px").append("path")
                .attr("d", "M0,0 L20,0 L0,20 Z").attr("fill",palette.red);

    wrap.append("p").html('<strong style="color:#bf597d">Key</strong><br />Share of neighborhood population that is black')
                    .style("font-weight","bold").style("margin","0px 0px 5px 0px").style("font-size","18px");

    var svg = wrap.append("svg")
                  .attr("width","100%")
                  .attr("height", (15+(scope.types.length*scope.bar_height))+"px");

    var bars = svg.selectAll("rect").data(scope.types);
    bars.exit().remove();
    bars.enter().append("rect").merge(bars)
        .attr("x", "0%")
        .attr("y", function(d,i){return 5 + (i * (scope.bar_height + 1))})
        .attr("height", scope.bar_height)
        .attr("width", scope.bar_height)
        .attr("fill", function(d){return scope.fill(d)});

    var labels = svg.selectAll("text").data(scope.types);
        labels.exit().remove();
        labels.enter().append("text").merge(labels)
            .attr("x", scope.bar_height)
            .attr("y", function(d,i){return 5 + (i * (scope.bar_height + 1))})
            .attr("dy", 10)
            .attr("dx", 3)
            .style("font-size","13px")
            .style("font-weight","bold")
            .text(function(d){return scope.type_labels[d]});
}

export {neighborhood_bars, neighborhood_legend};