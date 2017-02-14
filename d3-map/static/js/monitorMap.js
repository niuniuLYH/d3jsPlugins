/**
 * 地图主函数
 * @param map_con_di -- 包含地图的div
 * @province_name -- 展示的默认的地图的名字，如“北京”，“四川等”，当为空时，默认展示全国地图
 */
function drawMaps(map_con_di,province_name,map_level,province_info){
	var full_screen = d3.select('#'+map_con_di);

	var rect = full_screen.node().getBoundingClientRect();
	var h = parseInt(rect.height);
	var w = parseInt(rect.width);

	var map_div = full_screen.append("div")
		.attr("class","map_div_out");

	var returnSvgDiv = map_div.append('div').attr({'class':'return-div'});
	var container = map_div.append('div')
		.attr('class','cenmap')
		.style({
			"height":h - 120 + "px",
			"width":w - 20 + "px"
		});
	var svg = container.append('svg')
		.attr('width', '100%')
		.attr('height', '100%')
		.attr('preserveAspectRatio', 'xMidYMid meet')
		.attr('viewBox', '0 0 '+ 800 +' '+ 600)
		.attr('id', 'mapBox')
		.append("g").attr({'id':'mapSvg'});

	create_return_svg(returnSvgDiv);

	slide_map_line(returnSvgDiv);

	drawPrepare(map_level,province_name);
	if(map_level != 0){
		if(map_level == 1){
			var province_name2 = conversion(province_name);
			province_info && tranformMark(province_info.child_name, province_info.child_id,"全國地图",true);
			!province_info && tranformMark(province_name, province_name2,"全國地图",true);
		}else{
			province_info && tranformMark(province_info.child_name, province_info.child_id,province_info.parent_name,false,province_info.parent_id);
		}
	}

	/**点击是否显示流向的按钮**/
	d3.select(".javafile-a").on("click",function(){
		var is_show_line = javaFileSlide(false);
		setLocalStorage("map_line",JSON.stringify(is_show_line));
		if(is_show_line){
			d3.selectAll(".circle-line-bg,.circle-line")
				.style("display","inline-block");
			d3.selectAll(".comets")
				.style("display","inline-block");
		}else{
			d3.selectAll(".circle-line-bg,.circle-line")
				.style("display","none");
			d3.selectAll(".comets")
				.style("display","none");
		}
	});

	/**
	 * hover到连线时的滤镜效果
	 */
	var line_filter_svg = d3.select("body").append("svg")
		.attr({
			"width":"800px",
			"height":"400px"
		});
	line_filter_svg.append("filter")
		.attr({
			"id":"line_filter"
		})
		.append("feGaussianBlur")
		.attr({
			"in":"SourceGraphic",
			"stdDeviation":"5"
		});
}

/**
 * 画地图函数
 * flag -- 参数，当为0时，画全国地图；为1时，画省级地图；为2时，画市级地图
 * @param province_name -- 需要画出的省的名字，如“北京”,"四川"等，如果为空，则画全国地图
 */
function drawPrepare(flag,province_name){
	var province_e = conversion(province_name);
	var g = d3.select("#mapSvg").append('g');
	var projection,path,url;

	switch (flag){
		case 0:{
			projection = d3.geo.mercator()
				.center([110,41])
				.scale(720);

			url = '../resources/data/mapjsons/map.json';
		}
			break;
		case 1:{
			var coordinates = centerbox(province_name);
			var scale = scalebox(province_name);

			projection = d3.geo.mercator()
				.center(coordinates)
				.scale(scale);

			url = '../resources/data/mapjsons/mapjson/'+ province_e +'.json';
		}
			break;
		case 2:{
			var coordinates = [],scale;
			scale = probox(province_name,coordinates,scale);

			projection = d3.geo.mercator()
				.center(coordinates)
				.scale(scale);

			url = '../resources/data/mapjsons/geoJson/'+ province_name +'00.json';
		}
			break;
	}
	path = d3.geo.path()
		.projection(projection);

	d3.json(url,function (e, d) {
		if(!e) {
			drawMapPath(path,d,projection,flag);
		}
	});
}

/**
 * 地图的各个path的绘制
 * @param path -- 地图绘制的path方法
 * @param d -- 获取到的地图数据
 */
function drawMapPath(path,d,projection,flag){
	var tooltip = drawBack();
	d3.select("#mapSvg").select("g").selectAll("path").remove();
	d3.select("#mapSvg").select("g").selectAll('path')//画地图
		.data(d.features)
		.enter()
		.append('path')
		.attr('d', path)
		.attr('id', function(d) { return d.id; })
		.attr('class','map')
		.attr('fill', '#19262E')
		.attr('stroke', '#7D8A92')
		.attr('stroke-width', '1');


	d3.select("#southSeaG").remove();
	if(flag == 0){
		var southSeaG = d3.select(".cenmap").select("svg").append("g").attr("id","southSeaG");
		d3.xml("../resources/data/mapjsons/southchinasea.svg", function(error, xmlDocument) {
			southSeaG.html(function(d){
				return d3.select(this).html() + xmlDocument.getElementsByTagName("g")[0].outerHTML;
			});
			//确定南海的位置
			var gSouthSea = d3.select("#southsea");
			var southSea = gSouthSea[0][0].getBBox();
			var southSea_width = southSea.width;
			var southSea_height = southSea.height;
			var mapG = d3.select("#mapSvg").select("g")[0][0].getBBox();
			var mapG_width = mapG.width;
			var mapG_height = mapG.height;
			var mapG_x = mapG.x;
			var mapG_y = mapG.y;
			var trans_x = mapG_x + mapG_width - southSea_width * 0.67;
			var trans_y = mapG_y + mapG_height - southSea_height * 0.6;

			gSouthSea.attr("transform","translate("+trans_x +","+trans_y+")scale(0.5)").attr("class","southsea");
		});
	}

	//获取g的宽度和高度，以及其坐标
	var g_info = d3.select("#mapSvg").select("g")[0][0].getBBox();
	var g_width = g_info.width;
	var g_height = g_info.height;
	var g_x = g_info.x;
	var g_y = g_info.y;
	//给svg重新赋viewBox的值，使得地图在svg的中间位置
	d3.select("#mapBox").attr({
		"viewBox":g_x + " " + g_y + " " + g_width + " " + g_height
	});

	getData(projection);

	d3.selectAll('.map')
		.on('mouseover',function(d,i){
			d3.select(this)
				.transition()
				.attr("stroke","#DEDFF3")
				.attr("fill","#074c4b")
				.attr('transform','translate(-1,-1)')
				.duration(200);

			tooltip.style("opacity",0.6);
		})
		.on('mouseout',function(d,i){
			d3.select(this)
				.transition()
				.attr('stroke',originalColor(this,true))
				.attr("fill",originalColor(this,false))
				.attr('transform','translate(0,0)')
				.duration(200);

			tooltip.style("opacity",0.0);
		})
		.on("mousemove",function(d){
			/** 鼠标移动时，更改样式 left 和 top 来改变提示框的位置 */

			var map_div_left = d3.select(".cenmap")[0][0].getBoundingClientRect().left;
			var map_div_top = d3.select(".cenmap")[0][0].getBoundingClientRect().top;
			var mouse_left = parseInt(d3.event.pageX);
			var mouse_top = parseInt(d3.event.pageY);

			tooltip.html(d.properties.name)
				.style("left", (mouse_left -  map_div_left) + 20 + "px")
				.style("top", (mouse_top - map_div_top ) + 20 + "px");
		});

	if(flag == 2){//如果是三级地图，不给区域添加点击事件
		d3.selectAll('.map').on('click',null);
	}else{
		d3.selectAll('.map')
			.classed("unclick",false)
			.on('click', function (d) {
				if(d3.event.detail==1){
					var bool = 1;
					var clock_num = d3.select("#dest_city").attr("data_name");

					bool = clockClick(bool,clock_num);
					if(bool){
						tooltip.remove();
						var dest_city = d3.select("#dest_city").text();
						var province_id = "",map_num = "";

						if(flag == 0){//1级地图点击进入2级地图
							tranformMark(d.properties.name, d.id,"全國地图",true);
							province_id = d.id;
							map_num = 1;
						}else if(flag == 1){//二级地图点击进入三级地图
							tranformMark(d.properties.name, d.properties.id, dest_city,false);
							province_id = d.properties.id;
							map_num = 2;
						}
						var province_info = {
							child_id : d.properties.id || d.id,
							child_name : d.properties.name,
							parent_id : conversion(dest_city),
							parent_name : dest_city
						};
						setLocalStorage("map_level",JSON.stringify(map_num));
						setLocalStorage("province_info",JSON.stringify(province_info));

						d3.select("#mapSvg").transition().duration(1000).attr('transform', 'scale(2)');
						setTimeout(function(){
							d3.select("#mapSvg").transition().duration(0).attr('transform', 'scale(1)');
							drawPrepare(map_num,province_id);
						},1200);
					}
				}
			});
	}

	if(flag == 0){
		d3.select("#return-mark-r").classed("unclick",true);
	}else{
		d3.select("#return-mark-r")
			.classed("unclick",false)
			.on('click',function(d){//返回上一级地图的点击事件
				d3.select("#mapSvg").transition().duration(0).attr('transform', 'scale(1)');
				var province_id = "";
				if(flag == 1){ // 如果是二级地图，点击转回全国地图
					province_id = d3.select("#dest_city").attr("data_name");
					returnFun(true,province_id);
					drawPrepare(0,"");
				}else{ // 如果是三级地图，点击转回二级地图
					province_id = d3.select("#sour_city").attr("data_name");
					returnFun(false,province_id);
					drawPrepare(1,province_id);
				}
				if(tooltip){
					tooltip.remove()
				}
		});
	}
}

/***************************************获取数据的方法************/
/**
 * 数据对接方法
 * @param container
 * @param projection
 */
function getData(projection){

	var app_name = "",intf_name = "",earliest = "", trans_type = "";

	if(!(d3.select("#app_name").empty())){
		app_name = d3.select("#app_name").attr("name");
	}else{
		app_name = "";
	}

	if(!(d3.select("#intf_name").empty())){
		intf_name = d3.select("#intf_name").attr("name");
	}else{
		intf_name = "";
	}

	if(!(d3.select("#trans_trade").empty())){
		trans_type = d3.select("#trans_trade").text();
	}else{
		trans_type = "";
	}
	/**设置earliest的值**/
	earliest = getRefreshTime();
	d3.json("../resources/data/map_data.json")
		.header("Content-Type", "application/x-www-form-urlencoded")
		.get("", function (e, d) {
			if(!e) {
				var data = d;
				if(data.ll_data.length == 0){
					drawNoData();//显示“暂无数据的框”
					d3.selectAll('.blingblingG').remove();
					d3.selectAll('.line-svg').remove();

					//if(container.attr("id") == "firstMapG"){
					//	d3.select(".nanhai-div").select("img").attr({
					//			"src":STATIC_URL + "img/cbms-img/v403index/nanhai_no_data.svg"
					//		});
					//}else{
					//	d3.select(".nanhai-div").style("display","none");
					//}
				}else{
					if(!(d3.select(".no_data_div").empty())){
						d3.select(".no_data_div").remove();
					}
					//if(container.attr("id") == "firstMapG") {
					//	d3.select(".nanhai-div").select("img")
					//		.attr({
					//			"src":STATIC_URL + "img/cbms-img/v403index/nanhai.svg"
					//		});
					//}else{
					//	d3.select(".nanhai-div").style("display","none");
					//}
					d3.selectAll(".map").classed("no_data",false).attr({
						"fill":"#19262E",
						"stroke":"#7D8A92"
					});
					var data_arr = data.ll_data;
					for(var i = data_arr.length - 1; i >= 0; i--){//过滤掉没有经纬度的数据。
						if((data_arr[i].s["latitude"] == -1 && data_arr[i].s["longitude"] == -1) || (data_arr[i].d["latitude"] == -1 && data_arr[i].d["longitude"] == -1)){
							data_arr.splice(i, 1);
						}
					}
					data.ll_data = data_arr;
					//画点
					drawCircle(data,projection);
					//画出连线 本地存储的数据状态，如果是1就画出线，否则不画出
					drawLine(data,projection);
				}
			}
		});
}

/**
 * 设置地图path的fill和stroke的颜色
 * @param this_
 * @returns {*}
 */
function originalColor(this_,flag){
	if(d3.select(this_).classed("no_data")){//是否有数据
		if(flag){
			return "#434D56";//stroke
		}else{
			return "#0D1A23";//fill
		}
	}else{
		if(flag){
			return "#7D8A92";
		}else{
			return "#19262E"
		}
	}
}

/**
 * 画出地图hover上去的提示框
 */
function drawBack(){
	var tooltip = d3.select('.cenmap')
		.append("div")
		.classed("tootip-style",true);
	return tooltip;
}

