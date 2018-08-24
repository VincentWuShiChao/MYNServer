/**
 * Created by Administrator on 2018/7/27.
 */
/**
 *
 * stayState:首先达到120倍数惩罚值得用户的等待状态，true为正在等待敌人下落，此过程中一旦再次达到120的倍数时不会再次触发发送等待敌人的请求。false为未等待，可向敌人发送等待请求
 * removeRows:消除的次数//用于用户消除次数的叠加
 * penalty_value:用于记录用户的惩罚值
 * penaltyType:当用户游戏类型为画像时，记录画像的惩罚类型
 * map_list:记录用户上次被惩罚时生成的惩罚地图
 *
 */
var roomList=[];
class Room{
    constructor(roomid){
        this.roomid=roomid;
        this.playerList=[
            {"id":1,"name":"null","integral":"","type":0,"state":0,"universal":{},"url":"",loadingState:0,"removeState":0,"removeRows":0,"penalty_value":0,"penaltyType":0,"map_list":[[],[],[],[],[],[]],"stayState":false},
            {"id":2,"name":"null","integral":"","type":0,"state":0,"universal":{},"url":"","loadingState":0,"removeState":0,"removeRows":0,"penalty_value":0,"penaltyType":0,"map_list":[[],[],[],[],[],[]],"stayState":false}
        ];
        this.score_count=0;
    }
    getRoomId(){
        return this.roomid;
    }
    setPlayerList(player){
        if(this.playerList[0].name!="null"){
            this.playerList[1].name=player.name;
            this.playerList[1].integral=player.integral;
            this.playerList[1].type=player.type;
            this.playerList[1].state=player.state;
            this.playerList[1].universal=player.universal;
            this.playerList[1].url=player.url;
            this.playerList[1].penaltyType=player.penaltyType;
        }else {
            this.playerList[0].name=player.name;
            this.playerList[0].integral=player.integral;
            this.playerList[0].type=player.type;
            this.playerList[0].state=player.state;
            this.playerList[0].universal=player.universal;
            this.playerList[0].url=player.url;
            this.playerList[0].penaltyType=player.penaltyType;
        }
    }
    getPlayerList(){
        return this.playerList;
    }
    setRoomList(){
        roomList.push(this);
    }
    getRoomList(){
        return roomList;
    }

}
module.exports=Room;
