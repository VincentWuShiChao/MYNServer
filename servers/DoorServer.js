/**
 * Created by Administrator on 2018/7/27.
 */
var GlobalUrl=require('../utils/GlobalUrl');
var request=require('request');
var mysql_user=require('../db/UserMysql');
var Token=require('../utils/Token');
var Code=require('../utils/Code');
var LogJs=require('../utils/LogJs');
var _Date=require('../utils/Date');
var IpParse=require('../utils/IpParse');
var Utils=require('../utils/utils');
var GameServer=require('../servers/GameServer');

var has_token_msg="";
//门服务器
var ServerMysql=require('../db/ServerMysql');
var result={
    result:"ok",
    msg:"",
    data:[]
};
var globalUrl=new GlobalUrl();
var publicEntryToken=new Token("Entry");
globalUrl.setAccountServer("http://account.ykplay.com",6666);//向账户服务器发送验证



//获取所有的可用服务器
exports.getAllServer= function (req,res) {
    console.log("DoorServer-31:","getAllServer");
    ServerMysql.findAllServer(function(err,result_server){
        let server_list=[];
        for(let i=0;i<result_server.length;i++){
            if(result_server[i].count<=2000&&result_server[i].state==1){
               server_list.push({port:result_server[i].port,count:result_server[i].count,state:result_server[i].state});
            }
        }
        result.data=server_list;
        result.msg="allServer";
        res.send(result);
    });
};
//获取某个可用服务器
exports.getServer= function (req,res) {
    console.log("DoorServer-47:","getServer");
    ServerMysql.findAllServer(function(err,result_server){
        let server_list=[];
        for(let i=0;i<result_server.length;i++){
            if(result_server[i].count<=2000&&result_server[i].state==1){
                server_list.push({port:result_server[i].port,count:result_server[i].count,state:result_server[i].state});
                break;
            }
        }
        result.data=server_list;
        result.msg="server";
        res.send(result);
    });
};


//根据客户端传过来的openid和accesstoken去账户服务器验证，并把验证结果发送给客户端
exports.Entry=function (req,res) {//{access_token:,app:,openId,loginType}
    console.log("DoorServer-65:","Entry");
    let data=req.body;
    let resData=Utils.isAvailableData(data);
    if(resData.encode===-1){
        res.send(resData);
        return;
    }else {
        //res.send("用户信息格式正确");
        let ip=globalUrl.getAccountServer().ip;
        let port=globalUrl.getAccountServer().port;
        let userInfo=resData.data;
        request({
            method: 'POST',
            url:ip+"/ykVerify/Verify",
            form:userInfo
        }, function(err, respose){
            //账户服务器返回的数值
            let result_data=respose.body;
            let data=Utils.isAvailableData(result_data);
            if(data.data.encode===0){
                let user=data.data.userInfo;
                mysql_user.getPlayerByOpenId(user.openid, function (err,result_value) {
                    if(result_value.length==0){
                        userInfo.loginType=parseInt(userInfo.loginType);
                        if(userInfo.loginType===1){//微信小游戏用户
                            addWx(user,userInfo,req,res,err,result_value);
                        }else if(userInfo.loginType===0){//普通用户
                            addCommon(user,userInfo,req,res,err,result_value);
                        }

                    }else {
                        console.log("有该用户");
                        let userInfo=result_value[0];
                        let code=new Code(userInfo.name,"hex");
                        let decode_name=code.decodeCoding();
                        userInfo.name=decode_name;
                        //res.send({result:"ok",desc:"登陆成功",msg:"entry",data:userInfo});//客户端接收到登陆成功后才能进入游戏界面
                        recordUserLogin(userInfo,req,res)
                    }
                })
            }else {
                let result={
                    result:"error",
                    msg:"userMsg_1",
                    desc:"用户不合法"
                };
                res.send(JSON.stringify(result))
            }
        });
    }
};