/**
 * 点击一级或者二级地图时，左上角的标题变化
 * @param propertyName -- 标题右边的城市名字
 * @param flag -- 是否是一级地图，当为true时则是一级地图，否则是二级地图
 */
function tranformMark(propertyName,propertyId,dest_city,flag,dest_id){
	d3.select("#mapSvg").attr({"transform":'translate(0,0)'});
	if(flag){
		d3.select("#return-mark-r")
			.transition()
			.attr({'opacity':100,transform :"translate(0,0)"})
			.duration(800);
		d3.select("#return-mark-g")
			.transition()
			.attr({'opacity':0,transform :"translate(0,0)"})
			.duration(800);
		d3.select("#svf-back")
			.transition()
			.attr({'opacity':100})
			.duration(800);
		d3.select("#dest_city")
			.attr("data_name",propertyId)
			.html(propertyName);

		d3.select(".nanhai-div").style("display","none");

	}else{

		d3.select("#return-mark-r")
			.attr({'opacity':100,transform :"translate(-45,0)"})
			.transition()
			.attr({transform :"translate(0,0)"}).duration(800);
		d3.select("#return-mark-g")
			.attr({'opacity':0,transform :"translate(-45,0)"})
			.transition()
			.attr({transform :"translate(0,0)"}).duration(800);

		d3.select("#svf-back")
			.transition().attr({'opacity':100})
			.duration(800);

		d3.select(".nanhai-div").style("display","none");

		var sour_id = d3.select("#dest_city").attr("data_name")|| dest_id;
		d3.select("#sour_city")
			.attr("data_name",sour_id)
			.html(dest_city);

		d3.select("#dest_city")
			.attr("data_name",propertyId)
			.html(propertyName);
	}
}

/**
 * 还原地图按钮的函数
 * @param flag -- 如果为ture，则是二级地图，否则是三级地图的点击事件
 */
function returnFun(flag){
	d3.select("#mapSvg").attr({"transform":'translate(0,0)'});
	if(flag){
		d3.select("#return-mark-r")
			.transition()
			.attr({'opacity':0,transform :"translate(-45,0)"})
			.duration(800);
		d3.select("#return-mark-g")
			.transition()
			.attr({'opacity':100,transform :"translate(-45,0)"})
			.duration(800);
		d3.select("#svf-back")
			.transition()
			.attr({'opacity':0})
			.duration(800);

		d3.select("#dest_city")
			.attr("data_name","")
			.html("");

		setLocalStorage("map_level",JSON.stringify(0));
		var province_info = {
			child_id:"",
			child_name:"全国地图",
			parent_id : "",
			parent_name : ""
		};
		setLocalStorage("province_info",JSON.stringify(province_info));

		d3.select(".nanhai-div").style("display","inline-block");
	}else{
		d3.select("#return-mark-r")
			.attr({'opacity':100,transform :"translate(-45,0)"})
			.transition()
			.attr({transform :"translate(0,0)"})
			.duration(800);
		d3.select("#return-mark-g")
			.attr({'opacity':0,transform :"translate(-45,0)"})
			.transition()
			.attr({transform :"translate(0,0)"})
			.duration(800);
		d3.select("#svf-back")
			.transition()
			.attr({'opacity':100})
			.duration(800);

		d3.select(".nanhai-div").style("display","none");

		var sour_id = d3.select("#sour_city").attr("data_name");
		var sour_city = d3.select("#sour_city").text();

		setLocalStorage("map_level",JSON.stringify(1));
		var province_info = {
			child_id : sour_id,
			child_name : sour_city,
			parent_id : "",
			parent_name : "全国地图"
		};
		setLocalStorage("province_info",JSON.stringify(province_info));

		d3.select("#sour_city")
			.attr("data_name","")
			.html("全国地图");

		d3.select("#dest_city")
			.attr("data_name",sour_id)
			.html(sour_city);
	}
}

/**
 * 创建地图左上角的标题
 * @param parent
 */
function create_return_svg(parent){
	if(!d3.select(".map-return-btn").empty()){
		d3.select(".map-return-btn").remove();
	}
	var returnSvgDiv = parent.append('div').attr({});
	returnSvgDiv.append('span').attr({'id':'sour_city'}).text("全国地图");
	var return_svg = returnSvgDiv.append('svg')
		.attr('class','map-return-btn')
		.attr("viewBox",'13 0 50 50');

	return_svg.append("g").attr({'id':'svf-back','opacity':0}).append('path')//背景
		.attr({"fill":"rgb(66, 66, 66)",
			"d":"M16.500,8.000 C16.500,8.000 60.500,8.000 60.500,8.000 C69.613,8.000 77.000,15.387 77.000,24.500 C77.000,33.613 69.613,41.000 60.500,41.000 C60.500,41.000 16.500,41.000 16.500,41.000 C7.387,41.000 -0.000,33.613 -0.000,24.500 C-0.000,15.387 7.387,8.000 16.500,8.000 Z"});

	var return_svg_g2 = return_svg.append("g").attr({transform :"translate(-45,0)",'id':'return-mark-g'});//灰色
	return_svg_g2.append('path')
		.attr("fill",'rgb(66, 66, 66)')
		.attr("d","M60.500,8.000 C51.387,8.000 44.000,15.387 44.000,24.500 C44.000,28.952 44.000,41.000 44.000,41.000 C44.000,41.000 55.839,41.000 60.500,41.000 C69.613,41.000 77.000,33.613 77.000,24.500 C77.000,15.387 69.613,8.000 60.500,8.000 Z");
	return_svg_g2.append('path').attr({'fill':'rgb(244, 244, 244)','d':'M60.500,35.000 C60.500,35.000 68.000,25.545 68.000,21.437 C68.000,17.330 64.642,14.000 60.500,14.000 C56.358,14.000 53.000,17.330 53.000,21.437 C53.000,25.545 60.500,35.000 60.500,35.000 ZM60.500,16.333 C63.343,16.333 65.647,18.619 65.647,21.437 C65.647,24.256 63.343,26.542 60.500,26.542 C57.657,26.542 55.353,24.256 55.353,21.437 C55.353,18.619 57.657,16.333 60.500,16.333 ZM60.500,25.083 C62.530,25.083 64.177,23.451 64.177,21.437 C64.177,19.424 62.530,17.792 60.500,17.792 C58.470,17.792 56.824,19.424 56.824,21.437 C56.824,23.451 58.470,25.083 60.500,25.083 Z'});

	var return_svg_g = return_svg.append("g").attr({transform :"translate(-45,0)",'id':'return-mark-r','opacity':0});//红色
	return_svg_g.append('path')
		.attr("fill",'rgb(218, 81, 73)')
		.attr("d","M60.500,8.000 C51.387,8.000 44.000,15.387 44.000,24.500 C44.000,28.952 44.000,41.000 44.000,41.000 C44.000,41.000 55.839,41.000 60.500,41.000 C69.613,41.000 77.000,33.613 77.000,24.500 C77.000,15.387 69.613,8.000 60.500,8.000 Z");
	return_svg_g.append('path').attr({'fill':'rgb(244, 244, 244)','d':'M60.500,35.000 C60.500,35.000 68.000,25.545 68.000,21.437 C68.000,17.330 64.642,14.000 60.500,14.000 C56.358,14.000 53.000,17.330 53.000,21.437 C53.000,25.545 60.500,35.000 60.500,35.000 ZM60.500,16.333 C63.343,16.333 65.647,18.619 65.647,21.437 C65.647,24.256 63.343,26.542 60.500,26.542 C57.657,26.542 55.353,24.256 55.353,21.437 C55.353,18.619 57.657,16.333 60.500,16.333 ZM60.500,25.083 C62.530,25.083 64.177,23.451 64.177,21.437 C64.177,19.424 62.530,17.792 60.500,17.792 C58.470,17.792 56.824,19.424 56.824,21.437 C56.824,23.451 58.470,25.083 60.500,25.083 Z'});


	returnSvgDiv.append('span')
		.attr({'id':'dest_city'});
		//.attr({"data_name":province_e})
		//.text(province_name);
}

/**
 * 生成是否显示地图标线的滑块
 */
function slide_map_line(parent){
	var returnSvgDiv = parent.append('div');
	returnSvgDiv.append("span").text("显示流向");

	var open_span = returnSvgDiv.append("span").attr("class","javafile-span");
	open_span.append("span").attr("class","javafile-on").text("开");
	open_span.append("span").attr("class","javafile-off").text("关");
	open_span.append("a").attr("class","javafile-a");
}

/**
 * 当没有数据的时候，画出“暂无数据”的提示框
 */
function drawNoData(){
	if(!(d3.select(".no_data_div").empty())){
		d3.select(".no_data_div").style({
			"display":"inline-block"
		});
	}else{
		d3.select(".cenmap")
			.append("div")
			.attr({"class":"no_data_div"})
			.text("暂无数据！");
	}
	d3.selectAll(".map").attr({
		"fill":"#0D1A23",
		"stroke":"#434D56"
	}).classed("no_data",true);
}

/**
 * 取到需要刷新的时间
 */
function getRefreshTime(){
	var earliest = "";
	if(!(d3.select("#selectYear").empty())){
		if(d3.select("#selectYear").property("value") != ""){//如果能取得日期选择器的值，则进行下一步，否则将earliest设置为当前时间
			var click_date = d3.select("#selectYear").property("value").trim().split("-").join("/");
			var server_date = get_common_time(true).server_date;//取到当前服务器时间
			if(click_date == server_date){//如果选择的日期跟服务器的日期相同
				if(!(d3.select(".hourGroup.clicked-g").empty())){//判断是否选择了小时和分钟，如果没有，则earliest值设置为当前时间
					var click_hour = d3.select(".hourGroup.clicked-g").select("text").text();
					var click_minu = "";
					if(!(d3.select(".minuteGroup.clicked-g").empty())){
						click_minu = d3.select(".minuteGroup.clicked-g").select("text").text();
					}else{
						click_minu = "00";
					}
					var date = click_date +" "+ click_hour +":"+ click_minu +":"+ "00";
					earliest = new Date(date).getTime()/1000;
				}else{
					earliest = "";
				}
			}else{
				if(!(d3.select(".hourGroup.clicked-g").empty())){
					var click_hour = d3.select(".hourGroup.clicked-g").select("text").text();
					var click_minu = "";
					if(!(d3.select(".minuteGroup.clicked-g").empty())){
						click_minu = d3.select(".minuteGroup.clicked-g").select("text").text();
					}else{
						click_minu = "00";
					}
					var date = click_date +" "+ click_hour +":"+ click_minu +":"+ "00";
					earliest = new Date(date).getTime()/1000;
				}else{
					var date = click_date +" 00:00:00";
					earliest = new Date(date).getTime()/1000;
				}
			}
		}else{
			earliest = "";
		}
	}
	return earliest;
}

/**
 * 画点函数
 * @param container -- 包含点的父容器
 * @param data -- 数据
 * @param projection --
 */
function drawCircle(data,projection){
	d3.selectAll('.blingblingG').remove();
	var city_all_count = data.mapcount;
	data.ll_data.forEach(function(value,key){

		//if((value.s["latitude"] == -1 && value.s["longitude"] == -1) || (value.d["latitude"] == -1 && value.d["longitude"] == -1)){//过滤掉经纬度为-1的数据
		//}else{
			var circle_g = d3.select("#mapSvg")
				.append('g')
				.attr("class","blingblingG");
			for(var i in value){
				if(i != "trans_count"){
					/**画出动效的点 -- 由于修改首页卡顿问题，暂时取消数据点的动效**/
					for(var j = 0; j< 2; j++){
						circle_g
							.append("circle")
							.attr({
								"class": function(){
									if(j == 0){
										return "bling_1";
									}else{
										return "bling_2";
									}
								},
								'r': function (){
									if(value.trans_count >= 700){
										return 13;
									}else if(value.trans_count <=100){
										return 3;
									}else{
										return value.trans_count / 100 ;
									}
								},
								'stroke': 'rgb(41,201,197,1)',
								'fill':"none",
								'transform': function () {
									var sourpos = { 'cp':[Number(value[i].longitude),Number(value[i].latitude)]};
									return 'translate('+ projection(sourpos.cp)+ ')';
								}
							});
					}
					/**画出基础点**/
					circle_g.append('circle')
						.attr({
							"city_only":function(){
								if(i == "d"){
									return "d" +value[i].ip;
								}else{
									return "s" +value[i].ip;
								}
							},
							"class":"blingbling",
							'r': function (){
								if(value.trans_count >= 700){
									return 13;
								}else if(value.trans_count <=100){
									return 3;
								}else{
									return value.trans_count / 100 ;
								}
							},
							'fill':'rgb(41,201,197)',
							"data-city-name":function(d){
								return value[i].c;
							},
							'transform':function(){
								var destpos = { 'cp':[Number(value[i].longitude),Number(value[i].latitude)]};
								return 'translate('+ projection(destpos.cp)+ ')';
							}
						});
				}
			}
		//}
	});
	/**地图数据点的动效函数**/
	blingbling();
	d3.selectAll(".blingbling")
		.on('mouseout',function(d,i){
			d3.select(".tootip-style").style("opacity",0.0);
		})
		.on("mousemove",function(d){
			var city_name = d3.select(this).attr("data-city-name");
			for(var city in city_all_count){
				if(city_name.indexOf(city) >= 0){
					var city_count = city_all_count[city].trans_count;
				}
			}

			/** 鼠标移动时，更改样式 left 和 top 来改变提示框的位置 **/
			var map_div_left = d3.select(".cenmap")[0][0].getBoundingClientRect().left;
			var map_div_top = d3.select(".cenmap")[0][0].getBoundingClientRect().top;
			var mouse_left = parseInt(d3.event.pageX);
			var mouse_top = parseInt(d3.event.pageY);

			d3.select(".tootip-style").html(function(){
				if(city_count){
					return city_name + "交易量：" + city_count;
				}else{
					return city_name + "交易量：" + 0;
				}
			})
				.style("left", (mouse_left -  map_div_left) + 20 + "px")
				.style("top", (mouse_top - map_div_top) + 20 + "px")
				.style("opacity",0.6);
		})
}

