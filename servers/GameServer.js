/**
 * Created by Administrator on 2018/7/28.
 */
/*----------------------------------------------------------------------------
 -----------------------------客户端请求的tag值--------------------------------
 -------------                1.匹配                          -----------------
 -------------                2.长连接成功                    -----------------
 -------------                3.排行榜                        -----------------
 -------------                4.对战结果                      -----------------
 -------------                0.匹配测试                      -----------------
 -------------                5.back按钮(从游戏界面返回上一个界面)-------------
 -------------                6.消除每行，设置难度系数        -----------------
 -------------                //7.返回另一个用户的游戏状态      -----------------
 -------------                8.初始化地图                    -----------------
 -------------                9.发送玩家每刻状态              -----------------
 -------------               10.界面加载完毕                  -----------------
 -------------               11.对战界面显示敌人分数          -----------------
 ----------------------------------------------------------------------------*/
const websocket=require('ws');
var mysql_game=require('../db/ServerMysql');
var mysql_user=require('../db/UserMysql');
var mysql_server=require("../db/ServerMysql");
var Code=require('../utils/Code');
var Room=require('../utils/Room');
var Token=require('../utils/Token');
var Utils=require('../utils/utils');
//存放服务器中所有的session
var global_session_list=[];
var server;
var timers=1000;
var result={
    "result":"error",
    "msg":""
};
var broadcast_data={
    room:{},
    tag:"",
    json_data:"",
    map:[]
}
var roomid=1;
var publicRoom=new Room(0);
var publicToken=new Token("public");
const PENALTY_TYPE_ELUOSI=3*10;//俄罗斯惩罚系数
const PENALTY_TYPE_HUAXIANG=13.3*3;//画像惩罚系数
const PENALTY_TYPE_BAOSHI=13.3*3;//宝石惩罚系数
//玩家待匹配池
var allMatchingPlayer=[];
var MathcingPlayerState=0;//资源被占用状态

//所有的游戏服务器
var servers=[];//多个数据共享的游戏服务器

var servers_unShare=[

];//多个数据不共享的游戏服务器

//--------------------------------------------------向所有玩家发布公告------------------------------
exports.sendNotice= function (text) {
    servers.forEach(function (server) {
        server.clients.forEach(function (client) {
            result.result="ok";
            result.data=text;
            result.msg="notice";
            client.send(JSON.stringify(result));
        });
    });
    return new Promise(function (resolve,reject) {
        resolve("向全服玩家发送了公告信息");
    })
}

//开启服务器

function start_game_server(ip,port){
    server=new websocket.Server({
        port:port
    });
    let that=this;
    console.log("开启了游戏服务器：",port);
    servers.push(server);
    //servers_unShare.push({serverId:port,server:server});

    /*servers_unShare.forEach(function (server) {
        if(that.server===server.server&&server.serverId===port){
            //广播
            let Server=server.server;
            Server.broadcast=broadcast;
            //连接后
            Server.on("connection", function (session) {
                //监听此长连接用户的断开
                session.on("close", function () {
                    console.log(session.user.name,"退出游戏");
                    on_session_exit(session,server,port);
                });
                //error事件
                session.on("error",error);
                //接收用户的信息
                session.on("message", function (data) {
                    getMessage(data,session,port);
                });

            });
            Server.on("error", function (err) {
                console.log("game server error",err);
            });
            Server.on("close", function () {
                console.log("服务器已经被关闭啦啦啦啦啦");
            });
        }
    });*/
    //广播
    server.broadcast=broadcast;
    //连接后
    server.on("connection", function (session) {
        //监听此长连接用户的断开
        session.on("close", function () {
            console.log(session.user.name,"退出游戏");
            on_session_exit(session,server,port);
        });
        //error事件
        session.on("error",error);
        //接收用户的信息
        session.on("message", function (data) {
            getMessage(data,session,port);
        });

    });
    server.on("error", function (err) {
        console.log("game server error",err);
    });
    server.on("close", function () {
        console.log("服务器已经被关闭啦啦啦啦啦");
    });
}

