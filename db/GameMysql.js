/**
 * Created by Administrator on 2018/7/28.
 */
var mysql=require('mysql');

//user数据库
var conn_pool=mysql.createPool({
    host:"127.0.0.1" ,
    port:3306,
    database:"mysql_user",
    user:"root",
    password:"03251222yxn",
    multipleStatements: true//可执行多个语句
});
//门服务数据库
var conn_pool_server_state=mysql.createPool({
    host:"127.0.0.1",
    port:3306,
    database:"mysql_center",
    user:"root",
    password:"03251222yxn"
});

//user数据库的执行语句
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
//门数据库的执行语句
function mysql_exce_server(sql,callback){
    conn_pool_server_state.getConnection(function (err,conn) {
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
//获取排行榜
exports.getPlayerRank= function (callback) {

    var sql="select * from player order by integral desc";
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        if(err){
            callback(err,null);
        }

        callback(null,sql_result);
    });
};
exports.getWorldRank=function(callback){
    let sql=` select * from player order by integral desc`;
    console.log("159:",sql);
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        console.log("^^^^^^^^^^^^^^^^^:",sql_result);
        if(err){
            callback(err,null);
        }else{
            console.log("没有错误哦sql");
            callback(null,sql_result);
        }
    });
}
exports.getWorldRankByOpenId=function(name,callback){
    let sql=`set @rownum=0;set @rownum_1=0;set @rownum_2=0;select * from (select @rownum:=@rownum+1 as rownum,openid,name,integral,avatarUrl from player where integral!=0 order by integral desc) as table_1 where table_1.rownum<=(select rownum_1 from (select @rownum_1:=@rownum_1+1 as rownum_1,openid,name,integral,avatarUrl from player where integral!=0 order by integral desc) as table_2 where table_2.openid="${name}")+3 and table_1.rownum>=(select rownum_2 from (select @rownum_2:=@rownum_2+1 as rownum_2,openid,name,integral,avatarUrl from player where integral!=0 order by integral desc) as table_3 where table_3.openid="${name}")-2;`
    console.log("159:",sql);
    mysql_exce(sql, function (err,sql_result,fields_desic) {
        console.log("^^^^^^^^^^^^^^^^^:",sql_result);
        if(err){
            callback(err,null);
        }else{
            console.log("没有错误哦sql");
            callback(null,sql_result);
        }
    });
}

