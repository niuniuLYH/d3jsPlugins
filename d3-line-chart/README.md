# 基于d3.js封装的折线图插件
#折线图的使用方法
###折线图方法传递的参数详解
	dataOptions{  
	'containerId':'cpu-div',--图表的包含框的id。类型：字符串，【必要值，且不能为空】  
	'data':cpu,--传递的数据结构。类型：对象【必要值，且不能为空】  
	'colorArr':color_arr,--颜色数组。类型：数组【不必要值，可不要该项】  
	'margin':{top: 30, right: 50, bottom: 30, left: 0},--图表和包含框之间的距离。 类型：对象 【不必要值，可不要该项】  
	'legendWidth':100,--图例的宽度定义 类型：数字类型【不必要值，可不要该项】  
	'axisName':["%",""],--x轴和y轴的名字，类型：数组，分别存放x轴和y轴的名字【必须值】  
	'titleContent':'CPU',--图表的title。类型：字符串【不必要值，可不要该项】  
	'titleHeight':40,--图表title的高度。类型：数字类型【不必要值，可不要该项】  
  'hasArea': true,--是否画出折线图表面积【不必要值，默认是为显示，false为不显示，可不要该项】 	
  'xDomain':[0,10],--x的比例尺的自变量【不必要值，可不要该项】  
  'yDomain':[1,100],--y比例尺的自变量【不必要值，可不要该项】
  'durations':2000,--动画的过度时间，时间单位为ms【不必要值，可不要该项】  
  	}  
###折线图数据类型格式
 {  
  "data_arr": [//所有折线的数据  
    {  
      "day": "1:10",//自变量  
      "cpu": "500",//对应自变量的cpu的值  
      "memory": "220",//对应的自变量的memory的值  
      "userIO": "320",//对应自变量的userIO的值  
      "test": "100" //对应自变量的test的值 
    },//这里可以有多个类似cpu,memeory,userIO,test的关键字  
    {  
      "day": "2:10",  
      "cpu": "213",  
      "memory": "123",  
      "userIO": "432",  
      "test": "370"  
    },  
    {  
      "day": "3:10",  
      "cpu": "109",  
      "memory": "128",  
      "userIO": "304",  
      "test": "276"  
    },  
    {  
      "day": "4:10",  
      "cpu": "200",  
      "memory": "324",  
      "userIO": "102",  
      "test": "457"  
    }  
  ],  
  "host_name_map":{//每一个值的中文名，以上有多个关键词，这个对象要对应的关键词的中文名  
    "cpu":"CPU",  
    "test":"测试",  
    "memory":"内存",  
    "userIO":"用户IO"  
  }  
}  
  多个图表使用一个数据结构传递时，请参考resources/line-chart-datas.json  
###使用规则
       1. 图表包含框必须要有一个初始化的宽度和高度。
       2. 图标样式修改，参考css/barChart.css  
       3. 具体调用方法，参考pages/index.html
