## 插件简介:  
基于d3.js完成的地图插件  
### 功能.  
1. 可以进行地图的三级萃取，直辖市和特别行政区除外（它们只能切换的当前市，不能再往下级萃取）；  
2. 地图当前所在省市的状态会保存在localstorage中，例如，当前为四川，刷新之后还是四川地图；  
3. 地图数据线的显示状态也存在localstorage中，例如，当前选择是显示时，则刷新页面后也是显示的状态；
### 目录介绍
#### page目录：  
    page目录中只有一个文件，即index.html。这里面包含创建地图包含框的html代码和css样式，地图插件的使用也在该文件中  
#### static目录
    static目录中又有3个文件夹，分别是css，js和img
##### css目录
     里面是设置插件里面地图的样式
##### js目录
其中包含 三个js。
- d3.js是d3的框架文件，  
- mapPlugins.js为地图插件主模块，
- require.js 因插件使用了requirejs+AMD规范，所以引用了require.js
### 需要满足的要求：  
1. 页面中要存在一个容器，用于装下地图，并且容器要有初始化的宽和高；  
2. 使用方法，   
用require加载模块，取到模块返回回来的接口，再使用。  
var dataOptions1 = {  
                containerId:'mapDiv',  
                province_name : province_name,  
                map_level: parseInt(map_level),  
                province_info : province_info  
            };    
  require(['d3js','monitorMap'], function (d3,exportObj) {  
      var mapExample1 = new exportObj(dataOptions1);  
      mapExample1.drawMaps();  
    });  
##### dataOptions1为初始化的是数据  
  - containerId为容器的id，  
  - province_name为省的名字，如“北京”，“四川”，当为空时，表示全国地图，注意，如果要初始化为市的地图，需要填写市的行政代码  
  - map_level为地图的级别，一级地图，即全国地图为0，二级为1，三级为2；  
  - province_info这是保存在localstorage中地图的信息，如果不需要记住当前地图所在省市，则不需要该参数  
  3. 插件把地图的状态都保存在了localstorage中，如果需要保存地图当前显示的状态，在做初始化的时候，需要对localhost中的变量进行获取,具体如下：  
  - var map_level = localStorage.getItem("map_level") || 0;//获取本地存储的地图级别，0为设置的初始化值  
  - var province_in fo = JSON.parse(localStorage.getItem("province_info"));//获取本地存储的地图的相关信息，  
  - var province_name = province_info?(map_level == 1 ? province_info.child_name : province_info.child_id) : "";//获取地图展示的省的名字，“”为初始化的值，为全国地图  
  - 获取完之后就可以使用之前的方法，调用接口
 
