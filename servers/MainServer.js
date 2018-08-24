/**
 * Created by Administrator on 2018/8/6.
 */
var mysql_game=require('../db/GameMysql');
exports.getWorldRank= function (req,res) {
    mysql_game.getWorldRank(function(err,sql_result){
        if(err){
            console.log("获取世界排行失败");
        }else{
            if(sql_result.length===0){
                let result={
                    result:"ok",
                    msg:"getWorldRank",
                    data:null
                };
                res.send(result);
            }else{
                sql_result.forEach(function (each){
                    let buf=new Buffer(each.name,"hex");
                    let decode_string=buf.toString();
                    each.name=decode_string;
                });
                let result={
                    result:"ok",
                    msg:"getWorldRank",
                    data:sql_result
                };
                res.send(result);
            }

        }

    })
};
exports.getWorldRankByName=function(req,res){

    var arg=url.parse(req.url).query;
    let openid=qs.parse(arg)["openid"];
    mysql_game.getWorldRankByOpenId(openid,function(err,sql_result){

        if(err){
            console.log("获取世界排行失败");
        }else{
            if(sql_result[3].length===0){
                let result={
                    result:"ok",
                    msg:"getWorldRank",
                    data:null
                };
                res.send(result);

            }else{
                sql_result[3].forEach(function (each){
                    let buf=new Buffer(each.name,"hex");
                    let decode_string=buf.toString();
                    each.name=decode_string;
                });
                let result={
                    result:"ok",
                    msg:"getWorldRank",
                    data:sql_result[3]
                };
                res.send(result);
            }

        }

    })

}