/**
 * 地图数据点的动效--动效暂时还有效率问题
 */
function blingbling(){
	d3.selectAll(".bling_1")
		.transition()
		.ease("linear")
		.attr({
			"r":"15",
			"stroke":"rgba(41,201,197,0)"
		})
		.duration(1000)
		.each("end",function(){
			d3.select(this)
				.attr({
					"r":5,
					"stroke":"rgba(41,201,197,1)"
				});
			blingbling();
		});

	d3.selectAll(".bling_2")
		.transition()
		.ease("linear")
		.attr({
			"r":"15",
			"stroke":"rgba(41,201,197,0)"
		})
		.delay(500)
		.duration(1000)
		.each("end",function(){
			d3.select(this)
				.attr({
					"r":5,
					"stroke":"rgba(41,201,197,1)"
				});
			blingbling();
		});
}

/**
 * 根据数据画出连线
 * @param container -- 连线节点的父容器
 * @param data -- 后台返回的数据
 * @param projection -- 方法
 */
function drawLine(data,projection){
	d3.selectAll('.line-svg').remove();
	var line_g = d3.select("#mapSvg").selectAll('.line-svg')
		.data(data.ll_data)
		.enter()
		.append("svg")
		.attr("class","line-svg")
		.append("g");

	/*生成用于观看的连线*/
	line_g.append("path")
		.attr({
			"class":"circle-line",
			"stroke-width":"2",
			"fill":"none",
			"stroke":"rgba(71, 144, 95, 0.2)",
			"d":function(d){
				var tempdest = { 'cp':[Number(d.d.longitude),Number(d.d.latitude)]};
				var tempsour = { 'cp':[Number(d.s.longitude),Number(d.s.latitude)]};

				var destPos = projection(tempdest.cp);
				var sourPos = projection(tempsour.cp);

				var conPointPos = getConPointPos(sourPos,destPos);//画线

				return "M " + sourPos + " Q " + conPointPos.pos + " " + destPos;
			}
		});
	/*生成用于操作的连线*/
	line_g.append("path")
		.attr({
			"class":"circle-line-bg",
			"stroke":"rgba(0,0,0,0)",
			"data-sour-ip":function(d){
				return d.s.ip;
			},
			"data-dest-ip": function (d) {
				return d.d.ip;
			},
			"filter":"url('#line_filter')",
			"stroke-width":"5",
			"fill":"none",
			"id":function(d,i){
				return "motion_path"+i;
			},
			"d":function(d){
				var tempdest = { 'cp':[Number(d.d.longitude),Number(d.d.latitude)]};
				var tempsour = { 'cp':[Number(d.s.longitude),Number(d.s.latitude)]};

				var destPos = projection(tempdest.cp);
				var sourPos = projection(tempsour.cp);

				var conPointPos = getConPointPos(sourPos,destPos);

				return "M " + sourPos + " Q " + conPointPos.pos + " " + destPos;
			}
		});

	/**生成线性渐变的滤镜**/
	var linear_gradient = line_g.append("defs")
		.append("linearGradient")
		.attr("id","linear_gradient");

	linear_gradient.append("stop")
		.attr({
			"offset":"20%",
			"stop-color":"rgba(255,255,255,.2)"
		});
	linear_gradient.append("stop")
		.attr({
			"offset":"50%",
			"stop-color":"rgba(255,255,255,.5)"
		});
	linear_gradient.append("stop")
		.attr({
			"offset":"70%",
			"stop-color":"rgba(255,255,255,.7)"
		});
	linear_gradient.append("stop")
		.attr({
			"offset":"100%",
			"stop-color":"rgba(255,255,255,1)"
		});

	/**生成动效，“彗星尾巴”**/
	var comet_tail = line_g.append("g")
		.attr({"clip-path":function(d,i){
			return "url(#clip_comet"+i+")";
			}
		});
	var comet_path = comet_tail.append("path").
		attr({
			"d":"M 0,0 Q 15,2 17,0 Q 15,-2 0,0",
			"stroke-width":"1px",
			"stroke":"url(#linear_gradient)",
			"fill":"url(#linear_gradient)",
			"class":"comets"
		});
	comet_path.append("animateMotion")
		.attr({
			"dur":"5s",
			"repeatCount":"indefinite",
			"rotate":"auto"
		})
		.append("mpath")
		.attr({
			"xlink:href": function(d,i){
				return "#motion_path" + i;
			}
		});

	/**
	 * 截断地图数据流向的彗星尾部超出部分
	 */
	var clip_defs = line_g
		.append("g")
		.append("defs");
	clip_defs.append("clipPath")
		.attr({"id":function(d,i){
			return "clip_comet"+i;
		}})
		.append("rect")
		.attr({
			"x":function(d,i){
				return d3.select("#motion_path"+i)[0][0].getBBox().x;
			},
			"y":function(d,i){
				return d3.select("#motion_path"+i)[0][0].getBBox().y;
			},
			"width":function(d,i){
				return d3.select("#motion_path"+i)[0][0].getBBox().width;
			},
			"height":function(d,i){
				return d3.select("#motion_path"+i)[0][0].getBBox().height;
			}
		});

	d3.selectAll(".circle-line-bg")
		.on('mouseout',function(d,i){
			d3.select(".tootip-style").style("opacity",0.0);
			/*鼠标移出时，改变连线的样式*/
			d3.select(this)
				.attr("stroke","rgba(0,0,0,0)");
			d3.select(d3.select(this)[0][0].parentNode).select(".circle-line")
				.attr("stroke-width","2");
		})
		.on("mousemove",function(d){
			/** 鼠标移动时，更改样式 left 和 top 来改变提示框的位置 */
			var map_div_left = d3.select(".cenmap")[0][0].getBoundingClientRect().left;
			var map_div_top = d3.select(".cenmap")[0][0].getBoundingClientRect().top;
			var mouse_left = parseInt(d3.event.pageX);
			var mouse_top = parseInt(d3.event.pageY);

			d3.select(".tootip-style").html(d.s.c+'->'+d.d.c +"<br>"+"交易量" + d.trans_count)
				.style("left", (mouse_left -  map_div_left) + 20 + "px")
				.style("top", (mouse_top - map_div_top) + 20 + "px")
				.style("opacity",0.6);

			/** 鼠标移动到线上时改变其样式 */
			d3.select(this)
				.attr("stroke","rgba(71, 144, 95, .65)");
			d3.select(d3.select(this)[0][0].parentNode).select(".circle-line")
				.attr("stroke-width","5");

		});
        //.on('click',function(d){
        //    if((!d3.select('#app_name').empty()) && (!d3.select('#intf_name').empty())){
        //        var stat_app_name = d3.select("#app_name").attr("name");
        //        var stat_intf_name = d3.select("#intf_name").attr("name");
			//	var statUrl = '/' + LANGUAGE_CODE + '/transtrack/' + stat_app_name  + '/' + stat_intf_name + '/?ip_src=' + d.s.ip + '&ip_dst=' + d.d.ip;
			//	var ts_end = getRefreshTime();
			//	if(ts_end != ''){
			//		statUrl += '&ts_start=' + (parseInt(ts_end) - 60) + '&ts_end=' + ts_end;
			//	}
        //        setLocalStorage('statUrl',statUrl);
        //        setLocalStorage('is_change_intf','not');
        //        window.location.href = '/' + LANGUAGE_CODE + '/stat/' + stat_app_name + '/cap/' + stat_intf_name +'/';
        //    }
        //});

	var map_line = JSON.parse(localStorage.getItem("map_line"));//获取本地存储的数据
	//画出连线 本地存储的数据状态，如果是1就画出线，否则不画出
	if(map_line){
		d3.selectAll(".circle-line-bg,.circle-line")
			.style("display","inline-block");
		d3.selectAll(".comets")
			.style("display","inline-block");
		d3.select(".javafile-on").text("");
		d3.select(".javafile-off").text("关");
	}else{
		d3.selectAll(".circle-line-bg,.circle-line")
			.style("display","none");
		d3.selectAll(".comets")
			.style("display","none");
		d3.select(".javafile-off").text("");
		d3.select(".javafile-on").text("开");
	}
	javaFileSlide(false);
}

/**
 * 画线函数
 * @param sourPos -- 线的起点坐标
 * @param destPos -- 线的终点坐标
 * @returns {{pos: *[], linear_dire: string}} -- 返回的对象，其中包括控制点的坐标，和线上动画的移动方向
 */
function getConPointPos(sourPos,destPos){
	//var linear_dire = "";
	var pathAttr = {};

	var disX = Math.abs(destPos[0] - sourPos[0]);
	var disY = Math.abs(destPos[1] - sourPos[1]);

	var disXPow = Math.pow(disX,2);
	var disYPow = Math.pow(disY,2);

	var dis1To2 = Math.sqrt(disXPow + disYPow);

	var dis1To2Half = dis1To2 / 2;

	var dis1ToConPoint = (dis1To2Half * 2) / Math.sqrt(3);

	var kx1Tox2 = disY / disX;

	var argtan = Math.atan(kx1Tox2);
	var argtan2 = "";
	var conPointY = "";
	var conPointX = "";

	if(sourPos[0] >= destPos[0] && sourPos[1] >= destPos[1]){
		//linear_dire = "linear-right";

		argtan2 = Math.abs(argtan - Math.PI / 6);

		conPointX = destPos[0] + dis1ToConPoint * Math.cos(argtan2);

		if(argtan >= (Math.PI / 6)){
			conPointY = destPos[1] + dis1ToConPoint * Math.sin(argtan2);
		}else{
			conPointY = destPos[1] - dis1ToConPoint * Math.sin(argtan2);
		}

	}else if(sourPos[0] < destPos[0] && sourPos[1] >= destPos[1]){
		//linear_dire = "linear-left";

		argtan2 = Math.abs(argtan - Math.PI / 6);

		conPointX = destPos[0] - dis1ToConPoint * Math.cos(argtan2);

		if(argtan >= (Math.PI / 6)){
			conPointY = destPos[1] + dis1ToConPoint * Math.sin(argtan2);
		}else{
			conPointY = destPos[1] - dis1ToConPoint * Math.sin(argtan2);
		}

	}else if(sourPos[0] < destPos[0] && sourPos[1] < destPos[1]){
		//linear_dire = "linear-left";

		argtan2 = argtan + Math.PI / 6;

		conPointX = sourPos[0] + dis1ToConPoint * Math.cos(argtan2);
		conPointY = sourPos[1] + dis1ToConPoint * Math.sin(argtan2);

	}else if(sourPos[0] >= destPos[0] && sourPos[1] < destPos[1]){
		//linear_dire = "linear-right";

		argtan2 = argtan + Math.PI / 6;

		conPointX = sourPos[0] - dis1ToConPoint * Math.cos(argtan2);
		conPointY = sourPos[1] + dis1ToConPoint * Math.sin(argtan2);
	}

	return pathAttr = {
		pos:[conPointX,conPointY],
		//linear_dire: linear_dire
	} ;

}

/**
 * 设置二级和三级地图显示在svg元素的中间位置
 * @param falg
 */
