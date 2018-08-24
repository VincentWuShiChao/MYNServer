/**
 * Created by Administrator on 2018/7/27.
 */
/*
    日志
 */
var log4js=require('log4js');
var fs=require('fs');
let log4js_config={
    "appenders":{
        "log":{
            "type":"file",
            "filename":"../logs/log.log",
            layout:{
                type:"messagePassThrough"
            }
        }
    },
    "categories": {
        "default":{
            "appenders":["log"],
            "level":"ALL"
        }
    }

    /* pm2: true,
     pm2InstanceVar: 'INSTANCE_ID'*///linux下安装pm2-intercom模块后，使用pm2开启服务器，即可成功写入日志文件，否则无法写入。

}
class LogJs{
    constructor(){

    }
    setConfig(type,filename){
        log4js_config.appenders[filename]={"type":"file","filename":"../logs/"+type+"/"+filename+".log",layout:{type:"messagePassThrough"}};
        log4js_config.categories[filename]={"appenders":[filename],"level":"ALL"};
        log4js.configure(log4js_config);
        return new Promise(function (resolve,reject) {
            resolve({tag:true,content:log4js_config});
        })
    }
    useLogger(loggerName){
        return log4js.getLogger(loggerName);
    }
    createLog(logger,content){
        try{
            logger.info(content);
            console.log("日志文件写入成功");
        }catch (err){
            console.log("日志文件写入失败");
        }
    }
}
module.exports=LogJs;