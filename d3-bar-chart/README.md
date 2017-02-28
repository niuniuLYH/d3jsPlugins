#统计图的使用方法
##统计图方法传递的参数详解
  dataOptions{
   'containerId':'cpu-div',  -- 图表的包含框的id。类型：字符串
 	'data':cpu, -- 传递的数据结构。类型：对象
 	'colorArr':color_arr, -- 颜色数组。类型：数组	
  'margin':{top: 30, right: 50, bottom: 30, left: 0}, -- 图表和包含框之间的距离。 类型：对象	
  'legendWidth':100, -- 图例的宽度定义 类型：数字类型	
  'axisName' : ["%",""], -- x轴和y轴的名字，类型：数组，分别存放x轴和y轴的名字 
	'titleContent':'CPU', -- 图表的title。类型：字符串 
  'titleHeight':40 -- 图表title的高度。类型：数字类型
  }
 ##统计图数据类型格式
 {
             'memory': {
                 "pga": {//数据的英文名 
                     "name": "PGA",//中文名
                     "value": "700"//值
                 },
                 "sga": {
                     "name": "sga",
                     "value": "200"
                 },
                 "shared_io": {
                     "name": "共享I/O池",
                     "value": "400"
                 },
                 "java_pool": {
                     "name": "JAVA池",
                     "value": "500"
                 },
                 "shared_pool": {
                     "name": "共享池",
                     "value": "500"
                 },
                 "large_pill": {
                     "name": "大型池",
                     "value": "420"
                 },
                 "buffer_cache": {
                     "name": "缓冲区高速缓存",
                     "value": "700"
                 }
             }
         }
         多个图表使用一个数据结构传递时，请参考resources/bar-chart-data.json
       ##使用规则  
       1.图表包含框必须要有一个初始化的宽度和高度。
       2.图标样式修改，参考css/barChart.css