function setGToCenter(falg){
	var gWidth = d3.select("#mapSvg")[0][0].getBoundingClientRect().width;
	var gHeight = d3.select("#mapSvg")[0][0].getBoundingClientRect().height;
	var goffsetTop = d3.select("#mapSvg")[0][0].getBoundingClientRect().top;
	var goffsetLeft = d3.select("#mapSvg")[0][0].getBoundingClientRect().left;
	var gX0 = gWidth / 2 + goffsetLeft;
	var gY0 = gHeight / 2 + goffsetTop;

	var svgWidth = d3.select("#mapBox")[0][0].getBoundingClientRect().width;
	var svgHeight = d3.select("#mapBox")[0][0].getBoundingClientRect().height;
	var svgOffsetTop = d3.select("#mapBox")[0][0].getBoundingClientRect().top;
	var svgOffsetLeft = d3.select("#mapBox")[0][0].getBoundingClientRect().left;
	var svgX0 = svgWidth / 2 + svgOffsetLeft;
	var svgY0 = svgHeight / 2 + svgOffsetTop;

	var defferceX = svgX0 - gX0;
	var defferceY = svgY0 - gY0;
	if(falg){
		d3.select("#mapSvg").attr({"transform":'translate('+defferceX+','+defferceY+')'});
	}else{
		d3.select("#mapSvg").attr({"transform":'scale(2,2) translate('+defferceX+','+defferceY+') '});
	}

}

/**
 * 点击滑块时的动画函数。
 */
function javaFileSlide(flag){
	if(!d3.select(".javafile-on").empty() && d3.select(".javafile-on").text()){
		setTimeout(function () {
			d3.select(".javafile-off")
				.text("关");
		},300);

		setTimeout(function(){
			d3.select(".javafile-on")
				.text("")
		},500);

		d3.select(".javafile-a")
			.transition()
			.style({
				"left":function(){
					if(flag){
						return "-37px"
					}else{
						return "-32px"
					}
				},
				"background":"#8F8F8F"
			})
			.duration(800);

		d3.select(".javafile-span")
			.attr("name","off");

		return 0;
	}else{
		setTimeout(function(){
			d3.select(".javafile-off")
				.text("")
		},500);

		setTimeout(function () {
			d3.select(".javafile-on")
				.text("开");
		},300);

		d3.select(".javafile-a")
			.transition()
			.style({
				"left":"0px",
				"background":"#10EDE6"
			})
			.duration(800);

		d3.select(".javafile-span")
			.attr("name","on");

		return 1;
	}
}


/*****************省级地图的定位**********************/
function centerbox(id){
	var coordinates = [];
	if(id=='he_bei' || id == '河北'){
		coordinates[0]=116.23;
		coordinates[1]=39.74;
	}
	if(id=='qing_hai' || id == '河北'){
		coordinates[0]=96.7144857;
		coordinates[1]=36.9199;
	}
	if(id=='gui_zhou' || id == '贵州'){

		coordinates[0]=106.7144857;
		coordinates[1]=26.9385;
	}
	if(id=='guang_xi' || id == '广西'){
		coordinates[0]=108.2813;
		coordinates[1]=23.6426;
	}
	if(id=='shan_dong' || id == '山东'){

		coordinates[0]=119.00;
		coordinates[1]=36.40;
	}
	if(id=='hei_long_jiang' || id == '黑龙江'){

		coordinates[0]=127.92;
		coordinates[1]=49.50;
	}
	if(id=='yun_nan' || id == '云南'){

		coordinates[0]=102.92;
		coordinates[1]=26.00;
	}
	if(id=='xi_zang' || id == '西藏'){

		coordinates[0]=91.92;
		coordinates[1]=32.36;
	}
	if(id=='gan_su' || id == '甘肃'){

		coordinates[0]=103.40;
		coordinates[1]=38.36;
	}
	if(id=='nei_meng_gu' || id == '内蒙古'){

		coordinates[0]=113.40;
		coordinates[1]=47.36;
	}
	if(id=='xin_jiang' || id == '新疆'){

		coordinates[0]=88.40;
		coordinates[1]=43.36;
	}
	if(id=='si_chuan' || id == '四川'){

		coordinates[0]=104.06;
		coordinates[1]=30.67;
	}
	if(id=='hai_nan' || id == '海南'){

		coordinates[0]=109.9512;
		coordinates[1]=19.2041;
	}
	if(id=='tai_wan' || id == '台湾'){

		coordinates[0]=121.0254;
		coordinates[1]=23.5986;
	}
	if(id=='guang_dong' || id == '广东'){

		coordinates[0]=113.4668;
		coordinates[1]=22.8076;
	}
	if(id=='fu_jian' || id == '福建'){

		coordinates[0]=118.3008;
		coordinates[1]=25.9277;
	}
	if(id=='hu_nan' || id == '湖南'){

		coordinates[0]=111.5332;
		coordinates[1]=27.3779;
	}
	if(id=='chong_qing' || id == '重庆'){

		coordinates[0]=107.7539;
		coordinates[1]=30.1904;
	}
	if(id=='ning_xia' || id == '宁夏'){

		coordinates[0]=106.6961;
		coordinates[1]=37.8096;
	}
	if(id=='shan_xi_1' || id == '陕西'){

		coordinates[0]=109.5996;
		coordinates[1]=36.3996;
	}
	if(id=='shan_xi_2' || id == '山西'){

		coordinates[0]=112.4121;
		coordinates[1]=37.6611;
	}
	if(id=='he_nan' || id == '河南'){

		coordinates[0]=113.4668;
		coordinates[1]=33.8818;
	}
	if(id=='hu_bei' || id == '湖北'){

		coordinates[0]=112.2363;
		coordinates[1]=31.1572;
	}
	if(id=='jiang_xi' || id == '江西'){

		coordinates[0]=116.0156;
		coordinates[1]=27.29;
	}
	if(id=='zhe_jiang' || id == '浙江'){

		coordinates[0]=120.498;
		coordinates[1]=29.0918;
	}
	if(id=='jiang_su' || id == '江苏'){

		coordinates[0]=120.0586;
		coordinates[1]=32.915;
	}
	if(id=='an_hui' || id == '安徽'){

		coordinates[0]=117.2461;
		coordinates[1]=32.0361;
	}
	if(id=='tian_jin' || id == '天津'){

		coordinates[0]=117.4219;
		coordinates[1]=39.4189;
	}
	if(id=='bei_jing' || id == '北京'){

		coordinates[0]=116.4551;
		coordinates[1]=40.2539;
	}
	if(id=='liao_ning' || id == '辽宁'){

		coordinates[0]=122.3438;
		coordinates[1]=41.0889;
	}
	if(id=='ji_lin' || id == '吉林'){

		coordinates[0]=126.4746;
		coordinates[1]=43.5938;
	}
	if(id=='shang_hai' || id == '上海'){

		coordinates[0]=121.4746;
		coordinates[1]=31.3938;
	}
	if(id=='xiang_gang' || id == '香港'){

		coordinates[0]=114.1546;
		coordinates[1]=22.4038;
	}
	return coordinates;
}

/**
 * 转换地图的省的名字
 * @param id
 * @returns {Array}
 */
function conversion(id){
	var province_e = id;
	if(id == '河北'){
		province_e = "hei_bei";
	}
	if(id == '河北'){
		province_e = "qing_hai";
	}
	if(id == '贵州'){
		province_e = "gui_zhou";
	}
	if(id == '广西'){
		province_e = "guang_xi";
	}
	if(id == '山东'){
		province_e = "shan_dong";
	}
	if(id == '黑龙江'){
		province_e = "hei_long_jiang";
	}
	if(id == '云南'){
		province_e = "yun_nan";
	}
	if(id == '西藏'){
		province_e = "xi_zang";
	}
	if(id == '甘肃'){
		province_e = "gan_su";
	}
	if(id == '内蒙古'){
		province_e = "nei_meng_gu";
	}
	if(id == '新疆'){
		province_e = "xin_jiang";
	}
	if(id == '四川'){
		province_e = "si_chuan";
	}
	if(id == '海南'){
		province_e = "hai_nan";
	}
	if(id == '台湾'){
		province_e = "tai_wan";
	}
	if(id == '广东'){
		province_e = "guang_dong";
	}
	if(id == '福建'){
		province_e = "fu_jian";
	}
	if(id == '湖南'){
		province_e = "hu_nan";
	}
	if(id == '重庆'){
		province_e = "chong_qing";
	}
	if(id == '宁夏'){
		province_e = "ning_xia";
	}
	if(id == '陕西'){
		province_e = "shan_xi_1";
	}
	if(id == '山西'){
		province_e = "shan_xi_2";
	}
	if(id == '河南'){
		province_e = "he_nan";
	}
	if(id == '湖北'){
		province_e = "hu_bei";
	}
	if(id == '江西'){
		province_e = "jiang_xi";
	}
	if(id == '浙江'){
		province_e = "zhe_jiang";
	}
	if(id == '江苏'){
		province_e = "jiang_su";
	}
	if(id == '安徽'){
		province_e = "an_hui";
	}
	if(id == '天津'){
		province_e = "tian_jin";
	}
	if(id == '北京'){
		province_e = "bei_jing";
	}
	if(id == '辽宁'){
		province_e = "liao_ning";
	}
	if(id == '吉林'){
		province_e = "ji_lin";
	}
	if(id == '上海'){
		province_e = "shang_hai";
	}
	if(id == '香港'){
		province_e = "xiang_gang";
	}
	return province_e;
}

/****************未开放的三级萃取锁定*************************/
/**
 * 特别行政区和直辖市的三级萃取的功能锁定
 * @param bool
 * @param id
 * @returns {*}
 */
function clockClick(bool,id){
	if (id == 'bei_jing'|| id == 'shang_hai' ||id=='tian_jin'|| id=='chong_qing' || id == 'xiang_gang' || id=='ao_men' || id == "tai_wan"){
		bool = 0;
	}
	if (id == 659004||id == 659001||id == 659002||id == 659003){
		bool = 0;
	}
	if(id>=469000&&id<=470000){
		bool =0;
	}
	if(id>=429000&&id<=430000){
		bool =0;
	}
	if(id==3414){
		bool =0;
	}
	if(id >= 469001 && id <= 469007 || id >= 469021 && id <= 469033){//海南个省直辖县级行政单位
		bool = 0;
	}
	return bool;
}

/************************省级地图放大的比例尺********************/
function scalebox(id){
    var si_chuan=3300;
	var  xiang_gang=50000;
	var  nei_meng_gu=1400;
	var  xin_jiang=1700;
	var  xi_zang=2000;
	var  gan_su=2300;
	var  qing_hai=2800;
	var  yun_nan=3800;
	var  ning_xia=6000;
	var  chong_qing=6000;
	var  gui_zhou = 5000;
	var  shan_xi_1=3500;
	var  guang_xi=4500;
	var  shan_xi_2=3650;
	var  he_nan=4900;
	var  hu_bei=4600;
	var  hu_nan=4500;
	var  guang_dong=4500;
	var  hai_nan=12000;
	var  he_bei=3800;
	var  shan_dong=4600;
	var  bei_jing=13400;
	var  tian_jin=13000;
	var  jiang_su=5000;
	var  an_hui=5000;
	var  jiang_xi=4700;
	var  zhe_jiang=5700;
	var  fu_jian=5400;
	var  tai_wan=7700;
	var  liao_ning=4700;
	var  ji_lin=3700;
	var  hei_long_jiang=2200;
	var  ao_men=160000;
	var  shang_hai=24000;
	if (id=='si_chuan' || id == '四川')
		return si_chuan;
	if (id=='xiang_gang' || id == '香港')
		return xiang_gang;
	if (id=='nei_meng_gu' || id == '内蒙古')
		return nei_meng_gu;
	if (id=='xin_jiang' || id == '新疆')
		return xin_jiang;
	if (id=='xi_zang' || id == '西藏')
		return xi_zang;
	if (id=='qing_hai' || id == '青海')
		return qing_hai;
	if (id=='gan_su' || id == '甘肃')
		return gan_su;
	if (id=='yun_nan' || id == '云南')
		return yun_nan;
	if (id=='ning_xia' || id == '宁夏')
		return ning_xia;
	if (id=='chong_qing' || id == '重庆')
		return chong_qing;
	if (id=='gui_zhou' || id == '贵州')
		return gui_zhou;
	if (id=='shan_xi_1' || id == '陕西')
		return shan_xi_1;
	if (id=='guang_xi' || id == '广西')
		return guang_xi;
	if (id=='shan_xi_2' || id == '山西')
		return shan_xi_2;
	if (id=='he_nan' || id == '河南')
		return he_nan;
	if (id=='hu_bei' || id == '湖北')
		return hu_bei;
	if (id=='hu_nan' || id == '湖南')
		return hu_nan;
	if (id=='hai_nan' || id == '海南')
		return hai_nan;
	if (id=='guang_dong' || id == '广东')
		return guang_dong;
	if (id=='he_bei' || id == '河北')
		return he_bei;
	if (id=='shan_dong' || id == '山东')
		return shan_dong;
	if (id=='bei_jing' || id == '北京')
		return bei_jing;
	if (id=='tian_jin' || id == '天津')
		return tian_jin;
	if (id=='jiang_su' || id == '江苏')
		return jiang_su;
	if (id=='an_hui' || id == '安徽')
		return an_hui;
	if (id=='jiang_xi' || id == '江西')
		return jiang_xi;
	if (id=='zhe_jiang' || id == '浙江')
		return zhe_jiang;
	if (id=='fu_jian' || id == '福建')
		return fu_jian;
	if (id=='tai_wan' || id == '台湾')
		return tai_wan;
	if (id=='liao_ning' || id == '辽宁')
		return liao_ning;
	if (id=='ji_lin' || id == '吉林')
		return ji_lin;
	if (id=='hei_long_jiang' || id == '黑龙江')
		return hei_long_jiang;
	if (id=='ao_men' || id == '澳门')
		return ao_men;
	if (id=='shang_hai' || id == '上海')
		return shang_hai;
}

