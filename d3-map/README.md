#插件简介:  
基于d3.js完成的地图插件  
##功能.  
1. 可以进行地图的三级萃取，直辖市和特别行政区除外（它们只能切换的当前市，不能再往下级萃取）；  
2. 地图当前所在省市的状态会保存在localstorage中，例如，当前为四川，刷新之后还是四川地图；  
3.地图数据线的显示状态也存在localstorage中，例如，当前选择是显示时，则刷新页面后也是显示的状态；  
##需要满足的要求：  
1. 页面中要存在一个容器，用于装下地图，并且容器要有初始化的宽和高；  
2.使用方法，  
  drawMaps("monitor-map",province_name,parseInt(map_level),province_info);  
  //monitor-map为容器的id，  
  //province_name为省的名字，如“北京”，“四川”，当为空时，表示全国地图，注意，如果要初始化为市的地图，需要填写市的行政代码  
  //map_level为地图的级别，一级地图，即全国地图为0，二级为1，三级为2；  
  //province_info这是保存在localstorage中地图的信息，如果不需要记住当前地图所在省市，则不需要该参数  
 3.插件把地图的状态都保存在了localstorage中，如果需要保存地图当前显示的状态，在做初始化的时候，需要对localhost中的变量进行获取,具体如下：  
  var map_level = localStorage.getItem("map_level") || 0;//获取本地存储的地图级别，0为设置的初始化值  
  var province_in fo = JSON.parse(localStorage.getItem("province_info"));//获取本地存储的地图的相关信息，  
  var province_name = province_info?(map_level == 1 ? province_info.child_name : province_info.child_id) : "";//获取地图展示的省的名字，“”为初始化的值，为全国地图  
  drawMaps("monitor-map",province_name,parseInt(map_level),province_info);//调用接口，完成地图的绘画  
 4.使用该插件时，需要使用d3.json的方法对地图的json文件进行提取，因此需要搭建一个服务器。  
 5.另外，注意提取地图json文件的路径，在使用的过程中有可能会有变化
