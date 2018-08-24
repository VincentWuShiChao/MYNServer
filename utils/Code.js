/**
 * Created by Administrator on 2018/7/27.
 */
class Code{
    constructor(content,type){
        this.content=content;
        this.type=type;
    }
    setCoding(){
        let buf=new Buffer(this.content);
        let coding=buf.toString(this.type);
        return coding;
    }
    decodeCoding(){
        console.log("Code-15:",this.content);
        console.log("Code-15:",this.type);
        let buf=new Buffer(this.content,"hex");
        console.log("18:",buf.toString());
        let decode_string=buf.toString();
        console.log("Code-17:",decode_string);
        return decode_string;
    }
}
module.exports=Code;