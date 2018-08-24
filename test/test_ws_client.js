/**
 * Created by Administrator on 2018/5/22.
 */
var ws = require("ws");

// url ws://127.0.0.1:6080
// 创建了一个客户端的socket,然后让这个客户端去连接服务器的socket
var sockList=[];
for(let i=0;i<2000;i++) {
    var sock = new ws("ws://m5ws.ykplay.com");
    //var sock = new ws("ws://localhost:6080");
    sockList.push({"id":i,"sock":sock});
}
var index=0;
var j=0;
sockList.forEach(function (sock) {
    sock.sock.on("open", function () {
        console.log("connect success !!!!");
        /*let buf=new Buffer("1h1v1");
         let coding=buf.toString("base64");
         sock.send(JSON.stringify({"tag":2,"name":"wushichao","token":"","type":"1","openId":coding}));*/
        index=index+1;
        sock.sock.send(JSON.stringify({"tag":0,"name":"wushichao","token":"","type":index}));
        //sock.sock.send(JSON.stringify({"tag":0,"name":"wushichao","token":"","type":"hahahahahahaah"}));


    });

    sock.sock.on("error", function(err) {
        console.log("error: ", err);
    });

    sock.sock.on("close", function() {
        console.log("close");
    });


    sock.sock.on("message", function(data) {
        //console.log(data);
        //let json_value=JSON.parse(data);
        j=j+1;
        console.log(data+":"+j);
        /*if(json_value.msg==="linkSuccess"){
            sock.sock.send(JSON.stringify({tag:1,"name":"吴世超",type:"1"}))
        }*/
    });
});

/*
let Person=require('./test').Person;

let person=new Person("hahah",12);
console.log(person.getAge());
*/

/*
var json_1={
    name:"wushichao",
    age:1
}
var string_1="hahahahhah";
var number_1=122;
console.log(json_1 instanceof Object);
console.log(typeof string_1==="string");
console.log(typeof number_1==="number");*/