//广播
function broadcast(jsonData){//{room:,tag:,json_data:,map:}
    console.log("广播中。。。。。。。。。。。。");
    let tag=jsonData.tag;
    let room=jsonData.room;
    switch (tag){
        case "matching":
            console.log("匹配成功!");
            servers.forEach(function (server) {
                server.clients.forEach(function (client) {
                    for(let i=0;i<room.playerList.length;i++){
                        console.log("匹配成功：room:"+i+"个人：",room.playerList[i].name);
                        if(room.playerList[i].name==client.user.name){

                            console.log("matching----------------------------------------");
                            result.result="ok";
                            result.data=room;
                            result.msg="broadcast";
                            client.send(JSON.stringify(result));
                        }
                    }
                });
            });

            break;
        case "result_score":
            console.log("result_score!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            //console.log("result_score_room:",room);
            servers.forEach(function (server) {
                server.clients.forEach(function each(client) {
                    for(let i=0;i<room.playerList.length;i++){
                        if(room.playerList[i].name==client.user.name){
                            result.result="ok";
                            result.data=room.playerList[i];
                            result.msg="result_exit";
                            client.send(JSON.stringify(result));
                            console.log("result_score_user:",room.playerList[i]);
                        }
                    }
                });
            });

            break;
        case "otherState":
            console.log("otherState!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            let other_tag=0;
            for(let i=0;i<room.playerList.length;i++){
                if(room.playerList[i].name!=jsonData.json_data.name){
                    other_tag=i;
                    break;
                }
            }
            servers.forEach(function (server) {
                server.clients.forEach(function each(client) {
                    if(room.playerList[other_tag].name==client.user.name){
                        result.result="ok";
                        result.data=room;
                        result.msg="otherState";
                        result.matrix=jsonData.json_data.new_matrix;
                        client.send(JSON.stringify(result));
                    }
                });
            });

            break;
        case "initMap"://map:{row:json_data.map.row, col:json_data.map.col, nodeArray:[{row:0, col:0, state:0, color:0, type:json_data.type}]};
            console.log("initMap!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            servers.forEach(function (server) {
                server.clients.forEach(function each(client) {
                    if(jsonData.json_data.name==client.user.name){
                        result.result="ok";
                        result.data=room;
                        result.msg="initMap";
                        result.beginMap=jsonData.map;
                        client.send(JSON.stringify(result));
                    }
                });
            });

            break;
        case "changeMap":
            console.log("changeMap!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            servers.forEach(function (server) {
                server.clients.forEach(function each(client) {
                    if(jsonData.json_data.name==client.user.name){
                        console.log("tag=============changeMap");
                        result.result="ok";
                        result.data=room;
                        result.msg="changeMap";
                        result.changeMap=jsonData.map;
                        client.send(JSON.stringify(result));
                    }
                });
            });

            break;
        case "punishMap":
            console.log("punishMap!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            servers.forEach(function (server) {
                server.clients.forEach(function each(client) {
                    if(jsonData.json_data.name==client.user.name){
                        result.result="ok";
                        result.data=room;
                        result.msg="punishMap";
                        result.punishMap=jsonData.map.arrayMap;
                        result.rows=jsonData.map.count;
                        client.send(JSON.stringify(result));
                        console.log("tag================punishMap:",jsonData.json_data.name);
                    }
                });
            });

            break;
        case "enemyDisappear":
            console.log("enemyDisappear!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            servers.forEach(function (server) {
                server.clients.forEach(function each(client) {
                    if(jsonData.json_data.name==client.user.name){
                        result.result="ok";
                        result.data=room;
                        result.msg="enemyDisappear";
                        client.send(JSON.stringify(result));
                    }
                });
            });

            break;
        case "addScore":
            console.log("addScore!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            servers.forEach(function (server) {
                server.clients.forEach(function each(client) {
                    if(jsonData.json_data.name==client.user.name){
                        result.result="ok";
                        result.data=room;
                        result.msg="addScore";
                        result.removeRows=jsonData.map;
                        client.send(JSON.stringify(result));
                    }
                });
            });

            break;
        case "loadOk":
            console.log("loadOk!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            servers.forEach(function (server) {
                server.clients.forEach(function each(client) {

                    for(let i=0;i<room.playerList.length;i++){
                        if(room.playerList[i].name==client.user.name){
                            console.log("loadOk-------------room---------------------------",room);
                            result.result="ok";
                            result.data=room;
                            result.msg="loadOk";
                            client.send(JSON.stringify(result));
                        }
                    }
                });
            });

            break;
        case "sendResult":
            console.log("sendResult!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            servers.forEach(function (server) {
                server.clients.forEach(function each(client) {
                    if(jsonData.json_data.name==client.user.name){
                        result.result="ok";
                        result.data=room;
                        result.msg="getResult";
                        client.send(JSON.stringify(result));
                        console.log("sendResult:",jsonData.json_data.name);
                    }
                });
            });

            break;
    }

}
//断开连接
function on_session_exit(session,server,port){
    try{
        let has_session=false;
        for(let i=0;i<global_session_list.length;i++){

            if(global_session_list[i].user.name==session.user.name) {
                global_session_list.splice(i,1);
                has_session=true;
                break;
            }
        }
        if(has_session==true){
            console.log(session.user.name,"(game_server:48):","退出游戏");
            mysql_game.getServerByPort(port, function (err,servers) {
                //console.log(servers[0]);
                let allCount=servers[0].count-1;
                console.log(allCount);
                //修改服务器的连接数
                mysql_game.updateServerCountByPort(port,allCount, function (err,add_result) {
                    if(err){
                        console.log("修改失败");
                    } else {
                        console.log("修改成功");
                    }
                });
            });
            let r_tag=0;
            let u_tag=0;
            let hasroom=false;
            for(let i=0;i<publicRoom.getRoomList().length;i++){
                for(let j=0;j<publicRoom.getRoomList()[i].playerList.length;j++){
                    if(session.user.name==publicRoom.getRoomList()[i].playerList[j].name){
                        r_tag=i;
                        u_tag=j;
                        hasroom=true;
                        break;
                    }
                }
            }

            if(hasroom==true){
                if(u_tag==0){
                    console.log("===================================================");
                    back(u_tag,r_tag,server);
                }else {
                    console.log("===================================================");
                    back(u_tag,r_tag,server);
                }

            }else {
                //从匹配池中删除该用户
                for(let i=0;i<allMatchingPlayer.length;i++){
                    if(allMatchingPlayer[i].name==session.user.name){
                        allMatchingPlayer.splice(i,1);
                        break;
                    }
                }
            }
            //从tokenlist中删除该用户
            for(let i=0;i<publicToken.getTokenList().length;i++){
                if(publicToken.getTokenList()[i].username==session.user.name){
                    publicToken.getTokenList().splice(i,1);
                    break;
                }
            }
            //从session列表中删除该用户
            for(let i=0;i<global_session_list.length;i++){

                if(global_session_list[i].user.name==session.user.name) {
                    global_session_list.splice(i,1);

                    break;
                }
            }
            //从heartbeat_list中删除该用户的心跳
            /*for(let i=0;i<heartbeat_list.length;i++){
             if(heartbeat_list[i].name===session.user.name){
             clearInterval(heartbeat_list[i].heartbeat);
             heartbeat_list.splice(i,1);
             break;
             }
             }*/
        }

    }catch (err){
        console.log("服务器异常");
    }
}
//error事件
function error(err){
    console.log("client error:",err);
}
//接收用户信息
function getMessage(data,session,port){
    let return_result=Utils.isAvailableData(data);
    if(return_result.encode===-1){
        result.result="error";
        result.desc="请输入正确的json或者json字符串格式";
        session.send(result);
        session.close();
        return;
    }else {
        let userInfo=return_result.data;
        switch (userInfo.tag){//{"tag":,"token":,"name":,"integral":,"type":,"","openId":,}//type：代表玩家玩的类型。(1:俄罗斯  2:宝石方块  3:噗呦噗呦 4:画像方块)
            case 0:
                console.log("保持长连接");
                session.send("保持长连接");
                break;
            case 1://匹配
                for(let i=0;i<allMatchingPlayer.length;i++){
                    if(allMatchingPlayer[i].name===userInfo.name){
                        console.log("有该用户");
                        return;
                    }
                }
                for(let i=0;i<publicRoom.getRoomList().length;i++){
                    for(let j=0;j<publicRoom.getRoomList()[i].playerList.length;j++){
                        if(publicRoom.getRoomList()[i].playerList[j].name===userInfo.name){
                            console.log("房间里已经有该用户");
                            return;
                        }
                    }
                }
                if(MathcingPlayerState==0){
                    MathcingPlayerState=1;
                    console.log("匹配池占用状态：",MathcingPlayerState);
                    //计算匹配分段
                    matching(userInfo,session);
                }else {
                    console.log("资源被占用中...");
                    timers+=100;
                    let timer=setInterval(function () {
                        if(MathcingPlayerState==0){
                            MathcingPlayerState=1;
                            //计算匹配分段
                            matching(userInfo,session);
                            clearInterval(timer);
                            timers-=100;
                        }
                    },timers);
                }
                break;
            case 2://将用户的信息存入session中
                console.log("tag-----------------2:",userInfo.openId);
                mysql_user.getPlayerByOpenId(userInfo.openId, function (err,result_value) {
                    if(err){
                        console.log("GameServer-250:未找到该用户",err);
                        return;
                    }else {
                        session.user=result_value[0];
                        console.log("GameServer-255:",session.user);
                        let code=new Code(session.user.name,"hex");
                        let decode_name=code.decodeCoding();
                        console.log("258:",code);
                        session.user.name=decode_name;
                        on_session_enter(session,server,port);
                    }
                });
                break;
            case 3://排行榜
                mysql_game.getPlayerRank(function (err,result_call) {
                    result.result="ok";
                    result.msg="rank";
                    result.data=result_call;
                    session.send(JSON.stringify(result));
                });
                break;
            case 4://对战结果 {"tag":;"token":;"name":;"integral":;"type":;"result_score":;"openId":,}
                let room_tag_4=0;
                for(let i=0;i<publicRoom.getRoomList().length;i++){
                    for(let j=0;j<publicRoom.getRoomList()[i].playerList.length;j++){
                        if(publicRoom.getRoomList()[i].playerList[j].name==userInfo.name){
                            publicRoom.getRoomList()[i].score_count+=1;
                            room_tag_4=i;
                            publicRoom.getRoomList()[i].playerList[j].score=parseInt(userInfo.result_score);
                            console.log("该房间的所有人：",publicRoom.getRoomList()[i].playerList);
                        }
                    }
                    for(let j=0;j<publicRoom.getRoomList()[i].playerList.length;j++){
                        if(publicRoom.getRoomList()[i].playerList[j].name==userInfo.name){
                            if(publicRoom.getRoomList()[i].score_count==2){
                                break;
                            }
                        }
                    }

                }
                console.log("此时房间的状态为：",publicRoom.getRoomList()[room_tag_4]);
                for(let i=0;i<publicRoom.getRoomList().length;i++) {
                    //当count=2时，证明两个人的分数都被赋值
                    for (let j = 0; j < publicRoom.getRoomList()[i].playerList.length; j++) {
                        if (publicRoom.getRoomList()[i].playerList[j].name == userInfo.name) {
                            if (publicRoom.getRoomList()[i].score_count == 2) {
                                let room_tag = 0;
                                room_tag=i;
                                console.log("游戏结算前，房间情况：", publicRoom.getRoomList()[room_tag].playerList);
                                //对战结果结算
                                let difference_value=publicRoom.getRoomList()[room_tag].playerList[0].integral - publicRoom.getRoomList()[room_tag].playerList[1].integral;
                                if (difference_value>0) {
                                    console.log("------------------------------------------------低分者先进入-------------------------------------------");
                                    let user_high = publicRoom.getRoomList()[room_tag].playerList[0];//高分者
                                    let user_low = publicRoom.getRoomList()[room_tag].playerList[1];//低分者
                                    addIntegral(user_high, user_low)
                                        .then(function (user_result) {
                                            console.log("user_result:", user_result);
                                            if (user_result[0].score > user_result[1].score) {

                                                updateData(user_result[0], user_result[1], server, room_tag);

                                            } else {
                                                console.log("低分获胜");
                                                console.log(user_result[1].name);
                                                updateData(user_result[1], user_result[0], server, room_tag);
                                            }
                                        });
                                } else {
                                    console.log("------------------------------------------------高分者先进入-------------------------------------------");
                                    let user_high = publicRoom.getRoomList()[room_tag].playerList[1];//高分者
                                    let user_low = publicRoom.getRoomList()[room_tag].playerList[0];//低分者
                                    addIntegral(user_high, user_low)
                                        .then(function (user_result) {
                                            console.log("user_result:", user_result);
                                            if (user_result[0].score > user_result[1].score) {
                                                updateData(user_result[0], user_result[1], server, room_tag);
                                            } else {
                                                console.log("低分获胜");
                                                console.log(user_result[1].name);
                                                updateData(user_result[1], user_result[0], server, room_tag);
                                            }
                                        });
                                }
                                publicRoom.getRoomList()[i].score_count = 0;
                                break;
                            }
                        }
                    }
                }
                break;
            case 5://返回上一个界面,游戏进行中
                let r_tag=0;
                let u_tag=0;
                for(let i=0;i<publicRoom.getRoomList().length;i++){
                    for(let j=0;j<publicRoom.getRoomList()[i].playerList.length;j++){
                        if(userInfo.name==publicRoom.getRoomList()[i].playerList[j].name){
                            r_tag=i;
                            u_tag=j;
                            break;
                        }
                    }
                }
                //当有一个用户中途退出时，对战结果结算
                back(u_tag,r_tag,server);
                break;
            case 6://消除每行，设置难度系数 {"tag":,"token":,"name":,"integral":,"type":,"removeMapList":[{row:,col:}]}代表玩家玩的类型。(1:俄罗斯  2:宝石方块  3:噗呦噗呦 4:画像方块)==>  tag=12
                console.log("=================================================进入case6:消除行设置难度系数====================================================");
                switch (userInfo.type){
                    case "1":
                        //俄罗斯方块
                        let coe_1=PENALTY_TYPE_ELUOSI;
                        set_penalty_value(userInfo,publicRoom,server,coe_1);
                        break;
                    case "2"://宝石
                        let coe_2=PENALTY_TYPE_BAOSHI;
                        set_penalty_value(userInfo,publicRoom,server,coe_2);
                        break;
                    case "3"://噗呦噗呦
                        break;
                    case "4"://画像
                        let coe_4=PENALTY_TYPE_HUAXIANG;
                        set_penalty_value(userInfo,publicRoom,server,coe_4);
                        break;
                }
                break;
            case 7://返回另一个用户的游戏状态{"tag":,"token":,"name":,"integral":,"type":,"new_ matrix":}
                let tag_remove=0;
                for(let i=0;i<publicRoom.getRoomList().length;i++){
                    for(let j=0;j<publicRoom.getRoomList()[i].playerList.length;j++){
                        if(userInfo.name==publicRoom.getRoomList()[i].playerList[j].name){
                            tag_remove=i;
                            break;
                        }
                    }
                }
                broadcast_data.room=publicRoom.getRoomList()[tag_remove];
                broadcast_data.tag="otherState";
                broadcast_data.json_data=userInfo;
                server.broadcast(broadcast_data);
                break;
            case 8://初始化游戏地图{tag:8,name:,token:,"integral":,type:"",map:{row:,col:}}
                console.log("tag:8 is name:",userInfo.name,"   map:",userInfo.map);
                let my=0;
                let room_tag_8=0;
                let other=0;
                let Map={
                    row:userInfo.map.row,
                    col:userInfo.map.col,
                    nodeArray:[{
                        row:0,
                        col:0,
                        state:0,
                        color:0,
                        type:userInfo.type}]
                };
                console.log("Map:",Map);
                for(let i=0;i<publicRoom.getRoomList().length;i++){
                    for(let j=0;j<publicRoom.getRoomList()[i].playerList.length;j++){
                        if(userInfo.name==publicRoom.getRoomList()[i].playerList[j].name){
                            my=j;
                            room_tag_8=i;
                            break;
                        }
                    }
                }
                if(my==0){
                    other=1;
                }else {
                    other=0;
                }
                broadcast_data.room=publicRoom.getRoomList()[room_tag_8];
                broadcast_data.tag="initMap";
                broadcast_data.json_data=publicRoom.getRoomList()[room_tag_8].playerList[other];
                broadcast_data.map=Map;
                server.broadcast(broadcast_data);
                console.log("hahahaahahhaahahahahaha走过了session.broadcast");
                break;
            case 9://{tag:9,name:,token:,"integral":,changeMapList:[{row:,col:,color:,}]}代表玩家玩的类型。(1:俄罗斯  2:宝石方块  3:噗呦噗呦 4:画像方块)//每时刻的改变状态和消除时的状态
                console.log("tag:9");
                //console.log("9========:",userInfo.state);
                let my_9=0;
                let room_tag_9=0;
                let other_9=0;
                for(let i=0;i<publicRoom.getRoomList().length;i++){
                    for(let j=0;j<publicRoom.getRoomList()[i].playerList.length;j++){
                        if(userInfo.name==publicRoom.getRoomList()[i].playerList[j].name){
                            my_9=j;
                            room_tag_9=i;
                            break;
                        }
                    }
                }
                console.log("my_9:",my_9);
                if(my_9==0){
                    other_9=1;
                }else {
                    other_9=0;
                }
                broadcast_data.room=publicRoom.getRoomList()[room_tag_9];
                broadcast_data.tag="changeMap";
                broadcast_data.json_data=publicRoom.getRoomList()[room_tag_9].playerList[other_9];
                broadcast_data.map=userInfo.changeMapList;
                server.broadcast(broadcast_data);
                break;
            case 10://{tag:10,name:,loadingState:,"token":,}
                let my_10=0;
                let room_tag_10=0;
                console.log("+++++++++++++++++++++++++10");
                for(let i=0;i<publicRoom.getRoomList().length;i++){
                    for(let j=0;j<publicRoom.getRoomList()[i].playerList.length;j++){
                        if(userInfo.name==publicRoom.getRoomList()[i].playerList[j].name){
                            my_10=j;
                            room_tag_10=i;
                            publicRoom.getRoomList()[i].playerList[j].loadingState=1;
                            break;
                        }
                    }
                }
                broadcast_data.room=publicRoom.getRoomList()[room_tag_10];
                broadcast_data.tag="loadOk";
                if(publicRoom.getRoomList()[room_tag_10].playerList[0].loadingState==1&&publicRoom.getRoomList()[room_tag_10].playerList[1].loadingState==1){
                    console.log("两个玩家地图绘制完毕！");
                    server.broadcast(broadcast_data);
                }
                break;
            case 11://{tag:11,name:,token:,integral:,nDisappear:}//修改敌人的分数
                let my_11=0;
                let room_tag_11=0;
                let other_11=0;
                for(let i=0;i<publicRoom.getRoomList().length;i++){
                    for(let j=0;j<publicRoom.getRoomList()[i].playerList.length;j++){
                        if(userInfo.name==publicRoom.getRoomList()[i].playerList[j].name){
                            my_11=j;
                            room_tag_11=i;
                            break;
                        }
                    }
                }
                if(my_11==0){
                    other_11=1;
                }else {
                    other_11=0;
                }
                console.log("++++++++++++" + publicRoom.getRoomList()[room_tag_11]);
                console.log("$$$$$$$$$$$$$$" + publicRoom.getRoomList()[room_tag_11].playerList[other_11]);
                broadcast_data.room=publicRoom.getRoomList()[room_tag_11];
                broadcast_data.tag="addScore";
                broadcast_data.json_data=publicRoom.getRoomList()[room_tag_11].playerList[other_11];
                broadcast_data.map=userInfo.nDisappear;
                server.broadcast(broadcast_data);
                break;
            case 12://改变达到惩罚值得用户的敌方用户的下落完毕状态{tag:12,name:,token:,integral:,removeRow:,type:}与case6相结合使用
                console.log("进入到了case12");
                let my_12=0;
                let room_tag_12=0;
                let other_12=0;
                for(let i=0;i<publicRoom.getRoomList().length;i++){
                    for(let j=0;j<publicRoom.getRoomList()[i].playerList.length;j++){
                        if(userInfo.name==publicRoom.getRoomList()[i].playerList[j].name){
                            my_12=j;
                            room_tag_12=i;
                            //room.getRoomList()[room_tag_64].playerList[my_64].removeState=1;
                            //room.getRoomList()[room_tag_64].playerList[my_64].removeRows=room.getRoomList()[room_tag_64].playerList[my_64].removeRows+removeRow;
                            break;
                        }
                    }
                }
                if(my_12==0){
                    other_12=1;
                }else {
                    other_12=0;
                }
                switch(userInfo.type){
                    case "1"://俄罗斯方块
                        console.log("12俄罗斯模式");
                        let coe_1=3*10;
                        count_punish_data(publicRoom,userInfo,room_tag_12,my_12,other_12,server,coe_1);
                        break;
                    case "2"://宝石
                        let coe_2=13.3*3;
                        count_punish_data(publicRoom,userInfo,room_tag_12,my_12,other_12,server,coe_2);
                        break;
                    case "3":
                        break;
                    case "4"://画像
                        let coe_4=13.3*3;
                        count_punish_data(publicRoom,userInfo,room_tag_12,my_12,other_12,server,coe_4);
                        break;
                }
                //惩罚处理
                break;
            case 13://告知另一方胜利{tag:13,name:,token:,integral:,result:,type:}与case4
                if(userInfo.result==-1){
                    let my_13=0;
                    let room_tag_13=0;
                    let other_13=0;
                    let has_user=true;
                    for(let i=0;i<publicRoom.getRoomList().length;i++){
                        for(let j=0;j<publicRoom.getRoomList()[i].playerList.length;j++){
                            if(userInfo.name==publicRoom.getRoomList()[i].playerList[j].name){
                                my_13=j;
                                room_tag_13=i;
                                has_user=false;
                                break;
                            }
                        }
                    }
                    if(has_user===true){
                        return;
                    }
                    if(my_13==0){
                        other_13=1;
                    }else {
                        other_13=0;
                    }
                    broadcast_data.room=publicRoom.getRoomList()[room_tag_13];
                    broadcast_data.tag="sendResult";
                    broadcast_data.json_data=publicRoom.getRoomList()[room_tag_13].playerList[other_13];
                    server.broadcast(broadcast_data);
                }else{

                }
                break;
            case 14://从匹配界面返回
                reback(userInfo);
                break;

        }
    }


}
//有客户端session接入进来,加入到全局变量中
function on_session_enter(session,server,port){
    global_session_list.push(session);
    /*listen_timeout(session,token,tokenlist_game, function (data) {//7_19
     console.log(data);
     on_session_exit(session,server,port);//7_19
     })*/
    mysql_server.getServerByPort(port, function (err,servers) {
        let allCount=servers[0].count+1;
        mysql_server.updateServerCountByPort(port,allCount, function (err,result_value) {
            if(err){
                console.log("GameServer-275:","修改失败");
                return;
            }else {
                result.result="ok";
                result.msg="linkSuccess";
                result.data=session.user;
                session.send(JSON.stringify(result));
                console.log("linkSuccess");
                let userList=[];
                for(let i=0;i<global_session_list.length;i++){
                    userList.push(global_session_list[i].user);
                }
                console.log("该",port,"下的玩家：",userList);
            }

        })
    })
}
//匹配操作
function matching(json_data,session){

    console.log("matching-------------------------------:",json_data.name);
    for(let i=0;i<global_session_list.length;i++){
        console.log("GameServer-350:",global_session_list[i]);
    }
    let code=new Code(json_data.name,"hex");
    let buf_name=code.setCoding();
    mysql_user.getPlayerByName(buf_name, function (err,result_callback) {
        let coefficient_1=Math.ceil(result_callback[0].integral/500);
        if(result_callback[0].integral%500==0){
            coefficient_1=result_callback[0].integral/500+1
        }
        let maxValue=coefficient_1*500;
        let minValue=maxValue-1000+1;
        let hasPlayer=false;
        console.log("第二个用户的上限为：",minValue);
        console.log("第二个用户的下限为：",maxValue);
        for(let i=0;i<allMatchingPlayer.length;i++){
            if(parseInt(allMatchingPlayer[i].integral)>=minValue&&parseInt(allMatchingPlayer[i].integral)<=maxValue){
                console.log("用户匹配到其他用户加入到房间中");
                console.log("roomList的个数：",publicRoom.getRoomList.length);
                roomid=roomid+1;
                session.user["type"]=json_data.type;//玩家游戏类型
                hasPlayer=true;
                allMatchingPlayer[i].state=1;
                session.user.state=1;
                let user=session.user;
                if(json_data.type=="4"){//决定画像玩家的被惩罚方式
                    let penaltyType_list=[1,2,3,4];//画像的四种惩罚方式
                    let random_penaltyType=Math.random();
                    if(random_penaltyType<=0.25){
                        random_penaltyType=penaltyType_list[0];
                    }
                    if(random_penaltyType>0.25&&random_penaltyType<=0.5){
                        random_penaltyType=penaltyType_list[1];
                    }
                    if(random_penaltyType>0.5&&random_penaltyType<=0.75){
                        random_penaltyType=penaltyType_list[2];
                    }
                    if(random_penaltyType>0.75&&random_penaltyType<=1){
                        random_penaltyType=penaltyType_list[3];
                    }
                    user.penaltyType=random_penaltyType;
                    allMatchingPlayer[i].penaltyType=random_penaltyType;
                    //user.map_list=[[],[],[],[],[],[]];//存放上个下落惩罚方块的状态
                }
                let room=new Room(roomid);
                console.log("GameServer-394:",user);
                console.log("GameServer-395:",allMatchingPlayer[i]);
                room.setPlayerList(user);//讲第二个用户放入房间
                room.setPlayerList(allMatchingPlayer[i]);//将从匹配池的用户放入房间
                room.setRoomList();
                //room.setPlayerList(allMatchingPlayer[i]);
                if(room.getRoomList().length==2){
                    console.log("新的房间1：",room.getRoomList()[0]);
                    console.log("新的房间2：",room.getRoomList()[1]);
                }
                result.result="ok";
                result.data=allMatchingPlayer[i];
                server.broadcast({room:room,tag:"matching",json_data:"",map:""});//{room:,tag:,json_data:,map:}
                allMatchingPlayer.splice(i,1);
                console.log("房间情况：",room.getPlayerList());
                break;
            }
        }
        if(hasPlayer==false){
            console.log("第二次进入时",hasPlayer);
            addMatching(session,allMatchingPlayer,json_data)
                .then(function (data) {
                    allMatchingPlayer=data;
                });
            console.log("after allMatchingPlayer.length:",allMatchingPlayer.length);
        }
        MathcingPlayerState=0;
        console.log("matching----------end");
    });
}
//将用户放入待匹配池中
function addMatching(session,allMatchingPlayer,json_data){
    console.log("addMatching user:",session.user);
    session.user["state"]=0;//待匹配
    session.user["type"]=json_data.type;//玩家游戏类型
    allMatchingPlayer.push(session.user);
    result.result="ok";
    result.data=session.user;
    result.msg="addMatching";
    session.send(JSON.stringify(result));
    console.log("匹配池的人：",allMatchingPlayer);
    return new Promise(function (resolve,reject) {
        resolve(allMatchingPlayer);
    })
}
//当有一个用户中途退出时，对战结果结算
function back(u_tag,r_tag,server){
    if(u_tag==0){
        console.log("进入u_tag==0");
        let buf=new Buffer(publicRoom.getRoomList()[r_tag].playerList[1].name);
        let buf_name=buf.toString("hex");
        let buf_1=new Buffer(publicRoom.getRoomList()[r_tag].playerList[u_tag].name);
        let buf_name_1=buf_1.toString("hex");
        mysql_user.getPlayerByName(buf_name, function (err,result_callback) {
            console.log("=================:",typeof result_callback[0].universal);
            console.log("=================:",result_callback[0].universal);
            let universal_1=JSON.parse(result_callback[0].universal);
            let victory_1=universal_1.victory+1;
            let games_1=universal_1.games+1;
            let integral_1=result_callback[0].integral;
            mysql_user.updateIntegral_victory(buf_name,integral_1,victory_1,games_1, function (err,result_value) {
                mysql_user.getPlayerByName(buf_name_1, function (err,result1_callback) {
                    let universal_2 = JSON.parse(result1_callback[0].universal);
                    let victory_2 = universal_2.victory;
                    let games_2 = universal_2.games + 1;
                    let integral_2=result1_callback[0].integral;
                    mysql_user.updateIntegral_loser(buf_name_1, integral_2,victory_2,games_2, function (err, result_value) {
                        console.log("result_value:",result_value);
                        //将结算结果返回给客户端
                        publicRoom.getRoomList()[r_tag].playerList[u_tag].universal="{\"games\":"+games_2+",\"victory\":"+victory_2+"}";
                        publicRoom.getRoomList()[r_tag].playerList[1].universal="{\"games\":"+games_1+",\"victory\":"+victory_1+"}";
                        server.broadcast({room:publicRoom.getRoomList()[r_tag],tag:"result_score",json_data:"",map:""});
                        //游戏结算后，删除房间
                        publicRoom.getRoomList().splice(r_tag,1);
                        console.log("游戏结算后，房间情况：",publicRoom.getRoomList());
                    });
                });
            });
        });
    }
    if(u_tag==1){
        console.log("进入u_tag==1");
        console.log("获胜方为:",publicRoom.getRoomList()[r_tag].playerList[0].name);
        let buf=new Buffer(publicRoom.getRoomList()[r_tag].playerList[0].name);
        let buf_name=buf.toString("hex");
        let buf_1=new Buffer(publicRoom.getRoomList()[r_tag].playerList[u_tag].name);
        let buf_name_1=buf_1.toString("hex");
        mysql_user.getPlayerByName(buf_name, function (err,result_callback) {
            console.log("=================:",typeof result_callback[0].universal);
            console.log("=================:",result_callback[0].universal);
            let universal_1=JSON.parse(result_callback[0].universal);
            let victory_1=universal_1.victory+1;
            let games_1=universal_1.games+1;
            let integral_1=result_callback[0].integral;
            console.log(universal_1);

            mysql_user.updateIntegral_victory(buf_name,integral_1,victory_1,games_1, function (err,result_value) {
                mysql_user.getPlayerByName(buf_name_1, function (err,result1_callback) {
                    console.log("-----------------:",typeof result1_callback[0].universal);

                    let universal_2 = JSON.parse(result1_callback[0].universal);
                    let victory_2 = universal_2.victory;
                    let games_2 = universal_2.games + 1;
                    let integral_2=result1_callback[0].integral;
                    mysql_user.updateIntegral_loser(buf_name_1, integral_2,victory_2,games_2, function (err, result_value) {
                        console.log("result_value:",result_value);
                        //将结算结果返回给客户端
                        publicRoom.getRoomList()[r_tag].playerList[u_tag].universal="{\"games\":"+games_2+",\"victory\":"+victory_2+"}";
                        publicRoom.getRoomList()[r_tag].playerList[0].universal="{\"games\":"+games_1+",\"victory\":"+victory_1+"}";
                        broadcast_data.room=publicRoom.getRoomList()[r_tag];
                        broadcast_data.tag="result_score";
                        server.broadcast(broadcast_data);
                        //游戏结算后，删除房间
                        publicRoom.getRoomList().splice(r_tag,1);
                        console.log("游戏结算后，房间情况：",publicRoom.getRoomList());
                    });
                });
            });
        });
    }
}
//比赛结束加分情况
function addIntegral(user_high,user_low){
    if(user_high.score>user_low.score){//高分赢
        var bad=user_high.integral-user_low.integral;
        if(bad<=200){
            user_high.integral=user_high.integral+100;
            user_low.integral=user_low.integral+60;
        }else if(bad>200&&bad<=400){
            user_high.integral=user_high.integral+80;
            user_low.integral=user_low.integral+60;
        }else{
            let xishu_1=Math.ceil(bad/200)-2;
            let decate=xishu_1*20;
            user_high.integral=user_high.integral+(80-decate);
            user_low.integral=user_low.integral+(60-decate);
        }
    }else {//高分输
        var bad=user_high.integral-user_low.integral;
        if(bad<=200){
            user_high.integral=user_high.integral+60;
            user_low.integral=user_low.integral+100;
        }else if(bad>200&&bad<=400){
            user_high.integral=user_high.integral+40;
            user_low.integral=user_low.integral+120;
        }else{
            let xishu_1=Math.ceil(bad/200)-2;
            let decate=xishu_1*20;
            user_high.integral=user_high.integral+(40-decate);
            user_low.integral=user_low.integral+(120+decate);
        }
    }
    let user_result=[];
    user_result.push(user_high);
    user_result.push(user_low);
    console.log("user_hight:",user_high);
    console.log("user_low:",user_low);
    return new Promise(function (resolve,reject) {
        resolve(user_result);
    })
}
//在匹配界面返回
function reback(json_data){
    console.log(json_data.name);
    console.log("从匹配界面返回");
    //从匹配池中删除该用户
    for(let i=0;i<allMatchingPlayer.length;i++){
        console.log("从匹配界面返回:",allMatchingPlayer[i]);
        if(allMatchingPlayer[i].name==json_data.name){
            console.log(json_data.name,"从匹配界面返回");
            allMatchingPlayer.splice(i,1);
            break;
        }
    }
}
//更新数据库中用户的积分、胜场和总场数
function updateData(user_result_0,user_result_1,server,room_tag){

    var user_result_0_buf=new Buffer(user_result_0.name);
    var user_result_0_token_string=user_result_0_buf.toString("hex");
    var user_result_1_buf=new Buffer(user_result_1.name);
    var user_result_1_token_string=user_result_1_buf.toString("hex");
    mysql_user.getPlayerByName(user_result_0_token_string, function (err,result_callback) {
        console.log("*****************:",typeof result_callback[0].universal);
        let universal_1=JSON.parse(result_callback[0].universal);
        let victory_1=universal_1.victory+1;
        let games_1=universal_1.games+1;
        mysql_user.updateIntegral_victory(user_result_0_token_string,user_result_0.integral,victory_1,games_1, function (err,result_value) {

            mysql_user.getPlayerByName(user_result_1_token_string, function (err,result1_callback) {
                let universal_2 = JSON.parse(result1_callback[0].universal);
                let victory_2 = universal_2.victory;
                let games_2 = universal_2.games + 1;
                mysql_user.updateIntegral_loser(user_result_1_token_string, user_result_1.integral,victory_2,games_2, function (err, result_value) {
                    //将结算结果返回给客户端
                    console.log("======================:",publicRoom.getRoomList()[room_tag]);
                    for(let i=0;i< publicRoom.getRoomList()[room_tag].playerList.length;i++){
                        if(publicRoom.getRoomList()[room_tag].playerList[i].name==user_result_0.name){
                            publicRoom.getRoomList()[room_tag].playerList[i].universal="{\"games\":"+games_1+",\"victory\":"+victory_1+"}";
                            publicRoom.getRoomList()[room_tag].playerList[i].integral=user_result_0.integral;
                        }else {
                            publicRoom.getRoomList()[room_tag].playerList[i].universal="{\"games\":"+games_2+",\"victory\":"+victory_2+"}";
                            publicRoom.getRoomList()[room_tag].playerList[i].integral=user_result_1.integral;
                        }
                    }
                    broadcast_data.room=publicRoom.getRoomList()[room_tag];
                    broadcast_data.tag="result_score";
                    server.broadcast(broadcast_data);
                    //游戏结算后，删除房间
                    publicRoom.getRoomList().splice(room_tag,1);
                    console.log("游戏结算后，房间情况：",publicRoom.getRoomList());
                });
            });
        });
    });
}
//----------------------------------------------------------------------------case6消除后根据不同类型设置惩罚值并监听惩罚值是否达到120倍数(0)-----------------------------------------
function set_penalty_value(json_data,room,server,coe){
    let removeTime=json_data.removeMapList[0].row;//画像消了多少次
    let my_64=0;
    let room_tag_64=0;
    let other_64=0;
    for(let i=0;i<room.getRoomList().length;i++){
        for(let j=0;j<room.getRoomList()[i].playerList.length;j++){
            if(json_data.name==room.getRoomList()[i].playerList[j].name){
                my_64=j;
                room_tag_64=i;
                break;
            }
        }
    }
    if(my_64==0){
        other_64=1;
    }else {
        other_64=0;
    }
    console.log(json_data.name,"前一次的次数：",room.getRoomList()[room_tag_64].playerList[my_64].removeRows);
    room.getRoomList()[room_tag_64].playerList[my_64].removeRows=room.getRoomList()[room_tag_64].playerList[my_64].removeRows+removeTime;
    room.getRoomList()[room_tag_64].playerList[my_64].penalty_value=Math.ceil(room.getRoomList()[room_tag_64].playerList[my_64].removeRows*coe);
    console.log(room.getRoomList()[room_tag_64].playerList[my_64].name,"现在的次数：",room.getRoomList()[room_tag_64].playerList[my_64].removeRows);
    console.log("哈哈哈哈哈哈哈啊哈哈：",room.getRoomList()[room_tag_64].playerList[my_64].penalty_value);
    if(room.getRoomList()[room_tag_64].playerList[my_64].penalty_value%120==0&&room.getRoomList()[room_tag_64].playerList[my_64].stayState==false){
        room.getRoomList()[room_tag_64].playerList[my_64].stayState=true;//设置该等待者的等待状态
        console.log("等待敌人下落:",room.getRoomList()[room_tag_64].playerList[my_64].stayState);
        broadcast_data.room=room.getRoomList()[room_tag_64];
        broadcast_data.tag="enemyDisappear";
        broadcast_data.json_data=room.getRoomList()[room_tag_64].playerList[other_64];
        server.broadcast(broadcast_data);
    }
}
//----------------------------------------------------------------------------计算惩罚惩罚程度并得出需要惩罚的玩家(1)---------------------------------------------------------------
function count_punish_data(room,json_data,room_tag,my_tag,other_tag,server,coe){
    console.log("计算惩罚惩罚程度并得出需要惩罚的玩家(1)begin");
    console.log("敌人前一次的次数：",room.getRoomList()[room_tag].playerList[my_tag].removeRows);
    room.getRoomList()[room_tag].playerList[my_tag].removeRows=room.getRoomList()[room_tag].playerList[my_tag].removeRows+json_data.removeRow;
    room.getRoomList()[room_tag].playerList[my_tag].penalty_value=Math.ceil(room.getRoomList()[room_tag].playerList[my_tag].removeRows*coe);
    console.log("敌人此时的次数：",room.getRoomList()[room_tag].playerList[my_tag].removeRows);
    var needPenaltyPlayer=0;//需要惩罚的人
    //let unNeedPenaltyPlayer_124=0;//不需要惩罚的人
    var penalty_value=0;//惩罚程度（需要加多少行或者多少列）
    var distance_124=room.getRoomList()[room_tag].playerList[my_tag].penalty_value-room.getRoomList()[room_tag].playerList[other_tag].penalty_value;
    if(distance_124>0){
        needPenaltyPlayer=other_tag;
        //unNeedPenaltyPlayer_124=my_12;
        penalty_value=room.getRoomList()[room_tag].playerList[my_tag].removeRows;
        room.getRoomList()[room_tag].playerList[my_tag].removeRows=0;
        room.getRoomList()[room_tag].playerList[other_tag].removeRows=0;
        room.getRoomList()[room_tag].playerList[my_tag].penalty_value=0;
        room.getRoomList()[room_tag].playerList[other_tag].penalty_value=0;
        room.getRoomList()[room_tag].playerList[other_tag].stayState=false;
    }
    if(distance_124<0){
        needPenaltyPlayer=my_tag;
        distance_124=0-distance_124;
        penalty_value=room.getRoomList()[room_tag].playerList[other_tag].removeRows;
        room.getRoomList()[room_tag].playerList[my_tag].removeRows=0;
        room.getRoomList()[room_tag].playerList[other_tag].removeRows=0;
        room.getRoomList()[room_tag].playerList[my_tag].penalty_value=0;
        room.getRoomList()[room_tag].playerList[other_tag].penalty_value=0;
        room.getRoomList()[room_tag].playerList[other_tag].stayState=false;
    }
    if(distance_124==0){
        room.getRoomList()[room_tag].playerList[my_tag].removeRows=0;
        room.getRoomList()[room_tag].playerList[other_tag].removeRows=0;
        room.getRoomList()[room_tag].playerList[my_tag].penalty_value=0;
        room.getRoomList()[room_tag].playerList[other_tag].penalty_value=0;
        room.getRoomList()[room_tag].playerList[other_tag].stayState=false;
        return;
    }
    console.log("计算惩罚惩罚程度并得出需要惩罚的玩家(1)end");
    //(2)判断需要惩罚的玩家的游戏类型
    var needPenaltyPlayer_type=room.getRoomList()[room_tag].playerList[needPenaltyPlayer].type;
    decide_punish_type(needPenaltyPlayer_type,room,room_tag,needPenaltyPlayer,penalty_value,server);
}
//----------------------------------------------------------------------------判断需要惩罚的玩家的游戏类型并惩罚(2)------------------------------------------------------------------
function decide_punish_type(needPenaltyPlayer_type,room,room_tag,needPenaltyPlayer,penalty_value,server){
    console.log("判断需要惩罚的玩家的游戏类型并惩罚(2)begin");
    switch (needPenaltyPlayer_type){
        case "1"://俄罗斯
            punish_1_1(room,room_tag,needPenaltyPlayer,penalty_value,server);
            break;
        case "2"://宝石
            punish_2_1(room,room_tag,needPenaltyPlayer,penalty_value,server);
            break;
        case "3":
            break;
        case "4"://画像
            let penaltyType_1244=room.getRoomList()[room_tag].playerList[needPenaltyPlayer].penaltyType;
            console.log("惩罚方式:",penaltyType_1244);
            switch (4){//设置画像的惩罚方式默认为4
                case 1:
                    punish_4_1(room,room_tag,needPenaltyPlayer,penalty_value,server);
                    break;
                case 2:
                    punish_4_2(room,room_tag,needPenaltyPlayer,penalty_value,server);
                    break;
                case 3:
                    punish_4_3(room,room_tag,needPenaltyPlayer,penalty_value,server);
                    break;
                case 4:
                    punish_4_4(room,room_tag,needPenaltyPlayer,penalty_value,server);
                    break;
            }
            break;
    }
    console.log("判断需要惩罚的玩家的游戏类型并惩罚(2)end");
}
//----------------------------------------------------------------------------画像的四种惩罚方式(3)------------------------------------------------------------------------------
function punish_4_1(room,room_tag,needPenaltyPlayer,penalty_value,server){

    let rise=penalty_value;
    console.log("画像的四种惩罚方式(31)begin",rise);
    const max_cols=2;//规定下落的列数
    //var map_list=[[],[],[],[],[],[]];//二维数组[[],[],[]]
    var map_list=room.getRoomList()[room_tag].playerList[needPenaltyPlayer].map_list;
    var each_col_list=[];
    var each_col_number=rise*4/max_cols;
    var colors_list=["4","5","6","7"];
    var col_1=0;
    var col_2=0;
    var has_col=false;
    var direct=0;
    console.log("上次的惩罚记录：",map_list);
    for(let i=0;i<map_list.length;i++){
        if(map_list[i].length>0){
            has_col=true;

            if(i+2>5&&map_list[i][0].direction==1){
                console.log("到达最右边:"+i);
                col_1=i-2;
                col_2=i-1;
                direct=-1;
            }
            if(i+3<=5&&i-2>=0&&map_list[i][0].direction==1){
                col_1=i+2;
                col_2=i+3;
                direct=1
            }
            if(i+3<=5&&i-2>=0&&map_list[i][0].direction==-1){
                col_1=i-2;
                col_2=i-1;
                direct=-1
            }
            if(i-1<0&&map_list[i][0].direction==-1){
                col_1=i+2;
                col_2=i+3;
                direct=1;
            }
            if(i-1<0&&map_list[i][0].direction==1){
                col_1=i+2;
                col_2=i+3;
                direct=1;
            }


            break;
        }
    }
    if(has_col==false){//第一次
        col_1=0;
        col_2=1;
        direct=1;
    }
    //重置
    map_list=[[],[],[],[],[],[]];
    var random_color=Math.floor(Math.random()*(colors_list.length));
    for(let i=0;i<each_col_number;i++){
        each_col_list.push({col:col_1,color:colors_list[random_color],direction:direct});
    }
    map_list.splice(col_1,1,each_col_list);
    each_col_list=[];
    random_color=Math.floor(Math.random()*(colors_list.length));
    for(let i=0;i<each_col_number;i++){
        each_col_list.push({col:col_2,color:colors_list[random_color],direction:direct});
    }
    map_list.splice(col_2,1,each_col_list);
    room.getRoomList()[room_tag].playerList[needPenaltyPlayer].map_list=map_list;
    console.log("画像的四种惩罚方式(31)end");
    broadcast_data.room=room.getRoomList()[room_tag];
    broadcast_data.tag="punishMap";
    broadcast_data.json_data=room.getRoomList()[room_tag].playerList[needPenaltyPlayer];
    broadcast_data.map=map_list;
    server.broadcast(broadcast_data);
}
function punish_4_2(room,room_tag,needPenaltyPlayer,penalty_value,server){

    let rise=penalty_value;
    console.log("画像的四种惩罚方式(32)begin",rise);
    const max_cols=2;//规定下落的列数
    //var map_list=[[],[],[],[],[],[]];//二维数组[[],[],[]]
    var map_list=room.getRoomList()[room_tag].playerList[needPenaltyPlayer].map_list;
    var each_col_list=[];
    var each_col_number=rise*4/max_cols;
    var colors_list=["4","5","6","7"];
    var col_1=0;
    var col_2=0;
    var has_col=false;
    var direct=0;
    console.log("上次的惩罚记录：",map_list);
    for(let i=0;i<map_list.length;i++){
        if(map_list[i].length>0){
            has_col=true;

            if(i+2>5&&map_list[i][0].direction==-1){
                console.log("到达最右边:"+i);
                col_1=i-2;
                col_2=i-1;
                direct=-1;
            }
            if(i+2>5&&map_list[i][0].direction==1){
                console.log("到达最右边:"+i);
                col_1=i-2;
                col_2=i-1;
                direct=-1;
            }
            if(i+3<=5&&i-2>=0&&map_list[i][0].direction==-1){
                col_1=i-2;
                col_2=i-1;
                direct=-1
            }
            if(i+3<=5&&i-2>=0&&map_list[i][0].direction==1){
                col_1=i+2;
                col_2=i+3;
                direct=1
            }
            if(i-1<0&&map_list[i][0].direction==-1){
                col_1=i+2;
                col_2=i+3;
                direct=1;
            }

            break;
        }
    }
    if(has_col==false){//第一次
        col_1=4;
        col_2=5;
        direct=-1;
    }
    //重置
    map_list=[[],[],[],[],[],[]];
    var random_color=Math.floor(Math.random()*(colors_list.length));
    for(let i=0;i<each_col_number;i++){
        each_col_list.push({col:col_1,color:colors_list[random_color],direction:direct});
    }
    map_list.splice(col_1,1,each_col_list);
    each_col_list=[];
    random_color=Math.floor(Math.random()*(colors_list.length));
    for(let i=0;i<each_col_number;i++){
        each_col_list.push({col:col_2,color:colors_list[random_color],direction:direct});
    }
    map_list.splice(col_2,1,each_col_list);
    room.getRoomList()[room_tag].playerList[needPenaltyPlayer].map_list=map_list;
    console.log("画像的四种惩罚方式(32)end");
    broadcast_data.room=room.getRoomList()[room_tag];
    broadcast_data.tag="punishMap";
    broadcast_data.json_data=room.getRoomList()[room_tag].playerList[needPenaltyPlayer];
    broadcast_data.map=map_list;
    server.broadcast(broadcast_data);
}
function punish_4_3(room,room_tag,needPenaltyPlayer,penalty_value,server){

    const max_cols=2;//规定下落的列数
    var rise=penalty_value;
    console.log("画像的四种惩罚方式(33)begin:",rise);
    var map_list=room.getRoomList()[room_tag].playerList[needPenaltyPlayer].map_list;//二维数组[[],[],[]]//房间用户信息中获得
    var each_col_list=[];
    var each_col_number=rise*4/max_cols;
    var colors_list=["4","5","6","7"];
    var col_1=0;
    var col_2=0;
    var has_col=false;
    var direct_1=0;//第一列的方向
    var direct_2=0;//第二列的方向

    for(let i=0;i<map_list.length;i++){
        if(map_list[i].length>0){
            has_col=true;
            var col_number_list=findColNumber(map_list);//查找到已有列数的下标
            console.log("上次的惩罚记录：",map_list);
            console.log(col_number_list);
            col_1=col_number_list[0];
            col_2=col_number_list[1];
            if(map_list[col_1][0].direction==1&&map_list[col_2][0].direction==-1){
                if(col_2-col_1>=1){
                    col_2=col_2-1;
                    col_1=col_1+1;
                    direct_1=1;
                    direct_2=-1;
                }else {
                    let temp_index=col_1;
                    col_1=col_2;
                    col_2=temp_index;
                    col_1=col_1-1;
                    col_2=col_2+1;
                    direct_1=-1;
                    direct_2=1;
                }
            }else if(map_list[col_1][0].direction==-1&&map_list[col_2][0].direction==1){
                if(col_1==0&&col_2==5){
                    col_1=col_1+1;
                    col_2=col_2-1;
                    direct_1=1;
                    direct_2=-1;
                }else {
                    col_1=col_1-1;
                    col_2=col_2+1;
                    direct_1=-1;
                    direct_2=1;
                }
            }

            break;
        }
    }
    if(has_col==false){//第一次
        col_1=0;
        col_2=5;
        direct_1=1;
        direct_2=-1;
    }
//重置
    map_list=[[],[],[],[],[],[]];
    var random_color=Math.floor(Math.random()*(colors_list.length));
    for(let i=0;i<each_col_number;i++){
        each_col_list.push({col:col_1,color:colors_list[random_color],direction:direct_1});
    }
    map_list.splice(col_1,1,each_col_list);
    each_col_list=[];
    random_color=Math.floor(Math.random()*(colors_list.length));
    for(let i=0;i<each_col_number;i++){
        each_col_list.push({col:col_2,color:colors_list[random_color],direction:direct_2});
    }
    map_list.splice(col_2,1,each_col_list);
    room.getRoomList()[room_tag].playerList[needPenaltyPlayer].map_list=map_list;
    console.log("画像的四种惩罚方式(33)end");
    broadcast_data.room=room.getRoomList()[room_tag];
    broadcast_data.tag="punishMap";
    broadcast_data.json_data=room.getRoomList()[room_tag].playerList[needPenaltyPlayer];
    broadcast_data.map=map_list;
    server.broadcast(broadcast_data);
}
function punish_4_4(room,room_tag,needPenaltyPlayer,penalty_value,server){

    var rise=penalty_value;
    console.log("画像的四种惩罚方式(34)begin",rise);
    var map_list=room.getRoomList()[room_tag].playerList[needPenaltyPlayer].map_list;//二维数组[[],[],[]]
    var each_col_list=[];
    var each_col_number=4;
    var colors_list=["4","5","6","7"];
    var tag_map_list=[];
    if(rise<=6){
        console.log("上次的惩罚记录：",map_list);
        let index=findColNumber_last(map_list);
        console.log(index);
        let tag_col=index;
        map_list=[[],[],[],[],[],[]];
        for(let i=0;i<rise;i++){
            if(index+2>5){
                tag_col=0;
                while(map_list[tag_col].length>0){
                    tag_col=tag_col+1;
                }
                let random_color=Math.floor(Math.random()*(colors_list.length));
                for(let j=0;j<each_col_number;j++){
                    each_col_list.push({col:tag_col,color:colors_list[random_color]});
                }
                map_list.splice(tag_col,1,each_col_list);
                index=findColNumber_last(map_list);
                each_col_list=[];
            }else{
                tag_col=index+2;
                while(map_list[tag_col].length>0){
                    tag_col=tag_col+1;
                }
                let random_color=Math.floor(Math.random()*(colors_list.length));
                for(let j=0;j<each_col_number;j++){
                    each_col_list.push({col:tag_col,color:colors_list[random_color]});
                }
                map_list.splice(tag_col,1,each_col_list);
                index=findColNumber_last(map_list);
                each_col_list=[];
            }
        }
    }else {
        let index=0;
        let tag_col=index;
        map_list=[[],[],[],[],[],[]];
        for(let i=0;i<6;i++){
            if(index+2>5){
                tag_col=0;
                while(map_list[tag_col].length>0){
                    tag_col=tag_col+1;
                }
                let random_color=Math.floor(Math.random()*(colors_list.length));
                for(let j=0;j<each_col_number;j++){
                    each_col_list.push({col:tag_col,color:colors_list[random_color]});
                }
                map_list.splice(tag_col,1,each_col_list);
                index=findColNumber_last(map_list);
                each_col_list=[];
            }else{
                tag_col=index+2;
                while(map_list[tag_col].length>0){
                    tag_col=tag_col+1;
                }
                let random_color=Math.floor(Math.random()*(colors_list.length));
                for(let j=0;j<each_col_number;j++){
                    each_col_list.push({col:tag_col,color:colors_list[random_color]});
                }
                map_list.splice(tag_col,1,each_col_list);
                index=findColNumber_last(map_list);
                each_col_list=[];
            }
        }
        var add_col=rise-6;
        index=0;

        for(let i=0;i<add_col;i++){
            if(index+2>5){
                tag_col=0;
                let random_color=map_list[tag_col][0].color;
                for(let j=0;j<each_col_number;j++){
                    each_col_list.push({col:tag_col,color:random_color});
                }
                for(let j=0;j<each_col_list.length;j++){
                    map_list[tag_col].push(each_col_list[j]);
                }
                tag_map_list.push(each_col_list);
                index=findColNumber_last(tag_map_list);
                each_col_list=[];
            }else{
                tag_col=index+2;
                let random_color=map_list[tag_col][0].color;
                for(let j=0;j<each_col_number;j++){
                    each_col_list.push({col:tag_col,color:random_color});
                }
                for(let j=0;j<each_col_list.length;j++){
                    map_list[tag_col].push(each_col_list[j]);
                }

                tag_map_list.push(each_col_list);
                index=findColNumber_last(tag_map_list);
                each_col_list=[];
            }
        }
    }
    room.getRoomList()[room_tag].playerList[needPenaltyPlayer].map_list=map_list;
    let json_value={arrayMap:map_list,count:penalty_value};
    console.log("画像的四种惩罚方式(34)end");
    broadcast_data.room=room.getRoomList()[room_tag];
    broadcast_data.tag="punishMap";
    broadcast_data.json_data=room.getRoomList()[room_tag].playerList[needPenaltyPlayer];
    broadcast_data.map=map_list;
    server.broadcast(broadcast_data);
}
//---------------------------------------------------------------------------俄罗斯的惩罚方式(3)-----------------------------------------------------------------------------------------------
function punish_1_1(room,room_tag,needPenaltyPlayer,penalty_value,server){
    console.log("俄罗斯的惩罚方式begin");
    var _12_1=Math.random()*11;
    //var _1_2=3;
    var all_list=[];
    var white_list=[];
    var rise=penalty_value;
    console.log("惩罚值为：",rise);
    for(let i=0;i<10;i++){
        all_list.push(i);
    }
    var black_list=[];
    var array_map=[];
    var white_counts=rise;
    var row_index=0;
    while(white_counts>0){
        let white_count_random=Math.ceil(Math.random()*white_counts);
        if(white_count_random<=5){
            for(let i=0;i<white_count_random;i++){
                let index=Math.floor(Math.random()*(all_list.length));
                white_list.push(all_list[index]);
                all_list.splice(index,1);
            }
            white_counts=white_counts-white_count_random;
            black_list=[...all_list];
            for(let i=0;i<white_list.length;i++){
                array_map.push({row:row_index,col:white_list[i],color:"white"});
            }
            for(let i=0;i<black_list.length;i++){
                let colors=["green","blue","red"];
                let index_color=Math.floor(Math.random()*(colors.length));
                array_map.push({row:row_index,col:black_list[i],color:colors[index_color]});
            }
            row_index++;
            all_list=[];
            white_list=[];
            black_list=[];
            for(let j=0;j<10;j++){
                all_list.push(j);
            }
        }
    }
    let json_value={arrayMap:array_map,count:row_index};
    console.log(array_map);
    console.log("俄罗斯的惩罚方式end");
    broadcast_data.room=room.getRoomList()[room_tag];
    broadcast_data.tag="punishMap";
    broadcast_data.json_data=room.getRoomList()[room_tag].playerList[needPenaltyPlayer];
    broadcast_data.map=json_value;
    server.broadcast(broadcast_data);
}
//----------------------------------------------------------------------第三种方式查找到已有列的两个下标------------------------------------------------------------------------
function findColNumber(map_list){
    var map_temp_list=[];
    for(let i=0;i<map_list.length;i++){
        map_temp_list[i]=map_list[i];
    }
    var temp=[];
    for(let i=0;i<map_temp_list.length;i++){
        if(map_temp_list[i].length>0){
            temp.push(i);
            map_temp_list.splice(i,1,[]);
            if(temp.length==2){
                break;
            }
        }
    }
    return temp;
}
//----------------------------------------------------------------------第四种方式查找到已有列的两个下标------------------------------------------------------------------------
function findColNumber_last(map_list){//发现空的列数
    var map_temp_list=[];
    for(let i=0;i<map_list.length;i++){
        map_temp_list[i]=map_list[i];
    }
    var temp=0;
    for(let i=0;i<map_temp_list.length;i++){
        if(map_temp_list[i].length>0){
            temp=i;
        }
    }
    return temp;
}

