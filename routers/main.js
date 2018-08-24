/**
 * Created by Administrator on 2018/7/28.
 */
//进入游戏后，短链接的交互
var express=require('express');
var MainServer=require('../servers/MainServer');
var router=express.Router();

router.post("/GetWorldRank",MainServer.getWorldRank);
router.post("/GetWorldRankByName",MainServer.getWorldRankByName);
router.get("/KeepLink",function(req,res){console.log("单机刷新状态,此时也发送了长连接，保持长连接");res.end()});

module.exports=router;