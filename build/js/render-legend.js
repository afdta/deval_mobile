import palette from './palette.js';
import {rscale} from './data.js';
export default function render_legend(container, mobile){

    var side_panel = d3.select(container).append("div").classed("c-fix",true).style("padding","15px")
    side_panel.append("p").html("<strong>Comparing home values in majority black neighborhoods with those where less than 1% of residents are black</strong>").style("margin-bottom","20px")

    var devalued = side_panel.append("div").classed("c-fix",true).classed("devaluation-legend-entry",true);
    devalued.append("div").style("width","30px").style("height","1.1em").style("float","left").style("background-color",palette.red).style("margin","0px 5px 0px 0px");
    devalued.append("p").html('<strong>Devaluation:</strong> Comparable homes in majority black neighborhoods are worth <strong>less</strong> <img style="display:inline" src="https://www.brookings.edu/wp-content/uploads/2018/11/devaluation-worth-less.png" />').style("margin","0px");
    
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
    appreciated.append("div").style("width","30px").style("height","1.1em").style("float","left").style("background-color",palette.green).style("margin","0px 5px 0px 0px");
    appreciated.append("p").html('<strong>Appreciation:</strong> Comparable homes in majority black neighborhoods are worth <strong>more</strong> <img style="display:inline" src="https://www.brookings.edu/wp-content/uploads/2018/11/devaluation-worth-more.png" />').style("margin","0px");

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

    var footnote_text = "<em>Devaluation and appreciation are represented by percent difference between comparable homes. Hover over metro areas for detail on the magnitude of devaluation.</em>";
    var footnote = side_panel.append("p").style("margin","20px 0px 0px 0px").style("color","#555555").html(footnote_text);

    var is_mobile = arguments.length > 1 ? !!mobile : false;
    if(is_mobile){
        devalued.style("float","left").style("width","47%").style("min-width","170px").style("margin","0px 3% 20px 0px");
        appreciated.style("float","left").style("width","47%").style("min-width","170px").style("margin","0px 0px 20px 3%");
        footnote.style("clear","both");
        side_panel.style("padding-top","25px");
    }
    else{
        devalued.style("margin","10px 0px 30px 0px");
    }

}