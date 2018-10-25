import palette from './palette.js';

export default function map(container){
    //one-time-setup

    var scope = {
        map_width:360,
        min_width:360,
        map_aspect: 0.6,
        projection: d3.geoAlbersUsa(),
        is_mobile: true,
        side_panel_visible: false
    }
    scope.path = d3.geoPath(scope.projection);
    scope.map_height = scope.map_width * scope.map_aspect;

    //main outer wrap
    var wrap0 = d3.select(container).append("div").classed("c-fix",true).style("padding","0px").style("position","relative").style("min-width", scope.min_width+"px");

    //mobile map legend
    
    var mobile_legend = wrap0.append("div").style("padding","15px");
    var mobile_title = mobile_legend.append("p").style("margin","0px 0px 10px 0px").text("mobile legend here");
    var mobile_swatches = mobile_legend.append("div").classed("c-fix",true);


    //map dom
    var map_panel = wrap0.append("div").style("position","relative").style("z-index","7").style("top","0px").style("left","0px"); //hold map
    var svg = map_panel.append("svg").attr("width","100%").attr("height","100%");
    var g_back = svg.append("g");
    var g_main = svg.append("g");
    var g_front = svg.append("g");

    //tooltip
    var tooltip = map_panel.append("div")
                           .style("position","absolute")
                           .style("min-width","30px")
                           .style("max-width","500px")
                           .style("min-height","100px")
                           .style("pointer-events","none")
                           .style("padding","0px 0px 0px 11px")
                           .style("display","none")
                           ;

    var tooltip_content = tooltip.append("div").style("padding","10px 15px 10px 10px").style("border","1px solid " + palette.mediumgray)
                                .style("position","relative").style("z-index","10").style("background-color","#ffffff")
                                .style("box-shadow","2px 3px 8px rgba(0,0,0,0.4)");

    var tooltip_arrow_left = tooltip.append("div").style("width","12px").style("position","absolute")
                            .style("left","0px").style("top","0px")
                            .style("height","100px").style("z-index","11");
        tooltip_arrow_left.append("svg").attr("width","100%").attr("height","100%")
                            .append("path").attr("d", "M12.5,12 L1,20 L12.5,28")
                            .attr("stroke", palette.mediumgray)
                            .attr("fill","#ffffff")
                            ;

    var tooltip_arrow_right = tooltip.append("div").style("width","12px").style("position","absolute")
                            .style("left","100%").style("top","0px")
                            .style("height","100px").style("z-index","11");
        tooltip_arrow_right.append("svg").attr("width","100%").attr("height","100%").style("margin-left","-1px")
                            .append("path").attr("d", "M0,28 L11.5,20 L0,12")
                            .attr("stroke", palette.mediumgray)
                            .attr("fill","#ffffff")
                            ;



    //side panel
    var side_panel = wrap0.append("div").style("float","right").style("width","220px").style("position","relative").style("z-index","10");

    //build svg filters
    var defs = wrap0.append("div").style("height","0px").append("svg").append("defs");
    var filter = defs.append("filter").attr("id","feBlur").attr("width","150%").attr("height","150%");
    filter.append("feOffset").attr("result","offsetout").attr("in","SourceGraphic").attr("dx","6").attr("dy","6");
    filter.append("feColorMatrix").attr("result","matrixout").attr("in","offsetout").attr("type","matrix").attr("values","0.25 0 0 0 0 0 0.25 0 0 0 0 0 0.25 0 0 0 0 0 1 0");
    filter.append("feGaussianBlur").attr("result","blurout").attr("in","matrixout").attr("stdDeviation","4");
    filter.append("feBlend").attr("in","SourceGraphic").attr("in2","blurout").attr("mode","normal");


    var tooltip_test = wrap0.append("div").style("position","absolute").style("z-index","0")
                            .style("top","0px").style("left","0px").style("width","100%")
                            .style("overflow","visible").style("visibility","hidden")
                            .append("div").style("display","inline-block").style("visibility","hidden")
                            .classed("tooltip-test-area", true).style("padding","10px 15px 10px 10px")
                            .style("user-select","none");

    //calculate and set dimensions on containers
    function dims(){
        var width;
        try{
            var box = wrap0.node().getBoundingClientRect();
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
            scope.is_mobile = true;
        }

        //fractional widths of panels
        var map_share = 1;
        var side_share = 0;
        var map_absolute = true;

        //shadow for right panel
        var box_shadow = "-2px 1px 6px rgba(0,0,0,0.25)";


        if(width > 900){
            map_share = scope.side_panel_visible ? 0.74 : 1;
            side_share = scope.side_panel_visible ? 0.24 : 1;
            scope.is_mobile = false;
            map_absolute = true;
            box_shadow = null;
        }
        else if(width > 700){
            map_share = 1;
            side_share = 0.3;
            scope.is_mobile = false;
            map_absolute = true;
        }
        else{
            map_share = 1;
            side_share = 1;
            scope.is_mobile = true;
            map_absolute = false;
        }

        scope.map_width = Math.floor(width*map_share);
        scope.map_height = scope.map_aspect * scope.map_width;
        scope.side_width = Math.floor(width*side_share);

        wrap0.style("min-height", scope.map_height + "px");
        
        map_panel.style("position", map_absolute ? "absolute" : "relative")
                 .style("width", scope.map_width+"px")
                 .style("height", scope.map_height+"px")
                 .style("margin", scope.is_mobile ? "15px 0px" : "0px");

        side_panel.style("width", scope.side_width+"px")
                  .style("display", scope.side_panel_visible ? "block" : "none")
                  .style("box-shadow", box_shadow)
                  .style("min-height", scope.map_height + "px");;
        
        mobile_legend.style("display", scope.is_mobile ? "block" : "none");

    }

    //hold 
    var draw_stack = [];
    var clip_geo = null;

    //draw, redraw, resize
    var resize_timeout;
    var draw_timeout;

    function draw(){
        clearTimeout(resize_timeout);
        clearTimeout(draw_timeout);

        draw_timeout = setTimeout(function(){
            draw_();
        }, 0)
    }

    window.addEventListener("resize", function(){
        clearTimeout(resize_timeout);
        clearTimeout(draw_timeout);
        wrap0.style("overflow","hidden"); //avoid horizontal scroll bars while resizing
        resize_timeout = setTimeout(draw_, 100);
    });

    //internal draw method
    function draw_(){
        wrap0.style("overflow","visible"); //allow tooltips to overflow
        dims();

        if(clip_geo !== null){
            scope.projection.fitExtent([[0, 0], [scope.map_width, scope.map_height]], clip_geo);
        }

        var i = -1;
        while(++i < draw_stack.length){
            draw_stack[i]();
        }

    }    

    //map methods exposed to user for:
    // 1) draw_states(f, attrs, geokey, clip_to_this)
    // 2) draw_points(f, attrs, geokey, lonlat, clip_to_this)
    // 3) side_panel() //get panel container
    var map_methods = {};

    var tip_show_timer;
    var tip_hide_timer;
    function show_tooltip(centroid, html){
        //this is target element (path or circle)
        clearTimeout(tip_hide_timer);
        clearTimeout(tip_show_timer);

        tooltip_test.html(html);

        

        tip_show_timer = setTimeout(function(){
            //show to left or right
            var show_right = true;
            var left;
            var top;
            try{
                var tip_box = tooltip_test.node().getBoundingClientRect();
                var tip_width = tip_box.right - tip_box.left;
                show_right = tip_width + centroid[0] < scope.map_width;
            }
            catch(e){
                show_right = true;
            }

            if(!show_right){
                left = (centroid[0]-tip_width-25-3)+"px";
                top = (centroid[1]-20)+"px";
                tooltip_arrow_right.style("visibility","visible");
                tooltip_arrow_left.style("visibility","hidden");
            }
            else{
                left = (centroid[0]+3)+"px";
                top = (centroid[1]-20)+"px";
                tooltip_arrow_left.style("visibility","visible");
                tooltip_arrow_right.style("visibility","hidden");
            }

            tooltip.style("left",left).style("top",top).style("display", !scope.is_mobile ? "block" : "block");
            tooltip_content.html(html);
        }, 10);         
        

    }

    var hide_tooltip_callbacks = [];
    function hide_tooltip(){
        clearTimeout(tip_hide_timer);
        clearTimeout(tip_show_timer);

        tip_hide_timer = setTimeout(function(d){
            tooltip.style("left","0px").style("top","0px").style("display", "none");
            var i = -1;
            while(++i < hide_tooltip_callbacks.length){
                if(typeof hide_tooltip_callbacks[i] === "function"){
                    hide_tooltip_callbacks[i]();
                }
            }
        });
    }

    map_methods.draw_states = function(f, attrs, geokey, clip_to_this){
        var g = g_main.append("g");
        var features = [];
        
        if(f.hasOwnProperty("type") && f.type=="FeatureCollection" && f.features.length > 0){
            features = f.features;
        }
        else if(f instanceof Array && f.length > 0){
            features = f;
        }
        else{
            throw new Error("Argument f must be a FeatureCollection or an array of D3-supported geojson feature objects");
        }

  
        //set clip_geography for projection
        if((arguments.length > 3 && !!clip_to_this) || clip_geo === null){
            clip_geo = {type:"FeatureCollection", features:features};
        }

        //selection of states
        var selection = null;

        //tooltip function
        var ttip = null; 

        function draw_layer(){
            var selection_ = g.selectAll("path").data(features, geokey);
            selection_.exit().remove();
            selection = selection_.enter().append("path").merge(selection_).attr("d", scope.path);
    
            //apply attributes
            if(attrs != null){
                for(var a in attrs){
                    if(attrs.hasOwnProperty(a)){
                        if(typeof attrs[a] === "function"){
                            selection.attr(a, function(d){
                                return attrs[a].call(this, geokey(d))
                            })
                        }
                        else{
                            selection.attr(a, attrs[a]);
                        }
                        
                    }
                }
            }

            if(ttip !== null){
                selection.on("mouseenter", function(d){ttip(geokey(d))}).on("mouseleave", hide_tooltip);
            }
        }

        draw_stack.push(draw_layer);

        //return object for this layer
        var layer_methods = {}

        layer_methods.tooltips = function(html_){
            
            //register fn
            ttip = function(key){
                //get target path
                var path = selection.filter(function(d){
                    return d.key == key;
                });

                var html = html_(key); 
                var centroid = [0,0];

                if(path.size()==1){
                    centroid = scope.path.centroid(path.datum());
                    show_tooltip.call(path.node(), centroid, html);
                }
                else{
                    //would only occur if user passes an invalid geocode
                    console.warn("Multiple or no matching points.");
                }
            }            

            //apply, if selection created
            if(selection !== null){
                selection.on("mouseenter", function(d){ttip(geokey(d))}).on("mouseleave", hide_tooltip);
            }

            return layer_methods;
        }

        layer_methods.highlight = function(key){
            if(ttip !== null && selection !== null){
                var datum = selection.filter(function(d){
                    return geokey(d) == key;
                });

                if(datum != null){
                    ttip(datum);
                }
            }
        }

        //redraw all layers
        draw();

        //end state layer factory (draw_states);
        return layer_methods;    
    }


    map_methods.draw_points = function(f, attrs, geokey, lonlat, clip_to_this){
        var g = g_main.append("g");
       
        var g_voro = g.append("g"); //render voronoi here
        var g_points = g.append("g"); //render circles here
        
        //set default lonlat accessor
        if(lonlat == null || typeof lonlat == "undefined"){
            lonlat = function(d){return [d.lon, d.lat]}
        }
        
        //build a feature array of geojson points
        var geo_features = f.map(function(d){
            return {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": lonlat(d)
                    },
                    "properties": d
            }   
        });        

        //set clip_geography for projection
        if((arguments.length > 4 && !!clip_to_this) || clip_geo === null){
            clip_geo = {type:"FeatureCollection", features:geo_features};
        }
        
        //return object for this layer
        var layer_methods = {}

        //selection of points
        var selection = null;

        //voronoi layer
        var voro_selection = null;

        //tooltip fn
        var ttip = null;

        function draw_layer(){

            //project features
            var projected_features = f.map(function(d){
                var p = scope.projection(lonlat(d));
                return {xy:p, data:d, key:geokey(d)}
            }).filter(function(d){
                return d.xy != null;
            });   

            var selection_ = g_points.selectAll("circle").data(projected_features, function(d){return d.key});
            selection_.exit().remove();
            selection = selection_.enter().append("circle").merge(selection_)
                        .attr("cx", function(d){return d.xy[0]})
                        .attr("cy", function(d){return d.xy[1]})
                        ;
            
            //apply attributes
            if(attrs != null){
                for(var a in attrs){
                    if(attrs.hasOwnProperty(a)){
                        if(typeof attrs[a] === "function"){
                            selection.attr(a, function(d, i){
                                return attrs[a].call(this, d.key)
                            })
                        }
                        else{
                            selection.attr(a, attrs[a]);
                        }
                        
                    }
                }
            }

            //add voronoi paths
            var voro = d3.voronoi()
                        .extent([[0,0], [scope.map_width, scope.map_height]])
                        .x(function(d){return d.xy[0]})
                        .y(function(d){return d.xy[1]})
                        .polygons(projected_features)
                        .map(function(d, i){
                            var path = "M0,0";
                            var key = null;
                            var centroid = [0,0];
                            var data = null;

                            if(d!=null){
                                path = "M" + d.join("L") + "Z";
                                key = d.data.key;
                                centroid = d.data.xy;
                                data = d.data;
                            }

                            return {path: path, key: key, centroid: centroid, data: data}
                        })
                        ;
            
            var mv_u = g_voro.selectAll("path").data(voro);
                mv_u.exit().remove();
            voro_selection = mv_u.enter().append("path").merge(mv_u)
                                .attr("d", function(d){
                                    return d.path;
                                })
                                .attr("stroke","none")
                                .attr("fill","none")
                                .style("pointer-events","all");  
                                
            if(ttip !== null){
                selection.on("mouseenter", function(d){ttip(d.key)}).on("mouseleave", hide_tooltip);
                voro_selection.on("mouseenter", function(d){ttip(d.key)}).on("mouseleave", hide_tooltip);
            }                    
        }

        draw_stack.push(draw_layer);

        layer_methods.tooltips = function(html_, hide){
            
            //register
            ttip = function(key){
                //get circle node by filtering selection of circles
                var dot = selection.filter(function(d){
                    return d.key == key;
                });

                var html = html_(key); 
                var centroid = [0,0];

                if(dot.size()==1){
                    centroid = dot.datum().xy;
                    show_tooltip.call(dot.node(), centroid, html);
                }
                else{
                    //would only occur if user passes an invalid geocode
                    centroid = dot.datum().centroid;
                    console.warn("Multiple or no matching points.");
                } 
            }

            if(arguments.length > 1){
                hide_tooltip_callbacks.push(hide);
            }

            //apply
            if(voro_selection !== null && selection !== null){
                selection.on("mouseenter", function(d){ttip(d.key)}).on("mouseleave", hide_tooltip);
                voro_selection.on("mouseenter", function(d){ttip(d.key)}).on("mouseleave", hide_tooltip);
            }
            
            return layer_methods;
        }

        layer_methods.highlight = function(key){
            if(ttip !== null && selection !== null){
                ttip(key);
            }
        }

        //redraw all layers
        draw();

        //end point layer factory (draw_points);
        return layer_methods;    
    }

    map_methods.side_panel = function(make_visible){
        
        if(arguments.length > 0 && !!make_visible){
            scope.side_panel_visible = true;
        }
        else if(arguments.length > 0){
            scope.side_panel_visible = false;
        }

        //redraw all layers
        draw();
        return side_panel;
    }

    map_methods.mobile_panel = function(){
        return mobile_legend;
    }

    return map_methods;

}