function probox(id,coordinates,scale){
  if(id >4100 &&id<4200 ){
	scale = he_nanbox(id,coordinates,scale);
  }
  if(id >5100 &&id<5200 ){
	scale = si_chuanbox(id,coordinates,scale);
  }
  if(id >2200 &&id<2300){
	scale = ji_linbox(id,coordinates,scale);
  }
  if(id >1300 &&id<1400){
	scale = he_beibox(id,coordinates,scale);
  }
  if(id >1400 &&id<1500){
	scale = shan_xi_2box(id,coordinates,scale);
  }
  if(id >1500 &&id<1600){
	scale = nei_meng_gubox(id,coordinates,scale);
  }
  if(id >2100 &&id<2200){
	scale = liao_ningbox(id,coordinates,scale);
  }
  if(id >2300 &&id<2400){
	scale = hei_long_jiangbox(id,coordinates,scale);
  }
  if(id >3200 &&id<3300){
	scale = jiang_subox(id,coordinates,scale);
  }
  if(id >3300 &&id<3400){
	scale = zhe_jiangbox(id,coordinates,scale);
  }
  if(id >3400 &&id<3500){
	scale = an_huibox(id,coordinates,scale);
  }
  if(id >3500 &&id<3600){
	scale = fu_jianbox(id,coordinates,scale);
  }
  if(id >3600 &&id<3700){
	scale = jiang_xibox(id,coordinates,scale);
  }
  if(id >3700 &&id<3800){
	scale = shan_dongbox(id,coordinates,scale);
  }
  if(id >4200 &&id<4300){
	scale = hu_beibox(id,coordinates,scale);
  }
  if(id >4300 &&id<4400){
	scale = hu_nanbox(id,coordinates,scale);
  }
  if(id >4400 &&id<4500){
	scale = guang_dongbox(id,coordinates,scale);
  }
  if(id >4500 &&id<4600){
	scale = guang_xibox(id,coordinates,scale);
  }
  if(id >4600 &&id<4700){
	scale = hai_nanbox(id,coordinates,scale);
  }
  if(id >5200 &&id<5300){
	scale = gui_zhoubox(id,coordinates,scale);
  }
  if(id >5300 &&id<5400){
	scale = yun_nanbox(id,coordinates,scale);
  }
  if(id >5400 &&id<5500){
	scale = xi_zangbox(id,coordinates,scale);
  }
  if(id >6100 &&id<6200){
	scale = shan_xi_1box(id,coordinates,scale);
  }
  if(id >6400 &&id<6500){
	scale = ning_xiabox(id,coordinates,scale);
  }
  if(id >6200 &&id<6300){
	scale = gan_subox(id,coordinates,scale);
  }
  if(id >6300 &&id<6400){
	scale = qing_haibox(id,coordinates,scale);
  }
  if(id >6500 &&id<6600){
	scale = xin_jiangbox(id,coordinates,scale);
  }
  return scale;
}
function an_huibox(id,coordinates,scale){
	if(id == 3401){
		coordinates[0]=119.16;
		coordinates[1]=31.22;
		scale=8000;
	}
	if(id == 3402){
		coordinates[0]=119.46;
		coordinates[1]=30.82;
		scale=12000;
	}
	if(id == 3403){
		coordinates[0]=118.76;
		coordinates[1]=32.82;
		scale=12000;
	}
	if(id == 3404){
		coordinates[0]=117.66;
		coordinates[1]=32.55;
		scale=15000;
	}
	if(id == 3405){
		coordinates[0]=119.46;
		coordinates[1]=31.42;
		scale=14000;
	}
	if(id == 3406){
		coordinates[0]=117.950;
		coordinates[1]=31.40;
		scale=13000;
	}
	if(id == 3407){
		coordinates[0]=118.56;
		coordinates[1]=30.82;
		scale=30000;
	}
	if(id == 3408){
		coordinates[0]=118.96;
		coordinates[1]=30.02;
		scale=8000;
	}
	if(id == 3410){
		coordinates[0]=119.86;
		coordinates[1]=29.40;
		scale=9000;
	}
	if(id == 3411){
		coordinates[0]=119.96;
		coordinates[1]=32.10;
		scale=9000;
	}
	if(id == 3412){
		coordinates[0]=117.46;
		coordinates[1]=32.60;
		scale=9000;
	}
	if(id == 3413){
		coordinates[0]=119.36;
		coordinates[1]=33.40;
		scale=7500;
	}
	if(id == 3414){
		coordinates[0]=119.46;
		coordinates[1]=30.70;
		scale=9000;
		//巢湖暂时没有JSON文件，已撤市
	}
	if(id == 3415){
		coordinates[0]=118.66;
		coordinates[1]=31.20;
		scale=7500;
	}
	if(id == 3416){
		coordinates[0]=117.950;
		coordinates[1]=32.90;
		scale=9000;
	}
	if(id == 3417){
		coordinates[0]=118.96;
		coordinates[1]=29.60;
		scale=9000;
	}
	if(id == 3418){
		coordinates[0]=120.50;
		coordinates[1]=30.20;
		scale=9000;
	}
	return scale;
}
function fu_jianbox(id,coordinates,scale){
	if(id == 3501){
		coordinates[0]=120.96;
		coordinates[1]=25.38;
		scale=9000;
	}
	if(id == 3502){
		coordinates[0]=118.89;
		coordinates[1]=24.42;
		scale=20000;
	}
	if(id == 3503){
		coordinates[0]=119.96;
		coordinates[1]=25.08;
		scale=15000;
	}
	if(id == 3504){
		coordinates[0]=119.66;
		coordinates[1]=25.75;
		scale=7500;
	}
	if(id == 3505){
		coordinates[0]=120.16;
		coordinates[1]=24.82;
		scale=9000;
	}
	if(id == 3506){
		coordinates[0]=119.20;
		coordinates[1]=23.82;
		scale=9000;
	}
	if(id == 3507){
		coordinates[0]=120.56;
		coordinates[1]=26.62;
		scale=6500;
	}
	if(id == 3508){
		coordinates[0]=118.96;
		coordinates[1]=24.62;
		scale=7500;
	}
	if(id == 3509){
		coordinates[0]=121.66;
		coordinates[1]=26.40;
		scale=8000;
	}
	return scale;
}
function guang_xibox(id,coordinates,scale){
	if(id == 4501){//nanning
		coordinates[0]=110.75;
		coordinates[1]=22.21;
		scale=7000;
	}
	if(id == 4502){//liuzhou
		coordinates[0]=111.56;
		coordinates[1]=24.250;
		scale=7000;
	}
	if(id == 4503){//guilin
		coordinates[0]=112.66;
		coordinates[1]=24.50;
		scale=7000;
	}
	if(id == 4504){//wuzhou
		coordinates[0]=113.26;
		coordinates[1]=22.75;
		scale=7000;
	}
	if(id == 4505){//beihai
		coordinates[0]=110.60;
		coordinates[1]=21.00;
		scale=12000;
	}
	if(id == 4506){//fangchenggang
		coordinates[0]=109.35;
		coordinates[1]=21.4575;
		scale=12000;
	}
	if(id == 4507){//qinzhou
		coordinates[0]=110.75;
		coordinates[1]=21.6075;
		scale=9000;
	}
	if(id == 4508){//guigang
		coordinates[0]=111.75;
		coordinates[1]=22.8075;
		scale=9000;
	}
	if(id == 4509){//yulin
		coordinates[0]=111.90;
		coordinates[1]=21.8075;
		scale=9000;
	}
	if(id == 4510){//baise
		coordinates[0]=108.95;
		coordinates[1]=23.2875;
		scale=5500;
	}
	if(id == 4511){//hezhou
		coordinates[0]=113.35;
		coordinates[1]=23.80;
		scale=9000;
	}
	if(id == 4512){//hechi
		coordinates[0]=110.20;
		coordinates[1]=23.75;
		scale=6000;
	}
	if(id == 4513){//laibin
		coordinates[0]=112.72;
		coordinates[1]=23.60;
		scale=9000;
	}
	if(id == 4514){//崇左
		coordinates[0]=109.27;
		coordinates[1]=21.7875;
		scale=7500;
	}

	return scale;
}
function he_beibox(id,coordinates,scale){
	if(id == 1301){
		coordinates[0]=116.16;
		coordinates[1]=37.62;
		scale=9000;
	}
	if(id == 1302){
		coordinates[0]=120.36;
		coordinates[1]=39.19;
		scale=8000;
	}
	if(id == 1303){
		coordinates[0]=120.96;
		coordinates[1]=39.62;
		scale=9000;
	}
	if(id == 1304){
		coordinates[0]=116.36;
		coordinates[1]=35.92;
		scale=9000;
	}
	if(id == 1305){
		coordinates[0]=116.36;
		coordinates[1]=36.82;
		scale=9000;
	}
	if(id == 1306){
		coordinates[0]=117.36;
		coordinates[1]=38.42;
		scale=7500;
	}
	if(id == 1307){
		coordinates[0]=118.46;
		coordinates[1]=40.02;
		scale=4500;
	}
	if(id == 1308){
		coordinates[0]=120.76;
		coordinates[1]=40.62;
		scale=5000;
	}
	if(id == 1309){
		coordinates[0]=118.76;
		coordinates[1]=37.70;
		scale=8000;
	}
	if(id == 1310){
		coordinates[0]=118.76;
		coordinates[1]=38.70;
		scale=8000;
	}
	if(id == 1311){
		coordinates[0]=117.76;
		coordinates[1]=37.22;
		scale=9000;
	}
	return scale;
}
function he_nanbox(id,coordinates,scale){
	if(id == 4101){
		coordinates[0]=114.92;
		coordinates[1]=34.14;
		scale=12000;
	}
	if(id == 4102){
		coordinates[0]=115.92;
		coordinates[1]=34.14;
		scale=12000;
	}
	if(id == 4103){
		coordinates[0]=113.56;
		coordinates[1]=33.82;
		scale=9000;
	}
	if(id == 4104){
		coordinates[0]=114.27;
		coordinates[1]=33.35;
		scale=12000;
	}
	if(id == 4105){
		coordinates[0]=115.57;
		coordinates[1]=35.4075;
		scale=12000;
	}
	if(id == 4106){
		coordinates[0]=115.15;
		coordinates[1]=35.4075;
		scale=18000;
	}
	if(id == 4107){
		coordinates[0]=115.45;
		coordinates[1]=34.9075;
		scale=12000;
	}
	if(id == 4108){
		coordinates[0]=114.05;
		coordinates[1]=34.9075;
		scale=18000;
	}
	if(id == 4109){
		coordinates[0]=116.55;
		coordinates[1]=35.4075;
		scale=12000;
	}
	if(id == 4110){
		coordinates[0]=114.85;
		coordinates[1]=33.7075;
		scale=13500;
	}
	if(id == 4111){
		coordinates[0]=114.8;
		coordinates[1]=33.4075;
		scale=18000;
	}
	if(id == 4112){
		coordinates[0]=112.60;
		coordinates[1]=33.82;
		scale=9000;
	}
	if(id == 4113){
		coordinates[0]=114.47;
		coordinates[1]=32.4075;
		scale=7000;
	}
	if(id == 4114){
		coordinates[0]=117.22;
		coordinates[1]=33.84;
		scale=10000;
	}
	if(id == 4115){
		coordinates[0]=116.87;
		coordinates[1]=31.5075;
		scale=8000;
	}
	if(id == 4116){
		coordinates[0]=116.57;
		coordinates[1]=33.2075;
		scale=10000;
	}
	if(id == 4117){
		coordinates[0]=115.77;
		coordinates[1]=32.5075;
		scale=9000;
	}
	return scale;
}
function hei_long_jiangbox(id,coordinates,scale){
	if(id == 2301){
		coordinates[0]=131.66;
		coordinates[1]=44.52;
		scale=4500;
	}
	if(id == 2302){
		coordinates[0]=128.36;
		coordinates[1]=46.52;
		scale=4000;
	}
	if(id == 2303){
		coordinates[0]=134.86;
		coordinates[1]=45.02;
		scale=6000;
	}
	if(id == 2304){
		coordinates[0]=133.26;
		coordinates[1]=47.12;
		scale=7000;
	}
	if(id == 2305){
		coordinates[0]=135.76;
		coordinates[1]=45.92;
		scale=5000;
	}
	if(id == 2306){
		coordinates[0]=128.06;
		coordinates[1]=45.62;
		scale=5000;
	}
	if(id == 2307){
		coordinates[0]=133.66;
		coordinates[1]=46.96;
		scale=3800;
	}
	if(id == 2308){
		coordinates[0]=136.46;
		coordinates[1]=46.22;
		scale=3500;
	}
	if(id == 2309){
		coordinates[0]=132.68;
		coordinates[1]=45.52;
		scale=9000;
	}
	if(id == 2310){
		coordinates[0]=133.88;
		coordinates[1]=43.62;
		scale=4300;
	}
	if(id == 2311){
		coordinates[0]=131.88;
		coordinates[1]=48.22;
		scale=3000;
	}
	if(id == 2312){
		coordinates[0]=130.08;
		coordinates[1]=45.92;
		scale=4500;
	}
	if(id == 2327){
		coordinates[0]=129.68;
		coordinates[1]=50.92;
		scale=2700;
	}
	return scale;
}
function hu_nanbox(id,coordinates,scale){
	if(id == 4301){//changsha
		coordinates[0]=115.19;
		coordinates[1]=27.70;
		scale=8000;
	}
	if(id == 4302){//zhuzhou
		coordinates[0]=115.52;
		coordinates[1]=26.40;
		scale=7500;
	}
	if(id == 4303){//xiangtan
		coordinates[0]=113.76;
		coordinates[1]=27.30;
		scale=12000;
	}
	if(id == 4304){//hengyang
		coordinates[0]=114.27;
		coordinates[1]=26.05;
		scale=9000;
	}
	if(id == 4305){//shaoyang
		coordinates[0]=113.37;
		coordinates[1]=26.05;
		scale=7000;
	}
	if(id == 4306){//yueyang
		coordinates[0]=115.05;
		coordinates[1]=28.6075;
		scale=9000;
	}
	if(id == 4307){//changde
		coordinates[0]=113.25;
		coordinates[1]=28.8075;
		scale=9000;
	}
	if(id == 4308){//zhangjiajie
		coordinates[0]=112.25;
		coordinates[1]=28.8075;
		scale=9000;
	}
	if(id == 4309){//yiyang
		coordinates[0]=113.87;
		coordinates[1]=28.2075;
		scale=8000;
	}
	if(id == 4310){//binzhou
		coordinates[0]=115.35;
		coordinates[1]=25.2075;
		scale=7500;
	}
	if(id == 4311){//yongzhou
		coordinates[0]=114.15;
		coordinates[1]=25.00;
		scale=6500;
	}
	if(id == 4312){//huaihua
		coordinates[0]=113.80;
		coordinates[1]=26.30;
		scale=4500;
	}
	if(id == 4313){//loudi
		coordinates[0]=113.42;
		coordinates[1]=27.30;
		scale=9000;
	}
	if(id == 4331){//xiangxi
		coordinates[0]=111.77;
		coordinates[1]=27.9875;
		scale=7500;
	}

	return scale;
}
function ji_linbox(id,coordinates,scale){
	if(id == 2201){
		coordinates[0]=128.66;
		coordinates[1]=43.62;
		scale=5000;
	}
	if(id == 2202){
		coordinates[0]=130.36;
		coordinates[1]=42.82;
		scale=4500;
	}
	if(id == 2203){
		coordinates[0]=127.26;
		coordinates[1]=43.02;
		scale=6000;
	}
	if(id == 2204){
		coordinates[0]=127.26;
		coordinates[1]=42.42;
		scale=9000;
	}
	if(id == 2205){
		coordinates[0]=128.76;
		coordinates[1]=40.92;
		scale=5000;
	}
	if(id == 2206){
		coordinates[0]=129.66;
		coordinates[1]=41.42;
		scale=6000;
	}
	if(id == 2207){
		coordinates[0]=127.86;
		coordinates[1]=43.72;
		scale=5000;
	}
	if(id == 2208){
		coordinates[0]=126.26;
		coordinates[1]=44.62;
		scale=5000;
	}
	if(id == 2224){
		coordinates[0]=133.26;
		coordinates[1]=42.02;
		scale=4000;
	}
	return scale;
}
function jiang_subox(id,coordinates,scale){
	if(id == 3201){
		coordinates[0]=120.66;
		coordinates[1]=31.42;
		scale=10000;
	}
	if(id == 3202){
		coordinates[0]=121.06;
		coordinates[1]=31.22;
		scale=15000;
	}
	if(id == 3203){
		coordinates[0]=119.76;
		coordinates[1]=33.82;
		scale=8000;
	}
	if(id == 3204){
		coordinates[0]=120.76;
		coordinates[1]=31.25;
		scale=15000;
	}
	if(id == 3205){
		coordinates[0]=122.26;
		coordinates[1]=30.92;
		scale=10500;
	}
	if(id == 3206){
		coordinates[0]=122.70;
		coordinates[1]=31.72;
		scale=9000;
	}
	if(id == 3207){
		coordinates[0]=120.86;
		coordinates[1]=34.02;
		scale=9000;
	}
	if(id == 3208){
		coordinates[0]=120.96;
		coordinates[1]=32.62;
		scale=8000;
	}
	if(id == 3209){
		coordinates[0]=122.26;
		coordinates[1]=32.90;
		scale=7500;
	}
	if(id == 3210){
		coordinates[0]=121.26;
		coordinates[1]=32.30;
		scale=9000;
	}
	if(id == 3211){
		coordinates[0]=120.76;
		coordinates[1]=31.60;
		scale=13000;
	}
	if(id == 3212){
		coordinates[0]=121.86;
		coordinates[1]=31.90;
		scale=9000;
	}
	if(id == 3213){
		coordinates[0]=120.26;
		coordinates[1]=33.20;
		scale=9000;
	}
	return scale;
}
function jiang_xibox(id,coordinates,scale){
	if(id == 3601){
		coordinates[0]=117.36;
		coordinates[1]=28.18;
		scale=12000;
	}
	if(id == 3602){
		coordinates[0]=118.89;
		coordinates[1]=28.82;
		scale=11000;
	}
	if(id == 3603){
		coordinates[0]=115.36;
		coordinates[1]=27.08;
		scale=12000;
	}
	if(id == 3604){
		coordinates[0]=117.52;
		coordinates[1]=28.75;
		scale=7500;
	}
	if(id == 3605){
		coordinates[0]=116.26;
		coordinates[1]=27.52;
		scale=12000;
	}
	if(id == 3606){
		coordinates[0]=118.60;
		coordinates[1]=27.82;
		scale=12000;
	}
	if(id == 3607){
		coordinates[0]=118.36;
		coordinates[1]=24.82;
		scale=5500;
	}
	if(id == 3608){
		coordinates[0]=116.86;
		coordinates[1]=26.30;
		scale=7500;
	}
	if(id == 3609){
		coordinates[0]=117.16;
		coordinates[1]=27.60;
		scale=7500;
	}
	if(id == 3610){
		coordinates[0]=118.46;
		coordinates[1]=26.80;
		scale=7500;
	}
	if(id == 3611){
		coordinates[0]=119.66;
		coordinates[1]=28.20;
		scale=7000;
	}
	return scale;
}
function nei_meng_gubox(id,coordinates,scale){
	if(id == 1501){
		coordinates[0]=114.06;
		coordinates[1]=39.89;
		scale=6000;
	}
	if(id == 1502){
		coordinates[0]=113.86;
		coordinates[1]=40.59;
		scale=5000;
	}
	if(id == 1503){
		coordinates[0]=108.36;
		coordinates[1]=39.02;
		scale=11000;
	}
	if(id == 1504){
		coordinates[0]=124.16;
		coordinates[1]=41.82;
		scale=3000;
	}
	if(id == 1505){
		coordinates[0]=126.86;
		coordinates[1]=42.52;
		scale=3000;
	}
	if(id == 1506){
		coordinates[0]=113.66;
		coordinates[1]=38.12;
		scale=3500;
	}
	if(id == 1507){
		coordinates[0]=131.86;
		coordinates[1]=47.62;
		scale=1500;
	}
	if(id == 1508){
		coordinates[0]=111.26;
		coordinates[1]=40.62;
		scale=4000;
	}
	if(id == 1509){
		coordinates[0]=116.66;
		coordinates[1]=40.70;
		scale=3600;
	}
	if(id == 1522){
		coordinates[0]=127.16;
		coordinates[1]=44.82;
		scale=3000;
	}
	if(id == 1525){
		coordinates[0]=123.66;
		coordinates[1]=42.09;
		scale=2000;
	}
	if(id == 1529){
		coordinates[0]=113.66;
		coordinates[1]=37.09;
		scale=1500;
	}
	return scale;
}
function shan_dongbox(id,coordinates,scale){
	if(id == 3701){
		coordinates[0]=118.96;
		coordinates[1]=36.28;
		scale=9000;
	}
	if(id == 3702){
		coordinates[0]=122.00;
		coordinates[1]=35.86;
		scale=8500;
	}
	if(id == 3703){
		coordinates[0]=119.96;
		coordinates[1]=36.08;
		scale=9000;
	}
	if(id == 3704){
		coordinates[0]=118.71;
		coordinates[1]=34.50;
		scale=12000;
	}
	if(id == 3705){
		coordinates[0]=120.45;
		coordinates[1]=37.12;
		scale=9000;
	}
	if(id == 3706){
		coordinates[0]=122.60;
		coordinates[1]=36.82;
		scale=8500;
	}
	if(id == 3707){
		coordinates[0]=120.96;
		coordinates[1]=36.02;
		scale=8500;
	}
	if(id == 3708){
		coordinates[0]=118.46;
		coordinates[1]=34.72;
		scale=8500;
	}
	if(id == 3709){
		coordinates[0]=118.86;
		coordinates[1]=35.60;
		scale=9000;
	}
	if(id == 3710){
		coordinates[0]=123.60;
		coordinates[1]=36.52;
		scale=9500;
	}
	if(id == 3711){
		coordinates[0]=120.60;
		coordinates[1]=35.02;
		scale=10500;
	}
	if(id == 3712){
		coordinates[0]=119.02;
		coordinates[1]=35.92;
		scale=12500;
	}
	if(id == 3713){
		coordinates[0]=120.42;
		coordinates[1]=34.69;
		scale=7500;
	}
	if(id == 3714){
		coordinates[0]=118.82;
		coordinates[1]=36.69;
		scale=7500;
	}
	if(id == 3715){
		coordinates[0]=117.62;
		coordinates[1]=36.00;
		scale=9000;
	}
	if(id == 3716){
		coordinates[0]=119.70;
		coordinates[1]=36.96;
		scale=8500;
	}
	if(id == 3717){
		coordinates[0]=117.32;
		coordinates[1]=34.50;
		scale=9000;
	}
	return scale;
}
function shan_xi_2box(id,coordinates,scale){
	if(id == 1401){
		coordinates[0]=113.56;
		coordinates[1]=37.62;
		scale=12000;
	}
	if(id == 1402){
		coordinates[0]=115.86;
		coordinates[1]=39.19;
		scale=7000;
	}
	if(id == 1403){
		coordinates[0]=114.96;
		coordinates[1]=37.62;
		scale=12000;
	}
	if(id == 1404){
		coordinates[0]=114.66;
		coordinates[1]=36.02;
		scale=9000;
	}
	if(id == 1405){
		coordinates[0]=114.36;
		coordinates[1]=35.02;
		scale=9000;
	}
	if(id == 1406){
		coordinates[0]=114.66;
		coordinates[1]=39.02;
		scale=8000;
	}
	if(id == 1407){
		coordinates[0]=114.86;
		coordinates[1]=36.62;
		scale=7000;
	}
	if(id == 1408){
		coordinates[0]=113.26;
		coordinates[1]=34.62;
		scale=8000;
	}
	if(id == 1409){
		coordinates[0]=114.96;
		coordinates[1]=38.20;
		scale=6000;
	}
	if(id == 1410){
		coordinates[0]=113.36;
		coordinates[1]=35.70;
		scale=8000;
	}
	if(id == 1411){
		coordinates[0]=113.66;
		coordinates[1]=37.09;
		scale=6500;
	}
	return scale;
}
function si_chuanbox(id,coordinates,scale){
	if(id == 5101){
		coordinates[0]=105.66;
		coordinates[1]=30.24;
		scale=10000;
	}
	if(id == 5103){
		coordinates[0]=105.86;
		coordinates[1]=28.84;
		scale=12000;
	}
	if(id == 5104){
		coordinates[0]=102.86;
		coordinates[1]=26.30;
		scale=12000;
	}
	if(id == 5105){
		coordinates[0]=107.46;
		coordinates[1]=27.80;
		scale=8000;
	}
	if(id == 5106){
		coordinates[0]=105.96;
		coordinates[1]=30.74;
		scale=10000;
	}
	if(id == 5107){
		coordinates[0]=107.46;
		coordinates[1]=31.04;
		scale=6000;
	}
	if(id == 5108){
		coordinates[0]=107.76;
		coordinates[1]=31.54;
		scale=7000;
	}
	if(id == 5109){
		coordinates[0]=106.76;
		coordinates[1]=30.34;
		scale=12000;
	}
	if(id == 5110){
		coordinates[0]=106.46;
		coordinates[1]=29.34;
		scale=12000;
	}
	if(id == 5111){
		coordinates[0]=105.75;
		coordinates[1]=28.74;
		scale=8000;
	}
	if(id == 5113){
		coordinates[0]=107.96;
		coordinates[1]=30.54;
		scale=8000;
	}
	if(id == 5114){
		coordinates[0]=105.36;
		coordinates[1]=29.24;
		scale=10000;
	}
	if(id == 5115){
		coordinates[0]=106.40;
		coordinates[1]=27.94;
		scale=8000;
	}
	if(id == 5116){
		coordinates[0]=108.10;
		coordinates[1]=30.04;
		scale=10000;
	}
	if(id == 5117){
		coordinates[0]=109.90;
		coordinates[1]=30.64;
		scale=7000;
	}
	if(id == 5118){
		coordinates[0]=104.76;
		coordinates[1]=29.24;
		scale=7000;
	}
	if(id == 5119){
		coordinates[0]=109.06;
		coordinates[1]=31.54;
		scale=8000;
	}
	if(id == 5120){
		coordinates[0]=106.96;
		coordinates[1]=29.84;
		scale=9000;
	}
	if(id == 5120){
		coordinates[0]=106.96;
		coordinates[1]=29.84;
		scale=9000;
	}
	if(id == 5132){
		coordinates[0]=106.12;
		coordinates[1]=31.24;
		scale=4000;
	}
	if(id == 5133){
		coordinates[0]=105.62;
		coordinates[1]=29.04;
		scale=2300;
	}
	if(id == 5134){
		coordinates[0]=106.12;
		coordinates[1]=26.24;
		scale=4000;
	}
	return scale;
}
function zhe_jiangbox(id,coordinates,scale){
	if(id == 3301){
		coordinates[0]=121.25;
		coordinates[1]=29.42;
		scale=9000;
	}
	if(id == 3302){
		coordinates[0]=123.06;
		coordinates[1]=29.22;
		scale=10000;
	}
	if(id == 3303){
		coordinates[0]=122.56;
		coordinates[1]=27.32;
		scale=8000;
	}
	if(id == 3304){
		coordinates[0]=122.06;
		coordinates[1]=30.30;
		scale=13500;
	}
	if(id == 3305){
		coordinates[0]=121.36;
		coordinates[1]=30.22;
		scale=11500;
	}
	if(id == 3306){
		coordinates[0]=122.20;
		coordinates[1]=29.32;
		scale=10500;
	}
	if(id == 3307){
		coordinates[0]=121.46;
		coordinates[1]=28.62;
		scale=10000;
	}
	if(id == 3308){
		coordinates[0]=120.46;
		coordinates[1]=28.42;
		scale=10000;
	}
	if(id == 3309){
		coordinates[0]=124.46;
		coordinates[1]=29.40;
		scale=7500;
	}
	if(id == 3310){
		coordinates[0]=122.96;
		coordinates[1]=28.00;
		scale=9000;
	}
	if(id == 3311){
		coordinates[0]=121.36;
		coordinates[1]=27.60;
		scale=9000;
	}
	if(id == 3212){
		coordinates[0]=121.86;
		coordinates[1]=31.90;
		scale=9000;
	}
	if(id == 3213){
		coordinates[0]=120.26;
		coordinates[1]=33.20;
		scale=9000;
	}
	return scale;
}
function gan_subox(id,coordinates,scale){
  if(id == 6201){//兰州
    coordinates[0]=105.66;
	coordinates[1]=35.78;
	scale=8500;
  }
  if(id == 6202){//嘉峪关
    coordinates[0]=99.07;
	coordinates[1]=39.57;
	scale=18000;
  }
  if(id == 6203){//金昌
    coordinates[0]=104.16;
	coordinates[1]=37.78;
	scale=7000;
  }
  if(id == 6204){//白银
    coordinates[0]=107.31;
	coordinates[1]=35.83;
	scale=6000;
  }
  if(id == 6205){//天水
    coordinates[0]=107.45;
	coordinates[1]=34.02;
	scale=9000;
  }
  if(id == 6206){//武威
    coordinates[0]=107.300;
	coordinates[1]=37.22;
	scale=4000;
  }
  if(id == 6207){//张掖
    coordinates[0]=103.36;
	coordinates[1]=38.0;
	scale=4500;
  }
  if(id == 6208){//平凉
    coordinates[0]=108.46;
	coordinates[1]=34.8;
	scale=8500;
  }
  if(id == 6209){//酒泉
    coordinates[0]=102.86;
	coordinates[1]=39.0;
	scale=2500;
  }
  if(id == 6210){//庆阳
    coordinates[0]=110.30;
	coordinates[1]=35.52;
	scale=6500;
  }
  if(id == 6211){//定西
    coordinates[0]=106.90;
	coordinates[1]=34.52;
	scale=6500;
  }
  if(id == 6212){//陇南
    coordinates[0]=107.62;
	coordinates[1]=32.92;
	scale=6500;
  }
  if(id == 6229){//临夏
    coordinates[0]=105.02;
	coordinates[1]=35.09;
	scale=9500;
  }
  if(id == 6230){//甘南
    coordinates[0]=105.82;
	coordinates[1]=33.29;
	scale=5000;
  }
  return scale;
}
  