//-------------------------------------------------------------------------宝石的惩罚方式-----------------------------------------------------------------------------------------------------
function punish_2_1(room,room_tag,needPenaltyPlayer,penalty_value,server){
    console.log("宝石惩罚方式(21)begin");
    let rise=penalty_value;
    const max_col_num=3;
    const colors_able=["0","1","2","3"];
    const colors_unable=["4"];
    var colors_list=[...colors_able];
    let map_list=room.getRoomList()[room_tag].playerList[needPenaltyPlayer].map_list;

    let count_col=0;//记录上次地图的列数
    let index_col=[];//标记第一个非空块的位置

    var create_map_col=[];
    map_list.forEach(function (str_1,index) {
        if(str_1.length>0){
            index_col.push(index);
            count_col+=1;
        }
    });
    switch (count_col) {
        case 0:
            var down_index=Math.ceil(Math.random()*10);
            if(rise<=4){
                if(down_index<=3){//生成一列带有不可消除
                    var num_1=rise-1;
                    for(let i=0;i<max_col_num;i++){
                        let index_color=Math.floor(Math.random()*colors_list.length);
                        create_map_col.push({col:0,color:colors_list[index_color]});
                        colors_list.splice(index_color,1);
                    }
                    colors_list=[...colors_able];
                    map_list=[[],[],[],[],[],[]];
                    map_list.splice(0,1,create_map_col);
                    if(num_1!=0){
                        map_list=add_unthunk(index_col,map_list,num_1);
                    }
                }else {//生成三列
                    map_list=create_map(rise,map_list,create_map_col,colors_list,index_col);
                }
            }
            if(rise>4&&rise<=8){
                if(down_index<=3){//生成两列带有不可消除
                    var num_2=rise-2;
                    map_list=[[],[],[],[],[],[]];
                    for(let i=0;i<max_col_num;i++){
                        let index_color=Math.floor(Math.random()*colors_list.length);
                        create_map_col.push({col:0,color:colors_list[index_color]});
                        colors_list.splice(index_color,1);
                    }
                    colors_list=[...colors_able];
                    map_list.splice(0,1,create_map_col);
                    create_map_col=[];
                    for(let i=0;i<max_col_num;i++){
                        let index_color=Math.floor(Math.random()*colors_list.length);
                        create_map_col.push({col:1,color:colors_list[index_color]});
                        colors_list.splice(index_color,1);
                    }
                    colors_list=[...colors_able];
                    map_list.splice(1,1,create_map_col);
                    if(num_2!=0){
                        map_list=add_unthunk(index_col,map_list,num_2);
                    }
                }else {
                    map_list=create_map(rise,map_list,create_map_col,colors_list,index_col);
                }
            }
            if(rise>8){
                map_list=create_map(rise,map_list,create_map_col,colors_list,index_col);
            }
            break;
        case 1:
            var down_index_1=Math.ceil(Math.random()*10);
            if(rise<=4){
                if(down_index_1<=3){//生成一列带有不可消除
                    var num_11=rise-1;
                    for(let i=0;i<max_col_num;i++){
                        let index_color=Math.floor(Math.random()*colors_list.length);
                        if(index_col[0]+1>5){
                            index_col[0]=-1;
                            create_map_col.push({col:index_col[0]+1,color:colors_list[index_color]});
                        }else {
                            create_map_col.push({col:index_col[0]+1,color:colors_list[index_color]});
                        }
                        colors_list.splice(index_color,1);
                    }
                    colors_list=[...colors_able];
                    map_list=[[],[],[],[],[],[]];
                    map_list.splice(index_col[0]+1,1,create_map_col);
                    if(num_11!=0){
                        map_list=add_unthunk(index_col,map_list,num_11);
                    }
                }else {//生成三列
                    map_list=create_map(rise,map_list,create_map_col,colors_list,index_col);
                }
            }
            if(rise>4&&rise<=8){
                if(down_index_1<=3){//生成两列带有不可消除
                    var num_21=rise-2;
                    map_list=[[],[],[],[],[],[]];
                    for(let i=0;i<max_col_num;i++){
                        let index_color=Math.floor(Math.random()*colors_list.length);
                        create_map_col.push({col:0,color:colors_list[index_color]});
                        colors_list.splice(index_color,1);
                    }
                    colors_list=[...colors_able];
                    map_list.splice(0,1,create_map_col);
                    create_map_col=[];
                    for(let i=0;i<max_col_num;i++){
                        let index_color=Math.floor(Math.random()*colors_list.length);
                        create_map_col.push({col:1,color:colors_list[index_color]});
                        colors_list.splice(index_color,1);
                    }
                    colors_list=[...colors_able];
                    map_list.splice(1,1,create_map_col);
                    if(num_21!=0){
                        map_list=add_unthunk(index_col,map_list,num_21);
                    }
                }else {
                    map_list=create_map(rise,map_list,create_map_col,colors_list,index_col);
                }
            }
            if(rise>8){
                map_list=create_map(rise,map_list,create_map_col,colors_list,index_col);
            }
            break;
        case 2:
            var down_index_2=Math.ceil(Math.random()*10);
            if(rise<=4){
                if(down_index_2<=3){//生成一列带有不可消除
                    var num_12=rise-1;
                    for(let i=0;i<max_col_num;i++){
                        let index_color=Math.floor(Math.random()*colors_list.length);
                        create_map_col.push({col:0,color:colors_list[index_color]});
                        colors_list.splice(index_color,1);
                    }
                    colors_list=[...colors_able];
                    map_list=[[],[],[],[],[],[]];
                    map_list.splice(0,1,create_map_col);
                    if(num_12!=0){
                        map_list=add_unthunk(index_col,map_list,num_12);
                    }
                }else {//生成三列
                    map_list=create_map(rise,map_list,create_map_col,colors_list,index_col);
                }
            }
            if(rise>4&&rise<=8){
                if(down_index_2<=3){//生成两列带有不可消除
                    var num_22=rise-2;
                    map_list=[[],[],[],[],[],[]];
                    for(let i=0;i<max_col_num;i++){
                        let index_color=Math.floor(Math.random()*colors_list.length);
                        if(index_col[0]+2>4){
                            index_col[0]=-2;
                            create_map_col.push({col:index_col[0]+2,color:colors_list[index_color]});
                        }else {
                            create_map_col.push({col:index_col[0]+2,color:colors_list[index_color]});
                        }
                        colors_list.splice(index_color,1);
                    }
                    colors_list=[...colors_able];
                    map_list.splice(index_col[0]+2,1,create_map_col);
                    create_map_col=[];
                    for(let i=0;i<max_col_num;i++){
                        let index_color=Math.floor(Math.random()*colors_list.length);
                        create_map_col.push({col:index_col[0]+3,color:colors_list[index_color]});
                        colors_list.splice(index_color,1);
                    }
                    colors_list=[...colors_able];
                    map_list.splice(index_col[0]+3,1,create_map_col);
                    if(num_22!=0){
                        map_list=add_unthunk(index_col,map_list,num_22);
                    }
                }else {
                    map_list=create_map(rise,map_list,create_map_col,colors_list,index_col);
                }
            }
            if(rise>8){
                map_list=create_map(rise,map_list,create_map_col,colors_list,index_col);
            }
            break;
        case 3:
            console.log("case3:",index_col);
            if(index_col[0]===0&&index_col[1]===1&&index_col[2]===2){
                let map_1=[];
                let unable_thunk=rise-3;
                if(unable_thunk===0){
                    map_list=create_unequal_thunk_2(map_1,map_list,colors_list,create_map_col,index_col);
                }else {
                    map_list=create_unequal_thunk_2(map_1,map_list,colors_list,create_map_col,index_col);
                    index_col=[];
                    map_list.forEach(function (str_1,index) {
                        if(str_1.length>0){
                            index_col.push(index);
                        }
                    });
                    for(let i=0;i<unable_thunk;i++){
                        let index_1=Math.floor(Math.random()*index_col.length);
                        let flag=-1;
                        let flag_index=is_all_unthunk(flag,index_1,index_col,map_list);
                        console.log("===========================:",flag_index);
                        map_list[flag_index[0]][flag_index[1]].color=colors_unable[0];
                    }
                }
            }else if(index_col[0]===3&&index_col[1]===4&&index_col[2]===5){
                let map_1=[];
                let unable_thunk=rise-3;
                if(unable_thunk===0){
                    map_list=create_unequal_thunk_1(map_1,map_list,colors_list,create_map_col,index_col);
                }else {
                    map_list=create_unequal_thunk_1(map_1,map_list,colors_list,create_map_col,index_col);
                    index_col=[];
                    map_list.forEach(function (str_1,index) {
                        if(str_1.length>0){
                            index_col.push(index);
                        }
                    });
                    for(let i=0;i<unable_thunk;i++){
                        let index_1=Math.floor(Math.random()*index_col.length);
                        let flag=-1;
                        let flag_index=is_all_unthunk(flag,index_1,index_col,map_list);
                        console.log("===========================:",flag_index);
                        map_list[flag_index[0]][flag_index[1]].color=colors_unable[0];
                    }
                }
            }else if(index_col[0]===0&&index_col[1]===2&&index_col[2]===4){
                map_list=is_all_unthunk_1(rise,map_list,create_map_col,colors_list,index_col,1);

            }else {
                map_list=is_all_unthunk_1(rise,map_list,create_map_col,colors_list,index_col,-1);
            }

            break;
    }
    room.getRoomList()[room_tag].playerList[needPenaltyPlayer].map_list=map_list;
    let json_value={arrayMap:map_list,count:0};
    console.log("宝石惩罚方式(21)end");
    broadcast_data.room=room.getRoomList()[room_tag];
    broadcast_data.tag="punishMap";
    broadcast_data.json_data=room.getRoomList()[room_tag].playerList[needPenaltyPlayer];
    broadcast_data.map=json_value;
    server.broadcast(broadcast_data);

}
//------------------------------------------------------------------添加不可消除块begin------------------------------------------------------------------
function add_unthunk(index_col,map_list,unable_thunk){
    index_col=[];
    map_list.forEach(function (str_1,index) {
        if(str_1.length>0){
            index_col.push(index);
        }
    });
    for(let i=0;i<unable_thunk;i++){
        let index_1=Math.floor(Math.random()*index_col.length);
        let flag=-1;
        let flag_index=is_all_unthunk(flag,index_1,index_col,map_list);
        console.log("===========================:",flag_index);
        map_list[flag_index[0]][flag_index[1]].color=colors_unable[0];
    }
    return map_list;
}
//------------------------------------------------------------------添加不可消除块end------------------------------------------------------------------
//------------------------------------------------------------------宝石生成三列的情况下（70%）begin---------------------------------------------------------
function create_map(rise,map_list,create_map_col,colors_list,index_col){
    let map_1=[];
    let unable_thunk=rise-3;
    if(unable_thunk===0){
        map_list=[[],[],[],[],[],[]];
        for(let index=0;index<3;index++){
            for(let i=0;i<max_col_num;i++){
                let index_color=Math.floor(Math.random()*colors_list.length);
                create_map_col.push({col:index,color:colors_list[index_color]});
                colors_list.splice(index_color,1);
            }
            colors_list=[...colors_able];
            map_list.splice(index,1,create_map_col);
            create_map_col=[];
        }
    }else {
        map_list=[[],[],[],[],[],[]];
        for(let index=0;index<3;index++){
            for(let i=0;i<max_col_num;i++){
                let index_color=Math.floor(Math.random()*colors_list.length);
                create_map_col.push({col:index,color:colors_list[index_color]});
                colors_list.splice(index_color,1);
            }
            colors_list=[...colors_able];
            map_list.splice(index,1,create_map_col);
            create_map_col=[];
        }
        map_list=add_unthunk(index_col,map_list,unable_thunk);
    }
    return map_list;

}
//------------------------------------------------------------------宝石生成三列的情况下（70%）end-----------------------------------------------------------

