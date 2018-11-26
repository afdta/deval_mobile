export default function layout(container, width){
    
    var callback;
    var scope = {};

    scope.callback = function(fn){
        if(arguments.length > 0){
            callback = fn;
            return scope;
        }
        else{
            return callback;
        }
    }
    
    if(arguments.length < 2){
        width = "auto";
    }
    else if((width+"").search("px") == -1){
        width = width + "px";
    }

    var wrap = d3.select(container).append("div").classed("layout-root",true).style("width", width);


    //DOM CONTAINERS (panels exposed via API)
    var panels = {};
    panels.title = wrap.append("div").classed("layout-title",true);

    var main = wrap.append("div").classed("c-fix",true);
    var map_wrap = main.append("div").style("float","left").style("overflow","visible");
    panels.side = main.append("div").style("float","right").style("width","220px").style("position","relative").style("z-index","10").style("min-height","50px");
    panels.map = map_wrap.append("div");
    panels.mobile = wrap.append("div");

    //EXPOSE VIA API
    scope.panels = panels;

    var side_panel_visible = true;
    var is_mobile = false;

    //calculate and set dimensions on containers
    scope.dims = function(){
        var width;
        is_mobile = false;

        try{
            var box = wrap.node().getBoundingClientRect();
            width = box.right - box.left;
            if(width < scope.min_width){
                width = scope.min_width;
            }
            else if(width > 1400){
                width = 1400;
            }
        }
        catch(e){
            width = 360;
        }

        //fractional widths of panels
        var map_share = 1; //share of width for map
        var map_wrap_share = 1; //share of width for map wrap panel
        var side_share = 0; //share of width for side panel

        //shadow for right panel
        var box_shadow = "-2px 1px 6px rgba(0,0,0,0.25)";

        if(width > 900){
            map_wrap_share = side_panel_visible ? 0.74 : 1;
            map_share = 1;
            side_share = side_panel_visible ? 0.24 : 1;
            box_shadow = null;
        }
        else if(false){
            //overlapping disabled
            map_wrap_share = 0.7;
            map_share = 1 / map_wrap_share; //extend to full width of container (to be clipped by side panel)
            side_share = 0.3;
        }
        else{
            map_wrap_share = 1;
            map_share = 1;
            side_share = 1;
            is_mobile = true;
        }

        var widths = {
            map: Math.floor(width*map_share*map_wrap_share),
            side: Math.floor(width*side_share)
        }
        scope.widths = widths;

        //note: width for map and for main may be different when overlapping
        
        map_wrap.style("width", (map_wrap_share*100) + "%");

        panels.map.style("width", (map_share*100) + "%");
        panels.side.style("width", (side_share*100) + "%")
                  .style("box-shadow", box_shadow)
                  .style("display", is_mobile ? "none" : (side_panel_visible ? "block" : "none")); 
                  ;

        panels.mobile.style("display", is_mobile ? "block" : "none").classed("c-fix",true);

        return scope;
    }

    window.addEventListener("resize", function(){
        
        scope.dims();
        
        if(typeof callback === "function"){
            callback.call(scope);
        }
    });

    return scope;

}