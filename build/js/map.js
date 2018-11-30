import palette from './palette.js';

function map(container){
    //one-time-setup

    var scope = {
        width:360,
        width_user:null,
        min_width:240,
        aspect: 0.6,
        projection: d3.geoAlbersUsa(),
        responsive: true
    }
    scope.path = d3.geoPath(scope.projection);
    scope.height = scope.width * scope.aspect;

    //main outer wrap
    var wrap0 = d3.select(container).append("div").classed("c-fix",true).style("padding","0px").style("position","relative").style("min-height","15px");

    //map dom
    //map_panel holds map -- set dims on this panel
    var map_panel = wrap0.append("div").style("position","relative").style("z-index","7").style("top","0px").style("left","0px");
    var svg = map_panel.append("svg").attr("width","100%").attr("height","100%");
    var g_back = svg.append("g");
    var g_main = svg.append("g");
    var g_front = svg.append("g");
    var g_anno = svg.append("g");

    var panels = {back:g_back, main:g_main, front:g_front, anno:g_anno}

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

    //build svg filters
    var defs = wrap0.append("div").style("height","0px").style("overflow","hidden").append("svg").append("defs");
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

    var tip_show_timer;
    var tip_hide_timer;
    function show_tooltip(centroid, html){
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
                show_right = tip_width + centroid[0] < scope.width;
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

            tooltip.style("left",left).style("top",top).style("display", "block");
            tooltip_content.html(html);
        }, 10);         
    }

    function hide_tooltip(callback){
        clearTimeout(tip_hide_timer);
        clearTimeout(tip_show_timer);

        tip_hide_timer = setTimeout(function(){
            tooltip.style("left","0px").style("top","0px").style("display", "none");
            if(typeof callback === "function"){
                callback();
            }
        }, 50);
    }

    //hold 
    var draw_stack = [];
    var clip_geo = null;

    //draw, redraw, resize
    var resize_timeout;

    window.addEventListener("resize", function(){
        clearTimeout(resize_timeout);
        if(scope.responsive){
            wrap0.style("overflow","hidden"); //avoid horizontal scroll bars while resizing
            resize_timeout = setTimeout(draw, 0);
        }
        //console.log("map draw: " + scope.responsive);
    });

    //internal draw method
    function draw(){
        wrap0.style("overflow","visible"); //allow tooltips to overflow
        dims(); //if width set at any point by user--using map.print() or map.width()--dims will use that

        map_panel.style("width", scope.width+"px").style("height", scope.height+"px");

        if(clip_geo !== null){
            scope.projection.fitExtent([[0, 0], [scope.width, scope.height]], clip_geo);
        }

        var i = -1;
        while(++i < draw_stack.length){
            draw_stack[i]();
        }

    }    

    //map methods exposed to user for:
    // 1) add_states(f, attrs, geokey, clip_to_this)
    // 2) add_points(f, attrs, geokey, lonlat, clip_to_this)
    // 3) print -- render map
    var map_methods = {};

    map_methods.add_states = function(f, geokey, clip_to_this){
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
        if((arguments.length > 2 && !!clip_to_this) || clip_geo === null){
            clip_geo = {type:"FeatureCollection", features:features};
        }

        //selection of states
        var selection = null;

        //tooltip function
        var ttip_show;
        var ttip = function(key){
            if(typeof ttip_show === "function" && selection !== null){
                ttip_show(key);
            }
        }        

        //hide function
        var ttip_hide_;
        var ttip_hide = function(){
            hide_tooltip(ttip_hide_);
        }

        g.on("mousedown", ttip_hide);

        //attributes
        var attrs = {};

        function draw_layer(){
            var selection_ = g.selectAll("path").data(features, geokey);
            selection_.exit().remove();
            selection = selection_.enter().append("path").merge(selection_).attr("d", scope.path);
    
            //apply attributes
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

            selection
            .on("mouseenter", function(d){
                ttip(geokey(d));
            })
            .on("mousedown", function(d){
                ttip(geokey(d));
                d3.event.stopPropagation();
            })
            .on("mouseleave", ttip_hide);
        }

        draw_stack.push(draw_layer);

        //return object for this layer
        var layer_methods = {}

        layer_methods.tooltips = function(html_, hide_){
            
            //register fn
            ttip_show = function(key){
                //get target path
                var path = selection.filter(function(d){
                    return d.key == key;
                });

                 
                if(path.size()==1){
                    var node = path.node();
                    var html = html_(key, node);
                    var centroid = scope.path.centroid(path.datum());
                    show_tooltip.call(node, centroid, html);
                }
                else{
                    //would only occur if user passes an invalid geocode
                    console.warn("Multiple or no matching points.");
                }
            }  
            
            if(arguments.length > 1){
                ttip_hide_ = hide_;
            }            

            return layer_methods;
        }

        layer_methods.highlight = function(key){
            ttip(key);
        }        

        //to do, enable adding of attrs
        layer_methods.attr = function(a){
            if(arguments.length > 0){
                attrs = a;
            }
            return layer_methods;
        }

        //end state layer factory (add_states);
        return layer_methods;    
    }


    map_methods.add_points = function(f, geokey, lonlat, clip_to_this){
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
        if((arguments.length > 3 && !!clip_to_this) || clip_geo === null){
            clip_geo = {type:"FeatureCollection", features:geo_features};
        }
        
        //return object for this layer
        var layer_methods = {}

        //selection of points
        var selection = null;

        //voronoi layer
        var voro_selection = null;

        //tooltip fn
        var ttip_show;
        var ttip = function(key){
            if(typeof ttip_show === "function" && selection !== null){
                ttip_show(key);
            }
        }

        //hide function
        var ttip_hide_;
        var ttip_hide = function(){
            hide_tooltip(ttip_hide_);
        }

        g.on("mousedown", ttip_hide);

        //attributes
        var attrs = {};

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


            //add voronoi paths
            var voro = d3.voronoi()
                        .extent([[0,0], [scope.width, scope.height]])
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

            selection.on("mouseenter", function(d){
                        ttip(d.key)
                    })
                    .on("mousedown", function(d){
                        ttip(d.key);
                        d3.event.stopPropagation();
                    })
                    .on("mouseleave", ttip_hide);
            
            voro_selection.on("mouseenter", function(d){
                        ttip(d.key);
                    })
                    .on("mousedown", function(d){
                        ttip(d.key);
                        d3.event.stopPropagation();
                    })
                    .on("mouseleave", ttip_hide);
                                          
        }

        draw_stack.push(draw_layer);

        layer_methods.tooltips = function(html_, hide_){
            
            //register
            ttip_show = function(key){
                //get circle node by filtering selection of circles
                var dot = selection.filter(function(d){
                    return d.key == key;
                });

                if(dot.size()==1){
                    var node = dot.node();
                    var html = html_(key, node); 
                    var centroid = dot.datum().xy;
                    show_tooltip.call(node, centroid, html);
                }
                else{
                    //would only occur if user passes an invalid geocode
                    console.warn("Multiple or no matching points.");
                } 
            }

            if(arguments.length > 1){
                ttip_hide_ = hide_;
            }
            
            return layer_methods;
        }

        layer_methods.highlight = function(key){
            //ttip checks that selection exists
            ttip(key);
        }

        layer_methods.attr = function(a){
            if(arguments.length > 0){
                attrs = a;
            }
            return layer_methods;
        }

        //end point layer factory (add_points);
        return layer_methods;    
    }

    function dims(width){
        if(arguments.length == 0 || width == null){
            
            //if user passes null, switch back to auto width
            if(width === null){
                scope.width_user = null;
            }

            //infer width if not (ever) specified by user
            if(scope.width_user == null){
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
                }  
            }
            else{
                //use previously specified width
                width = scope.width_user;
            }
        }
        else{
            scope.responsive = false;
            scope.width_user = width;
            if(width < scope.min_width){
                scope.min_width = width;
            }
        }

        scope.width = width;
        scope.height = scope.aspect * scope.width;
      
    }

    map_methods.width = function(width){
        if(arguments.length > 0){
            dims(width);
            return map_methods;
        }
        else{
            return scope.width;
        }
    }

    map_methods.print = function(width){
        dims(width);
        draw();
    }

    map_methods.panels = function(){
        return panels;
    }

    return map_methods;

}

export default map;