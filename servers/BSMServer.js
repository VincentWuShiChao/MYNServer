/**
 * Created by Administrator on 2018/7/28.
 */
//--------------------------------------------------------------------------后台管理界面的登录界面----------------------------------------------------------------------
var mysql_user=require('../db/UserMysql');
var mysql_server=require('../db/ServerMysql');
var url=require('url');
var qs=require('qs');
var fs=require('fs');
var path=require('path');
var adminUser={name:null,password:null};
var Utils=require('../utils/utils');
var GameServer=require('../servers/GameServer');



exports.showAdminLogin= function (req,res) {
    console.log("has user  login");
    console.log(req.query);
    if(adminUser.name){
        adminUser={};
    }
    return res.render(__dirname+"/../views/login_admin.ejs",{state:0});
};
//---------------------------------------------------------后台管理系统用户名和密码验证---------------------------------------------------------------------

exports.verify= function (req,res) {//{name:,password:,}
    console.log("center_server.js verify");
    var result_client=req.body;
    console.log("admin login:",result_client);
    var name=result_client.name;
    var password=result_client.password;
    console.log("admin name:",name);
    console.log("password:",password);
    mysql_user.getUserByName(name,password, function (err,data) {
        if(data.length===0){
            res.json({msg:"用户名或者密码不正确"});
        }else {
            adminUser.name=name;
            req.session.userInfo=name;
            return res.json({msg:1});
        }
    })
};

