
/**
 * 分区业务状况一览图,条形图
 * dataOptions{
 *  'containerId':'cpu-div', -- 图表的包含框的id
 *	'data':cpu, -- 传递过来的数据
 *	'colorArr':color_arr, -- 颜色数组
	'margin':{top: 30, right: 50, bottom: 30, left: 0}, -- 图表和包含框之间的距离
	'legendWidth':'100', -- 图例的宽度定义 --
	'axisName' : ["%",""], -- x轴和y轴的名字，
	'titleContent':'CPU', -- 图表的title
	'titleHeight':'40' -- 图表title的高度
 * }
 * @returns -- 条形图的container
 */
function barChart(dataOptions) {
	var defalutDataOptions = {//设置默认对象
		'containerId':'',
		'data':'',
		'colorArr':["#9B69FB","#9EC935","#73E5FD","#FA8356","#466928","#99CC33","#00CBFF","#005CFD","#003399","#8966FD"],
		'margin':{top: 30, right: 50, bottom: 30, left: 0},
		'legendWidth':'100',
		'axisName' : ['数值','时间'],
		'titleContent':'',
		'titleHeight':'40',
		'xDomain':[0,400],//默认的x的比例尺的自变量
		'yDomain':[1,2,3,4,5]//默认的y比例尺的自变量
	};
	var initDataOption = {};//设置插件中使用的对象

	for(var initTem in defalutDataOptions){
		initDataOption[initTem]=defalutDataOptions[initTem];
	}
	for(var tem in dataOptions){
		initDataOption[tem]=dataOptions[tem];
	}

	var chartInfo = {
		svg_width: parseInt(d3.select("#"+initDataOption.containerId).style("width")),
		svg_height : parseInt(d3.select("#"+initDataOption.containerId).style("height")),
		xScale:"",//横坐标的比例尺
		yScale:""//纵坐标的比例尺
	},
	DURATION = 2000,
	width = chartInfo.svg_width - initDataOption.margin.left - initDataOption.margin.right - initDataOption.legendWidth,
	height = chartInfo.svg_height - initDataOption.margin.top - initDataOption.margin.bottom - initDataOption.titleHeight;

	chartInfo.xScale = d3.scale.linear().domain(defalutDataOptions.xDomain).range([0, width]);
	chartInfo.yScale = d3.scale.ordinal().domain(defalutDataOptions.yDomain).rangeRoundBands([height, 0], .1);

	var xAxis = d3.svg.axis().scale(chartInfo.xScale).orient("bottom");
	var yAxis = d3.svg.axis().scale(chartInfo.yScale).orient("left");

	var svg = d3.select("#"+initDataOption.containerId).append("svg")
		.attr({
			"width":"100%",
			"height":"100%",
			'preserveAspectRatio': 'xMidYMid meet',
			"viewBox":"0 0 "+ chartInfo.svg_width +" "+ chartInfo.svg_height
		})
		.append("g")
		.attr("class", "graph")
		.attr("transform", "translate(" + initDataOption.margin.left + "," + initDataOption.margin.top + ")");

	//生成侧边栏name的包含框
	var legend_con_g = svg.append("g")
		.attr("class","legend_name_g")
		.attr("transform","translate(0,0)");

	//生成图表标题
	var title_x = (width + (+initDataOption.legendWidth) * 2)/2;//initDataOption.legendWidth原本是一个字符串，使用+将取得字符串的数字部分。功能类似于jQuery的parseFloat()方法
	var title_y = height + +initDataOption.titleHeight;
	var title_con = svg.append('g')
		.attr('class','title_con')
		.append('text')
		.text(initDataOption.titleContent)
		.attr("x",title_x)
		.attr("y",title_y);

	var x_axis_con = svg.append("g")
		.attr("class", "bar-chart-x axis")
		.attr("transform", "translate(" + initDataOption.legendWidth + " , " + height + ")")
		.call(xAxis);

	x_axis_con.append("text")
		.attr("x", width)
		.attr("dx", "2em")
		.style("text-anchor", "end")
		.text(initDataOption.axisName[0]);

	var y_axis_con = svg.append("g")
		.attr('class', 'bar-chart-y axis')
		.attr('transform', 'translate('+ initDataOption.legendWidth +',0)')
		.call(yAxis);

	y_axis_con.append("text")
		.attr("y", 6)
		.attr("dy", "-2em")
		.style("text-anchor", "end")
		.text(initDataOption.axisName[1]);

	y_axis_con.selectAll("g").selectAll("text").style('display','none');
	d3.selectAll(".bar-chart-x").selectAll("line")
		.transition()
		.duration(DURATION)
		.attr({y2:'-' + height});//网格的水平线

	var bars = svg.append('g')
		.attr('transform','translate('+ initDataOption.legendWidth +',0)')
		.attr('class','bar-container');

	//生成tooltip框
	var bar_tooltips = d3.select("body").append("div")
		.attr("class", "ret-code-tooltip tooltip")
		.style('display','none');

	drawChartFresh(initDataOption.data);
	function drawChartFresh(data){
		/**数据处理**/
		bars.selectAll("*").remove();
		if(JSON.stringify(data) != "{}"){//排除传递空数据时的情况
			var COLOR_INDEX = 0;
			var dataObj = {
					dataValue :[],//数据的所有值的数组
					nameArr : [],//数据中每一项的名字
					name_color:[]//每一项数据的英文名、中文名和颜色的映射关系
				};
			for(var key in data){
				var _name = data[key].name;//数据的名字数组
				var _value = data[key].value;//数据的值数组
				if(_value){
					var data_info = {
						"C_name":data[key].name,
						"E_name":key,
						"color":initDataOption.colorArr[COLOR_INDEX],
						"value":_value
					};
					dataObj.name_color.push(data_info);
				}
				_value && dataObj.dataValue.push(_value);
				_name && dataObj.nameArr.push(_name);
				COLOR_INDEX++;
			}
			var xValueMax = d3.max(dataObj.dataValue);
			chartInfo.xScale.domain([0, xValueMax == 0 ? defalutDataOptions.xDomain[1] : xValueMax]);//当数据中的值的长度为零时，使用默认的值
			chartInfo.yScale.domain(dataObj.nameArr.length > 0 ? dataObj.nameArr : defalutDataOptions.yDomain);//当数据中都为0，没办法给y轴设置自变量时，使用默认的值

			xAxis.scale(chartInfo.xScale);
			yAxis.scale(chartInfo.yScale);

			x_axis_con.transition().duration(DURATION).call(xAxis);
			y_axis_con.transition().duration(DURATION).call(yAxis);
			y_axis_con.selectAll("g").selectAll("text").style('display','none');

			d3.selectAll(".bar-chart-x").selectAll("line")
				.transition()
				.duration(DURATION)
				.attr({y2:'-' + height});//网格的水平线

			var barHeightInit = height / dataObj.name_color.length - 10;
			var barsHeight = barHeightInit > 25 ? 25 : barHeightInit ;

			var bars_rect = bars
				.selectAll(".bar")
				.data(dataObj.name_color)
				.enter()
				.append("rect")
				.attr({
					'class':'sum-grap-bar',
					'x':  chartInfo.xScale(0),
					'y':function(d,i) {
						var setBarH = chartInfo.yScale(d.C_name);
						if(barsHeight = 25){
							return setBarH + (chartInfo.yScale.rangeBand() - 25) / 2;
						}else{
							return setBarH;
						}
					},
					'height':barsHeight,
					'rx':4,
					'ry':4,
					'fill':function(d,i){
						return d.color;
					}
				});
			/***设置统计图右侧的值**/
			var bars_text = bars
				.selectAll("text")
				.data(dataObj.name_color)
				.enter()
				.append('text')
				.attr({
					'x':function(d,i){
						return chartInfo.xScale(d.value);
					},
					'y':function(d,i){
						var setBarH = chartInfo.yScale(d.C_name);
						if(barsHeight = 25){
							return setBarH + (chartInfo.yScale.rangeBand() - 25) / 2 + barsHeight * 0.67;
						}else{
							return setBarH + barsHeight * 0.67;
						}
					},
					'dx':'1em',
					'fill':'#5BA9C9'
				})
				.style({
					'display':'none',
					'font-size':'12px'
				})
				.text(function(d,i){
					return d.value;
				});
			/**设置统计图的value值的显示**/
			bars_text
				.transition()
				.delay(function(){
					return 50 * dataObj.name_color.length + 2000;
				})
				.duration(DURATION)
				.style('display','inline-block');
			/**统计图的条条的动画**/
			bars_rect.attr('width',function(){return 0})
				.transition()
				.delay(function(d,i){
					return i * 50;
				})
				.duration(DURATION)
				.ease('bounce')
				.attr('width',function(d){
					return chartInfo.xScale(d.value)
				});

			//生成图例
			bar_draw_title(dataObj.name_color,legend_con_g);

			bars_rect.on('mouseover', function (d) {
				bar_tooltips
					.html(d.C_name + '：'+ d.value)
					.style({
						'left':d3.event.pageX + 'px',
						'top':d3.event.pageY + 'px',
						'display':'block'
					})
				})
				.on("mousemove", function (d) {
					bar_tooltips.style({
						//'display':'block',
						'left':d3.event.pageX + 'px',
						'top':d3.event.pageY + 'px'
					});
				})
				.on("mouseout", function (d) {
					bar_tooltips.style({
						'display':'none'
					});
				});
			}
	}
	return drawChartFresh;
}

/**
 * 生成侧边栏的title
 * @param each_name
 */
function bar_draw_title(name_color,title_con_g){
	var margin = {top: 50, right: 50, bottom: 20, left: 20};
	title_con_g.selectAll("g").remove();
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
			appendMultiText(title_g,name_color[i].C_name,25,7,50,12,'微软雅黑');
		}
	}
}
