# Foxglove Extension

此仓库包含用于ROS2自瞄调参的Foxglove扩展，建议搭配rm.cv.std.ros2_transplant_2025使用。
 
## 目录

- [扩展说明](#扩展说明)
  - [MessageConverter](#messageconverter)
  - [JsonMessageViewer](#jsonmessageviewer)
  - [ParameterEditor](#parametereditor)
- [安装方法](#安装方法)
  - [安装Foxglove](#安装foxglove)
  - [安装扩展](#安装扩展)
- [文件目录说明](#文件目录说明)

## 扩展说明

### MessageConverter

 - 自动将`robot_msgs/msg/EnemyInfo`类型的消息转化为`3D`面板中的信息，在`3D`面板的`Panel`设置中开启该扩展消息后即可绘制四块装甲板和敌人中心位置，同时第一块装甲板将会有长方体示意。具体消息内容定义如下：

   > geometry_msgs/PoseStamped armor1  
   > geometry_msgs/PoseStamped armor2  
   > geometry_msgs/PoseStamped armor3  
   > geometry_msgs/PoseStamped armor4  
   > geometry_msgs/PoseStamped center
 - 自动将`geometry_msgs/msg/PoseArray`类型的消息转化为`3D`面板中的信息，为优化可视化效果可在`3D`面板的`Panel`设置中将坐标系的显示大小设置为`0`。此功能可用于绘制`/trajectory`话题中发布的模拟弹道。

### JsonMessageViewer

 - 订阅`/autoaim_debug_info`话题，自动解析传入的内容并转化为可视化面板。
 - 话题Json消息的内容可以包含多个键值对，会自动将键中`/`前的内容解析为小标题，键中`/`后的内容解析为参数名称，值的内容解析在第二列表格中。
 - 页面样式与网页段调试页面相同。

### ParameterEditor

 - 通过提供服务器制定地址获取TOML参数设置文件内容。
 - 自动解析TOML文件内容，自动匹配参数修改框或勾选框，同时保留展示源文件的注释内容。
 - 键盘快捷键指引：  
   1. `Ctrl + d`可将光标移至服务器路径编辑框中。
   2. `Ctrl + r`可快速读取文件。
   3. `Ctrl + f`可将光标移动至搜索框输入中，输入搜索内容后使用`↑↓`可浏览前后匹配项，使用`Enter`可直接进入当前聚焦的参数输入框或勾选/取消勾选，完成编辑参数后使用`Enter`可将光标再次回到搜索框输入。
   4. `Ctrl + s`可快速保存文件。
 - 参数调试效果与网页端调参类似。

## 安装方法

#### 安装Foxglove

 - 安装指引参考[Foxglove官网](https://foxglove.dev/download)

#### 安装扩展
 
 1. 下载最新[Releases](https://github.com/yyyyymzzzzz/foxglove_extension)并解压。
 2. 打开`Foxglove`并进入`Setting`,选择`Extensions`选项，点击`Install local extension...`，选择逐一选择**Releases**中所有的`.foxe`即可完成安装。    

## 文件目录说明

```
├── Autoaim-ros2.json 自定义面板布局，可在Foxglove中直接导入
├── install_foxglove.sh 自动安装脚本，如果有配置Yarn工具可快速本地安装
├── JsonMessageViewer
│   ├── package.json
│   ├── src
│   │   ├── index.ts
│   │   └── JsonMessageViewer.tsx 自定义扩展实现
│   └── ymz.JsonMessageViewer-1.0.foxe 最新版本安装包
├── MessageConverter
│   ├── package.json
│   ├── src
│   │   ├── EnemyInfo.ts 自定义消息类型
│   │   ├── ExamplePanel.tsx 
│   │   ├── index.ts 自定义扩展实现
│   │   └── PoseStamped.ts
│   ├── ymz.MessageConverter-1.0.foxe
│   └── ymz.MessageConverter-1.1.foxe 最新版本安装包
├── ParameterEditor
│   ├── package.json
│   ├── src
│   │   ├── index.ts
│   │   └── ParameterEditor.tsx 自定义扩展实现
│   ├── ymz.ParameterEditor-1.0.foxe
│   └── ymz.ParameterEditor-1.1.foxe 最新版本安装包
└── README.md

```