//--------------------------------------------------------后台管理系统的首页----------------------------------------------------------------------
exports.home= function (req,res) {
    var arg=url.parse(req.url).query;
    var name=qs.parse(arg)["name"];
    console.log("req.session.userInfo:",req.session.userInfo);
    res.render("../../views/index",{name:req.session.userInfo});


};
//------------------------------------------------------登录记录界面（并显示所有的登录日志列表）----------------------------------------------------
//登录记录
exports.login_record= function (req,res) {

    var files=getFileList("../logs/login/");
    var fileNames=[];
    for(let i=0;i<files.length;i++){
        fileNames.push(files[i].filename);
    }
    res.render("../../views/login_record",{name:req.session.userInfo,logs:fileNames});

};
//注册记录
exports.register_record= function (req,res) {
    var files=getFileList("../logs/register/");
    var fileNames=[];
    for(let i=0;i<files.length;i++){
        fileNames.push(files[i].filename);
    }
    res.render("../../views/register_record",{name:req.session.userInfo,logs:fileNames});
};
//--------------------------------------------------------------------------后台管理系统获取服务器的数据---------------------------------------------------------------
exports.getServers= function (req,res) {

    mysql_server.findAllServer(function(err,result_server){
        console.log(result_server);
        res.render("../../views/gallery.ejs",{name:req.session.userInfo,servers:result_server});
    });
};
exports.addServer= function (req,res) {
    console.log("addServer-91:",req.body);
    let port=Utils.isAvailableData(req.body).data.port;
    console.log(port);
    let result_addServer={
        result:"ok",
        state:0,
        desc:""
    }
    mysql_server.getServerByPort(port, function (err,result) {
        if(err){
            console.log("获取服务器失败",err);
        }else if(result.length===0){
            mysql_server.addServerByPort(port, function (err,result_add) {
                if(err){
                    console.log("添加服务器失败");
                }else {
                    result_addServer.state=0;
                    result_addServer.desc="添加成功";
                    res.send(result_addServer);
                }
            });
        }else if(result.length===1){
            result_addServer.state=1;
            result_addServer.desc="已经有该服务器，不可重复添加";
            res.send(result_addServer);
        }
    })
};
exports.changeStateOpen= function (req,res) {
    let port=Utils.isAvailableData(req.body).data.port;
    console.log(port);
    mysql_server.getServerByPort(port, function (err,result_port) {
        if(err){
            console.log("查找失败");
        }else if(result_port.length===0){
            let result_upstateState={
                result:"ok",
                state:-1,
                desc:"该服务器不存在"
            }
            res.send(result_upstateState);
        }else if(result_port.length===1){
            if(result_port[0].state===1){
                let result_upstateState={
                    result:"ok",
                    state:1,
                    desc:"该服务器已经开启"
                }
                res.send(result_upstateState);
            }else {
                mysql_server.updateServerStateOpen(port, function (err,result) {
                    if(err){
                        console.log("修改服务器状态失败");
                    }else {
                        let result_upstateState={
                            result:"ok",
                            state:0,
                            desc:"开启服务器成功"
                        }
                        GameServer.open("localhost",port);
                        res.send(result_upstateState);
                    }
                })
            }
        }
    })

};
/*exports.changeStateClose= function (req,res) {
    if(adminUser.name){
        let port=Utils.isAvailableData(req.body).data.port;
        console.log(port);
        mysql_server.updateServerStateClose(port, function (err,result) {
            if(err){
                console.log("修改服务器状态失败");
            }else {
                let result_upstateState={
                    result:"ok",
                    state:0,
                    desc:"开启服务器成功"
                }
                GameServer.close("localhost",port);
                res.send(result_upstateState);
            }
        })
    }else {
        res.render("../../views/login_admin");
    }
};*/
exports.showEditData= function (req,res) {

    res.render("../../views/edit_data",{name:adminUser.name});//7_20


};
exports.showTable= function (req,res) {
    var client_data=req.body;
    console.log("showTable type:",client_data);
    if(client_data.text=="数据库表结构"){
        res.send({})
    }else{
        let table_name=client_data.text;
        if(table_name=="player"){
            mysql_user.getAllPlayer(function (err,all_data) {
                console.log(all_data);
                res.send({playerList:all_data});//7_20
            });
        }
    }

};
exports.editPlayerData= function (req,res) {
    var client_data=req.query;
    let pid=client_data["pid"];
    console.log("pid;",pid);
    console.log(typeof pid);
    mysql_user.getPlayerByPid(parseInt(pid), function (err,data) {
        if(err){
            res.send({player:[]});
        }else {
            console.log(data);
            res.render("../../views/edit_player",{name:adminUser.name,player:data});
        }

    })

};
//修改数据库信息
exports.editPlayerSubmit= function (req,res) {
    var client_data=req.body;
    console.log("client data:",client_data);
    var pid=parseInt(client_data.pid);
    var name=client_data.name;
    var integral=parseInt(client_data.integral);
    var universal=client_data.universal;
    var time=client_data.time;
    var logintype=parseInt(client_data.logintype);
    var level=parseInt(client_data.level);
    var exper=parseInt(client_data.exper);
    mysql_user.updatePlayer(pid,name,integral,universal,time,logintype,level,exper, function (err,msg) {
        res.send({msg:msg.msg});
    });
}
var lineReader=require('line-reader');
//------------------------------------------------------登录记录表的信息---------------------------------------------------------------------------
exports.apply= function (req,res) {
    var client_data=req.body;
    console.log("apply type:",typeof client_data);
    if(client_data.text=="日志目录"){
        res.send({})
    }else{
        var list=[];
        lineReader.eachLine(path.join("../logs/login",client_data.text), function (line,last) {
            //console.log(typeof line);
            list.push(JSON.parse(line));
            if(last){
                console.log("i am done");
                //console.log(list);
                hander(list);
            }
        });
        var table=[];
        function hander(list) {
            //console.log(list);

            list.forEach(function (each) {
                var tag = false;
                var u_tag;
                for (var i = 0; i < table.length; i++) {
                    if (each.name == table[i].name) {
                        tag = true;
                        u_tag = i;
                        break;
                    }
                }
                if (tag == false) {
                    each.count = 1;
                    table.push(each);
                } else {
                    table[u_tag].count += 1;
                }
            });
            console.log("table msg:",table);
            res.send({logs_list:table});
        }
    }
};
//------------------------------------------------------注册记录表的信息---------------------------------------------------------------------------
exports.apply_register= function (req,res) {
    var client_data=req.body;
    console.log("BSMServer-211:",client_data);
    if(client_data.text=="日志目录"){
        res.send({});
    }else{
        var list=[];
        lineReader.eachLine(path.join("../logs/register",client_data.text), function (line,last) {
            //console.log(typeof line);
            list.push(JSON.parse(line));
            if(last){
                console.log("i am done");
                //console.log(list);
                res.send({logs_list:list});
            }
        });
    }
};
//----------------------------------------------------发布公告------------------------------------------
exports.showNotice= function (req,res) {
    var client_data=req.body;
    var text=client_data.text;
    GameServer.sendNotice(text).then(function (msg) {
        console.log("发布公告-296：",msg);
        res.send({msg:"成功发送公告"});
    });

}

//获取文件夹下的所有文件
function getFileList(path) {
    var filesList = [];
    readFileList(path, filesList);
    return filesList;
}
function readFileList(path, filesList) {
    var files = fs.readdirSync(path);
    files.forEach(function (itm, index) {
        var stat = fs.statSync(path + itm);
        if (stat.isDirectory()) {
            //递归读取文件
            readFileList(path + itm + "/", filesList)
        } else {

            var obj = {};//定义一个对象存放文件的路径和名字
            obj.path = 'H5_server/logs/';//路径
            obj.filename = itm;//名字
            filesList.push(obj);
        }
    })
}