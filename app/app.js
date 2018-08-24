/**
 * Created by Administrator on 2018/7/27.
 */

var express=require('express');
var bodyParser=require('body-parser');
var request=require('request');
var http=require('http');
var router_door=require('../routers/door');
var router_entry=require('../routers/entry');
var router_main=require('../routers/main');
var router_bsm=require('../routers/bsm');
var Utils=require('../utils/utils');
var session=require('express-session');
//-------------------------------------------------------------------------------------------------app初始配置区----------------------------------------------------------------------------------------------------------
var app=express();
app.set("view engine",'ejs');
app.use(express.static(__dirname+"/../public"));
app.use(bodyParser.json({limit:"2mb"}));
app.use(bodyParser.urlencoded({
    extended:true
}));

app.use(session({
    secret:"MYNServer",
    cookie:{maxAge:60*1000}
}));
app.all("*", function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    res.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.setHeader("X-Powered-By",' 3.2.1');
    next();
});
app.use(["/Entry","/Door","/Main"], function (req,res,next) {
    res.setHeader("Content-Type", "application/json;charset=utf-8");
    next();
});
app.use(["/BSM/Apply","/BSM/GetCacheGame_server"], function (req,res,next) {

    res.setHeader("Content-Type", "application/json;charset=utf-8");
    next();
});
app.use("/BSM", function (req,res,next) {

    res.setHeader("Content-Type", "text/html");
    next();
});
//--------------------------------------------------------------------------------------------------app初始配置区-----------------------------------------------------------------------------------------------------------


//--------------------------------------------------------------------------------------------------路由区-------------------------------------------------------------------------------------------------------------
app.use("/Entry",router_entry);//用户进入游戏时需要验证账户服务器的用户账号登录状态
app.use("/Main",router_main);//进入游戏后短链接的交互

app.use("/Door",router_door);//用户获取服务器的状态

app.use("/Game",router_door);//控制游戏服务器的开关

app.use("/BSM",router_bsm);//进入后台管理系统
//--------------------------------------------------------------------------------------------------路由区---------------------------------------------------------------------------------------------------------------


http.createServer(app).listen(6001,"0.0.0.0", function () {
    console.log("开始监听");
    request({
        method: 'POST',
        url:"http://localhost:6001/Game/openAllServer",
        form:""
    }, function (err, respose) {
        let result=respose.body;
        result=Utils.isAvailableData(result).data;
        console.log("开启了所有服务器：\n",result.servers);
    });
});
