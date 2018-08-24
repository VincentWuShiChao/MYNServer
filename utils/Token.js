/**
 * Created by Administrator on 2018/7/27.
 */
var _Date=require('./Date.js');
var Code=require('./Code');
var token_list=[];
const CODINGTYPE='base64';//编码方式
const VALIDTIMES=60*1000*2;//有效期
var date=new _Date();
class Token{
    constructor(username){
        this.username=username;
        this.safeCode="";
        this.oldTime=(new Date()).getTime();
    };
    createToken(userInfo){
        userInfo=JSON.stringify(userInfo)+"&time="+date._getDate();
        let code=new Code(userInfo,CODINGTYPE);
        this.safeCode=code.setCoding();
    };
    getToken(){
        return this;
    }
    decodeToken(userInfo){
        let code=new Code(userInfo,CODINGTYPE);
        return code.decodeCoding();
    }
    setTokenToTokenList(token){
        token_list.push(token);
    }
    getTokenList(){
        return token_list;
    }
}

module.exports=Token;


/*
//范例
var token=new Token("吴世超");
token.createToken({id:1,age:20});
token.setTokenToTokenList(token.getToken());
var token1=new Token("楠");
token1.createToken({id:2,age:40});
token1.setTokenToTokenList(token1.getToken());
console.log(token.getTokenList());*/
