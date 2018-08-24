# MYNServer
<h1>nodejs游戏服务器架构-雏版</h1>

<h3>
该游戏服务器只有一个游戏大区，但后台会分发到多个游戏服务器中，每个分服务器支持2000人在线，多个游戏服务器扩充了在线人数，同时每个服务器的数据是互通的</h3>
<div>
  <ul>
    <li>express</li>
    <li>body-parser</li>
    <li>express-session</li>
    <li>ejs</li>
    <li>mysql</li>
    <li>lib-qqwry</li>
    <li>log4js</li>
    <li>apidoc</li>
  </ul>
</div>
<div>
  <h2>项目文件说明</h2>
<ul>
    <li>app:项目入口，node app.js打开服务器</li>
    <li>db:数据库文件</li>
    <li>doc:API文档在线浏览文件</li>
    <li>logs:服务器数据暂时缓存日志，用户日登录日志，用户日注册日志</li>
    <li>public:后台管理系统的静态资源文件</li>
    <li>routers:项目路由文件</li>
    <li>servers:项目服务器文件</li>
    <li>test:测试文件</li>
    <li>utils:自定义工具文件</li>
    <li>views:后台管理系统页面</li>
</ul>
</div>