var result_servers={
    result:"ok",
    desc:"开启了所有服务器",
    servers:[]
};
exports.openServerByPort= function (req,res) {
    res.send("开启单个服务器");
    let port=req.body.port;
    ServerMysql.findServerByPort(port, function (err,result_server) {
        if(err){

        }else if(result_server.length===0){
            result_servers.desc="未找到该服务器";
        }else {
            if(result_server.state===1){
                result_servers.desc="该服务器已经开启";
            }else {
                result_servers.desc="服务器开启，能访问";
            }
        }
    })
};
exports.openAllServer= function (req,res) {
    ServerMysql.findAllServer(function(err,result_server){
        let server_list=[];
        for(let i=0;i<result_server.length;i++){
            //console.log(result_server[i].count);
            if(result_server[i].count<=2000&&result_server[i].state==1){
                server_list.push({port:result_server[i].port,count:result_server[i].count,state:result_server[i].state});
            }
        }
        for(let i=0;i<server_list.length;i++){
            GameServer.open("localhost",server_list[i].port);
        }
        result_servers.servers=server_list;
        res.send(result_servers);
    });
}



function addWx(user,userInfo,req,res,err,result_value){
    user.wx=JSON.parse(user.wx);
    mysql_user.addPlayer(user.wx.nickName,userInfo.loginType,user.openid, function () {
        if(err){
            console.log("添加用户失败");
            return;
        }else {
            console.log("添加用户成功");
            mysql_user.getPlayerByOpenId(user.openid, function (err,result_value1) {
                let userInfo = result_value1[0];
                let code=new Code(userInfo.name,"hex");
                let decode_name=code.decodeCoding();
                userInfo.name=decode_name;
                recordUserLoginAndRegister(userInfo,req,res)
            });//客户端接收到登陆成功后才能进入游戏界面
        }
    });
}
function addCommon(user,userInfo,req,res,err,result_value){
    mysql_user.addPlayer(user.uname,userInfo.loginType,user.openid, function () {
        if(err){
            console.log("添加用户失败");
            return;
        }else {
            console.log("添加用户成功");
            mysql_user.getPlayerByOpenId(user.openid, function (err,result_value1) {
                let userInfo = result_value1[0];
                let code=new Code(userInfo.name,"hex");
                let decode_name=code.decodeCoding();
                userInfo.name=decode_name;
                recordUserLoginAndRegister(userInfo,req,res)
            });//客户端接收到登陆成功后才能进入游戏界面

        }
    });
}
function recordUserLogin(data,req,res){
    var has_user=false;
    for(let i=0;i<publicEntryToken.getTokenList().length;i++){
        if(publicEntryToken.getTokenList()[i].username==data.name){
            has_user=true;
            has_token_msg=publicEntryToken.getTokenList()[i];
            break;
        }
    }
    if(has_user==false){
        console.log("用户不是第一次登录该游戏");
        let token=new Token(data.name);
        token.createToken(data);
        publicEntryToken.setTokenToTokenList(token.getToken());
        let result={
            result:"ok",
            msg:"userMsg_1",
            data:data,
            token:token.getToken()
        };
        console.log("给用户发送userMsg");
        res.send(JSON.stringify(result));
        let logjs=new LogJs();
        let date=new _Date();
        logjs.setConfig("login",date._getDate().toString()+"_login")
            .then(function (content) {
                if(content.tag){
                    console.log("日志配置设置成功-123:",content.content);
                    data.loginTime=new Date().getHours()+":"+new Date().getMinutes();
                    let ipParse=new IpParse(req);
                    let userIp=ipParse.getClientIp();
                    data.ipAddr=ipParse.parseIp(userIp);
                    let logger=logjs.useLogger(date._getDate().toString()+"_login");
                    logjs.createLog(logger,JSON.stringify(data));
                }
            });
    }else {
        console.log("此人的token存在");
        let result={
            result:"ok",
            msg:"userMsg_1",
            data:data,
            token:has_token_msg
        };
        res.send(JSON.stringify(result));
        let logjs=new LogJs();
        let date=new _Date();
        logjs.setConfig("login",date._getDate().toString()+"_login")
            .then(function (tag) {
                if(tag){
                    console.log("日志配置设置成功");
                    data.loginTime=new Date().getHours()+":"+new Date().getMinutes();
                    let ipParse=new IpParse(req);
                    let userIp=ipParse.getClientIp();
                    data.ipAddr=ipParse.parseIp(userIp);
                    let logger=logjs.useLogger(date._getDate().toString()+"_login");
                    logjs.createLog(logger,JSON.stringify(data));
                }
            });
    }
}
function recordUserLoginAndRegister(data,req,res){
    var has_user=false;
    for(let i=0;i<publicEntryToken.getTokenList().length;i++){
        if(publicEntryToken.getTokenList()[i].username==data.name){
            has_user=true;
            has_token_msg=publicEntryToken.getTokenList()[i];
            break;
        }
    }
    if(has_user==false){
        console.log("用户第一次登录该游戏");
        let token=new Token(data.name);
        token.createToken(data);
        publicEntryToken.setTokenToTokenList(token.getToken());
        let result={
            result:"ok",
            msg:"userMsg_1",
            data:data,
            token:token.getToken()
        };
        console.log("给用户发送userMsg");
        res.send(JSON.stringify(result));
        let logjs=new LogJs();
        let date=new _Date();
        logjs.setConfig("login",date._getDate().toString()+"_login")
            .then(function (content) {
                if(content.tag){
                    console.log("日志配置设置成功-123:",content.content);
                    data.loginTime=new Date().getHours()+":"+new Date().getMinutes();
                    let ipParse=new IpParse(req);
                    let userIp=ipParse.getClientIp();
                    data.ipAddr=ipParse.parseIp(userIp);
                    let logger=logjs.useLogger(date._getDate().toString()+"_login");
                    logjs.createLog(logger,JSON.stringify(data));
                }
            });

        let logjs1=new LogJs();
        let date1=new _Date();
        logjs1.setConfig("register",date1._getDate().toString()+"_register")
            .then(function (content) {
                if(content.tag){
                    console.log("日志配置设置成功-123:",content.content);
                    data.registerTime=new Date().getHours()+":"+new Date().getMinutes();
                    let ipParse=new IpParse(req);
                    let userIp=ipParse.getClientIp();
                    data.ipAddr=ipParse.parseIp(userIp);
                    let logger1=logjs1.useLogger(date1._getDate().toString()+"_register");
                    logjs1.createLog(logger1,JSON.stringify(data));
                }
            });
    }else {
        console.log("此人的token存在");
        let result={
            result:"ok",
            msg:"userMsg_1",
            data:data,
            token:has_token_msg
        };
        res.send(JSON.stringify(result));
        let logjs=new LogJs();
        let date=new _Date();
        logjs.setConfig("login",date._getDate().toString()+"_login")
            .then(function (tag) {
                if(tag){
                    console.log("日志配置设置成功");
                    data.loginTime=new Date().getHours()+":"+new Date().getMinutes();
                    let ipParse=new IpParse(req);
                    let userIp=ipParse.getClientIp();
                    data.ipAddr=ipParse.parseIp(userIp);
                    let logger=logjs.useLogger(date._getDate().toString()+"_login");
                    logjs.createLog(logger,JSON.stringify(data));
                }
            });
        let logjs1=new LogJs();
        let date1=new _Date();
        logjs1.setConfig("register",date1._getDate().toString()+"_register")
            .then(function (content) {
                if(content.tag){
                    console.log("日志配置设置成功-123:",content.content);
                    data.registerTime=new Date().getHours()+":"+new Date().getMinutes();
                    let ipParse=new IpParse(req);
                    let userIp=ipParse.getClientIp();
                    data.ipAddr=ipParse.parseIp(userIp);
                    let logger1=logjs1.useLogger(date1._getDate().toString()+"_register");
                    logjs1.createLog(logger1,JSON.stringify(data));
                }
            });
    }
}