function gui_zhoubox(id,coordinates,scale){
  if(id == 5201){
    coordinates[0]=108.00;
	coordinates[1]=26.35;
	scale=12000;
  }
  if(id == 5202){
    coordinates[0]=106.86;
	coordinates[1]=25.54;
	scale=9000;
  }
  if(id == 5203){
    coordinates[0]=109.46;
	coordinates[1]=27.10;
	scale=6000;
  }
  if(id == 5204){
    coordinates[0]=107.50;
	coordinates[1]=25.450;
	scale=10000;
  }
  if(id == 5222){
    coordinates[0]=110.66;
	coordinates[1]=27.34;
	scale=7500;
  }
  if(id == 5223){
    coordinates[0]=107.96;
	coordinates[1]=24.64;
	scale=7000;
  }
  if(id == 5224){
    coordinates[0]=107.86;
	coordinates[1]=26.24;
	scale=6000;
  }
  if(id == 5226){
    coordinates[0]=111.06;
	coordinates[1]=25.44;
	scale=6000;
  }
  if(id == 5227){
    coordinates[0]=109.96;
	coordinates[1]=25.34;
	scale=6000;
  }
  return scale;
}
function hai_nanbox(id,coordinates,scale){
  if(id == 4601){//海口
    coordinates[0]=111.19;
	coordinates[1]=19.541;
	scale=20500;
  }
  if(id == 4602){//三亚
	coordinates[0]=110.22;
	coordinates[1]=18.10;
	scale=17500;
  }
  if(id == 4403){//shenzhen
	coordinates[0]=114.96;
	coordinates[1]=22.30;
	scale=20000;
  }
  if(id == 4404){//zhuhai
	coordinates[0]=114.37;
	coordinates[1]=21.95;
	scale=20000;
  }
  if(id == 4405){//shantou
	coordinates[0]=117.60;
	coordinates[1]=23.00;
	scale=18000;
  }
  if(id == 4406){//foushan
	coordinates[0]=114.15;
	coordinates[1]=22.8075;
	scale=13000;
  }
  if(id == 4407){//jiangmen
	coordinates[0]=114.05;
	coordinates[1]=21.8075;
	scale=10500;
  }
  if(id == 4408){//zhanjiang
	coordinates[0]=112.25;
	coordinates[1]=20.3075;
	scale=8000;
  }
  if(id == 4409){//maoming
	coordinates[0]=112.80;
	coordinates[1]=21.5075;
	scale=9000;
  }
  if(id == 4412){//zhaoqing
	coordinates[0]=113.95;
	coordinates[1]=22.9875;
	scale=8500;
  }
  if(id == 4413){//huizhou
	coordinates[0]=116.35;
	coordinates[1]=22.70;
	scale=9000;
  }
  if(id == 4414){//meizhou
	coordinates[0]=117.70;
	coordinates[1]=23.60;
	scale=9000;
  }
  if(id == 4415){//shanwei
	coordinates[0]=116.72;
	coordinates[1]=22.60;
	scale=13000;
  }
  if(id == 4416){//heyuan
	coordinates[0]=116.87;
	coordinates[1]=23.2875;
	scale=8500;
  }
  if(id == 4417){//yangjiang
	coordinates[0]=113.27;
	coordinates[1]=21.5875;
	scale=10500;
  }
  if(id == 4418){//qingyuan
	coordinates[0]=115.17;
	coordinates[1]=23.5875;
	scale=7500;
  }
  if(id == 4419){//dongguan
	coordinates[0]=115.17;
	coordinates[1]=22.3875;
	scale=12000;
  }
  if(id == 4420){//guangzhou
	coordinates[0]=114.87;
	coordinates[1]=22.0875;
	scale=12000;
  }
  if(id == 4451){//chaozhou
	coordinates[0]=117.70;
	coordinates[1]=23.55;
	scale=18000;
  }
  if(id == 4452){//jieyang
	coordinates[0]=117.40;
	coordinates[1]=22.95;
	scale=12000;
  }
  if(id == 4453){//yunfu
	coordinates[0]=113.17;
	coordinates[1]=22.2875;
	scale=10500;
  }
  return scale;
}
function hu_beibox(id,coordinates,scale){
  if(id == 4201){//wuhan
    coordinates[0]=116.03;
	coordinates[1]=30.20;
	scale=10000;
  }
  if(id == 4202){//huangshi
	coordinates[0]=116.02;
	coordinates[1]=29.60;
	scale=15000;
  }
  if(id == 4203){//shiyan
	coordinates[0]=112.56;
	coordinates[1]=31.65;
	scale=7000;
  }
  if(id == 4205){//yichang
	coordinates[0]=113.27;
	coordinates[1]=30.05;
	scale=7000;
  }
  if(id == 4206){//xiangfan
	coordinates[0]=114.37;
	coordinates[1]=31.4075;
	scale=7000;
  }
  if(id == 4207){//ezhou
	coordinates[0]=115.65;
	coordinates[1]=30.1075;
	scale=18000;
  }
  if(id == 4208){//jingmen
	coordinates[0]=114.35;
	coordinates[1]=30.4075;
	scale=9000;
  }
  if(id == 4209){//xiaogan
	coordinates[0]=115.75;
	coordinates[1]=30.5075;
	scale=9000;
  }
  if(id == 4210){//jingzhou
	coordinates[0]=114.67;
	coordinates[1]=29.4075;
	scale=8000;
  }
  if(id == 4211){//huanggang
	coordinates[0]=117.35;
	coordinates[1]=30.0075;
	scale=7500;
  }
  if(id == 4212){//xianning
	coordinates[0]=116.00;
	coordinates[1]=29.00;
	scale=9000;
  }
  if(id == 4213){//suizhou
	coordinates[0]=115.20;
	coordinates[1]=31.32;
	scale=9000;
  }
  if(id == 4228){//enshi
	coordinates[0]=111.77;
	coordinates[1]=29.4875;
	scale=6400;
  }
  if(id == 4290){//shennongjia
	coordinates[0]=111.82;
	coordinates[1]=31.14;
	scale=10000;
  }
  return scale;
}
function liao_ningbox(id,coordinates,scale){
  if(id == 2101){
    coordinates[0]=125.66;
	coordinates[1]=41.52;
	scale=7000;
  }
  if(id == 2102){
    coordinates[0]=124.36;
	coordinates[1]=38.82;
	scale=7000;
  }
  if(id == 2103){
    coordinates[0]=125.26;
	coordinates[1]=40.02;
	scale=7000;
  }
  if(id == 2104){
    coordinates[0]=126.46;
	coordinates[1]=41.42;
	scale=9000;
  }
  if(id == 2105){
    coordinates[0]=126.46;
	coordinates[1]=40.72;
	scale=9000;
  }
  if(id == 2106){
    coordinates[0]=126.76;
	coordinates[1]=39.82;
	scale=7000;
  }
  if(id == 2107){
    coordinates[0]=123.46;
	coordinates[1]=41.02;
	scale=9000;
  }
  if(id == 2108){
    coordinates[0]=123.66;
	coordinates[1]=40.12;
	scale=12000;
  }
  if(id == 2109){
    coordinates[0]=123.66;
	coordinates[1]=41.72;
	scale=9000;
  }
  if(id == 2110){
    coordinates[0]=124.56;
	coordinates[1]=40.79;
	scale=13000;
  }
  if(id == 2111){
    coordinates[0]=123.26;
	coordinates[1]=40.72;
	scale=13000;
  }
  if(id == 2112){
    coordinates[0]=126.66;
	coordinates[1]=42.02;
	scale=7000;
  }
  if(id == 2113){
    coordinates[0]=122.46;
	coordinates[1]=40.82;
	scale=6500;
  }
  if(id == 2114){
    coordinates[0]=122.16;
	coordinates[1]=40.02;
	scale=8500;
  }
  return scale;
}
function ning_xiabox(id,coordinates,scale){
  if(id == 6401){//银川
    coordinates[0]=108.16;
	coordinates[1]=37.58;
	scale=8500;
  }
  if(id == 6402){//石嘴山市
    coordinates[0]=107.80;
	coordinates[1]=38.62;
	scale=13000;
  }
  if(id == 6403){//吴忠
    coordinates[0]=108.86;
	coordinates[1]=36.78;
	scale=7000;
  }
  if(id == 6404){//固原
    coordinates[0]=108.01;
	coordinates[1]=35.30;
	scale=9000;
  }
  if(id == 6405){//中卫
    coordinates[0]=107.95;
	coordinates[1]=36.32;
	scale=7000;
  }

  return scale;
}
function qing_haibox(id,coordinates,scale){
  if(id == 6301){//西宁
    coordinates[0]=102.86;
	coordinates[1]=36.38;
	scale=10500;
  }
  if(id == 6321){//海东
    coordinates[0]=104.07;
	coordinates[1]=35.72;
	scale=8000;
  }
  if(id == 6322){//海北
    coordinates[0]=103.86;
	coordinates[1]=37.08;
	scale=4500;
  }
  if(id == 6323){//黄南
    coordinates[0]=104.31;
	coordinates[1]=34.43;
	scale=6200;
  }
  if(id == 6325){//海南
    coordinates[0]=103.45;
	coordinates[1]=35.02;
	scale=5000;
  }
  if(id == 6326){//果洛
    coordinates[0]=103.600;
	coordinates[1]=33.02;
	scale=4000;
  }
  if(id == 6327){//玉树
    coordinates[0]=101.36;
	coordinates[1]=31.5;
	scale=2200;
  }
  if(id == 6328){//海西
    coordinates[0]=105.46;
	coordinates[1]=32.8;
	scale=1500;
  }
 
  return scale;
}
function shan_xi_1box(id,coordinates,scale){
  if(id == 6101){//西安
    coordinates[0]=110.56;
	coordinates[1]=33.58;
	scale=8500;
  }
  if(id == 6102){//铜川
    coordinates[0]=110.10;
	coordinates[1]=34.86;
	scale=14500;
  }
  if(id == 6103){//宝鸡
    coordinates[0]=109.06;
	coordinates[1]=33.78;
	scale=8000;
  }
  if(id == 6104){//咸阳
    coordinates[0]=110.01;
	coordinates[1]=34.30;
	scale=9000;
  }
  if(id == 6105){//渭南
    coordinates[0]=111.95;
	coordinates[1]=34.52;
	scale=8000;
  }
  if(id == 6106){//延安
    coordinates[0]=112.300;
	coordinates[1]=35.62;
	scale=5500;
  }
  if(id == 6107){//汉中
    coordinates[0]=109.36;
	coordinates[1]=32.32;
	scale=6500;
  }
  if(id == 6108){//榆林
    coordinates[0]=113.46;
	coordinates[1]=36.82;
	scale=4000;
  }
  if(id == 6109){//安康
    coordinates[0]=111.86;
	coordinates[1]=32.10;
	scale=6000;
  }
  if(id == 6110){//商洛
    coordinates[0]=112.30;
	coordinates[1]=33.02;
	scale=6500;
  }
  if(id == 3711){
    coordinates[0]=120.60;
	coordinates[1]=35.02;
	scale=10500;
  }
  if(id == 3712){
    coordinates[0]=119.02;
	coordinates[1]=35.92;
	scale=12500;
  }
  if(id == 3713){
    coordinates[0]=120.42;
	coordinates[1]=34.69;
	scale=7500;
  }
  if(id == 3714){
    coordinates[0]=118.82;
	coordinates[1]=36.69;
	scale=7500;
  }
  if(id == 3715){
    coordinates[0]=117.62;
	coordinates[1]=36.00;
	scale=9000;
  }
  if(id == 3716){
    coordinates[0]=119.70;
	coordinates[1]=36.96;
	scale=8500;
  }
  if(id == 3717){
    coordinates[0]=117.32;
	coordinates[1]=34.50;
	scale=9000;
  }
  return scale;
}
function xi_zangbox(id,coordinates,scale){
  if(id == 5401){//拉萨
    coordinates[0]=93.60;
	coordinates[1]=29.30;
	scale=6000;
  }
  if(id == 5421){//昌都
    coordinates[0]=102.26;
	coordinates[1]=28.84;
	scale=3000;
  }
  if(id == 5422){//山南
    coordinates[0]=96.46;
	coordinates[1]=27.10;
	scale=4000;
  }
  if(id == 5423){//日喀则
    coordinates[0]=92.50;
	coordinates[1]=27.250;
	scale=2500;
  }
  if(id == 5424){//那曲
    coordinates[0]=97.66;
	coordinates[1]=31.00;
	scale=2000;
  }
  if(id == 5425){//阿里
    coordinates[0]=90.96;
	coordinates[1]=30.34;
	scale=2000;
  }
  if(id == 5426){//林芝
    coordinates[0]=100.46;
	coordinates[1]=27.24;
	scale=3000;
  }
  return scale;
}
function xin_jiangbox(id,coordinates,scale){
  if(id == 6501){//乌鲁木齐
    coordinates[0]=91.00;
	coordinates[1]=43.16;
	scale=5300;
  }
  if(id == 6502){//克拉玛依
    coordinates[0]=88.77;
	coordinates[1]=44.32;
	scale=5000;
  }
  if(id == 6521){//吐鲁番
    coordinates[0]=94.36;
	coordinates[1]=41.08;
	scale=3500;
  }
  if(id == 6522){//哈密
    coordinates[0]=100.31;
	coordinates[1]=41.43;
	scale=2200;
  }
  if(id == 6523){//昌吉
    coordinates[0]=93.75;
	coordinates[1]=43.02;
	scale=3000;
  }
  if(id == 6527){//博尔塔拉
    coordinates[0]=85.000;
	coordinates[1]=44.02;
	scale=5000;
  }
  if(id == 6528){//巴音郭楞
    coordinates[0]=99.36;
	coordinates[1]=37.0;
	scale=1500;
  }
  if(id == 6529){//阿克苏
    coordinates[0]=86.46;
	coordinates[1]=39.8;
	scale=3000;
  }
  if(id == 6530){//克孜勒苏柯尔克孜
    coordinates[0]=81.46;
	coordinates[1]=37.8;
	scale=3000;
  }
  if(id == 6531){//喀什
    coordinates[0]=83.46;
	coordinates[1]=35.8;
	scale=2500;
  }
  if(id == 6532){//和田
    coordinates[0]=88.46;
	coordinates[1]=34.8;
	scale=2100;
  }
  if(id == 6540){//伊犁哈萨克
    coordinates[0]=87.56;
	coordinates[1]=42.8;
	scale=3500;
  }
  if(id == 6542){//塔城
    coordinates[0]=90.56;
	coordinates[1]=44.0;
	scale=2800;
  }
  if(id == 6543){//阿勒泰
    coordinates[0]=94.56;
	coordinates[1]=45.5;
	scale=2500;
  }
 
  return scale;
}
function yun_nanbox(id,coordinates,scale){
  if(id == 5301){//昆明
    coordinates[0]=104.90;
	coordinates[1]=24.70;
	scale=7000;
  }
  if(id == 5303){//曲靖
    coordinates[0]=107.26;
	coordinates[1]=24.84;
	scale=5000;
  }
  if(id == 5304){//玉溪
    coordinates[0]=104.46;
	coordinates[1]=23.50;
	scale=7500;
  }
  if(id == 5305){//保山
    coordinates[0]=101.50;
	coordinates[1]=24.250;
	scale=6500;
  }
  if(id == 5306){//昭通
    coordinates[0]=106.66;
	coordinates[1]=27.00;
	scale=6500;
  }
  if(id == 5307){//丽江
    coordinates[0]=102.96;
	coordinates[1]=26.34;
	scale=6500;
  }
  if(id == 5308){//普洱
    coordinates[0]=103.46;
	coordinates[1]=22.24;
	scale=5000;
  }
  if(id == 5309){//临沧
    coordinates[0]=102.06;
	coordinates[1]=23.14;
	scale=6000;
  }
  if(id == 5323){//楚雄
    coordinates[0]=103.96;
	coordinates[1]=24.54;
	scale=6000;
  }
  if(id == 5325){//红河
    coordinates[0]=105.66;
	coordinates[1]=22.84;
	scale=6000;
  }
  if(id == 5326){//文山
    coordinates[0]=107.36;
	coordinates[1]=22.84;
	scale=6000;
  }
  if(id == 5328){//西双版纳
    coordinates[0]=103.46;
	coordinates[1]=21.00;
	scale=6000;
  }
  if(id == 5329){//大理
    coordinates[0]=102.66;
	coordinates[1]=24.90;
	scale=6000;
  }
  if(id == 5331){//德宏
    coordinates[0]=100.26;
	coordinates[1]=23.90;
	scale=7500;
  }
  if(id == 5333){//怒江
    coordinates[0]=101.76;
	coordinates[1]=25.90;
	scale=5000;
  }
  if(id == 5334){//迪庆
    coordinates[0]=102.26;
	coordinates[1]=27.30;
	scale=6000;
  }
  return scale;
}

