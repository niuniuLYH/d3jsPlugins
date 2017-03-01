/**
 * 折线图 
 * @param IDnum
 * @returns
 */
function lineChartFun(dataOptions) {
	var defalutDataOptions = {//设置默认对象
		'containerId': '',
		'data': '',
		'colorArr': ["#9B69FB", "#9EC935", "#73E5FD", "#FA8356", "#466928", "#99CC33", "#00CBFF", "#005CFD", "#003399", "#8966FD"],
		'margin': {top: 30, right: 20, bottom: 30, left: 60},
		'legendWidth': '100',
		'axisName': ['数值', '时间'],
		'titleContent': '测试测试',
		'titleHeight': '40',
		'hasArea': true,
		'xDomain':[0,10],//默认的x的比例尺的自变量
		'yDomain':[1,100], //默认的y比例尺的自变量
		'durations':2000
	};
	var initDataOption = defalutDataOptions;//设置插件中使用的对象
	for (var tem in dataOptions) {
		initDataOption[tem] = dataOptions[tem];
	}
	var chartInfo = {
			svg_width: parseInt(d3.select("#" + initDataOption.containerId).style("width")),
			svg_height: parseInt(d3.select("#" + initDataOption.containerId).style("height")),
			xScale: "",//横坐标的比例尺
			yScale: ""//纵坐标的比例尺
		},
		width = chartInfo.svg_width - initDataOption.margin.left - initDataOption.margin.right - initDataOption.legendWidth,
		height = chartInfo.svg_height - initDataOption.margin.top - initDataOption.margin.bottom - initDataOption.titleHeight;

	//设置x轴和y轴的比例尺
	chartInfo.xScale = d3.scale.linear().domain(defalutDataOptions.xDomain).range([0, width]);//rangeRoundBands功能同rangeBands，但是该函数可以美化输出的区间段，也就是保证每个区间段的起点值都是整数。
	chartInfo.yScale = d3.scale.linear().domain(defalutDataOptions.yDomain).range([height, 0]);
	//定义x轴和y轴
	var xAxis = d3.svg.axis().scale(chartInfo.xScale).orient("bottom");
	var yAxis = d3.svg.axis().scale(chartInfo.yScale).orient("left").ticks(5);
	var svg = d3.select("#" + initDataOption.containerId).append("svg")
		.attr({
			"width": "100%",
			"height": "100%",
			'preserveAspectRatio': 'xMidYMid meet',
			"viewBox": "0 0 " + chartInfo.svg_width + " " + chartInfo.svg_height
		})
		.append("g")
		.attr("class", "graph")
		.attr("transform", "translate(" + initDataOption.margin.left + "," + initDataOption.margin.top + ")");
	//生成侧边栏name的包含框
	var title_g = svg.append("g")
		.attr("class", "legend_name_g")
		.attr("transform", "translate(" + width + "," + initDataOption.margin.top + ")");
	//生成图表标题
	var title_x = (width - (+initDataOption.legendWidth))/2;//initDataOption.legendWidth原本是一个字符串，使用+将取得字符串的数字部分。功能类似于jQuery的parseFloat()方法
	var title_y = 0;
	var title_con = svg.append('g')
		.attr('class','title_con')
		.append('text')
		.text(initDataOption.titleContent)
		.attr("x",title_x)
		.attr("y",title_y);

	//添加x轴
	var xBar = svg.append("g")
		.attr("class", "line-chart-x axis")
		.attr("transform", "translate(0," + (+height + +initDataOption.titleHeight) + ")")
		.call(xAxis);

	xBar.append("text")
		.attr("x", width)
		.attr("dx", "3em")
		.style("text-anchor", "end")
		.text(initDataOption.axisName[1]);

	//添加y轴
	var yBar = svg.append("g")
		.attr("class", "line-chart-y axis")
		.attr("transform", "translate(0,"+ initDataOption.titleHeight +")")
		.call(yAxis);//给当前选择到的元素调用yAxis方法;

	yBar.append("text")
		.attr("y", 6)
		.attr("dy", "-2em")
		.style("text-anchor", "end")
		.text(initDataOption.axisName[0]);

	if (initDataOption.hasArea) {
		d3.selectAll(".line-chart-y").selectAll("line")
			.transition()
			.duration(initDataOption.durations)
			.attr({x2: width});//网格的水平线
	}
	d3.selectAll(".line-chart-x").selectAll("line")
		.transition()
		.duration(initDataOption.durations)
		.attr({y2: "-" + height});

	//生成曲线包含框
	var path_container = svg.append("g")
		.attr("class", "path_container")
		.attr("transform", "translate(0,"+ initDataOption.titleHeight +")");

	//生成tooltip框
	var bar_tooltips = d3.select("body").append("div")
		.attr("class", "tooltip")
		.style('display','none');
	//定义标记包含框
	var mark_container = svg.append("g")
		.attr('class', 'mark_g')
		.attr("transform", "translate(0,"+ initDataOption.titleHeight +")");
	//生成圆点包含框
	var pointer_container = svg.append("g").attr("class", "path_container");
	/**统计图的条条的动画**/
	lineChartFresh(initDataOption.data);
	function lineChartFresh(data) {
		/**数据处理**/
		var userData = data.data_arr;
		path_container.selectAll("*").remove();
		mark_container.selectAll("*").remove();
		var mark_g = mark_container.selectAll('g').data(userData).enter().append('g');
		if(userData.length > 0) {
			var dataObj = {
					dataValue: [],//数据的所有值的数组
					nameArr: [],//数据中每一项的名字
					name_color: [],//每一项数据的英文名、中文名和颜色的映射关系,
					each_name: data.host_name_map//各个内容项的名字
				},
				COLOR_INDEX = 0;

			for (var j in data.data_arr[1]) {//几种图的数据接口名称
				if (j != 'day') {
					var name_obj = {
						'color': initDataOption.colorArr[COLOR_INDEX],
						'C_name': dataObj.each_name[j],
						'E_name': j
					};
					dataObj.name_color.push(name_obj);
					COLOR_INDEX++;
				}
			}
			for (var i in userData) {
				if (i != "remove") {
					for (var key_num in userData[i]) {
						key_num != "day" && dataObj.dataValue.push(userData[i][key_num]);//将所有的value值放进数组中
					}
				}
			}
			var max_value = d3.max(dataObj.dataValue);//获取所有value中最大的值
			var X_test_arr = userData.map(function (d) {return d.day;});

			chartInfo.xScale.domain([0, X_test_arr.length > 0 ? X_test_arr.length - 1 : defalutDataOptions.xDomain[1]]);//当数据中的值的长度为零时，使用默认的值
			chartInfo.yScale.domain([0, max_value > 0 ? max_value : defalutDataOptions.yDomain[1]]);//当数据中都为0，没办法给y轴设置自变量时，使用默认的值

			xAxis.scale(chartInfo.xScale).ticks(X_test_arr.length > 0 ? X_test_arr.length - 1 : defalutDataOptions.xDomain[1]);
			yAxis.scale(chartInfo.yScale);

			xBar.transition().duration(initDataOption.durations).call(xAxis);
			yBar.transition().duration(initDataOption.durations).call(yAxis);
			//通过编号获取对应的横轴标签
			xBar.selectAll("text")
				.text(function (d) {return X_test_arr[d];});

			if (initDataOption.hasArea) {
				d3.selectAll(".line-chart-y").selectAll("line")
					.transition()
					.duration(initDataOption.durations)
					.attr({x2: width});//网格的水平线
			}
			d3.selectAll(".line-chart-x").selectAll("line")
				.transition()
				.duration(initDataOption.durations)
				.attr({y2: "-" + height});//网格的竖直线

			//定义画线函数
			var line = d3.svg.line()
				.x(function (d, i) {return chartInfo.xScale(i);})
				.y(function (d) {return chartInfo.yScale(d);})
				.interpolate('linear');

			if (initDataOption.hasArea) {
				//定义画面积函数
				var area = d3.svg.area()
					.x(function (d, i) {return chartInfo.xScale(i);})
					.y0(height)
					.y1(function (d) {return chartInfo.yScale(d);});
				createGradient(dataObj.name_color);
			}

			/**生成标记的矩形**/
			mark_g.append('rect')
				.attr({
					'class':'mark-rect',
					'x':function (d, i) {return chartInfo.xScale(i);},
					'height':height,
					'width':function(d,i){return chartInfo.xScale(+i + 1) - chartInfo.xScale(i);},
					'fill-opacity':0
				});

			/**生成标记的竖线**/
			mark_g.append('line')
				.attr({
					'class':'mark-line',
					'x1':function(d,i){return chartInfo.xScale(i);},
					'y1': 0,
					'y2': height,
					'x2':function (d, i) {return chartInfo.xScale(i);},
					'stroke-width':2
				});

			for (var item_num in dataObj.name_color) {
				path_container.append("path")//画曲线
					.attr("class", "chart-polyline")
					.datum(function () {
						var test_arr = [];
						userData.forEach(function (value, index) {
							test_arr.push(value[dataObj.name_color[item_num].E_name]);
						});
						return test_arr;
					})
					.transition()
					.duration(initDataOption.durations)
					.ease('bounce')
					.attr("d", line)
					.attr("stroke", dataObj.name_color[item_num].color)
					.attr("fill", "none");

				/**生成标记的外圆*/
				mark_g.append('circle')
					.attr({
						"class": "mark-points-m",
						'cx':function (d, i) {return chartInfo.xScale(i);},
						'cy':function (d) {return chartInfo.yScale(d[dataObj.name_color[item_num].E_name]);},
						'fill': dataObj.name_color[item_num].color,
						'fill-opacity':0.3,
						'stroke':dataObj.name_color[item_num].color,
						'r':8
					});
				if (initDataOption.hasArea) {
					path_container.append("path")//画面积
						.datum(function () {
							var test_arr = [];
							userData.forEach(function (value, index) {
								test_arr.push(value[dataObj.name_color[item_num].E_name]);
							});
							return test_arr;
						})
						.transition()
						.duration(initDataOption.durations)
						.ease('bounce')
						.attr("d", area)
						.attr("stroke", "none")
						.attr("fill", "url(#gradient_" + dataObj.name_color[item_num].E_name + ")");
					/**生成标记的内圆*/
					mark_g.append('circle')
						.attr({
							"class": "mark-points-m",
							'cx':function (d, i) {return chartInfo.xScale(i);},
							'cy':function (d) {return chartInfo.yScale(d[dataObj.name_color[item_num].E_name]);},
							'fill': dataObj.name_color[item_num].color,
							'fill-opacity':1,
							'stroke':dataObj.name_color[item_num].color,
							'r':3
						});

				} else {

					var points = pointer_container.selectAll("chart-points").data(userData).enter();//画曲线上的点
					points.append("circle")//折线上的圆点
						.attr("class", "chart-points")
						.transition()
						.duration(initDataOption.durations)
						.attr("cx", function (d, i) {return chartInfo.xScale(i);})
						.attr("cy", function (d) {return chartInfo.yScale(d[dataObj.name_color[item_num].E_name]);})
						.attr("fill", dataObj.name_color[item_num].color)
						.attr("r", 2);
				}
			}
			//生成侧边title
			line_draw_title(dataObj.name_color, title_g);

			mark_g.data(userData).on('mouseover',function(d,i){
				var target_dom = d3.event.target.parentNode;
				d3.select(target_dom).selectAll('line,circle').style('display','inline-block');

				var html_text =  d.day + '<br/>';
				for(var name_key in d){
					name_key != 'day' && (html_text += dataObj.each_name[name_key] + '：' + d[name_key] + '<br/>');
				}
				bar_tooltips
					.html(html_text)
					.style({
						'left':d3.event.pageX + 10 + 'px',
						'top':d3.event.pageY + 10 + 'px',
						'display':'block'
					})
			}).on("mousemove", function (d) {
					var target_dom = d3.event.target.parentNode;
					d3.select(target_dom).selectAll('line,circle').style('display','inline-block');
				bar_tooltips.style({
					'display':'block',
					'left':d3.event.pageX + 10 + 'px',
					'top':d3.event.pageY + 10 + 'px'
				});
			}).on("mouseout", function (d) {
					var target_dom = d3.event.target.parentNode;
					d3.select(target_dom).selectAll('line,circle').style('display','none');
					bar_tooltips.style({
						'display':'none'
					});
				})
		}
		return lineChartFresh;
	}
}

