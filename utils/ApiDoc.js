/**
 * Created by Administrator on 2018/8/2.
 */
//----------------apidoc文件-----------------------------------------------
/**
 * @api {post} /Entry Entry 本服务器入口
 * @apiName entry
 * @apiGroup Entry
 *
 * @apiParam (主参数) {Object} userInfo 客户端传过来的数据
 * @apiParamExample  {json} userInfo
 *      {
 *          access_token:,
 *          app:,
 *          openId:,
 *          loginType:
 *       }
 * @apiParam (userInfo) {String} app 软件类型
 * @apiParamExample  {String} app
 *      "h1v1"
 * @apiParam (userInfo) {String} loginType 用户登录类型（0：普通用户，1：微信小游戏版登录，2：手机登录）
 * @apiParamExample  {String} loginType
 *      "0"//代表普通用户登录
 * @apiParam (userInfo) {String} openId 客户端从昱凯科技账户服务器得到的openID
 * @apiParam (userInfo) {String} access_token 客户端从昱凯科技账户服务器得到的access_token
 * @apiSuccess (服务器返回给客户端的数据) {Object} result_user 返回给客户端的数据
 * @apiSuccessExample {json} result_user
 *      {
 *          result:"ok",
 *          msg:"userMsg_1",
 *          data:{},//玩家信息
 *          token:""//返回给客户端本游戏服务器的token
 *      }
 */
/**
 * @api {post} /Door/GetAllServer GetAllServer
 * @apiName getAllServer
 * @apiGroup DoorServer
 * @apiSuccess (服务器返回给客户端的数据) {Object} result_user 返回给客户端的数据
 * @apiSuccessExample {json} result_user
 *      {
 *          result:"ok",
 *          msg:"allServer",
 *          data:[],//所有可用的服务器信息数组
 *      }
 */
/**
 * @api {post} /Door/GetServer GetServer
 * @apiName GetServer
 * @apiGroup DoorServer
 * @apiSuccess (服务器返回给客户端的数据) {Object} result_user 返回给客户端的数据
 * @apiSuccessExample {json} result_user
 *      {
 *          result:"ok",
 *          msg:"server",
 *          data:[],//某一个可用服务器的信息
 *      }
 */
/**
 * @api {post} /Main/RankingList RankingList
 * @apiName rankingList
 * @apiGroup MainServer
 * @apiSuccess (服务器返回给客户端的数据) {Object} result_user 返回给客户端的数据
 * @apiSuccessExample {json} result_user
 *      {
 *          result:"ok",
 *          msg:"server",
 *          data:[],//某一个可用服务器的信息
 *      }
 */

/**
 * @api {post} /BSM/AdminLogin AdminLogin
 * @apiName adminLogin
 * @apiGroup BSMServer
 * @apiSuccess (服务器返回给客户端的数据) {ejs} login_admin.ejs 返回后台管理的登录界面
 */

