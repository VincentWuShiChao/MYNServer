/**
 * Created by Administrator on 2018/7/27.
 */
var express=require('express');
var router=express.Router();
var BSMServer=require('../servers/BSMServer');
var GameServer=require('../servers/GameServer');
//后台管理
router.get("/AdminLogin",BSMServer.showAdminLogin);
router.post("/Verify",BSMServer.verify);
router.all("*", function (req,res,next) {
    if(req.session.userInfo){
        console.log("存在用户的session");
        next();
    }else {
        console.log("走到开始的拦截");
        res.render("../../views/login_admin");
    }
});
router.get("/Home",BSMServer.home);
router.get("/login_record",BSMServer.login_record);
router.get("/register_record",BSMServer.register_record);
router.get("/Servers",BSMServer.getServers);
router.post("/GetCacheGame_server",GameServer.getCacheGame);
router.post("/AddServer",BSMServer.addServer);
router.post("/ChangeStateOpen",BSMServer.changeStateOpen);
//router.post("/ChangeStateClose",BSMServer.changeStateClose);
router.get("/edit_data",BSMServer.showEditData);
router.post("/showTable",BSMServer.showTable);
router.post("/showNotice",BSMServer.showNotice);
router.get("/editPlayerData",BSMServer.editPlayerData);
router.post("/editPlayerSubmit",BSMServer.editPlayerSubmit);
router.post("/Apply",BSMServer.apply);
router.post("/Apply_Register",BSMServer.apply_register);



module.exports=router;