/**
 * 生成侧边栏的title
 * @param each_name
 */
function line_draw_title(name_color,title_con_g){
	var margin = {top: 50, right: 50, bottom: 20, left: 20};
	for(var i in name_color){
		if(i != "remove" ){
			var title_g = title_con_g.append("g")
				.attr({
					"transform":"translate(" + margin.left + "," +  i * 30 +")"
				});
			title_g.append("rect")
				.attr({
					"x":"10",
					"y":"10",
					"width":"10",
					"height":"10",
					"stroke":name_color[i].color,
					"fill":name_color[i].color,
					"transform":"translate(0,0)"
				});
			title_g.append("text")
				.attr({
					"transform":"translate(30,20)"
				})
				.text(name_color[i].C_name);
		}
	}
}

/**
 * 根据数据的个数生成不同的滤镜
 * @param item_name -- 数据的name数组
 * @param color_arr -- 备用的颜色数组
 */
function createGradient(name_color){
	var svg = d3.select(".graph").append("g").attr("class","gradient_g");
	for(var item_i in name_color) {
		var linear_gradient = svg.append("defs")
			.append("linearGradient")
			.attr({
				"id":"gradient_" + name_color[item_i].E_name,
				"x1" : "0%",
				"y1" : "0%",
				"x2" : "0%",
				"y2" : "100%"
			});
		linear_gradient.append("stop")
			.attr({
				"offset":"0%",
				"stop-color":name_color[item_i].color,
				"stop-opacity":0.3
			});
		linear_gradient.append("stop")
			.attr({
				"offset":"100%",
				"stop-color":name_color[item_i].color,
				"stop-opacity":0.1
			});
	}
}