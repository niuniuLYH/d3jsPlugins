define(function(){
	function MapMainFun(dataOptions){
		var this_ = this;
		this_.projection = '';

		var defalutDataOptions = {//设置默认对象
			'province_name':'',
			'map_level':0,
			'province_info':{
				child_id : '',
				child_name : '',
				parent_id : '',
				parent_name : ''
			},
			'colorful':true,
			'is_click' : true//选择是否进行萃取，false为不进行萃取，true为萃取。主要用在首页，点击地图跳转至区域监控页面而不进行萃取
		};

		this_.initDataOption = {};//设置插件中使用的对象
		this_.initDataOption = defalutDataOptions;
		for(var tem in dataOptions){
			if(tem == 'province_info'){
				dataOptions[tem] && (this_.initDataOption[tem] = dataOptions[tem]);
			}else{
				this_.initDataOption[tem] = dataOptions[tem];
			}
		}
		this_.container = d3.select('#'+this_.initDataOption.containerId);
	}

	MapMainFun.prototype = {
		/**
		 * 地图主函数
		 */
		drawMaps:function(){
			var this_ = this;
			var full_screen = this_.container;

			var rect = full_screen.node().getBoundingClientRect();

			var map_div = full_screen.append("div")
				.attr("class","map_div_out");

			var returnSvgDiv = map_div.append('div').attr({'class':'return-div'});
			var container = map_div.append('div')
				.attr('class','cenmap');

			var svg = container.append('svg')
				.attr('width', '100%')
				.attr('height', '100%')
				.attr('preserveAspectRatio', 'xMidYMid meet')
				.attr('viewBox', '0 0 '+ 800 +' '+ 600)
				.attr('class', 'mapBox')
				.attr('xmlns','http://www.w3.org/2000/svg')
				.append("g").attr({'class':'mapSvg'});

			create_return_svg(returnSvgDiv);

			slide_map_line(returnSvgDiv);

			this_.drawPrepare();
			if(this_.initDataOption.map_level != 0){
				if(this_.initDataOption.map_level == 1){
					var province_name2 = conversion(this_.initDataOption.province_name);
					this_.initDataOption.province_info.parent_name = '全国地图';
					if(this_.initDataOption.province_info){
						this_.tranformMark(true);
					}else{
						this_.initDataOption.province_info.child_id = province_name2;
						this_.initDataOption.province_info.child_name = this_.initDataOption.province_name;
						this_.tranformMark(true);
					}
				}else{
					this_.initDataOption.province_info && this_.tranformMark(false);
				}
			}

			/**点击是否显示流向的按钮**/
			full_screen.selectAll(".javafile-a,.javafile-span").on("click",function(){
				var is_show_line = mapLineSwitch(this_.container);
				setLocalStorage("map_line",JSON.stringify(is_show_line));
				if(is_show_line){
					full_screen.selectAll(".circle-line-bg,.circle-line,.comets,.sourPointer")
						.style("display","inline-block");
				}else{
					full_screen.selectAll(".circle-line-bg,.circle-line,.comets,.sourPointer")
						.style("display","none");
				}
			});

			var this_id = full_screen[0][0].id;

			/**
			 * hover到连线时的滤镜效果
			 */
			var line_filter_svg = full_screen.append("svg")
				.attr({
					"width":"0",
					"height":"0"
				});
			line_filter_svg.append("filter")
				.attr({
					"id":this_id +"_filter"
				})
				.append("feGaussianBlur")
				.attr({
					"in":"SourceGraphic",
					"stdDeviation":"5"
				});

			/**数据点的滤镜效果**/
			var circle_filter_svg = full_screen.append("svg")
				.attr({
					"width":"0",
					"height":"0"
				});
			circle_filter_svg.append("filter")
				.attr({
					"id":this_id +"_circle_f",
					'width':'300%',
					'height':'300%'
				})
				.append("feGaussianBlur")
				.attr({
					"stdDeviation":"0.5"
				});

			/**生成彗星的尾巴的线性渐变的滤镜**/
			var linear_gradient = full_screen.append("svg")
				.attr({
					"width":"0",
					"height":"0"
				})
				.append("defs")
				.append("linearGradient")
				.attr("id",this_id+"_gradient");

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
		},

		/**
		 * 地图的各个path的绘制
		 * @param path -- 地图绘制的path方法
		 * @param d -- 获取到的地图数据
		 */
		drawMapPath :function(path,d){
			var this_ = this,
				tooltip = drawBack(this_.container),
				flag = this_.initDataOption.map_level;
			this_.container.select(".mapSvg").selectAll(".map_back2,.map_back1,.map_back3,.map_truth").selectAll("path").remove();

			this_.container.select('.map_back1').selectAll('path')//地图错位的阴影
				.data(d.features)
				.enter()
				.append('path')
				.attr('d', path)
				.attr('fill', '#0B0B0B')

				.attr('stroke', '#383838')
				.attr('stroke-width', '2');
			this_.container.select('.map_back2').selectAll('path')//地图外围的描边
				.data(d.features)
				.enter()
				.append('path')
				.attr('d', path)
				.attr('fill', '#4390A0')
				.attr('stroke', '#90A1A4')
				.attr('stroke-width', '4');

			this_.container.select('.map_back3').selectAll('path')//hover上去之后省级等的背景
				.data(d.features)
				.enter()
				.append('path')
				.attr('d', path)
				.attr('fill', '#1F3D5D')
				.attr('stroke','none');

			this_.container.select(".mapSvg").select(".map_truth").selectAll('path')//画地图
				.data(d.features)
				.enter()
				.append('path')
				.attr('d', path)
				.attr('id', function(d) { return d.id; })
				.attr('class','map')
				.attr('fill',function(d){
					return this_.initDataOption.colorful　? d.backColor : '';
				})
				.attr('stroke', '#798ea3')
				.attr('stroke-width', '1');

			this_.container.select("#southSeaG").remove();

			//获取g的宽度和高度，以及其坐标
			var g_info = this_.container.select(".mapSvg").select("g")[0][0].getBBox(),
				g_width = g_info.width + 20,
				g_height = g_info.height + 20,
				g_x = g_info.x - 5,
				g_y = g_info.y - 5;

			//给svg重新赋viewBox的值，使得地图在svg的中间位置
			this_.container.select(".mapBox").attr({
				"viewBox":g_x + " " + g_y + " " + g_width + " " + g_height
			});

			if(flag == 0){
				if(this_.container.select('.nanhai-div').empty()){
					var nanhai_g = this_.container.select('.mapBox').append('image').attr({
						'class' : 'nanhai-div',
						'xlink:href' : "../static/img/nanhai_no_data.svg",
						height : "16.5%",
						width : "9%",
						preserveAspectRatio : "none meet"
					});
					var nanhai_info = nanhai_g[0][0].getBBox(),
						nanhai_width = g_width - 20 - nanhai_info.width,
						nanhai_height = g_height - 20 - nanhai_info.height;
					nanhai_g.attr({
						x : nanhai_width,
						y : nanhai_height
					});
				}
			}
			this_.getData();

			this_.container.selectAll('.map')
				.on('mouseover',function(d,i){
					d3.select(this)
						.classed('hover-map-style',true);
					tooltip.style("opacity",0.6);
				})
				.on('mouseout',function(d,i){
					d3.select(this)
						.classed('hover-map-style',false);
					tooltip.style("opacity",0.0);
				})
				.on("mousemove",function(d){
					/** 鼠标移动时，更改样式 left 和 top 来改变提示框的位置 */

					var map_div_left = this_.container.select(".cenmap")[0][0].getBoundingClientRect().left,
						map_div_top = this_.container.select(".cenmap")[0][0].getBoundingClientRect().top,
						mouse_left = parseInt(d3.event.pageX),
						mouse_top = parseInt(d3.event.pageY);

					tooltip.html(d.properties.name)
						.style("left", (mouse_left -  map_div_left) + 20 + "px")
						.style("top", (mouse_top - map_div_top ) + 20 + "px");
				});

			if(flag == 2){//如果是三级地图，不给区域添加点击事件
				this_.container.selectAll('.map').on('click',null);
			}else{
				this_.container.selectAll('.map')
					.classed("unclick",false)
					.on('click', function (d) {
						if(!this_.initDataOption.is_click){//判断是否进行下级萃取，this_.initDataOption.is_click值为false为不进行萃取，true为萃取。主要用在首页，点击地图跳转至区域监控页面而不进行萃取
							return false;
						}
						if(d3.event.detail==1){
							var bool = 1;
							var clock_num = this_.container.select("#dest_city").attr("data_name");

							bool = clockClick(bool,clock_num);
							if(bool){
								tooltip.remove();
								var dest_city = this_.container.select("#dest_city").text();
								var province_id = "",map_num = "";

								this_.initDataOption.province_info.child_name = d.properties.name;
								this_.initDataOption.province_info.child_id = d.id;

								if(flag == 0){//1级地图点击进入2级地图
									this_.initDataOption.province_info.parent_name = '全國地图';
									this_.tranformMark(true);
									province_id = d.id;
									map_num = 1;
								}else if(flag == 1){//二级地图点击进入三级地图
									this_.initDataOption.province_info.parent_name = dest_city;
									this_.tranformMark(false);
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

								this_.initDataOption.map_level = map_num;
								this_.initDataOption.province_name = province_id;

								this_.container.select(".mapSvg").interrupt().transition().duration(1000).attr('transform', 'scale(2)').each('start',function(){
									this_.container.selectAll('.map').classed('unclick',true);
								}).each('end',function(){
									this_.container.select(".mapSvg").interrupt().transition().duration(0).attr('transform', 'scale(1)');
									this_.container.select(".mapSvg").selectAll("g").selectAll("path").remove();
									this_.drawPrepare();
									this_.container.selectAll('.map').classed('unclick',false);
								});
							}
						}
					});
			}

			if(flag == 0){
				this_.container.selectAll(".return-mark-g,.svf-back").classed("unclick",true);
			}else{
				this_.container.selectAll(".return-mark-g,.svf-back")
					.classed("unclick",false)
					.on('click',function(d){//返回上一级地图的点击事件
						this_.container.select(".mapSvg").interrupt().transition().duration(0).attr('transform', 'scale(1)');
						var province_id = "";
						if(flag == 1){ // 如果是二级地图，点击转回全国地图
							province_id = this_.container.select("#dest_city").attr("data_name");
							this_.returnFun(true,province_id);
							this_.initDataOption.map_level = 0;
							this_.initDataOption.province_name = '';

							this_.drawPrepare();
						}else{ // 如果是三级地图，点击转回二级地图
							province_id = this_.container.select("#sour_city").attr("data_name");
							this_.returnFun(false,province_id);

							this_.initDataOption.map_level = 1;
							this_.initDataOption.province_name = province_id;

							this_.drawPrepare();
						}
						if(tooltip){
							tooltip.remove()
						}
					});
			}
		},

		/**
		 * 画地图函数
		 * flag -- 参数，当为0时，画全国地图；为1时，画省级地图；为2时，画市级地图
		 * @param province_name -- 需要画出的省的名字，如“北京”,"四川"等，如果为空，则画全国地图
		 */
		drawPrepare : function (){
			var this_ = this;
			var province_name = this_.initDataOption.province_name;
			var province_e = conversion(province_name);
			//立体地图的背景层
			if(this_.container.select('.map_back3').empty()){
				this_.container.select(".mapSvg").append("g").attr({'transform':'translate(5,10)'}).attr('class','map_back1');
				this_.container.select(".mapSvg").append('g').attr('class','map_back2');
				this_.container.select(".mapSvg").append('g').attr('class','map_back3');
			}
			this_.container.select('.map_truth').remove();
			var g = this_.container.select(".mapSvg").append('g').attr('class','map_truth');

			var projection,path,url;
			var url_default1 = 'http://onirzhj5y.bkt.clouddn.com/';
			var url_default2 = 'http://oo1a66tov.bkt.clouddn.com/';

			switch (this_.initDataOption.map_level){
				case 0:{
					projection = d3.geo.mercator()
						.center([110,41])
						.scale(720);
					url = '../static/mapjsons/map.json';
				}
					break;
				case 1:{
					var coordinates = centerbox(province_name);
					var scale = scalebox(province_name);
					projection = d3.geo.mercator()
						.center(coordinates)
						.scale(scale);
					url = '../static/mapjsons/mapjson/' + province_e +'.json';
				}
					break;
				case 2:{
					var proboxObj = probox(province_name);
					var coordinates = proboxObj.coordinates,
						scale = proboxObj.scale;
					projection = d3.geo.mercator()
						.center(coordinates)
						.scale(scale);
					var province_name2 = province_name.length > 4 ? province_name : province_name + '00';
					url = '../static/mapjsons/geoJson/' + province_name2 +'.json';
				}
					break;
			}
			path = d3.geo.path()
				.projection(projection);

			d3.json(url,function (e, d) {
				if(!e) {
					this_.drawMapPath(path,d,projection);
				}
			});
			this_.projection = projection;
		},

		/**
		 * 数据对接方法
		 * @param container
		 * @param projection
		 */
		getData : function(){
			var this_ = this,
				projection = this_.projection,
				app_name = '' ,intf_name = '',
				earliest = "",trans_type = '',
				app_menu_list = d3.select('#apps-list-div').select('.selecting'),
				selected_app = d3.select('#selected-app-div').selectAll('.selected');
			selected_app[0] && selected_app[0].forEach(function(ele_value,ele_index){
				var data_name = ele_value.getAttribute('data-app-name');
				if(data_name.indexOf('app') > -1){
					app_name = data_name;
				}else if(data_name.indexOf('intf' > -1)){
					intf_name = data_name;
				}
			});

			trans_type = app_menu_list[0][0] && app_menu_list.attr('data-trans-text') || '';

			/**设置earliest的值**/
			earliest = getRefreshTime();
			d3.json('http://onirzhj5y.bkt.clouddn.com/map_data.json')
				.header("Content-Type", "application/x-www-form-urlencoded")
				.get('', function (e, d) {
					if(!e) {
						var data = d;
						if(data.ll_data.length == 0){
							drawNoData(this_.container);//显示“暂无数据的框”
							this_.container.selectAll('.blingblingG').remove();
							this_.container.selectAll('.line-svg').remove();

							this_.initDataOption.map_level == 0 && this_.container.select(".nanhai-div").attr({
								"xlink:href":"../static/img/nanhai_no_data.svg"
							});
						}else{
							this_.initDataOption.map_level == 0 && this_.container.select(".nanhai-div").attr({
								"xlink:href":"../static/img/nanhai.svg"
							});

							if(!(this_.container.select(".no_data_div").empty())){
								this_.container.select(".no_data_div").remove();
							}

							var data_arr = data.ll_data;
							for(var i = data_arr.length - 1; i >= 0; i--){//过滤掉没有经纬度的数据。
								if((data_arr[i].s["latitude"] == -1 && data_arr[i].s["longitude"] == -1) || (data_arr[i].d["latitude"] == -1 && data_arr[i].d["longitude"] == -1)){
									data_arr.splice(i, 1);
								}
							}
							data.ll_data = data_arr;
							//画点
							this_.drawCircle(data);
							//画出连线 本地存储的数据状态，如果是1就画出线，否则不画出
							this_.drawLine(data);
						}
					}
				});
		},

		/**
		 * 点击一级或者二级地图时，左上角的标题变化
		 * @param propertyName -- 标题右边的城市名字
		 * @param flag -- 是否是一级地图，当为true时则是一级地图，否则是二级地图
		 */
		tranformMark : function (flag){
			var this_ = this;
			var propertyName = this_.initDataOption.province_info.child_name,
				propertyId = this_.initDataOption.province_info.child_id,
				dest_city_t = this_.initDataOption.province_info.parent_name,
				dest_id = this_.initDataOption.province_info.parent_id;

			this_.container.select(".return-mark-g .cursor-path")
				.classed('switch-map-path',true);

			this_.container.select('.return-mark-g')
				.classed('switch-map-g',true);

			this_.container.select(".svf-back")
				.classed('switch-map-back',true);
			this_.container.select(".nanhai-div").style("display","none");

			this_.container.select(".mapSvg").attr({"transform":'translate(0,0)'});
			if(flag){
				this_.container.select("#dest_city")
					.attr("data_name",propertyId)
					.html(propertyName);
			}else{
				var sour_id = this_.container.select("#dest_city").attr("data_name")|| dest_id;
				this_.container.select("#sour_city")
					.attr("data_name",sour_id)
					.html(dest_city_t);

				this_.container.select("#dest_city")
					.attr("data_name",propertyId)
					.html(propertyName);
			}
		},

		/**
		 * 还原地图按钮的函数
		 * @param flag -- 如果为ture，则是二级地图，否则是三级地图的点击事件
		 */
		returnFun : function (flag){
			var this_ = this;
			this_.container.select(".mapSvg").attr({"transform":'translate(0,0)'});
			if(flag){

				this_.container.select(".return-mark-g .cursor-path")
					.classed('switch-map-path',false);

				this_.container.select('.return-mark-g')
					.classed('switch-map-g',false);

				this_.container.select(".svf-back")
					.classed('switch-map-back',false);

				this_.container.select("#dest_city")
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

				this_.container.select(".nanhai-div").style("display","inline-block");
			}else{

				this_.container.select(".nanhai-div").style("display","none");

				var sour_id = this_.container.select("#sour_city").attr("data_name");
				var sour_city_t = this_.container.select("#sour_city").text();

				setLocalStorage("map_level",JSON.stringify(1));
				var province_info = {
					child_id : sour_id,
					child_name : sour_city_t,
					parent_id : "",
					parent_name : "全国地图"
				};
				setLocalStorage("province_info",JSON.stringify(province_info));

				this_.container.select("#sour_city")
					.attr("data_name","")
					.html("全国地图");

				this_.container.select("#dest_city")
					.attr("data_name",sour_id)
					.html(sour_city_t);
			}
		},

		/**
		 * 画点函数
		 * @param container -- 包含点的父容器
		 * @param data -- 数据
		 * @param projection --
		 */
		drawCircle : function (data){
			var this_ = this,
				this_id = this_.container[0][0].id,
				projection = this_.projection,
				mapLevel = this_.initDataOption.map_level;

			this_.container.selectAll('.blingblingG').remove();
			if(mapLevel == 0){//一级地图提取data.mapcount的数据，并把数据转换成data.ll_data的格式
				var mapCountArr = manageData(data.mapcount);
			}
			var city_all_count = data.mapcount,
				each_data = mapLevel != 0 ? data.ll_data : mapCountArr,
				circle_g = this_.container.select(".mapSvg")
					.append('g')
					.attr("class","blingblingG");

			/**目标地址交易量的点**/
			each_data.forEach(function(value,key){
				var	circle_d_old = this_.container.select('.destPointer.' + this_id + conversion(value.d.c)),
					destpos = projection([Number(value.d.longitude),Number(value.d.latitude)]);

				if(circle_d_old.empty()){//规避产生相同位置的目标节点
					var dest_circle = circle_g.append('circle')
						.attr({
							'class':function(){
								var circle_id = this_id + conversion(value.d.c);
								return 'blingbling destPointer ' + circle_id;
							},
							'filter':"url(#"+this_id+"_circle_f)",
							'r':1.5,
							'all_data' : function(){
								var city_count = '';
								city_all_count.forEach(function(city_value,i){
									if(value.d.c.indexOf(city_value.d.c) > -1){
										city_count = city_value.trans_count;
									}
								});
								return city_count + '_' + value.d.c;
							},
							'cx' : destpos[0],
							'cy' : destpos[1]
						})
						.style({
							'transform-origin': destpos[0] +'px ' + destpos[1] + 'px',
							'-moz-transform-origin':destpos[0] +'px ' + destpos[1] + 'px',
							'-ms-transform-origin':destpos[0] +'px ' + destpos[1] + 'px'
						});
					var all_data = dest_circle.attr('all_data').split('_')[0];//取得每个数据点的数据总和
					dest_circle.classed({
						'circle-least' :  !! (all_data <= 500) ,
						'circle-middle' : !! (all_data < 2000 && all_data > 500),
						'circle-large' : !! (all_data >= 2000)
					})
				}
			});
			/**源地址圆点**/
			each_data.forEach(function(value,key){
				var circle_s_old = this_.container.select('.' + this_id + conversion(value.s.c)),//选择到已经在该位置画过的源节点
					sourpos = projection([Number(value.s.longitude),Number(value.s.latitude)]);

				if(circle_s_old.empty()){
					var sour_circle = circle_g.append('circle')
						.attr({
							'class': function(){
								var circle_id = this_id + conversion(value.s.c);
								return 'blingbling sourPointer ' + circle_id;
							},
							'filter':"url(#"+this_id+"_circle_f)",
							'all_data' : function(){
								var city_count = '';
								city_all_count.forEach(function(city_value,i){
									if(value.s.c.indexOf(city_value.d.c) > -1){
										city_count = city_value.trans_count;
									}
								});
								return city_count + '_' + value.s.c;
							},
							'r':1.5,
							'cx' : sourpos[0],
							'cy' : sourpos[1]
						})
						.style({
							'transform-origin':sourpos[0] +'px ' + sourpos[1] + 'px',
							'-moz-transform-origin':sourpos[0] +'px ' + sourpos[1] + 'px',
							'-ms-transform-origin':sourpos[0] +'px ' + sourpos[1] + 'px',
							'display' : JSON.parse(localStorage.getItem("map_line")) ? 'inline-block' : 'none'
						});
					var all_data = sour_circle.attr('all_data').split('_')[0];//取得每个数据点的数据总和
					sour_circle.classed({
						'circle-least' : !! (all_data <= 500),
						'circle-middle' : !! (all_data < 2000 && all_data > 500),
						'circle-large' : !! (all_data >= 2000),
					})
				}
			});

			/**地图数据点的动效函数**/
			this_.container.selectAll(".blingbling")
				.on('mouseout',function(d,i){
					this_.container.select(".tootip-style").style("opacity",0.0);
				})
				.on("mousemove",function(d){
					var city_info = d3.select(this).attr("all_data").split('_');
					/** 鼠标移动时，更改样式 left 和 top 来改变提示框的位置 **/
					var map_div_left = this_.container.select(".cenmap")[0][0].getBoundingClientRect().left;
					var map_div_top = this_.container.select(".cenmap")[0][0].getBoundingClientRect().top;
					var mouse_left = parseInt(d3.event.pageX);
					var mouse_top = parseInt(d3.event.pageY);

					this_.container.select(".tootip-style").html(city_info[1] + "交易量：" + (city_info[0] ? city_info[0] : 0))
						.style("left", (mouse_left -  map_div_left) + 20 + "px")
						.style("top", (mouse_top - map_div_top) + 20 + "px")
						.style("opacity",0.6);
				})
		},

		/**
		 * 根据数据画出连线
		 * @param container -- 连线节点的父容器
		 * @param data -- 后台返回的数据
		 * @param projection -- 方法
		 */
		drawLine : function (data){
			var this_ = this,
				projection = this_.projection,
				mapLevel = this_.initDataOption.map_level,
				this_id = this_.container[0][0].id;
			this_.container.selectAll('.line-svg').remove();
			if(mapLevel == 0){
				var mapCountArr = manageData(data.mapcount);
			}
			var line_g = this_.container.select(".mapSvg").selectAll('.line-svg')
				.data(function(){
					return  mapLevel != 0 ? data.ll_data : mapCountArr;
				})
				.enter()
				.append("g")
				.attr("class","line-svg");

			/**生成用于观看的连线**/
			line_g.append("path")
				.attr({
					"class":"circle-line",
					"stroke-width":"2",
					"fill":"none",
					"stroke":"rgba(139,164,172, 0.2)",
					"d":function(d){
						var tempdest = { 'cp':[Number(d.d.longitude),Number(d.d.latitude)]};
						var tempsour = { 'cp':[Number(d.s.longitude),Number(d.s.latitude)]};
						var destPos = projection(tempdest.cp);
						var sourPos = projection(tempsour.cp);
						if(destPos.toString() != sourPos.toString()){
							var conPointPos = getConPointPos(sourPos,destPos);
							return "M " + sourPos + " Q " + conPointPos.pos + " " + destPos;
						}else{
							return "M 0,0 Q 0,0 0,0";
						}
					}
				});

			/**生成用于操作的连线**/
			line_g.append("path")
				.attr({
					"class":"circle-line-bg",
					"stroke":"rgba(0,0,0,0)",
					"filter":"url('#"+this_id+"_filter')",
					"stroke-width":"5",
					"fill":"none",
					"id":function(d,i){
						return this_id + "_motion"+i;
					},
					"d":function(d){
						var tempdest = { 'cp':[Number(d.d.longitude),Number(d.d.latitude)]};
						var tempsour = { 'cp':[Number(d.s.longitude),Number(d.s.latitude)]};

						var destPos = projection(tempdest.cp);
						var sourPos = projection(tempsour.cp);
						if(destPos.toString() != sourPos.toString()){
							var conPointPos = getConPointPos(sourPos,destPos);
							return "M " + sourPos + " Q " + conPointPos.pos + " " + destPos;
						}else{
							return "M 0,0 Q 0,0 0,0";
						}
					}
				});

			/**生成动效，“彗星尾巴”**/
			var comet_tail = line_g.append("g")
				.attr({"clip-path":function(d,i){
					return "url(#"+ this_id +"_clip"+i+")";
				}
				});
			var comet_path = comet_tail.append("path")
				.attr({
					"d":"M 0,0 Q 15,2 17,0 Q 15,-2 0,0",
					"stroke-width":"1px",
					"stroke":"url(#"+ this_id +"_gradient)",
					"fill":"url(#"+ this_id +"_gradient)",
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
						return "#" + this_id + "_motion" + i;
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
					return this_id + "_clip"+i;
				}})
				.append("rect")
				.attr({
					"x":function(d,i){
						return this_.container.select("#"+ this_id +"_motion"+i)[0][0].getBBox().x;
					},
					"y":function(d,i){
						return this_.container.select("#"+ this_id +"_motion"+i)[0][0].getBBox().y;
					},
					"width":function(d,i){
						return this_.container.select("#"+ this_id +"_motion"+i)[0][0].getBBox().width;
					},
					"height":function(d,i){
						return this_.container.select("#"+ this_id +"_motion"+i)[0][0].getBBox().height;
					}
				});

			this_.container.selectAll(".circle-line-bg")
				.on('mouseout',function(d,i){
					this_.container.select(".tootip-style").style("opacity",0.0);
					/*鼠标移出时，改变连线的样式*/
					d3.select(this)
						.attr("stroke","rgba(0,0,0,0)");
					d3.select(d3.select(this)[0][0].parentNode).select(".circle-line")
						.attr("stroke-width","2");
				})
				.on("mousemove",function(d){
					/** 鼠标移动时，更改样式 left 和 top 来改变提示框的位置 */
					var map_div_left = this_.container.select(".cenmap")[0][0].getBoundingClientRect().left;
					var map_div_top = this_.container.select(".cenmap")[0][0].getBoundingClientRect().top;
					var mouse_left = parseInt(d3.event.pageX);
					var mouse_top = parseInt(d3.event.pageY);

					this_.container.select(".tootip-style").html(d.s.c+'->'+d.d.c +"<br>"+"交易量" + d.trans_count)
						.style("left", (mouse_left -  map_div_left) + 20 + "px")
						.style("top", (mouse_top - map_div_top) + 20 + "px")
						.style("opacity",0.6);

					/** 鼠标移动到线上时改变其样式 */
					if((!d3.select('#app_name').empty()) && (!d3.select('#intf_name').empty()) && mapLevel != 0){
						d3.select(this)
							.attr("stroke","rgba(71, 144, 95, .65)");
						d3.select(d3.select(this)[0][0].parentNode).select(".circle-line")
							.attr("stroke-width","5");
					}
				})
				.on('click',function(d){
					if((!d3.select('#app_name').empty()) && (!d3.select('#intf_name').empty()) && mapLevel != 0){

						var stat_app_name = d3.select("#app_name").attr("name");
						var stat_intf_name = d3.select("#intf_name").attr("name");
						var statUrl = '/' + LANGUAGE_CODE + '/transtrack/' + stat_app_name  + '/' + stat_intf_name + '/?ip_src=' + d.s.ip + '&ip_dst=' + d.d.ip;
						var ts_end = getRefreshTime();
						if(ts_end != ''){
							statUrl += '&ts_start=' + (parseInt(ts_end) - 60) + '&ts_end=' + ts_end;
						}
						setLocalStorage('statUrl',statUrl);
						setLocalStorage('is_change_intf','not');
						window.location.href = '/' + LANGUAGE_CODE + '/stat/' + stat_app_name + '/cap/' + stat_intf_name +'/';
					}
				});

			var map_line = JSON.parse(localStorage.getItem("map_line"));//获取本地存储的数据
			//画出连线 本地存储的数据状态，如果是1就画出线，否则不画出
			if(map_line){
				this_.container.selectAll(".circle-line-bg,.circle-line")
					.style("display","inline-block");
				this_.container.selectAll(".comets")
					.style("display","inline-block");
				this_.container.select(".javafile-on").text("");
				this_.container.select(".javafile-off").text("关");
			}else{
				this_.container.selectAll(".circle-line-bg,.circle-line")
					.style("display","none");
				this_.container.selectAll(".comets")
					.style("display","none");
				this_.container.select(".javafile-off").text("");
				this_.container.select(".javafile-on").text("开");
			}

			mapLineSwitch(this_.container);
		}
	};

	return MapMainFun;

	/**
	 * 画出地图hover上去的提示框
	 */
	function drawBack(con){
		var tooltip = con.select('.cenmap')
			.append("div")
			.classed("tootip-style",true);
		return tooltip;
	}

	/**
	 * 创建地图左上角的标题
	 * @param parent
	 */
	function create_return_svg(parent){
		if(!parent.select(".map-return-btn").empty()){
			parent.select(".map-return-btn").remove();
		}
		var returnSvgDiv = parent.append('div').attr({});
		returnSvgDiv.append('span').attr({'id':'sour_city'}).text("全国地图");
		var return_svg = returnSvgDiv.append('svg')
			.attr('class','map-return-btn')
			.attr("viewBox",'10 0 25 25');

		return_svg.append("g").attr({'class':'svf-back','opacity':0}).append('path')//背景
			.attr({"fill":"rgb(23, 38, 51)",
				"d":"M11.000,-0.000 C11.000,-0.000 37.000,-0.000 37.000,-0.000 C43.075,-0.000 48.000,4.925 48.000,11.000 C48.000,11.000 48.000,11.000 48.000,11.000 C48.000,17.075 43.075,22.000 37.000,22.000 C37.000,22.000 11.000,22.000 11.000,22.000 C4.925,22.000 -0.000,17.075 -0.000,11.000 C-0.000,11.000 -0.000,11.000 -0.000,11.000 C-0.000,4.925 4.925,-0.000 11.000,-0.000 Z"});

		var return_svg_g2 = return_svg.append("g").attr({transform :"translate(0,0)",'class':'return-mark-g'});//灰色
		return_svg_g2.append('path')
			.attr("fill",'rgb(183, 189, 199)')
			.attr('class','cursor-path')
			.attr("d","M11.000,-0.000 C11.000,-0.000 11.000,-0.000 11.000,-0.000 C17.075,-0.000 22.000,4.925 22.000,11.000 C22.000,11.000 22.000,11.000 22.000,11.000 C22.000,17.075 17.075,22.000 11.000,22.000 C11.000,22.000 11.000,22.000 11.000,22.000 C4.925,22.000 -0.000,17.075 -0.000,11.000 C-0.000,11.000 -0.000,11.000 -0.000,11.000 C-0.000,4.925 4.925,-0.000 11.000,-0.000 Z");
		return_svg_g2.append('path').attr({'fill':'rgb(2, 13, 22)','d':"M11.500,19.454 C11.500,19.454 5.818,12.292 5.818,9.180 C5.818,6.068 8.362,3.545 11.500,3.545 C14.638,3.545 17.181,6.068 17.181,9.180 C17.181,12.292 11.500,19.454 11.500,19.454 ZM11.500,5.313 C9.346,5.313 7.600,7.044 7.600,9.180 C7.600,11.315 9.346,13.047 11.500,13.047 C13.653,13.047 15.399,11.315 15.399,9.180 C15.399,7.044 13.653,5.313 11.500,5.313 ZM11.500,11.942 C9.961,11.942 8.714,10.705 8.714,9.180 C8.714,7.654 9.961,6.418 11.500,6.418 C13.038,6.418 14.285,7.654 14.285,9.180 C14.285,10.705 13.038,11.942 11.500,11.942 Z"});

		returnSvgDiv.append('span')
			.attr({'id':'dest_city'});
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
		mapLineSwitch(open_span)
	}

	/**
	 * 当没有数据的时候，画出“暂无数据”的提示框
	 */
	function drawNoData(parent){
		if(!(parent.select(".no_data_div").empty())){
			parent.select(".no_data_div").style({
				"display":"inline-block"
			});
		}else{
			parent.select(".cenmap")
				.append("div")
				.attr({"class":"no_data_div"})
				.text("暂无数据！");
		}
		parent.selectAll(".map").classed("no_data",true);
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
	 * 数据处理方法
	 */
	function manageData(data){
		var mapCountArr = [];
		data.forEach(function(value,i){
			var transD = {
				c:value.d.c,
				latitude:value.d.latitude,
				longitude:value.d.longitude
			};
			var sourceData = value.s;
			for(var sourCity in sourceData){
				var transS = {
					c:sourCity,
					latitude:sourceData[sourCity].latitude,
					longitude:sourceData[sourCity].longitude
				};
				var mapCountObj = {
					trans_count:sourceData[sourCity].trans_count,
					d:transD,
					s:transS
				};
				mapCountArr.push(mapCountObj)
			}
		});
		return mapCountArr;
	}

	/**
	 * 画线函数
	 * @param sourPos -- 线的起点坐标
	 * @param destPos -- 线的终点坐标
	 * @returns {{pos: *[], linear_dire: string}} -- 返回的对象，其中包括控制点的坐标，和线上动画的移动方向
	 */
	function getConPointPos(sourPos,destPos){

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

			argtan2 = Math.abs(argtan - Math.PI / 6);

			conPointX = destPos[0] + dis1ToConPoint * Math.cos(argtan2);

			if(argtan >= (Math.PI / 6)){
				conPointY = destPos[1] + dis1ToConPoint * Math.sin(argtan2);
			}else{
				conPointY = destPos[1] - dis1ToConPoint * Math.sin(argtan2);
			}

		}else if(sourPos[0] < destPos[0] && sourPos[1] >= destPos[1]){
			argtan2 = Math.abs(argtan - Math.PI / 6);

			conPointX = destPos[0] - dis1ToConPoint * Math.cos(argtan2);

			if(argtan >= (Math.PI / 6)){
				conPointY = destPos[1] + dis1ToConPoint * Math.sin(argtan2);
			}else{
				conPointY = destPos[1] - dis1ToConPoint * Math.sin(argtan2);
			}

		}else if(sourPos[0] < destPos[0] && sourPos[1] < destPos[1]){
			argtan2 = argtan + Math.PI / 6;

			conPointX = sourPos[0] + dis1ToConPoint * Math.cos(argtan2);
			conPointY = sourPos[1] + dis1ToConPoint * Math.sin(argtan2);

		}else if(sourPos[0] >= destPos[0] && sourPos[1] < destPos[1]){
			argtan2 = argtan + Math.PI / 6;

			conPointX = sourPos[0] - dis1ToConPoint * Math.cos(argtan2);
			conPointY = sourPos[1] + dis1ToConPoint * Math.sin(argtan2);
		}

		return pathAttr = {
			pos:[conPointX,conPointY]
		} ;

	}

	/**
	 * 点击滑块时的动画函数。
	 */
	function mapLineSwitch(parent){
		if(!parent.select(".javafile-on").empty() && parent.select(".javafile-on").text()){
			parent.select(".javafile-a")
				.interrupt()
				.transition()
				.style({
					"left": "-26px"
				})
				.duration(800)
				.each('start',function(){
					parent.select(".javafile-off").text("关");
				})
				.each('end',function(){
					parent.select(".javafile-on").text("");
					parent.select(".javafile-span").attr("name","off");
				});
			d3.selectAll('.blingbling').classed('stop-animate',false);
			return 0;
		}else{
			parent.select(".javafile-a")
				.interrupt()
				.transition()
				.style({
					"left":"0px"
				})
				.duration(800)
				.each('start',function(){
					parent.select(".javafile-on").text("开");
				}).each('end',function(){
					parent.select(".javafile-off").text("");
					parent.select(".javafile-span").attr("name","on");
				});
			d3.selectAll('.blingbling').classed('stop-animate',true);
			return 1;
		}
	}

	/**
	 * 保存LocalStorage
	 * @param key
	 * @param value
	 */
	function setLocalStorage(key,value) {
		try {
			localStorage.setItem(key, value);
		} catch (e) {
			var storage_len = localStorage.length;
			for(var i=0;i<(storage_len*2/3);i++){
				localStorage.removeItem(localStorage.key(0));
			}
		}
	}

	/*****************省级地图的定位**********************/
	function centerbox(id){
		var coordinates = [];
		if(id=='he_bei' || id == '河北'){
			coordinates[0]=116.23;
			coordinates[1]=39.74;
		}
		if(id=='qing_hai' || id == '青海'){
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
		if(id == 'ao_men' || id == '澳门'){
			coordinates[0] = 113.55475;
			coordinates[1] = 22.2001;
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
			province_e = "he_bei";
		}
		if(id == '青海'){
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
		if(id == '澳门'){
			province_e = "ao_men";
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

	function probox(id){
		var id2 = id.slice(0,4);
		var infoObj = '';
		if(id2 >4100 &&id2<4200 ){
			infoObj = he_nanbox(id);
		}
		if(id2 >5100 &&id2<5200 ){
			infoObj = si_chuanbox(id);
		}
		if(id2 >2200 &&id2<2300){
			infoObj = ji_linbox(id);
		}
		if(id2 >1300 &&id2<1400){
			infoObj = he_beibox(id);
		}
		if(id2 >1400 &&id2<1500){
			infoObj = shan_xi_2box(id);
		}
		if(id2 >1500 &&id2<1600){
			infoObj = nei_meng_gubox(id);
		}
		if(id2 >2100 &&id2<2200){
			infoObj = liao_ningbox(id);
		}
		if(id2 >2300 &&id2<2400){
			infoObj = hei_long_jiangbox(id);
		}
		if(id2 >3200 &&id2<3300){
			infoObj = jiang_subox(id);
		}
		if(id2 >3300 &&id2<3400){
			infoObj = zhe_jiangbox(id);
		}
		if(id2 >3400 &&id2<3500){
			infoObj = an_huibox(id);
		}
		if(id2 >3500 &&id2<3600){
			infoObj = fu_jianbox(id);
		}
		if(id2 >3600 &&id2<3700){
			infoObj = jiang_xibox(id);
		}
		if(id2 >3700 &&id2<3800){
			infoObj = shan_dongbox(id);
		}
		if(id2 >4200 &&id2<4300){
			infoObj = hu_beibox(id);
		}
		if(id2 >4300 &&id2<4400){
			infoObj = hu_nanbox(id);
		}
		if(id2 >4400 &&id2<4500){
			infoObj = guang_dongbox(id);
		}
		if(id2 >4500 &&id2<4600){
			infoObj = guang_xibox(id);
		}
		if(id2 >4600 &&id2<4700){
			infoObj = hai_nanbox(id);
		}
		if(id2 >5200 &&id2<5300){
			infoObj = gui_zhoubox(id);
		}
		if(id2 >5300 &&id2<5400){
			infoObj = yun_nanbox(id);
		}
		if(id2 >5400 &&id2<5500){
			infoObj = xi_zangbox(id);
		}
		if(id2 >6100 &&id2<6200){
			infoObj = shan_xi_1box(id);
		}
		if(id2>6400  &&id2<6500){
			infoObj = ning_xiabox(id);
		}
		if(id2 >6200 &&id2<6300){
			infoObj = gan_subox(id);
		}
		if(id2 >6300 &&id2<6400){
			infoObj = qing_haibox(id);
		}
		if(id2 >6500 &&id2<6600){
			infoObj = xin_jiangbox(id);
		}
		return infoObj;
	}
	function an_huibox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 3401){
			infoObj.coordinates[0]=119.16;
			infoObj.coordinates[1]=31.22;
			infoObj.scale=8000;
		}
		if(id == 3402){
			infoObj.coordinates[0]=119.46;
			infoObj.coordinates[1]=30.82;
			infoObj.scale=12000;
		}
		if(id == 3403){
			infoObj.coordinates[0]=118.76;
			infoObj.coordinates[1]=32.82;
			infoObj.scale=12000;
		}
		if(id == 3404){
			infoObj.coordinates[0]=117.66;
			infoObj.coordinates[1]=32.55;
			infoObj.scale=15000;
		}
		if(id == 3405){
			infoObj.coordinates[0]=119.46;
			infoObj.coordinates[1]=31.42;
			infoObj.scale=14000;
		}
		if(id == 3406){
			infoObj.coordinates[0]=117.950;
			infoObj.coordinates[1]=31.40;
			infoObj.scale=13000;
		}
		if(id == 3407){
			infoObj.coordinates[0]=118.56;
			infoObj.coordinates[1]=30.82;
			infoObj.scale=30000;
		}
		if(id == 3408){
			infoObj.coordinates[0]=118.96;
			infoObj.coordinates[1]=30.02;
			infoObj.scale=8000;
		}
		if(id == 3410){
			infoObj.coordinates[0]=119.86;
			infoObj.coordinates[1]=29.40;
			infoObj.scale=9000;
		}
		if(id == 3411){
			infoObj.coordinates[0]=119.96;
			infoObj.coordinates[1]=32.10;
			infoObj.scale=9000;
		}
		if(id == 3412){
			infoObj.coordinates[0]=117.46;
			infoObj.coordinates[1]=32.60;
			infoObj.scale=9000;
		}
		if(id == 3413){
			infoObj.coordinates[0]=119.36;
			infoObj.coordinates[1]=33.40;
			infoObj.scale=7500;
		}
		if(id == 3414){
			infoObj.coordinates[0]=119.46;
			infoObj.coordinates[1]=30.70;
			infoObj.scale=9000;
			//巢湖暂时没有JSON文件，已撤市
		}
		if(id == 3415){
			infoObj.coordinates[0]=118.66;
			infoObj.coordinates[1]=31.20;
			infoObj.scale=7500;
		}
		if(id == 3416){
			infoObj.coordinates[0]=117.950;
			infoObj.coordinates[1]=32.90;
			infoObj.scale=9000;
		}
		if(id == 3417){
			infoObj.coordinates[0]=118.96;
			infoObj.coordinates[1]=29.60;
			infoObj.scale=9000;
		}
		if(id == 3418){
			infoObj.coordinates[0]=120.50;
			infoObj.coordinates[1]=30.20;
			infoObj.scale=9000;
		}
		return infoObj;
	}
	function fu_jianbox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 3501){
			infoObj.coordinates[0]=120.96;
			infoObj.coordinates[1]=25.38;
			infoObj.scale=9000;
		}
		if(id == 3502){
			infoObj.coordinates[0]=118.89;
			infoObj.coordinates[1]=24.42;
			infoObj.scale=20000;
		}
		if(id == 3503){
			infoObj.coordinates[0]=119.96;
			infoObj.coordinates[1]=25.08;
			infoObj.scale=15000;
		}
		if(id == 3504){
			infoObj.coordinates[0]=119.66;
			infoObj.coordinates[1]=25.75;
			infoObj.scale=7500;
		}
		if(id == 3505){
			infoObj.coordinates[0]=120.16;
			infoObj.coordinates[1]=24.82;
			infoObj.scale=9000;
		}
		if(id == 3506){
			infoObj.coordinates[0]=119.20;
			infoObj.coordinates[1]=23.82;
			infoObj.scale=9000;
		}
		if(id == 3507){
			infoObj.coordinates[0]=120.56;
			infoObj.coordinates[1]=26.62;
			infoObj.scale=6500;
		}
		if(id == 3508){
			infoObj.coordinates[0]=118.96;
			infoObj.coordinates[1]=24.62;
			infoObj.scale=7500;
		}
		if(id == 3509){
			infoObj.coordinates[0]=121.66;
			infoObj.coordinates[1]=26.40;
			infoObj.scale=8000;
		}
		return infoObj;
	}
	function guang_xibox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 4501){//nanning
			infoObj.coordinates[0]=110.75;
			infoObj.coordinates[1]=22.21;
			infoObj.scale=7000;
		}
		if(id == 4502){//liuzhou
			infoObj.coordinates[0]=111.56;
			infoObj.coordinates[1]=24.250;
			infoObj.scale=7000;
		}
		if(id == 4503){//guilin
			infoObj.coordinates[0]=112.66;
			infoObj.coordinates[1]=24.50;
			infoObj.scale=7000;
		}
		if(id == 4504){//wuzhou
			infoObj.coordinates[0]=113.26;
			infoObj.coordinates[1]=22.75;
			infoObj.scale=7000;
		}
		if(id == 4505){//beihai
			infoObj.coordinates[0]=110.60;
			infoObj.coordinates[1]=21.00;
			infoObj.scale=12000;
		}
		if(id == 4506){//fangchenggang
			infoObj.coordinates[0]=109.35;
			infoObj.coordinates[1]=21.4575;
			infoObj.scale=12000;
		}
		if(id == 4507){//qinzhou
			infoObj.coordinates[0]=110.75;
			infoObj.coordinates[1]=21.6075;
			infoObj.scale=9000;
		}
		if(id == 4508){//guigang
			infoObj.coordinates[0]=111.75;
			infoObj.coordinates[1]=22.8075;
			infoObj.scale=9000;
		}
		if(id == 4509){//yulin
			infoObj.coordinates[0]=111.90;
			infoObj.coordinates[1]=21.8075;
			infoObj.scale=9000;
		}
		if(id == 4510){//baise
			infoObj.coordinates[0]=108.95;
			infoObj.coordinates[1]=23.2875;
			infoObj.scale=5500;
		}
		if(id == 4511){//hezhou
			infoObj.coordinates[0]=113.35;
			infoObj.coordinates[1]=23.80;
			infoObj.scale=9000;
		}
		if(id == 4512){//hechi
			infoObj.coordinates[0]=110.20;
			infoObj.coordinates[1]=23.75;
			infoObj.scale=6000;
		}
		if(id == 4513){//laibin
			infoObj.coordinates[0]=112.72;
			infoObj.coordinates[1]=23.60;
			infoObj.scale=9000;
		}
		if(id == 4514){//崇左
			infoObj.coordinates[0]=109.27;
			infoObj.coordinates[1]=21.7875;
			infoObj.scale=7500;
		}
		return infoObj;
	}
	function he_beibox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 1301){
			infoObj.coordinates[0]=116.16;
			infoObj.coordinates[1]=37.62;
			infoObj.scale=9000;
		}
		if(id == 1302){
			infoObj.coordinates[0]=120.36;
			infoObj.coordinates[1]=39.19;
			infoObj.scale=8000;
		}
		if(id == 1303){
			infoObj.coordinates[0]=120.96;
			infoObj.coordinates[1]=39.62;
			infoObj.scale=9000;
		}
		if(id == 1304){
			infoObj.coordinates[0]=116.36;
			infoObj.coordinates[1]=35.92;
			infoObj.scale=9000;
		}
		if(id == 1305){
			infoObj.coordinates[0]=116.36;
			infoObj.coordinates[1]=36.82;
			infoObj.scale=9000;
		}
		if(id == 1306){
			infoObj.coordinates[0]=117.36;
			infoObj.coordinates[1]=38.42;
			infoObj.scale=7500;
		}
		if(id == 1307){
			infoObj.coordinates[0]=118.46;
			infoObj.coordinates[1]=40.02;
			infoObj.scale=4500;
		}
		if(id == 1308){
			infoObj.coordinates[0]=120.76;
			infoObj.coordinates[1]=40.62;
			infoObj.scale=5000;
		}
		if(id == 1309){
			infoObj.coordinates[0]=118.76;
			infoObj.coordinates[1]=37.70;
			infoObj.scale=8000;
		}
		if(id == 1310){
			infoObj.coordinates[0]=118.76;
			infoObj.coordinates[1]=38.70;
			infoObj.scale=8000;
		}
		if(id == 1311){
			infoObj.coordinates[0]=117.76;
			infoObj.coordinates[1]=37.22;
			infoObj.scale=9000;
		}
		return infoObj;
	}
	function he_nanbox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 4101){
			infoObj.coordinates[0]=114.92;
			infoObj.coordinates[1]=34.14;
			infoObj.scale=12000;
		}
		if(id == 4102){
			infoObj.coordinates[0]=115.92;
			infoObj.coordinates[1]=34.14;
			infoObj.scale=12000;
		}
		if(id == 4103){
			infoObj.coordinates[0]=113.56;
			infoObj.coordinates[1]=33.82;
			infoObj.scale=9000;
		}
		if(id == 4104){
			infoObj.coordinates[0]=114.27;
			infoObj.coordinates[1]=33.35;
			infoObj.scale=12000;
		}
		if(id == 4105){
			infoObj.coordinates[0]=115.57;
			infoObj.coordinates[1]=35.4075;
			infoObj.scale=12000;
		}
		if(id == 4106){
			infoObj.coordinates[0]=115.15;
			infoObj.coordinates[1]=35.4075;
			infoObj.scale=18000;
		}
		if(id == 4107){
			infoObj.coordinates[0]=115.45;
			infoObj.coordinates[1]=34.9075;
			infoObj.scale=12000;
		}
		if(id == 4108){
			infoObj.coordinates[0]=114.05;
			infoObj.coordinates[1]=34.9075;
			infoObj.scale=18000;
		}
		if(id == 4109){
			infoObj.coordinates[0]=116.55;
			infoObj.coordinates[1]=35.4075;
			infoObj.scale=12000;
		}
		if(id == 4110){
			infoObj.coordinates[0]=114.85;
			infoObj.coordinates[1]=33.7075;
			infoObj.scale=13500;
		}
		if(id == 4111){
			infoObj.coordinates[0]=114.8;
			infoObj.coordinates[1]=33.4075;
			infoObj.scale=18000;
		}
		if(id == 4112){
			infoObj.coordinates[0]=112.60;
			infoObj.coordinates[1]=33.82;
			infoObj.scale=9000;
		}
		if(id == 4113){
			infoObj.coordinates[0]=114.47;
			infoObj.coordinates[1]=32.4075;
			infoObj.scale=7000;
		}
		if(id == 4114){
			infoObj.coordinates[0]=117.22;
			infoObj.coordinates[1]=33.84;
			infoObj.scale=10000;
		}
		if(id == 4115){
			infoObj.coordinates[0]=116.87;
			infoObj.coordinates[1]=31.5075;
			infoObj.scale=8000;
		}
		if(id == 4116){
			infoObj.coordinates[0]=116.57;
			infoObj.coordinates[1]=33.2075;
			infoObj.scale=10000;
		}
		if(id == 4117){
			infoObj.coordinates[0]=115.77;
			infoObj.coordinates[1]=32.5075;
			infoObj.scale=9000;
		}
		return infoObj;
	}
	function hei_long_jiangbox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 2301){
			infoObj.coordinates[0]=131.66;
			infoObj.coordinates[1]=44.52;
			infoObj.scale=4500;
		}
		if(id == 2302){
			infoObj.coordinates[0]=128.36;
			infoObj.coordinates[1]=46.52;
			infoObj.scale=4000;
		}
		if(id == 2303){
			infoObj.coordinates[0]=134.86;
			infoObj.coordinates[1]=45.02;
			infoObj.scale=6000;
		}
		if(id == 2304){
			infoObj.coordinates[0]=133.26;
			infoObj.coordinates[1]=47.12;
			infoObj.scale=7000;
		}
		if(id == 2305){
			infoObj.coordinates[0]=135.76;
			infoObj.coordinates[1]=45.92;
			infoObj.scale=5000;
		}
		if(id == 2306){
			infoObj.coordinates[0]=128.06;
			infoObj.coordinates[1]=45.62;
			infoObj.scale=5000;
		}
		if(id == 2307){
			infoObj.coordinates[0]=133.66;
			infoObj.coordinates[1]=46.96;
			infoObj.scale=3800;
		}
		if(id == 2308){
			infoObj.coordinates[0]=136.46;
			infoObj.coordinates[1]=46.22;
			infoObj.scale=3500;
		}
		if(id == 2309){
			infoObj.coordinates[0]=132.68;
			infoObj.coordinates[1]=45.52;
			infoObj.scale=9000;
		}
		if(id == 2310){
			infoObj.coordinates[0]=133.88;
			infoObj.coordinates[1]=43.62;
			infoObj.scale=4300;
		}
		if(id == 2311){
			infoObj.coordinates[0]=131.88;
			infoObj.coordinates[1]=48.22;
			infoObj.scale=3000;
		}
		if(id == 2312){
			infoObj.coordinates[0]=130.08;
			infoObj.coordinates[1]=45.92;
			infoObj.scale=4500;
		}
		if(id == 2327){
			infoObj.coordinates[0]=129.68;
			infoObj.coordinates[1]=50.92;
			infoObj.scale=2700;
		}
		return infoObj;
	}
	function hu_nanbox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 4301){//changsha
			infoObj.coordinates[0]=115.19;
			infoObj.coordinates[1]=27.70;
			infoObj.scale=8000;
		}
		if(id == 4302){//zhuzhou
			infoObj.coordinates[0]=115.52;
			infoObj.coordinates[1]=26.40;
			infoObj.scale=7500;
		}
		if(id == 4303){//xiangtan
			infoObj.coordinates[0]=113.76;
			infoObj.coordinates[1]=27.30;
			infoObj.scale=12000;
		}
		if(id == 4304){//hengyang
			infoObj.coordinates[0]=114.27;
			infoObj.coordinates[1]=26.05;
			infoObj.scale=9000;
		}
		if(id == 4305){//shaoyang
			infoObj.coordinates[0]=113.37;
			infoObj.coordinates[1]=26.05;
			infoObj.scale=7000;
		}
		if(id == 4306){//yueyang
			infoObj.coordinates[0]=115.05;
			infoObj.coordinates[1]=28.6075;
			infoObj.scale=9000;
		}
		if(id == 4307){//changde
			infoObj.coordinates[0]=113.25;
			infoObj.coordinates[1]=28.8075;
			infoObj.scale=9000;
		}
		if(id == 4308){//zhangjiajie
			infoObj.coordinates[0]=112.25;
			infoObj.coordinates[1]=28.8075;
			infoObj.scale=9000;
		}
		if(id == 4309){//yiyang
			infoObj.coordinates[0]=113.87;
			infoObj.coordinates[1]=28.2075;
			infoObj.scale=8000;
		}
		if(id == 4310){//binzhou
			infoObj.coordinates[0]=115.35;
			infoObj.coordinates[1]=25.2075;
			infoObj.scale=7500;
		}
		if(id == 4311){//yongzhou
			infoObj.coordinates[0]=114.15;
			infoObj.coordinates[1]=25.00;
			infoObj.scale=6500;
		}
		if(id == 4312){//huaihua
			infoObj.coordinates[0]=113.80;
			infoObj.coordinates[1]=26.30;
			infoObj.scale=4500;
		}
		if(id == 4313){//loudi
			infoObj.coordinates[0]=113.42;
			infoObj.coordinates[1]=27.30;
			infoObj.scale=9000;
		}
		if(id == 4331){//xiangxi
			infoObj.coordinates[0]=111.77;
			infoObj.coordinates[1]=27.9875;
			infoObj.scale=7500;
		}
		return infoObj;
	}
	function ji_linbox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 2201){
			infoObj.coordinates[0]=128.66;
			infoObj.coordinates[1]=43.62;
			infoObj.scale=5000;
		}
		if(id == 2202){
			infoObj.coordinates[0]=130.36;
			infoObj.coordinates[1]=42.82;
			infoObj.scale=4500;
		}
		if(id == 2203){
			infoObj.coordinates[0]=127.26;
			infoObj.coordinates[1]=43.02;
			infoObj.scale=6000;
		}
		if(id == 2204){
			infoObj.coordinates[0]=127.26;
			infoObj.coordinates[1]=42.42;
			infoObj.scale=9000;
		}
		if(id == 2205){
			infoObj.coordinates[0]=128.76;
			infoObj.coordinates[1]=40.92;
			infoObj.scale=5000;
		}
		if(id == 2206){
			infoObj.coordinates[0]=129.66;
			infoObj.coordinates[1]=41.42;
			infoObj.scale=6000;
		}
		if(id == 2207){
			infoObj.coordinates[0]=127.86;
			infoObj.coordinates[1]=43.72;
			infoObj.scale=5000;
		}
		if(id == 2208){
			infoObj.coordinates[0]=126.26;
			infoObj.coordinates[1]=44.62;
			infoObj.scale=5000;
		}
		if(id == 2224){
			infoObj.coordinates[0]=133.26;
			infoObj.coordinates[1]=42.02;
			infoObj.scale=4000;
		}
		return infoObj;
	}
	function jiang_subox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 3201){
			infoObj.coordinates[0]=120.66;
			infoObj.coordinates[1]=31.42;
			infoObj.scale=10000;
		}
		if(id == 3202){
			infoObj.coordinates[0]=121.06;
			infoObj.coordinates[1]=31.22;
			infoObj.scale=15000;
		}
		if(id == 3203){
			infoObj.coordinates[0]=119.76;
			infoObj.coordinates[1]=33.82;
			infoObj.scale=8000;
		}
		if(id == 3204){
			infoObj.coordinates[0]=120.76;
			infoObj.coordinates[1]=31.25;
			infoObj.scale=15000;
		}
		if(id == 3205){
			infoObj.coordinates[0]=122.26;
			infoObj.coordinates[1]=30.92;
			infoObj.scale=10500;
		}
		if(id == 3206){
			infoObj.coordinates[0]=122.70;
			infoObj.coordinates[1]=31.72;
			infoObj.scale=9000;
		}
		if(id == 3207){
			infoObj.coordinates[0]=120.86;
			infoObj.coordinates[1]=34.02;
			infoObj.scale=9000;
		}
		if(id == 3208){
			infoObj.coordinates[0]=120.96;
			infoObj.coordinates[1]=32.62;
			infoObj.scale=8000;
		}
		if(id == 3209){
			infoObj.coordinates[0]=122.26;
			infoObj.coordinates[1]=32.90;
			infoObj.scale=7500;
		}
		if(id == 3210){
			infoObj.coordinates[0]=121.26;
			infoObj.coordinates[1]=32.30;
			infoObj.scale=9000;
		}
		if(id == 3211){
			infoObj.coordinates[0]=120.76;
			infoObj.coordinates[1]=31.60;
			infoObj.scale=13000;
		}
		if(id == 3212){
			infoObj.coordinates[0]=121.86;
			infoObj.coordinates[1]=31.90;
			infoObj.scale=9000;
		}
		if(id == 3213){
			infoObj.coordinates[0]=120.26;
			infoObj.coordinates[1]=33.20;
			infoObj.scale=9000;
		}
		return infoObj;
	}
	function jiang_xibox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 3601){
			infoObj.coordinates[0]=117.36;
			infoObj.coordinates[1]=28.18;
			infoObj.scale=12000;
		}
		if(id == 3602){
			infoObj.coordinates[0]=118.89;
			infoObj.coordinates[1]=28.82;
			infoObj.scale=11000;
		}
		if(id == 3603){
			infoObj.coordinates[0]=115.36;
			infoObj.coordinates[1]=27.08;
			infoObj.scale=12000;
		}
		if(id == 3604){
			infoObj.coordinates[0]=117.52;
			infoObj.coordinates[1]=28.75;
			infoObj.scale=7500;
		}
		if(id == 3605){
			infoObj.coordinates[0]=116.26;
			infoObj.coordinates[1]=27.52;
			infoObj.scale=12000;
		}
		if(id == 3606){
			infoObj.coordinates[0]=118.60;
			infoObj.coordinates[1]=27.82;
			infoObj.scale=12000;
		}
		if(id == 3607){
			infoObj.coordinates[0]=118.36;
			infoObj.coordinates[1]=24.82;
			infoObj.scale=5500;
		}
		if(id == 3608){
			infoObj.coordinates[0]=116.86;
			infoObj.coordinates[1]=26.30;
			infoObj.scale=7500;
		}
		if(id == 3609){
			infoObj.coordinates[0]=117.16;
			infoObj.coordinates[1]=27.60;
			infoObj.scale=7500;
		}
		if(id == 3610){
			infoObj.coordinates[0]=118.46;
			infoObj.coordinates[1]=26.80;
			infoObj.scale=7500;
		}
		if(id == 3611){
			infoObj.coordinates[0]=119.66;
			infoObj.coordinates[1]=28.20;
			infoObj.scale=7000;
		}
		return infoObj;
	}
	function nei_meng_gubox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 1501){
			infoObj.coordinates[0]=114.06;
			infoObj.coordinates[1]=39.89;
			infoObj.scale=6000;
		}
		if(id == 1502){
			infoObj.coordinates[0]=113.86;
			infoObj.coordinates[1]=40.59;
			infoObj.scale=5000;
		}
		if(id == 1503){
			infoObj.coordinates[0]=108.36;
			infoObj.coordinates[1]=39.02;
			infoObj.scale=11000;
		}
		if(id == 1504){
			infoObj.coordinates[0]=124.16;
			infoObj.coordinates[1]=41.82;
			infoObj.scale=3000;
		}
		if(id == 1505){
			infoObj.coordinates[0]=126.86;
			infoObj.coordinates[1]=42.52;
			infoObj.scale=3000;
		}
		if(id == 1506){
			infoObj.coordinates[0]=113.66;
			infoObj.coordinates[1]=38.12;
			infoObj.scale=3500;
		}
		if(id == 1507){
			infoObj.coordinates[0]=131.86;
			infoObj.coordinates[1]=47.62;
			infoObj.scale=1500;
		}
		if(id == 1508){
			infoObj.coordinates[0]=111.26;
			infoObj.coordinates[1]=40.62;
			infoObj.scale=4000;
		}
		if(id == 1509){
			infoObj.coordinates[0]=116.66;
			infoObj.coordinates[1]=40.70;
			infoObj.scale=3600;
		}
		if(id == 1522){
			infoObj.coordinates[0]=127.16;
			infoObj.coordinates[1]=44.82;
			infoObj.scale=3000;
		}
		if(id == 1525){
			infoObj.coordinates[0]=123.66;
			infoObj.coordinates[1]=42.09;
			infoObj.scale=2000;
		}
		if(id == 1529){
			infoObj.coordinates[0]=113.66;
			infoObj.coordinates[1]=37.09;
			infoObj.scale=1500;
		}
		return infoObj;
	}
	function shan_dongbox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 3701){
			infoObj.coordinates[0]=118.96;
			infoObj.coordinates[1]=36.28;
			infoObj.scale=9000;
		}
		if(id == 3702){
			infoObj.coordinates[0]=122.00;
			infoObj.coordinates[1]=35.86;
			infoObj.scale=8500;
		}
		if(id == 3703){
			infoObj.coordinates[0]=119.96;
			infoObj.coordinates[1]=36.08;
			infoObj.scale=9000;
		}
		if(id == 3704){
			infoObj.coordinates[0]=118.71;
			infoObj.coordinates[1]=34.50;
			infoObj.scale=12000;
		}
		if(id == 3705){
			infoObj.coordinates[0]=120.45;
			infoObj.coordinates[1]=37.12;
			infoObj.scale=9000;
		}
		if(id == 3706){
			infoObj.coordinates[0]=122.60;
			infoObj.coordinates[1]=36.82;
			infoObj.scale=8500;
		}
		if(id == 3707){
			infoObj.coordinates[0]=120.96;
			infoObj.coordinates[1]=36.02;
			infoObj.scale=8500;
		}
		if(id == 3708){
			infoObj.coordinates[0]=118.46;
			infoObj.coordinates[1]=34.72;
			infoObj.scale=8500;
		}
		if(id == 3709){
			infoObj.coordinates[0]=118.86;
			infoObj.coordinates[1]=35.60;
			infoObj.scale=9000;
		}
		if(id == 3710){
			infoObj.coordinates[0]=123.60;
			infoObj.coordinates[1]=36.52;
			infoObj.scale=9500;
		}
		if(id == 3711){
			infoObj.coordinates[0]=120.60;
			infoObj.coordinates[1]=35.02;
			infoObj.scale=10500;
		}
		if(id == 3712){
			infoObj.coordinates[0]=119.02;
			infoObj.coordinates[1]=35.92;
			infoObj.scale=12500;
		}
		if(id == 3713){
			infoObj.coordinates[0]=120.42;
			infoObj.coordinates[1]=34.69;
			infoObj.scale=7500;
		}
		if(id == 3714){
			infoObj.coordinates[0]=118.82;
			infoObj.coordinates[1]=36.69;
			infoObj.scale=7500;
		}
		if(id == 3715){
			infoObj.coordinates[0]=117.62;
			infoObj.coordinates[1]=36.00;
			infoObj.scale=9000;
		}
		if(id == 3716){
			infoObj.coordinates[0]=119.70;
			infoObj.coordinates[1]=36.96;
			infoObj.scale=8500;
		}
		if(id == 3717){
			infoObj.coordinates[0]=117.32;
			infoObj.coordinates[1]=34.50;
			infoObj.scale=9000;
		}
		return infoObj;
	}
	function shan_xi_2box(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 1401){
			infoObj.coordinates[0]=113.56;
			infoObj.coordinates[1]=37.62;
			infoObj.scale=12000;
		}
		if(id == 1402){
			infoObj.coordinates[0]=115.86;
			infoObj.coordinates[1]=39.19;
			infoObj.scale=7000;
		}
		if(id == 1403){
			infoObj.coordinates[0]=114.96;
			infoObj.coordinates[1]=37.62;
			infoObj.scale=12000;
		}
		if(id == 1404){
			infoObj.coordinates[0]=114.66;
			infoObj.coordinates[1]=36.02;
			infoObj.scale=9000;
		}
		if(id == 1405){
			infoObj.coordinates[0]=114.36;
			infoObj.coordinates[1]=35.02;
			infoObj.scale=9000;
		}
		if(id == 1406){
			infoObj.coordinates[0]=114.66;
			infoObj.coordinates[1]=39.02;
			infoObj.scale=8000;
		}
		if(id == 1407){
			infoObj.coordinates[0]=114.86;
			infoObj.coordinates[1]=36.62;
			infoObj.scale=7000;
		}
		if(id == 1408){
			infoObj.coordinates[0]=113.26;
			infoObj.coordinates[1]=34.62;
			infoObj.scale=8000;
		}
		if(id == 1409){
			infoObj.coordinates[0]=114.96;
			infoObj.coordinates[1]=38.20;
			infoObj.scale=6000;
		}
		if(id == 1410){
			infoObj.coordinates[0]=113.36;
			infoObj.coordinates[1]=35.70;
			infoObj.scale=8000;
		}
		if(id == 1411){
			infoObj.coordinates[0]=113.66;
			infoObj.coordinates[1]=37.09;
			infoObj.scale=6500;
		}
		return infoObj;
	}
	function si_chuanbox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 5101){
			infoObj.coordinates[0]=105.66;
			infoObj.coordinates[1]=30.24;
			infoObj.scale=10000;
		}
		if(id == 5103){
			infoObj.coordinates[0]=105.86;
			infoObj.coordinates[1]=28.84;
			infoObj.scale=12000;
		}
		if(id == 5104){
			infoObj.coordinates[0]=102.86;
			infoObj.coordinates[1]=26.30;
			infoObj.scale=12000;
		}
		if(id == 5105){
			infoObj.coordinates[0]=107.46;
			infoObj.coordinates[1]=27.80;
			infoObj.scale=8000;
		}
		if(id == 5106){
			infoObj.coordinates[0]=105.96;
			infoObj.coordinates[1]=30.74;
			infoObj.scale=10000;
		}
		if(id == 5107){
			infoObj.coordinates[0]=107.46;
			infoObj.coordinates[1]=31.04;
			infoObj.scale=6000;
		}
		if(id == 5108){
			infoObj.coordinates[0]=107.76;
			infoObj.coordinates[1]=31.54;
			infoObj.scale=7000;
		}
		if(id == 5109){
			infoObj.coordinates[0]=106.76;
			infoObj.coordinates[1]=30.34;
			infoObj.scale=12000;
		}
		if(id == 5110){
			infoObj.coordinates[0]=106.46;
			infoObj.coordinates[1]=29.34;
			infoObj.scale=12000;
		}
		if(id == 5111){
			infoObj.coordinates[0]=105.75;
			infoObj.coordinates[1]=28.74;
			infoObj.scale=8000;
		}
		if(id == 5113){
			infoObj.coordinates[0]=107.96;
			infoObj.coordinates[1]=30.54;
			infoObj.scale=8000;
		}
		if(id == 5114){
			infoObj.coordinates[0]=105.36;
			infoObj.coordinates[1]=29.24;
			infoObj.scale=10000;
		}
		if(id == 5115){
			infoObj.coordinates[0]=106.40;
			infoObj.coordinates[1]=27.94;
			infoObj.scale=8000;
		}
		if(id == 5116){
			infoObj.coordinates[0]=108.10;
			infoObj.coordinates[1]=30.04;
			infoObj.scale=10000;
		}
		if(id == 5117){
			infoObj.coordinates[0]=109.90;
			infoObj.coordinates[1]=30.64;
			infoObj.scale=7000;
		}
		if(id == 5118){
			infoObj.coordinates[0]=104.76;
			infoObj.coordinates[1]=29.24;
			infoObj.scale=7000;
		}
		if(id == 5119){
			infoObj.coordinates[0]=109.06;
			infoObj.coordinates[1]=31.54;
			infoObj.scale=8000;
		}
		if(id == 5120){
			infoObj.coordinates[0]=106.96;
			infoObj.coordinates[1]=29.84;
			infoObj.scale=9000;
		}
		if(id == 5120){
			infoObj.coordinates[0]=106.96;
			infoObj.coordinates[1]=29.84;
			infoObj.scale=9000;
		}
		if(id == 5132){
			infoObj.coordinates[0]=106.12;
			infoObj.coordinates[1]=31.24;
			infoObj.scale=4000;
		}
		if(id == 5133){
			infoObj.coordinates[0]=105.62;
			infoObj.coordinates[1]=29.04;
			infoObj.scale=2300;
		}
		if(id == 5134){
			infoObj.coordinates[0]=106.12;
			infoObj.coordinates[1]=26.24;
			infoObj.scale=4000;
		}
		return infoObj;
	}
	function zhe_jiangbox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 3301){
			infoObj.coordinates[0]=121.25;
			infoObj.coordinates[1]=29.42;
			infoObj.scale=9000;
		}
		if(id == 3302){
			infoObj.coordinates[0]=123.06;
			infoObj.coordinates[1]=29.22;
			infoObj.scale=10000;
		}
		if(id == 3303){
			infoObj.coordinates[0]=122.56;
			infoObj.coordinates[1]=27.32;
			infoObj.scale=8000;
		}
		if(id == 3304){
			infoObj.coordinates[0]=122.06;
			infoObj.coordinates[1]=30.30;
			infoObj.scale=13500;
		}
		if(id == 3305){
			infoObj.coordinates[0]=121.36;
			infoObj.coordinates[1]=30.22;
			infoObj.scale=11500;
		}
		if(id == 3306){
			infoObj.coordinates[0]=122.20;
			infoObj.coordinates[1]=29.32;
			infoObj.scale=10500;
		}
		if(id == 3307){
			infoObj.coordinates[0]=121.46;
			infoObj.coordinates[1]=28.62;
			infoObj.scale=10000;
		}
		if(id == 3308){
			infoObj.coordinates[0]=120.46;
			infoObj.coordinates[1]=28.42;
			infoObj.scale=10000;
		}
		if(id == 3309){
			infoObj.coordinates[0]=124.46;
			infoObj.coordinates[1]=29.40;
			infoObj.scale=7500;
		}
		if(id == 3310){
			infoObj.coordinates[0]=122.96;
			infoObj.coordinates[1]=28.00;
			infoObj.scale=9000;
		}
		if(id == 3311){
			infoObj.coordinates[0]=121.36;
			infoObj.coordinates[1]=27.60;
			infoObj.scale=9000;
		}
		if(id == 3212){
			infoObj.coordinates[0]=121.86;
			infoObj.coordinates[1]=31.90;
			infoObj.scale=9000;
		}
		if(id == 3213){
			infoObj.coordinates[0]=120.26;
			infoObj.coordinates[1]=33.20;
			infoObj.scale=9000;
		}
		return infoObj;
	}
	function gan_subox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 6201){//兰州
			infoObj.coordinates[0]=105.66;
			infoObj.coordinates[1]=35.78;
			infoObj.scale=8500;
		}
		if(id == 6202){//嘉峪关
			infoObj.coordinates[0]=99.07;
			infoObj.coordinates[1]=39.57;
			infoObj.scale=18000;
		}
		if(id == 6203){//金昌
			infoObj.coordinates[0]=104.16;
			infoObj.coordinates[1]=37.78;
			infoObj.scale=7000;
		}
		if(id == 6204){//白银
			infoObj.coordinates[0]=107.31;
			infoObj.coordinates[1]=35.83;
			infoObj.scale=6000;
		}
		if(id == 6205){//天水
			infoObj.coordinates[0]=107.45;
			infoObj.coordinates[1]=34.02;
			infoObj.scale=9000;
		}
		if(id == 6206){//武威
			infoObj.coordinates[0]=107.300;
			infoObj.coordinates[1]=37.22;
			infoObj.scale=4000;
		}
		if(id == 6207){//张掖
			infoObj.coordinates[0]=103.36;
			infoObj.coordinates[1]=38.0;
			infoObj.scale=4500;
		}
		if(id == 6208){//平凉
			infoObj.coordinates[0]=108.46;
			infoObj.coordinates[1]=34.8;
			infoObj.scale=8500;
		}
		if(id == 6209){//酒泉
			infoObj.coordinates[0]=102.86;
			infoObj.coordinates[1]=39.0;
			infoObj.scale=2500;
		}
		if(id == 6210){//庆阳
			infoObj.coordinates[0]=110.30;
			infoObj.coordinates[1]=35.52;
			infoObj.scale=6500;
		}
		if(id == 6211){//定西
			infoObj.coordinates[0]=106.90;
			infoObj.coordinates[1]=34.52;
			infoObj.scale=6500;
		}
		if(id == 6212){//陇南
			infoObj.coordinates[0]=107.62;
			infoObj.coordinates[1]=32.92;
			infoObj.scale=6500;
		}
		if(id == 6229){//临夏
			infoObj.coordinates[0]=105.02;
			infoObj.coordinates[1]=35.09;
			infoObj.scale=9500;
		}
		if(id == 6230){//甘南
			infoObj.coordinates[0]=105.82;
			infoObj.coordinates[1]=33.29;
			infoObj.scale=5000;
		}
		return infoObj;
	}
	function gui_zhoubox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 5201){
			infoObj.coordinates[0]=108.00;
			infoObj.coordinates[1]=26.35;
			infoObj.scale=12000;
		}
		if(id == 5202){
			infoObj.coordinates[0]=106.86;
			infoObj.coordinates[1]=25.54;
			infoObj.scale=9000;
		}
		if(id == 5203){
			infoObj.coordinates[0]=109.46;
			infoObj.coordinates[1]=27.10;
			infoObj.scale=6000;
		}
		if(id == 5204){
			infoObj.coordinates[0]=107.50;
			infoObj.coordinates[1]=25.450;
			infoObj.scale=10000;
		}
		if(id == 5222){
			infoObj.coordinates[0]=110.66;
			infoObj.coordinates[1]=27.34;
			infoObj.scale=7500;
		}
		if(id == 5223){
			infoObj.coordinates[0]=107.96;
			infoObj.coordinates[1]=24.64;
			infoObj.scale=7000;
		}
		if(id == 5224){
			infoObj.coordinates[0]=107.86;
			infoObj.coordinates[1]=26.24;
			infoObj.scale=6000;
		}
		if(id == 5226){
			infoObj.coordinates[0]=111.06;
			infoObj.coordinates[1]=25.44;
			infoObj.scale=6000;
		}
		if(id == 5227){
			infoObj.coordinates[0]=109.96;
			infoObj.coordinates[1]=25.34;
			infoObj.scale=6000;
		}
		return infoObj;
	}
	function hai_nanbox(id) {
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 4601){//海口
			infoObj.coordinates[0]=110.198879;
			infoObj.coordinates[1]=20.043353;
			infoObj.scale=20500;
		}
		if(id == 4602){//三亚
			infoObj.coordinates[0]=109.510860;
			infoObj.coordinates[1]=18.251687;
			infoObj.scale=17500;
		}
		if(id == 469001){//五指山市
			infoObj.coordinates[0]=109.377136;
			infoObj.coordinates[1]=19.088076;
			infoObj.scale=18000;
		}
		if(id == 469002){//琼海市
			infoObj.coordinates[0]=110.474825;
			infoObj.coordinates[1]=19.257917;
			infoObj.scale=18000;
		}
		if(id == 469003){//儋州市
			infoObj.coordinates[0]=109.579439;
			infoObj.coordinates[1]=19.526222;
			infoObj.scale=13000;
		}
		if(id == 469005){//文昌市
			infoObj.coordinates[0]=110.798492;
			infoObj.coordinates[1]=19.543128;
			infoObj.scale=20000;
		}
		if(id == 469006){//万宁市
			infoObj.coordinates[0]=110.387707;
			infoObj.coordinates[1]=18.799474;
			infoObj.scale=20000;
		}
		if(id == 469007){//东方市
			infoObj.coordinates[0]=108.652382;
			infoObj.coordinates[1]=19.095051;
			infoObj.scale=20000;
		}
		if(id == 469021){//安定县
			infoObj.coordinates[0]=110.348718;
			infoObj.coordinates[1]=19.680980;
			infoObj.scale=20000;
		}
		if(id == 469022){//屯昌县
			infoObj.coordinates[0]=110.103436;
			infoObj.coordinates[1]=19.350991;
			infoObj.scale=20000;
		}
		if(id == 469023){//澄迈县
			infoObj.coordinates[0]=110.006447;
			infoObj.coordinates[1]=19.738026;
			infoObj.scale=20000;
		}
		if(id == 469024){//临高县
			infoObj.coordinates[0]=109.690418;
			infoObj.coordinates[1]=19.911948;
			infoObj.scale=20000;
		}
		if(id == 469025){//白沙县
			infoObj.coordinates[0]=109.451981;
			infoObj.coordinates[1]=19.223800;
			infoObj.scale=20000;
		}
		if(id == 469026){//昌江县
			infoObj.coordinates[0]=109.055786;
			infoObj.coordinates[1]=19.296886;
			infoObj.scale=20000;
		}
		if(id == 469027){//乐东县
			infoObj.coordinates[0]=109.173803;
			infoObj.coordinates[1]=18.750066;
			infoObj.scale=20000;
		}
		if(id == 469028){//陵水县
			infoObj.coordinates[0]=110.038548;
			infoObj.coordinates[1]=18.505982;
			infoObj.scale=20000;
		}
		if(id == 469029){//保亭县
			infoObj.coordinates[0]=109.703979;
			infoObj.coordinates[1]=18.637787;
			infoObj.scale=20000;
		}
		if(id == 469030){//琼中县
			infoObj.coordinates[0]=109.838390;
			infoObj.coordinates[1]=19.032586;
			infoObj.scale=20000;
		}
		if(id == 469031){//三沙市
			infoObj.coordinates[0]=112.334918;
			infoObj.coordinates[1]=16.836606;
			infoObj.scale=20000;
		}
		return infoObj;
	}
	function hu_beibox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 4201){//wuhan
			infoObj.coordinates[0]=116.03;
			infoObj.coordinates[1]=30.20;
			infoObj.scale=10000;
		}
		if(id == 4202){//huangshi
			infoObj.coordinates[0]=116.02;
			infoObj.coordinates[1]=29.60;
			infoObj.scale=15000;
		}
		if(id == 4203){//shiyan
			infoObj.coordinates[0]=112.56;
			infoObj.coordinates[1]=31.65;
			infoObj.scale=7000;
		}
		if(id == 4205){//yichang
			infoObj.coordinates[0]=113.27;
			infoObj.coordinates[1]=30.05;
			infoObj.scale=7000;
		}
		if(id == 4206){//xiangfan
			infoObj.coordinates[0]=114.37;
			infoObj.coordinates[1]=31.4075;
			infoObj.scale=7000;
		}
		if(id == 4207){//ezhou
			infoObj.coordinates[0]=115.65;
			infoObj.coordinates[1]=30.1075;
			infoObj.scale=18000;
		}
		if(id == 4208){//jingmen
			infoObj.coordinates[0]=114.35;
			infoObj.coordinates[1]=30.4075;
			infoObj.scale=9000;
		}
		if(id == 4209){//xiaogan
			infoObj.coordinates[0]=115.75;
			infoObj.coordinates[1]=30.5075;
			infoObj.scale=9000;
		}
		if(id == 4210){//jingzhou
			infoObj.coordinates[0]=114.67;
			infoObj.coordinates[1]=29.4075;
			infoObj.scale=8000;
		}
		if(id == 4211){//huanggang
			infoObj.coordinates[0]=117.35;
			infoObj.coordinates[1]=30.0075;
			infoObj.scale=7500;
		}
		if(id == 4212){//xianning
			infoObj.coordinates[0]=116.00;
			infoObj.coordinates[1]=29.00;
			infoObj.scale=9000;
		}
		if(id == 4213){//suizhou
			infoObj.coordinates[0]=115.20;
			infoObj.coordinates[1]=31.32;
			infoObj.scale=9000;
		}
		if(id == 4228){//enshi
			infoObj.coordinates[0]=111.77;
			infoObj.coordinates[1]=29.4875;
			infoObj.scale=6400;
		}
		if(id == 429021){//神农架
			infoObj.coordinates[0]=110.697792;
			infoObj.coordinates[1]=31.74922;
			infoObj.scale=10000;
		}
		if(id == 429004){//仙桃市
			infoObj.coordinates[0]=113.387448;
			infoObj.coordinates[1]=30.293966;
			infoObj.scale=10000;
		}
		if(id == 429005){//潜江市
			infoObj.coordinates[0]=112.768768;
			infoObj.coordinates[1]=30.343116;
			infoObj.scale=10000;
		}
		if(id == 429006){//天门市
			infoObj.coordinates[0]=113.12623;
			infoObj.coordinates[1]=30.649047;
			infoObj.scale=10000;
		}
		return infoObj;
	}
	function liao_ningbox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 2101){
			infoObj.coordinates[0]=125.66;
			infoObj.coordinates[1]=41.52;
			infoObj.scale=7000;
		}
		if(id == 2102){
			infoObj.coordinates[0]=124.36;
			infoObj.coordinates[1]=38.82;
			infoObj.scale=7000;
		}
		if(id == 2103){
			infoObj.coordinates[0]=125.26;
			infoObj.coordinates[1]=40.02;
			infoObj.scale=7000;
		}
		if(id == 2104){
			infoObj.coordinates[0]=126.46;
			infoObj.coordinates[1]=41.42;
			infoObj.scale=9000;
		}
		if(id == 2105){
			infoObj.coordinates[0]=126.46;
			infoObj.coordinates[1]=40.72;
			infoObj.scale=9000;
		}
		if(id == 2106){
			infoObj.coordinates[0]=126.76;
			infoObj.coordinates[1]=39.82;
			infoObj.scale=7000;
		}
		if(id == 2107){
			infoObj.coordinates[0]=123.46;
			infoObj.coordinates[1]=41.02;
			infoObj.scale=9000;
		}
		if(id == 2108){
			infoObj.coordinates[0]=123.66;
			infoObj.coordinates[1]=40.12;
			infoObj.scale=12000;
		}
		if(id == 2109){
			infoObj.coordinates[0]=123.66;
			infoObj.coordinates[1]=41.72;
			infoObj.scale=9000;
		}
		if(id == 2110){
			infoObj.coordinates[0]=124.56;
			infoObj.coordinates[1]=40.79;
			infoObj.scale=13000;
		}
		if(id == 2111){
			infoObj.coordinates[0]=123.26;
			infoObj.coordinates[1]=40.72;
			infoObj.scale=13000;
		}
		if(id == 2112){
			infoObj.coordinates[0]=126.66;
			infoObj.coordinates[1]=42.02;
			infoObj.scale=7000;
		}
		if(id == 2113){
			infoObj.coordinates[0]=122.46;
			infoObj.coordinates[1]=40.82;
			infoObj.scale=6500;
		}
		if(id == 2114){
			infoObj.coordinates[0]=122.16;
			infoObj.coordinates[1]=40.02;
			infoObj.scale=8500;
		}
		return infoObj;
	}
	function ning_xiabox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 6401){//银川
			infoObj.coordinates[0]=108.16;
			infoObj.coordinates[1]=37.58;
			infoObj.scale=8500;
		}
		if(id == 6402){//石嘴山市
			infoObj.coordinates[0]=107.80;
			infoObj.coordinates[1]=38.62;
			infoObj.scale=13000;
		}
		if(id == 6403){//吴忠
			infoObj.coordinates[0]=108.86;
			infoObj.coordinates[1]=36.78;
			infoObj.scale=7000;
		}
		if(id == 6404){//固原
			infoObj.coordinates[0]=108.01;
			infoObj.coordinates[1]=35.30;
			infoObj.scale=9000;
		}
		if(id == 6405){//中卫
			infoObj.coordinates[0]=107.95;
			infoObj.coordinates[1]=36.32;
			infoObj.scale=7000;
		}
		return infoObj;
	}
	function qing_haibox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 6301){//西宁
			infoObj.coordinates[0]=102.86;
			infoObj.coordinates[1]=36.38;
			infoObj.scale=10500;
		}
		if(id == 6321){//海东
			infoObj.coordinates[0]=104.07;
			infoObj.coordinates[1]=35.72;
			infoObj.scale=8000;
		}
		if(id == 6322){//海北
			infoObj.coordinates[0]=103.86;
			infoObj.coordinates[1]=37.08;
			infoObj.scale=4500;
		}
		if(id == 6323){//黄南
			infoObj.coordinates[0]=104.31;
			infoObj.coordinates[1]=34.43;
			infoObj.scale=6200;
		}
		if(id == 6325){//海南
			infoObj.coordinates[0]=103.45;
			infoObj.coordinates[1]=35.02;
			infoObj.scale=5000;
		}
		if(id == 6326){//果洛
			infoObj.coordinates[0]=103.600;
			infoObj.coordinates[1]=33.02;
			infoObj.scale=4000;
		}
		if(id == 6327){//玉树
			infoObj.coordinates[0]=101.36;
			infoObj.coordinates[1]=31.5;
			infoObj.scale=2200;
		}
		if(id == 6328){//海西
			infoObj.coordinates[0]=105.46;
			infoObj.coordinates[1]=32.8;
			infoObj.scale=1500;
		}

		return infoObj;
	}
	function shan_xi_1box(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 6101){//西安
			infoObj.coordinates[0]=110.56;
			infoObj.coordinates[1]=33.58;
			infoObj.scale=8500;
		}
		if(id == 6102){//铜川
			infoObj.coordinates[0]=110.10;
			infoObj.coordinates[1]=34.86;
			infoObj.scale=14500;
		}
		if(id == 6103){//宝鸡
			infoObj.coordinates[0]=109.06;
			infoObj.coordinates[1]=33.78;
			infoObj.scale=8000;
		}
		if(id == 6104){//咸阳
			infoObj.coordinates[0]=110.01;
			infoObj.coordinates[1]=34.30;
			infoObj.scale=9000;
		}
		if(id == 6105){//渭南
			infoObj.coordinates[0]=111.95;
			infoObj.coordinates[1]=34.52;
			infoObj.scale=8000;
		}
		if(id == 6106){//延安
			infoObj.coordinates[0]=112.300;
			infoObj.coordinates[1]=35.62;
			infoObj.scale=5500;
		}
		if(id == 6107){//汉中
			infoObj.coordinates[0]=109.36;
			infoObj.coordinates[1]=32.32;
			infoObj.scale=6500;
		}
		if(id == 6108){//榆林
			infoObj.coordinates[0]=113.46;
			infoObj.coordinates[1]=36.82;
			infoObj.scale=4000;
		}
		if(id == 6109){//安康
			infoObj.coordinates[0]=111.86;
			infoObj.coordinates[1]=32.10;
			infoObj.scale=6000;
		}
		if(id == 6110){//商洛
			infoObj.coordinates[0]=112.30;
			infoObj.coordinates[1]=33.02;
			infoObj.scale=6500;
		}
		if(id == 3711){
			infoObj.coordinates[0]=120.60;
			infoObj.coordinates[1]=35.02;
			infoObj.scale=10500;
		}
		if(id == 3712){
			infoObj.coordinates[0]=119.02;
			infoObj.coordinates[1]=35.92;
			infoObj.scale=12500;
		}
		if(id == 3713){
			infoObj.coordinates[0]=120.42;
			infoObj.coordinates[1]=34.69;
			infoObj.scale=7500;
		}
		if(id == 3714){
			infoObj.coordinates[0]=118.82;
			infoObj.coordinates[1]=36.69;
			infoObj.scale=7500;
		}
		if(id == 3715){
			infoObj.coordinates[0]=117.62;
			infoObj.coordinates[1]=36.00;
			infoObj.scale=9000;
		}
		if(id == 3716){
			infoObj.coordinates[0]=119.70;
			infoObj.coordinates[1]=36.96;
			infoObj.scale=8500;
		}
		if(id == 3717){
			infoObj.coordinates[0]=117.32;
			infoObj.coordinates[1]=34.50;
			infoObj.scale=9000;
		}
		return infoObj;
	}
	function xi_zangbox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 5401){//拉萨
			infoObj.coordinates[0]=93.60;
			infoObj.coordinates[1]=29.30;
			infoObj.scale=6000;
		}
		if(id == 5421){//昌都
			infoObj.coordinates[0]=102.26;
			infoObj.coordinates[1]=28.84;
			infoObj.scale=3000;
		}
		if(id == 5422){//山南
			infoObj.coordinates[0]=96.46;
			infoObj.coordinates[1]=27.10;
			infoObj.scale=4000;
		}
		if(id == 5423){//日喀则
			infoObj.coordinates[0]=92.50;
			infoObj.coordinates[1]=27.250;
			infoObj.scale=2500;
		}
		if(id == 5424){//那曲
			infoObj.coordinates[0]=97.66;
			infoObj.coordinates[1]=31.00;
			infoObj.scale=2000;
		}
		if(id == 5425){//阿里
			infoObj.coordinates[0]=90.96;
			infoObj.coordinates[1]=30.34;
			infoObj.scale=2000;
		}
		if(id == 5426){//林芝
			infoObj.coordinates[0]=100.46;
			infoObj.coordinates[1]=27.24;
			infoObj.scale=3000;
		}
		return infoObj;
	}
	function xin_jiangbox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 6501){//乌鲁木齐
			infoObj.coordinates[0]=91.00;
			infoObj.coordinates[1]=43.16;
			infoObj.scale=5300;
		}
		if(id == 6502){//克拉玛依
			infoObj.coordinates[0]=88.77;
			infoObj.coordinates[1]=44.32;
			infoObj.scale=5000;
		}
		if(id == 6521){//吐鲁番
			infoObj.coordinates[0]=94.36;
			infoObj.coordinates[1]=41.08;
			infoObj.scale=3500;
		}
		if(id == 6522){//哈密
			infoObj.coordinates[0]=100.31;
			infoObj.coordinates[1]=41.43;
			infoObj.scale=2200;
		}
		if(id == 6523){//昌吉
			infoObj.coordinates[0]=93.75;
			infoObj.coordinates[1]=43.02;
			infoObj.scale=3000;
		}
		if(id == 6527){//博尔塔拉
			infoObj.coordinates[0]=85.000;
			infoObj.coordinates[1]=44.02;
			infoObj.scale=5000;
		}
		if(id == 6528){//巴音郭楞
			infoObj.coordinates[0]=99.36;
			infoObj.coordinates[1]=37.0;
			infoObj.scale=1500;
		}
		if(id == 6529){//阿克苏
			infoObj.coordinates[0]=86.46;
			infoObj.coordinates[1]=39.8;
			infoObj.scale=3000;
		}
		if(id == 6530){//克孜勒苏柯尔克孜
			infoObj.coordinates[0]=81.46;
			infoObj.coordinates[1]=37.8;
			infoObj.scale=3000;
		}
		if(id == 6531){//喀什
			infoObj.coordinates[0]=83.46;
			infoObj.coordinates[1]=35.8;
			infoObj.scale=2500;
		}
		if(id == 6532){//和田
			infoObj.coordinates[0]=88.46;
			infoObj.coordinates[1]=34.8;
			infoObj.scale=2100;
		}
		if(id == 6540){//伊犁哈萨克
			infoObj.coordinates[0]=87.56;
			infoObj.coordinates[1]=42.8;
			infoObj.scale=3500;
		}
		if(id == 6542){//塔城
			infoObj.coordinates[0]=90.56;
			infoObj.coordinates[1]=44.0;
			infoObj.scale=2800;
		}
		if(id == 6543){//阿勒泰
			infoObj.coordinates[0]=94.56;
			infoObj.coordinates[1]=45.5;
			infoObj.scale=2500;
		}
		if(id == 659001){//石河子市
			infoObj.coordinates[0]=86.041865;
			infoObj.coordinates[1]=44.308259;
			infoObj.scale=20000;
		}
		if(id == 659002){//阿拉布尔
			infoObj.coordinates[0]=81.8591;
			infoObj.coordinates[1]=40.946;
			infoObj.scale=30000;
		}
		if(id == 659003){//图木舒克市
			infoObj.coordinates[0]=79.198155;
			infoObj.coordinates[1]=39.889223;
			infoObj.scale=30000;
		}
		if(id == 659004){//五家渠
			infoObj.coordinates[0]=87.565449;
			infoObj.coordinates[1]=44.368899;
			infoObj.scale=20000;
		}

		return infoObj;
	}
	function yun_nanbox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 5301){//昆明
			infoObj.coordinates[0]=104.90;
			infoObj.coordinates[1]=24.70;
			infoObj.scale=7000;
		}
		if(id == 5303){//曲靖
			infoObj.coordinates[0]=107.26;
			infoObj.coordinates[1]=24.84;
			infoObj.scale=5000;
		}
		if(id == 5304){//玉溪
			infoObj.coordinates[0]=104.46;
			infoObj.coordinates[1]=23.50;
			infoObj.scale=7500;
		}
		if(id == 5305){//保山
			infoObj.coordinates[0]=101.50;
			infoObj.coordinates[1]=24.250;
			infoObj.scale=6500;
		}
		if(id == 5306){//昭通
			infoObj.coordinates[0]=106.66;
			infoObj.coordinates[1]=27.00;
			infoObj.scale=6500;
		}
		if(id == 5307){//丽江
			infoObj.coordinates[0]=102.96;
			infoObj.coordinates[1]=26.34;
			infoObj.scale=6500;
		}
		if(id == 5308){//普洱
			infoObj.coordinates[0]=103.46;
			infoObj.coordinates[1]=22.24;
			infoObj.scale=5000;
		}
		if(id == 5309){//临沧
			infoObj.coordinates[0]=102.06;
			infoObj.coordinates[1]=23.14;
			infoObj.scale=6000;
		}
		if(id == 5323){//楚雄
			infoObj.coordinates[0]=103.96;
			infoObj.coordinates[1]=24.54;
			infoObj.scale=6000;
		}
		if(id == 5325){//红河
			infoObj.coordinates[0]=105.66;
			infoObj.coordinates[1]=22.84;
			infoObj.scale=6000;
		}
		if(id == 5326){//文山
			infoObj.coordinates[0]=107.36;
			infoObj.coordinates[1]=22.84;
			infoObj.scale=6000;
		}
		if(id == 5328){//西双版纳
			infoObj.coordinates[0]=103.46;
			infoObj.coordinates[1]=21.00;
			infoObj.scale=6000;
		}
		if(id == 5329){//大理
			infoObj.coordinates[0]=102.66;
			infoObj.coordinates[1]=24.90;
			infoObj.scale=6000;
		}
		if(id == 5331){//德宏
			infoObj.coordinates[0]=100.26;
			infoObj.coordinates[1]=23.90;
			infoObj.scale=7500;
		}
		if(id == 5333){//怒江
			infoObj.coordinates[0]=101.76;
			infoObj.coordinates[1]=25.90;
			infoObj.scale=5000;
		}
		if(id == 5334){//迪庆
			infoObj.coordinates[0]=102.26;
			infoObj.coordinates[1]=27.30;
			infoObj.scale=6000;
		}
		return infoObj;
	}
	function guang_dongbox(id){
		var infoObj = {
			coordinates:[],
			scale:''
		};
		if(id == 4401){//guangdong
			infoObj.coordinates[0]=115.00;
			infoObj.coordinates[1]=22.81;
			infoObj.scale=10500;
		}
		if(id == 4402){//shaoguan
			infoObj.coordinates[0]=116.02;
			infoObj.coordinates[1]=24.10;
			infoObj.scale=7500;
		}
		if(id == 4403){//shenzhen
			infoObj.coordinates[0]=114.96;
			infoObj.coordinates[1]=22.30;
			infoObj.scale=20000;
		}
		if(id == 4404){//zhuhai
			infoObj.coordinates[0]=114.37;
			infoObj.coordinates[1]=21.95;
			infoObj.scale=20000;
		}
		if(id == 4405){//shantou
			infoObj.coordinates[0]=117.60;
			infoObj.coordinates[1]=23.00;
			infoObj.scale=18000;
		}
		if(id == 4406){//foushan
			infoObj.coordinates[0]=114.15;
			infoObj.coordinates[1]=22.8075;
			infoObj.scale=13000;
		}
		if(id == 4407){//jiangmen
			infoObj.coordinates[0]=114.05;
			infoObj.coordinates[1]=21.8075;
			infoObj.scale=10500;
		}
		if(id == 4408){//zhanjiang
			infoObj.coordinates[0]=112.25;
			infoObj.coordinates[1]=20.3075;
			infoObj.scale=8000;
		}
		if(id == 4409){//maoming
			infoObj.coordinates[0]=112.80;
			infoObj.coordinates[1]=21.5075;
			infoObj.scale=9000;
		}
		if(id == 4412){//zhaoqing
			infoObj.coordinates[0]=113.95;
			infoObj.coordinates[1]=22.9875;
			infoObj.scale=8500;
		}
		if(id == 4413){//huizhou
			infoObj.coordinates[0]=116.35;
			infoObj.coordinates[1]=22.70;
			infoObj.scale=9000;
		}
		if(id == 4414){//meizhou
			infoObj.coordinates[0]=117.70;
			infoObj.coordinates[1]=23.60;
			infoObj.scale=9000;
		}
		if(id == 4415){//shanwei
			infoObj.coordinates[0]=116.72;
			infoObj.coordinates[1]=22.60;
			infoObj.scale=13000;
		}
		if(id == 4416){//heyuan
			infoObj.coordinates[0]=116.87;
			infoObj.coordinates[1]=23.2875;
			infoObj.scale=8500;
		}
		if(id == 4417){//yangjiang
			infoObj.coordinates[0]=113.27;
			infoObj.coordinates[1]=21.5875;
			infoObj.scale=10500;
		}
		if(id == 4418){//qingyuan
			infoObj.coordinates[0]=115.17;
			infoObj.coordinates[1]=23.5875;
			infoObj.scale=7500;
		}
		if(id == 4419){//dongguan
			infoObj.coordinates[0]=115.17;
			infoObj.coordinates[1]=22.3875;
			infoObj.scale=12000;
		}
		if(id == 4420){//guangzhou
			infoObj.coordinates[0]=114.87;
			infoObj.coordinates[1]=22.0875;
			infoObj.scale=12000;
		}
		if(id == 4451){//chaozhou
			infoObj.coordinates[0]=117.70;
			infoObj.coordinates[1]=23.55;
			infoObj.scale=18000;
		}
		if(id == 4452){//jieyang
			infoObj.coordinates[0]=117.40;
			infoObj.coordinates[1]=22.95;
			infoObj.scale=12000;
		}
		if(id == 4453){//yunfu
			infoObj.coordinates[0]=113.17;
			infoObj.coordinates[1]=22.2875;
			infoObj.scale=10500;
		}
		return infoObj;
	}
});