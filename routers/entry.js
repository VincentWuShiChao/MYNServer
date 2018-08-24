/**
 * Created by Administrator on 2018/7/27.*/

var express=require('express');
var router=express.Router();
var DoorServer=require('../servers/DoorServer');

//用户点击进入游戏时，会从账号服务器中获取access_token，发送给本服务器，本服务器拿着该access_token去账户服务器验证用户是否登录成功。
router.post("/", DoorServer.Entry);

module.exports=router;