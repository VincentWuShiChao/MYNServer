/**
 * Created by Administrator on 2018/8/6.
 */
//判断data为json还是json字符串，并转化为json
function isAvailableData(data){
    console.log("进入isAvailableData方法");
    if(data instanceof Object){
        console.log("14:",data);
        return {encode:0,data:data};

    }else if(typeof data==="string"){
        try{
            data=JSON.parse(data);
            console.log("18:",data);
            return {encode:0,data:data};
        }catch (err){
            return {encode:-1,data:data};
        }
    }else {
        return {encode:-1,data:data};
    }
}

exports.isAvailableData=isAvailableData;