function guang_dongbox(id,coordinates,scale){
  if(id == 4501){//guangzhou
    coordinates[0]=115.00;
	coordinates[1]=22.81;
	scale=10500;
  }
  if(id == 4402){//shaoguan
	coordinates[0]=116.02;
	coordinates[1]=24.10;
	scale=7500;
  }
  if(id == 4403){//shenzhen
	coordinates[0]=114.96;
	coordinates[1]=22.30;
	scale=20000;
  }
  if(id == 4404){//zhuhai
	coordinates[0]=114.37;
	coordinates[1]=21.95;
	scale=20000;
  }
  if(id == 4405){//shantou
	coordinates[0]=117.60;
	coordinates[1]=23.00;
	scale=18000;
  }
  if(id == 4406){//foushan
	coordinates[0]=114.15;
	coordinates[1]=22.8075;
	scale=13000;
  }
  if(id == 4407){//jiangmen
	coordinates[0]=114.05;
	coordinates[1]=21.8075;
	scale=10500;
  }
  if(id == 4408){//zhanjiang
	coordinates[0]=112.25;
	coordinates[1]=20.3075;
	scale=8000;
  }
  if(id == 4409){//maoming
	coordinates[0]=112.80;
	coordinates[1]=21.5075;
	scale=9000;
  }
  if(id == 4412){//zhaoqing
	coordinates[0]=113.95;
	coordinates[1]=22.9875;
	scale=8500;
  }
  if(id == 4413){//huizhou
	coordinates[0]=116.35;
	coordinates[1]=22.70;
	scale=9000;
  }
  if(id == 4414){//meizhou
	coordinates[0]=117.70;
	coordinates[1]=23.60;
	scale=9000;
  }
  if(id == 4415){//shanwei
	coordinates[0]=116.72;
	coordinates[1]=22.60;
	scale=13000;
  }
  if(id == 4416){//heyuan
	coordinates[0]=116.87;
	coordinates[1]=23.2875;
	scale=8500;
  }
  if(id == 4417){//yangjiang
	coordinates[0]=113.27;
	coordinates[1]=21.5875;
	scale=10500;
  }
  if(id == 4418){//qingyuan
	coordinates[0]=115.17;
	coordinates[1]=23.5875;
	scale=7500;
  }
  if(id == 4419){//dongguan
	coordinates[0]=115.17;
	coordinates[1]=22.3875;
	scale=12000;
  }
  if(id == 4420){//guangzhou
	coordinates[0]=114.87;
	coordinates[1]=22.0875;
	scale=12000;
  }
  if(id == 4451){//chaozhou
	coordinates[0]=117.70;
	coordinates[1]=23.55;
	scale=18000;
  }
  if(id == 4452){//jieyang
	coordinates[0]=117.40;
	coordinates[1]=22.95;
	scale=12000;
  }
  if(id == 4453){//yunfu
	coordinates[0]=113.17;
	coordinates[1]=22.2875;
	scale=10500;
  }
  return scale;
}

