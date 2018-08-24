/**
 * Created by Administrator on 2018/7/27.
 */

class GlobalUrl{
    constructor(){
        this.accountServer={ip:"",port:0};
        this.bankServer={ip:"",port:0};
    }
    setAccountServer(ip,port){
        this.accountServer.ip=ip;
        this.accountServer.port=port;
    }
    setBankServer(ip,port){
        this.bankServer.ip=ip;
        this.bankServer.port=port;
    }
    getAccountServer() {
        return this.accountServer;
    }
    getBankServer(){
        return this.bankServer;
    }
}

module.exports=GlobalUrl;