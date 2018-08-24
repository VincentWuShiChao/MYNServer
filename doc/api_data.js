define({ "api": [
  {
    "type": "get",
    "url": "/BSM/Home",
    "title": "Home",
    "name": "Home",
    "group": "BSMServer",
    "parameter": {
      "fields": {
        "主要参数": [
          {
            "group": "主要参数",
            "type": "Object",
            "optional": false,
            "field": "userInfo",
            "description": "<p>客户端穿送过来的参数</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "userInfo",
          "content": "{\n    name:\"\"\n}",
          "type": "Object"
        }
      ]
    },
    "success": {
      "fields": {
        "返回页面": [
          {
            "group": "返回页面",
            "type": "ejs",
            "optional": false,
            "field": "index",
            "description": "<p>返回值为result</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "result",
          "content": "{\n    name:\"wushichao\"\n}",
          "type": "Object"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "utils/ApiDoc.js",
    "groupTitle": "BSMServer"
  },
  {
    "type": "post",
    "url": "/BSM/AdminLogin",
    "title": "AdminLogin",
    "name": "adminLogin",
    "group": "BSMServer",
    "success": {
      "fields": {
        "服务器返回给客户端的数据": [
          {
            "group": "服务器返回给客户端的数据",
            "type": "ejs",
            "optional": false,
            "field": "login_admin.ejs",
            "description": "<p>返回后台管理的登录界面</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "utils/ApiDoc.js",
    "groupTitle": "BSMServer"
  },
  {
    "type": "post",
    "url": "/BSM/Verify",
    "title": "Verify",
    "name": "verify",
    "group": "BSMServer",
    "parameter": {
      "fields": {
        "主要参数": [
          {
            "group": "主要参数",
            "type": "Object",
            "optional": false,
            "field": "userInfo",
            "description": "<p>客户端穿送过来的参数</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "userInfo",
          "content": "{\n    name:\"\",\n    password:\"\"\n}",
          "type": "Object"
        }
      ]
    },
    "success": {
      "fields": {
        "服务器返回给客户端的数据": [
          {
            "group": "服务器返回给客户端的数据",
            "type": "Object",
            "optional": false,
            "field": "result",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "result",
          "content": "{\n    msg:1\n}",
          "type": "Object"
        }
      ]
    },
    "error": {
      "fields": {
        "服务器返回给客户端的失败数据": [
          {
            "group": "服务器返回给客户端的失败数据",
            "type": "Object",
            "optional": false,
            "field": "result",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "result",
          "content": "{\n    msg:\"用户名或者密码不正确\"\n}",
          "type": "Object"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "utils/ApiDoc.js",
    "groupTitle": "BSMServer"
  },
  {
    "type": "post",
    "url": "/Door/GetServer",
    "title": "GetServer",
    "name": "GetServer",
    "group": "DoorServer",
    "success": {
      "fields": {
        "服务器返回给客户端的数据": [
          {
            "group": "服务器返回给客户端的数据",
            "type": "Object",
            "optional": false,
            "field": "result_user",
            "description": "<p>返回给客户端的数据</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "result_user",
          "content": "{\n    result:\"ok\",\n    msg:\"server\",\n    data:[],//某一个可用服务器的信息\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "utils/ApiDoc.js",
    "groupTitle": "DoorServer"
  },
  {
    "type": "post",
    "url": "/Door/GetAllServer",
    "title": "GetAllServer",
    "name": "getAllServer",
    "group": "DoorServer",
    "success": {
      "fields": {
        "服务器返回给客户端的数据": [
          {
            "group": "服务器返回给客户端的数据",
            "type": "Object",
            "optional": false,
            "field": "result_user",
            "description": "<p>返回给客户端的数据</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "result_user",
          "content": "{\n    result:\"ok\",\n    msg:\"allServer\",\n    data:[],//所有可用的服务器信息数组\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "utils/ApiDoc.js",
    "groupTitle": "DoorServer"
  },
  {
    "type": "post",
    "url": "/Entry",
    "title": "Entry 本服务器入口",
    "name": "entry",
    "group": "Entry",
    "parameter": {
      "fields": {
        "主参数": [
          {
            "group": "主参数",
            "type": "Object",
            "optional": false,
            "field": "userInfo",
            "description": "<p>客户端传过来的数据</p>"
          }
        ],
        "userInfo": [
          {
            "group": "userInfo",
            "type": "String",
            "optional": false,
            "field": "app",
            "description": "<p>软件类型</p>"
          },
          {
            "group": "userInfo",
            "type": "String",
            "optional": false,
            "field": "loginType",
            "description": "<p>用户登录类型（0：普通用户，1：微信小游戏版登录，2：手机登录）</p>"
          },
          {
            "group": "userInfo",
            "type": "String",
            "optional": false,
            "field": "openId",
            "description": "<p>客户端从昱凯科技账户服务器得到的openID</p>"
          },
          {
            "group": "userInfo",
            "type": "String",
            "optional": false,
            "field": "access_token",
            "description": "<p>客户端从昱凯科技账户服务器得到的access_token</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "userInfo",
          "content": "{\n    access_token:,\n    app:,\n    openId:,\n    loginType:\n }",
          "type": "json"
        },
        {
          "title": "app",
          "content": "\"h1v1\"",
          "type": "String"
        },
        {
          "title": "loginType",
          "content": "\"0\"//代表普通用户登录",
          "type": "String"
        }
      ]
    },
    "success": {
      "fields": {
        "服务器返回给客户端的数据": [
          {
            "group": "服务器返回给客户端的数据",
            "type": "Object",
            "optional": false,
            "field": "result_user",
            "description": "<p>返回给客户端的数据</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "result_user",
          "content": "{\n    result:\"ok\",\n    msg:\"userMsg_1\",\n    data:{},//玩家信息\n    token:\"\"//返回给客户端本游戏服务器的token\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "utils/ApiDoc.js",
    "groupTitle": "Entry"
  },
  {
    "type": "post",
    "url": "/Main/RankingList",
    "title": "RankingList",
    "name": "rankingList",
    "group": "MainServer",
    "success": {
      "fields": {
        "服务器返回给客户端的数据": [
          {
            "group": "服务器返回给客户端的数据",
            "type": "Object",
            "optional": false,
            "field": "result_user",
            "description": "<p>返回给客户端的数据</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "result_user",
          "content": "{\n    result:\"ok\",\n    msg:\"server\",\n    data:[],//某一个可用服务器的信息\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "utils/ApiDoc.js",
    "groupTitle": "MainServer"
  }
] });