//-------------------------------------------------------------------宝石三个分开列的方法begin------------------------------------------------------
function is_all_unthunk_1(rise,map_list,create_map_col,colors_list,index_col,type){
    let map_1=[];
    let unable_thunk=rise-3;
    if(unable_thunk===0){
        map_list=[[],[],[],[],[],[]];
        for(let index=0;index<3;index++){
            for(let i=0;i<max_col_num;i++){
                let index_color=Math.floor(Math.random()*colors_list.length);
                create_map_col.push({col:index_col[index]+type,color:colors_list[index_color]});
                colors_list.splice(index_color,1);
            }
            colors_list=[...colors_able];
            map_list.splice(index_col[index]+type,1,create_map_col);
            create_map_col=[];
        }
    }else {
        map_list=[[],[],[],[],[],[]];
        for(let index=0;index<3;index++){
            for(let i=0;i<max_col_num;i++){
                let index_color=Math.floor(Math.random()*colors_list.length);
                create_map_col.push({col:index_col[index]+type,color:colors_list[index_color]});
                colors_list.splice(index_color,1);
            }
            colors_list=[...colors_able];
            map_list.splice(index_col[index]+type,1,create_map_col);
            create_map_col=[];
        }
        map_list=add_unthunk(index_col,map_list,unable_thunk);
    }
    return map_list;
}

