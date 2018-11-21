//bar chart draw/redraw
export default function draw_bars(svg, bars_main, bar_scale, devaluation_scale, mobile_swatches){

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