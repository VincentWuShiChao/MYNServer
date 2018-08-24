/**
 * Created by Administrator on 2018/7/27.
 */
'use strict'
/*
    ip地址解析
 */
var libqqwry=require('lib-qqwry');
var qqwry=libqqwry.init();
qqwry.speed();

class IpParse{
    constructor(req){
        this.req=req;
    }
    getClientIp(){//获取客户端ip
        return this.req.get("X-Real-IP")||this.req.get("X-Forwarded-For")||this.req.ip;
    }
    parseIp(ipAddr){//解析IP
        let ipL=qqwry.searchIP(ipAddr);
        return ipL;
    }
}
module.exports=IpParse;