//-------------------------------------------------------------------宝石三个分开列的方法end------------------------------------------------------
//-------------------------------------------------------------------宝石三个相连列的方法begin------------------------------------------------------
function is_all_unthunk(flag,index,index_col,map_list){
    for(let i=0;i<map_list[index_col[index]].length;i++){
        if(map_list[index_col[index]][i].color!="4"){
            flag=i;
            break;
        }
    }
    if(flag==-1){
        index_col.splice(index,1);
        index=Math.floor(Math.random()*index_col.length);
        [index_col[index],flag]=is_all_unthunk(flag,index,index_col,map_list);
        return [index_col[index],flag];
    }else {
        return [index_col[index],flag];
    }
}

function create_unequal_thunk_1(map_1,map_list,colors_list,create_map_col,index_col){
    for(let i=0;i<max_col_num;i++){
        let index_color=Math.floor(Math.random()*colors_list.length);
        create_map_col.push({col:index_col[0],color:colors_list[index_color]});
        colors_list.splice(index_color,1);
    }
    colors_list=[...colors_able];
    map_list=[[],[],[],[],[],[]];
    map_list.splice(0,1,create_map_col);
    for(let i=0;i<max_col_num;i++){
        let index_color=Math.floor(Math.random()*colors_list.length);
        if(map_list[0][i].color===colors_list[index_color]){
            if(index_color+1>=colors_list.length){
                map_1.push({col:1,color:colors_list[0]});
                colors_list.splice(0,1);
            }else {
                map_1.push({col:1,color:colors_list[index_color+1]});
                colors_list.splice(index_color+1,1);
            }
        }else {
            map_1.push({col:1,color:colors_list[index_color]});
            colors_list.splice(index_color,1);
        }
    }
    map_list.splice(1,1,map_1);
    colors_list=[...colors_able];
    map_1=[];
    for(let i=0;i<max_col_num;i++){
        let index_color=Math.floor(Math.random()*colors_list.length);
        if(map_list[1][i].color===colors_list[index_color]){
            if(index_color+1>=colors_list.length){
                map_1.push({col:2,color:colors_list[0]});
                colors_list.splice(0,1);
            }else {
                map_1.push({col:2,color:colors_list[index_color+1]});
                colors_list.splice(index_color+1,1);
            }
        }else {
            map_1.push({col:2,color:colors_list[index_color]});
            colors_list.splice(index_color,1);
        }
    }
    if(map_1[0].color===map_list[1][1].color){
        colors_list=[...colors_able];
        colors_list.splice(colors_list.indexOf(map_list[1][1].color),1);
        colors_list.splice(colors_list.indexOf(map_list[1][0].color),1);
        let index_color=Math.floor(Math.random()*colors_list.length);
        map_1[0].color=colors_list[index_color];
    }
    if(map_1[2].color===map_list[1][1].color){
        colors_list=[...colors_able];
        colors_list.splice(colors_list.indexOf(map_list[1][0].color),1);
        colors_list.splice(colors_list.indexOf(map_list[1][2].color),1);
        let index_color=Math.floor(Math.random()*colors_list.length);
        map_1[2].color=colors_list[index_color];
    }
    map_list.splice(2,1,map_1);
    colors_list=[...colors_able];
    map_1=[];
    index_col=[];
    return map_list;
}
function create_unequal_thunk_2(map_1,map_list,colors_list,create_map_col,index_col){
    for(let i=0;i<max_col_num;i++){
        let index_color=Math.floor(Math.random()*colors_list.length);
        create_map_col.push({col:index_col[0],color:colors_list[index_color]});
        colors_list.splice(index_color,1);
    }
    colors_list=[...colors_able];
    map_list=[[],[],[],[],[],[]];
    map_list.splice(3,1,create_map_col);
    for(let i=0;i<max_col_num;i++){
        let index_color=Math.floor(Math.random()*colors_list.length);
        if(map_list[3][i].color===colors_list[index_color]){
            if(index_color+1>=colors_list.length){
                map_1.push({col:1,color:colors_list[0]});
                colors_list.splice(0,1);
            }else {
                map_1.push({col:1,color:colors_list[index_color+1]});
                colors_list.splice(index_color+1,1);
            }
        }else {
            map_1.push({col:1,color:colors_list[index_color]});
            colors_list.splice(index_color,1);
        }
    }
    map_list.splice(4,1,map_1);
    colors_list=[...colors_able];
    map_1=[];
    for(let i=0;i<max_col_num;i++){
        let index_color=Math.floor(Math.random()*colors_list.length);
        if(map_list[4][i].color===colors_list[index_color]){
            if(index_color+1>=colors_list.length){
                map_1.push({col:2,color:colors_list[0]});
                colors_list.splice(0,1);
            }else {
                map_1.push({col:2,color:colors_list[index_color+1]});
                colors_list.splice(index_color+1,1);
            }
        }else {
            map_1.push({col:2,color:colors_list[index_color]});
            colors_list.splice(index_color,1);
        }
    }
    if(map_1[0].color===map_list[4][1].color){
        colors_list=[...colors_able];
        colors_list.splice(colors_list.indexOf(map_list[4][1].color),1);
        colors_list.splice(colors_list.indexOf(map_list[4][0].color),1);
        let index_color=Math.floor(Math.random()*colors_list.length);
        map_1[0].color=colors_list[index_color];
    }
    if(map_1[2].color===map_list[4][1].color){
        colors_list=[...colors_able];
        colors_list.splice(colors_list.indexOf(map_list[4][0].color),1);
        colors_list.splice(colors_list.indexOf(map_list[4][2].color),1);
        let index_color=Math.floor(Math.random()*colors_list.length);
        map_1[2].color=colors_list[index_color];
    }
    map_list.splice(5,1,map_1);
    colors_list=[...colors_able];
    map_1=[];
    return map_list;
}
//------------------------------------------------------------------宝石三个相连列的方法end--------------------------------------------------

//---------------------------------------------------------------------------------------------------------关闭服务器---------------------------------------------------------------------------
function close_game_server(){
    //console.log("after server:",server._server);
    if(server._server==null){
        console.log("服务器已经关闭");
    }else {

        console.log("服务器关闭成功");
        server.close();
    }
}

exports.open=start_game_server;
exports.close=close_game_server;
var LogJs=require('../utils/LogJs');
var _Date=require('../utils/Date');

exports.getCacheGame= function (req,res) {
    let list={
        "allMatchingPlayer":allMatchingPlayer,
        "global_session_list":global_session_list
    };
    //将缓存数据主动加入的文件中保存
    let logjs=new LogJs();
    let date=new _Date();
    logjs.setConfig("game_server_cache",date._getDate().toString()+"_game_server_cache")
        .then(function (content) {
            if(content.tag){
                console.log("日志配置设置成功-123:",content.content);
                list.getTime=new Date().getHours()+":"+new Date().getMinutes();
                let logger=logjs.useLogger(date._getDate().toString()+"_game_server_cache");
                logjs.createLog(logger,JSON.stringify(list));
            }
        });
    return res.send({"list":list});
};