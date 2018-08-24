/**
 * Created by Administrator on 2018/7/27.
 */
var express=require('express');
var router=express.Router();
var DoorServer=require('../servers/DoorServer');



router.post("/GetAllServer",DoorServer.getAllServer);
router.post("/GetServer",DoorServer.getServer);

router.post("/openServerByPort",DoorServer.openServerByPort);
router.post("/openAllServer",DoorServer.openAllServer);





module.exports=router;