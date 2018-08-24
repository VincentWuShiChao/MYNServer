/**
 * Created by Administrator on 2018/7/27.
 */
//门服务器 存放游戏服务器信息
var mysql=require('mysql');

var conn_pool=mysql.createPool({
    host:"127.0.0.1" ,
    port:3306,
    database:"mysql_center",
    user:"root",
    password:"03251222yxn"
});

function mysql_exce(sql,callback){
    conn_pool.getConnection(function (err,conn) {
        if(err){
            if(callback){
                callback(err,null,null);
            }
            return;
        }
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

    });
}
//发现所有的服务器状态
exports.findAllServer= function (callback) {
    var sql="select * from servers";
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
//查找单个服务器的状态
exports.findServerByPort= function (port,callback) {
    var sql="select * from servers where port="+port;
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        //console.log("sql_result:",sql_result);
        if(err){
            //console.log(err);
            callback(err,null);
        }else {
            callback(null,sql_result);
        }

    })
}


exports.updateServerStateOpen= function (port,callback) {
    var sql="update servers set state=1 where port="+port;
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        //console.log("opensql_result:",sql_result);
        if(err){
            //console.log(err);
            callback(err,null);
        }else {
            callback(null,sql_result);
        }
    })
};
exports.updateServerStateClose= function (port,callback) {
    var sql="update servers set state=0 where port="+port;
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        console.log("close_sql_result:",sql_result);
        if(err){
            //console.log(err);
            callback(err,null);
        }else {
            callback(null,sql_result);
        }

    })
};

//查询某服务器的信息（连接数）
exports.getServerByPort= function (port,callback) {

    var sql="select * from servers where port="+port;
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        //console.log("sql_result:",sql_result);
        if(err){
            //console.log(err);
            callback(err,null);
        }
        callback(null,sql_result);
    })
};
//修改服务器的连接数(增加)
exports.updateServerCountByPort= function (port,count,callback) {
    var sql="update servers set count="+count+" where port="+port;
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        //console.log("sql_result:",sql_result);
        if(err){
            //console.log(err);
            callback(err,null);
        }else {
            callback(null,sql_result);
        }

    })
};
//添加服务器
exports.addServerByPort= function (port,callback) {
    let p=parseInt(port)-6079;
    let sname="server_"+p;
    let sql=`insert into servers(sname,state,port,count) values("${sname}",0,${port},0)`;
    console.log("sql:",sql);
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        //console.log("sql_result:",sql_result);
        if(err){
            console.log(err);
            callback(err,null);
        }else {
            callback(null,sql_result);
        }

    })
}

