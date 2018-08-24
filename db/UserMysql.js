/**
 * Created by Administrator on 2018/7/28.
 */
var mysql=require('mysql');

var _Date=require("../utils/Date");
var conn_pool=mysql.createPool({
    host:"127.0.0.1" ,
    port:3306,
    database:"mysql_user",
    user:"root",
    password:"03251222yxn"
});
function mysql_exce(sql,callback){
    conn_pool.getConnection(function (err,conn) {
        if(err){

            console.log("连接数据库失败",err);

            return;
        }else {
            console.log("连接数据库成功");
            conn.query(sql, function (sql_err,sql_result,fields_desic) {
                if(sql_err){
                    if(callback){
                        callback(sql_err,null,null);
                        conn.release();
                    }
                    return;
                }
                if(callback){
                    callback(null,sql_result,fields_desic);
                    conn.release();
                }
            });
        }


    });
}

//根据用户名获取用户信息
exports.getUserByName= function (name,password,callback) {
    console.log("mysql_user.js/getUserByName");
    var sql="select * from user where name=\""+name+"\" and password=\""+password+"\"";
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        console.log("sql_result:",sql_result);
        if(err){
            //console.log(err);
            callback(err,null);
        }else{
            callback(null,sql_result);
        }

    })
};
//根据用户名获取用户信息
exports.getPlayerByName= function (name,callback) {
    console.log("mysql_user.js/getUserByName");
    var sql="select * from player where name=\""+name+"\"";
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        console.log("sql_result:",sql_result);
        if(err){
            //console.log(err);
            callback(err,null);
        }else {
            callback(null,sql_result);
        }

    })
};
//根据用户名获取用户信息(微信小游戏版本)
exports.getPlayerByOpenId= function (openid,callback) {
    console.log("mysql_user.js/getUserByOpenid");
    console.log("UserMysql-75:",openid);
    var sql="select * from player where openid=\""+openid+"\"";
    console.log("UserMysql-77:",sql);
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        console.log("sql_result:",sql_result);
        if(err){
            //console.log(err);
            callback(err,null);
        }else {
            callback(null,sql_result);
        }

    })
};
//用户第一次微信登录，将用户信息保存到数据库
exports.addPlayer= function (name,type,openid,callback) {
    console.log("mysql_user:81",openid);
    let date=new _Date();
    let time=date._getDate();
    var sql="insert into player(openid,name,integral,universal,time,logintype) values(\""+openid+"\",\""+name+"\",0,"+"\"{\\\"games\\\": 0, \\\"victory\\\": 0}\",\""+time+"\","+type+")";
    console.log("UserMysql-90:",sql);
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        if(err){
            callback(err,null);
            console.log("mysql_user:88",err);
        }else {
            callback(null,sql_result);
        }

    });

};

//获取所有玩家的所有数据
exports.getAllPlayer= function (callback) {
    var sql="select * from player";
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        console.log("sql_result:",sql_result);
        if(err){
            //console.log(err);
            callback(err,null);
        }else {
            callback(null,sql_result);
        }

    })
};
//根据用户的pid获取信息
exports.getPlayerByPid= function (pid,callback) {
    var sql="select * from player where pid="+pid;
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        console.log("sql_result:",sql_result);
        if(err){
            //console.log(err);
            callback(err,null);
        }else {
            callback(null,sql_result);
        }

    })
};

//修改用户的信息
exports.updatePlayer= function (pid,name,integral,universal,time,logintype,level,exper,callback) {
    console.log("universal:",universal);
    console.log((JSON.parse(universal)).victory);
    universal=JSON.parse(universal);
    console.log("pid:",pid);
    //var sql="update player set name=\""+name+"\",integral="+integral+",universal=\"\""+universal+"\"\",time=\""+time+"\",logintype="+logintype+",level="+level+",exper="+exper+" where pid="+pid;
    var sql=`update player set name="${name}",universal="{\\\"victory\\\":${universal.victory},\\\"games\\\":${universal.games}}",integral=${integral},time=${time},logintype=${logintype},level=${level},exper=${exper} where pid=${pid}`;
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        console.log("sql_result:",sql_result);
        if(err){
            //console.log(err);
            callback(err,null);
        }else {
            callback(null,{msg:1});
        }

    });
};
//修改用户的信息(微信小游戏版本)
exports.updatePlayerName= function (openid,name,callback) {
    //var sql="update player set name=\""+name+"\",integral="+integral+",universal=\"\""+universal+"\"\",time=\""+time+"\",logintype="+logintype+",level="+level+",exper="+exper+" where pid="+pid;
    var sql=`update player set name="${name}" where openid="${openid}"`;
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        console.log("sql_result:",sql_result);
        if(err){
            console.log(err);
            callback(err,null);
        }else{
            callback(null,{msg:1});
        }

    });
};
//更新胜利用户的积分以及场数
exports.updateIntegral_victory= function (name,integral,victory,games,callback) {
    var sql1=`update player set integral=${integral},universal="{\\\"victory\\\":${victory},\\\"games\\\":${games}}" where name="${name}"`;
    console.log(sql1);
    // var sql="update player set integral="+integral+",universal=json_set('{\"victory\":0,\"games\":0}','$.victory',"+victory+",'$.games',"+games+")"+" where name=\""+name+"\"";
    mysql_exce(sql1, function (err,sql_result,fields_desic) {
        if(err){
            callback(err,null);
        }
        callback(null,sql_result);
    });
};
//更新失败用户的积分以及场数
exports.updateIntegral_loser= function (name,integral,victory,games,callback) {
    var sql2=`update player set integral=${integral},universal="{\\\"victory\\\":${victory},\\\"games\\\":${games}}" where name="${name}"`;
    console.log(sql2);
    //var sql="update player set integral="+integral+",universal=json_set('{\"victory\":0,\"games\":0}','$.victory',"+victory+",'$.games',"+games+")"+" where name=\""+name+"\"";
    mysql_exce(sql2, function (err,sql_result,fields_desic) {
        console.log("^^^^^^^^^^^^^^^^^:",sql_result);
        if(err){
            callback(err,null);
        }
        callback(null,sql_result);
    });
};

