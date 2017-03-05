//;(function(window,document,undefined){

/**
* 分区业务状况一览图,条形图
* dataOptions -- 数据的对象
* @returns -- 条形图的container
*/
function barChart() {
    var this_ = this;
    this_.defalutOptions = {//设置默认对象
    'containerId':'',
    'colorArr':["#9B69FB","#9EC935","#73E5FD","#FA8356","#466928","#99CC33","#00CBFF","#005CFD","#003399","#8966FD"],
    'margin':{top: 30, right: 50, bottom: 30, left: 0},
    'legendWidth':'100',
    'axisName' : ['数值','时间'],
    'titleContent':'',
    'titleHeight':'40',
    'xDomain':[0,400],//默认的x的比例尺的自变量
    'yDomain':[1,2,3,4,5],//默认的y比例尺的自变量
    'durations':2000//默认的动画过度时间
};

    this_.initBarChart = function (dataOptions) {
        this_.initOption = {};//设置插件中使用的对象
        this_.initOption = this_.defalutOptions;

        for(var tem in dataOptions){
            this_.initOption[tem]=dataOptions[tem];
        }

        this_.chartInfo = {
            svg_width: parseInt(d3.select("#"+this_.initOption.containerId).style("width")),
            svg_height : parseInt(d3.select("#"+this_.initOption.containerId).style("height")),
            xScale:"",//横坐标的比例尺
            yScale:"",//纵坐标的比例尺
            width : '',
            height : '',
            xAxis:'',
            yAxis:''
        };
        this_.chartInfo.width = this_.chartInfo.svg_width - this_.initOption.margin.left - this_.initOption.margin.right - this_.initOption.legendWidth;
        this_.chartInfo.height = this_.chartInfo.svg_height - this_.initOption.margin.top - this_.initOption.margin.bottom - this_.initOption.titleHeight;

        this_.chartInfo.xScale = d3.scale.linear().domain(this_.defalutOptions.xDomain).range([0, this_.chartInfo.width]);
        this_.chartInfo.yScale = d3.scale.ordinal().domain(this_.defalutOptions.yDomain).rangeRoundBands([this_.chartInfo.height, 0], .1);

        this_.chartInfo.xAxis = d3.svg.axis().scale(this_.chartInfo.xScale).orient("bottom");
        this_.chartInfo.yAxis = d3.svg.axis().scale(this_.chartInfo.yScale).orient("left");

        var svg = d3.select("#"+this_.initOption.containerId).append("svg")
            .attr({
                "width":"100%",
                "height":"100%",
                'preserveAspectRatio': 'xMidYMid meet',
                "viewBox":"0 0 "+ this_.chartInfo.svg_width +" "+ this_.chartInfo.svg_height
            })
            .append("g")
            .attr("class", "graph")
            .attr("transform", "translate(" + this_.initOption.margin.left + "," + this_.initOption.margin.top + ")");

        //生成侧边栏name的包含框
        this_.legend_con_g = svg.append("g")
            .attr("class","legend_name_g")
            .attr("transform","translate(0,0)");

        //生成图表标题
        var title_x = (this_.chartInfo.width + (+this_.initOption.legendWidth) * 2)/2;//initOption.legendWidth原本是一个字符串，使用+将取得字符串的数字部分。功能类似于js的Number()方法
        var title_y = this_.chartInfo.height + +this_.initOption.titleHeight;
        var title_con = svg.append('g')
            .attr('class','title_con')
            .append('text')
            .text(this_.initOption.titleContent)
            .attr("x",title_x)
            .attr("y",title_y);

        this_.x_axis_con = svg.append("g")
            .attr("class", "bar-chart-x axis")
            .attr("transform", "translate(" + this_.initOption.legendWidth + " , " + this_.chartInfo.height + ")")
            .call(this_.chartInfo.xAxis);

        this_.x_axis_con.append("text")
            .attr("x", this_.chartInfo.width)
            .attr("dx", "2em")
            .style("text-anchor", "end")
            .text(this_.initOption.axisName[0]);

        this_.y_axis_con = svg.append("g")
            .attr('class', 'bar-chart-y axis')
            .attr('transform', 'translate('+ this_.initOption.legendWidth +',0)')
            .call(this_.chartInfo.yAxis);

        this_.y_axis_con.append("text")
            .attr("y", 6)
            .attr("dy", "-2em")
            .style("text-anchor", "end")
            .text(this_.initOption.axisName[1]);

        this_.y_axis_con.selectAll("g").selectAll("text").style('display','none');
        d3.selectAll(".bar-chart-x").selectAll("line")
            .transition()
            .duration(this_.initOption.durations)
            .attr({y2:'-' + this_.chartInfo.height});//网格的水平线

        this_.bars = svg.append('g')
            .attr('transform','translate('+ this_.initOption.legendWidth +',0)')
            .attr('class','bar-container');

        //生成tooltip框
        this_.bar_tooltips = d3.select("body").append("div")
            .attr("class", "ret-code-tooltip tooltip")
            .style('display','none');
    };

    this_.refreshChart = function(data){
        /**数据处理**/
        this_.bars.selectAll("*").remove();
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
                        "color":this_.initOption.colorArr[COLOR_INDEX],
                        "value":_value
                    };
                    dataObj.name_color.push(data_info);
                }
                _value && dataObj.dataValue.push(_value);
                _name && dataObj.nameArr.push(_name);
                COLOR_INDEX++;
            }
            var xValueMax = d3.max(dataObj.dataValue);
            this_.chartInfo.xScale.domain([0, xValueMax == 0 ? defalutOptions.xDomain[1] : xValueMax]);//当数据中的值的长度为零时，使用默认的值
            this_.chartInfo.yScale.domain(dataObj.nameArr.length > 0 ? dataObj.nameArr : this_.defalutOptions.yDomain);//当数据中都为0，没办法给y轴设置自变量时，使用默认的值

            this_.chartInfo.xAxis.scale(this_.chartInfo.xScale);
            this_.chartInfo.yAxis.scale(this_.chartInfo.yScale);

            this_.x_axis_con.transition().duration(this_.initOption.durations).call(this_.chartInfo.xAxis);
            this_.y_axis_con.transition().duration(this_.initOption.durations).call(this_.chartInfo.yAxis);
            this_.y_axis_con.selectAll("g").selectAll("text").style('display','none');

            d3.selectAll(".bar-chart-x").selectAll("line")
                .transition()
                .duration(this_.initOption.durations)
                .attr({y2:'-' + this_.chartInfo.height});//网格的水平线

            var barHeightInit = this_.chartInfo.height / dataObj.name_color.length - 10;
            var barsHeight = barHeightInit > 25 ? 25 : barHeightInit ;

            var bars_rect = this_.bars
                .selectAll(".bar")
                .data(dataObj.name_color)
                .enter()
                .append("rect")
                .attr({
                    'class':'sum-grap-bar',
                    'x':  this_.chartInfo.xScale(0),
                    'y':function(d,i) {
                        var setBarH = this_.chartInfo.yScale(d.C_name);
                        if(barsHeight = 25){
                            return setBarH + (this_.chartInfo.yScale.rangeBand() - 25) / 2;
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
            var bars_text = this_.bars
                .selectAll("text")
                .data(dataObj.name_color)
                .enter()
                .append('text')
                .attr({
                    'x':function(d,i){
                        return this_.chartInfo.xScale(d.value);
                    },
                    'y':function(d,i){
                        var setBarH = this_.chartInfo.yScale(d.C_name);
                        if(barsHeight = 25){
                            return setBarH + (this_.chartInfo.yScale.rangeBand() - 25) / 2 + barsHeight * 0.67;
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
                .duration(this_.initOption.durations)
                .style('display','inline-block');
            /**统计图的条条的动画**/
            bars_rect.attr('width',function(){return 0})
                .transition()
                .delay(function(d,i){
                    return i * 50;
                })
                .duration(this_.initOption.durations)
                .ease('bounce')
                .attr('width',function(d){
                    return this_.chartInfo.xScale(d.value)
                });

            //生成图例
            this_.barDrawTitle(dataObj.name_color);

            bars_rect.on('mouseover', function (d) {
                this_.bar_tooltips
                    .html(d.C_name + '：'+ d.value)
                    .style({
                        'left':d3.event.pageX + 10 + 'px',
                        'top':d3.event.pageY + 10 + 'px',
                        'display':'block'
                    })
                })
                .on("mousemove", function (d) {
                    this_.bar_tooltips.style({
                        //'display':'block',
                        'left':d3.event.pageX +10 + 'px',
                        'top':d3.event.pageY + 10 + 'px'
                    });
                })
                .on("mouseout", function (d) {
                    this_.bar_tooltips.style({
                        'display':'none'
                    });
                });
            }
    };

    /**生成图表的图例**/
    this_.barDrawTitle = function(name_color){
        var margin = {top: 50, right: 50, bottom: 20, left: 20};
        this_.legend_con_g.selectAll("g").remove();
        for(var i in name_color){
            if(i != "remove" ){
                var title_g = this_.legend_con_g.append("g")
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

}

