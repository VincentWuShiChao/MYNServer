/**
 * Created by renjie on 2015/7/3.
 */


(function(window){


    function linkServer(){
        var ws = new WebSocket("ws://192.168.1.141:3000?number="+"<%= number%>");
        var flag=true;
        ws.onopen = function() {
            console.log("连接状态", ws);
            ws.open("start");
        };
        var list=[];
        ws.onmessage = function(evt) {
            var obj_1=evt.data.split("@");
        };
        ws.onclose = function(evt) {
            console.log("WebSocketClosed!");
            console.log(evt);
        };
        ws.onerror = function(evt) {
            console.log("WebSocketError!");
        };
    }

    // 状态描述
    var GameState = {
        STATE_INIT:0,
        STATE_STEP:1,
        STATE_RUN:2,
        STATE_OVER:3
    };
    //随机的创建形状
    function createShape() {
        //形状数组
        var shapeTypes = [LShape, JShape, IShape, OShape, TShape, SShape, ZShape];
        //颜色数组
        var colorTypes = ["red", "green", "blue", "pink"];
        //形状数组的索引位置
        var shapeIdx = Math.floor(Math.random() * 100) % shapeTypes.length;
        //形状数组的位置因为每一个Shape都是一个三维的数组
        var shapePos = Math.floor(Math.random() * 100) % 4;
        //获得随机颜色
        var colorIdx = Math.floor(Math.random() * 100) % colorTypes.length;
        //将新生成的形状信息放回带着颜色的形状
        console.log(new shapeTypes[shapeIdx](4, 0, shapePos, colorTypes[colorIdx]));
        return new shapeTypes[shapeIdx](4, 0, shapePos, colorTypes[colorIdx]);
    }

    // *) 游戏场景的构造
    function GameScene() {
        //创建一个俄罗斯方块单元
        this.tetrisUnit = new TetrisUnit();
        this.strategy = new AIStrategy();
        this.moves = [];

        this.gameState = GameState.STATE_INIT;

        this.currentShape = null;
        this.nextShape = null;

        this.timestamp = new Date().getTime();

        this.score = 0;

    };
    //初始化游戏
    GameScene.prototype.initGame = function() {
        //重置20行10列的二维数组都填充为零
        this.tetrisUnit.reset();
        console.log("重置游戏");
    };
    //开始游戏
    GameScene.prototype.startGame = function() {
        //游戏移动一步
        this.gameState = GameState.STATE_STEP;
        //创建当前的形状
        this.currentShape = createShape();
        //预备好下一个形状准备出厂
        this.nextShape = createShape();
        //将分数初始化为零
        this.score = 0;
        //重置俄罗斯方块单元为0
        this.tetrisUnit.reset();
        //获得当前开始游戏的时间戳
        this.timestamp = new Date().getTime();

        var moveAns = this.strategy.makeBestDecision(this.tetrisUnit, this.currentShape);
        this.moves = moveAns.action_moves;
        console.log("开始游戏");
    };

    GameScene.prototype.updateScore = function(line) {
        switch(line) {
            case 1:
                this.score += 100;
                break;
            case 2:
                this.score += 300;
                break;
            case 3:
                this.score += 500;
                break;
            case 4:
                this.score += 800;
                break;
            default:
                break;
        }
        console.log("更新分数");
    };

    GameScene.prototype.updateGame = function() {
        // *) 状态判断
        if ( this.gameState === GameState.STATE_INIT ) {
            return;
        }

        var now = new Date().getTime();
        if ( now - this.timestamp > 500 ) {
            if ( this.currentShape != null ) {
                if ( this.moves.length > 0 ) {
                    this.currentShape.x = this.moves[0].x;
                    this.currentShape.y = this.moves[0].y;
                    this.currentShape.idx = this.moves[0].idx;
                    this.moves.splice(0, 1);
                } else if ( this.detect(ActionType.ACTION_DOWN) ) {
                    this.currentShape.doAction(ActionType.ACTION_DOWN);
                } else {
                    var tx = this.currentShape.x;
                    var ty = this.currentShape.y;
                    var shapeArr = this.currentShape.shapes[this.currentShape.idx];

                    var eliminatedLines = this.tetrisUnit.touchDown(tx, ty, shapeArr);
                    this.updateScore(eliminatedLines);

                    this.currentShape = this.nextShape;
                    this.nextShape = createShape();

                    // *) 判断游戏是否结束
                    if ( this.detectGameOver() ) {
                        alert("Game Over\n you had " + this.score + " points");
                        this.initGame();
                    } else {
                        // *)
                        var moveAns = this.strategy.makeBestDecision(this.tetrisUnit, this.currentShape);
                        this.moves = moveAns.action_moves;
                    }

                }
            }
            this.timestamp = now;
        } else {
            if ( this.moves.length > 0 ) {
                if ( this.moves[0].x === this.currentShape.x
                    && this.moves[0].y === this.currentShape.y + 1
                    && this.moves[0].idx === this.currentShape.idx ) {
                    this.currentShape.y = this.moves[0].y;
                    this.moves.splice(0, 1);
                }
            }
        }

    };

    GameScene.prototype.renderGame = function(ctx) {

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 800, 640);

        ctx.strokeStyle = "rgb(125, 0, 0)";
        ctx.strokeRect(0, 0, 20 * this.col, 20 * this.row);

        if ( this.gameState === GameScene.STATE_INIT ) {
            return;
        }

        this.tetrisUnit.render(ctx);

        if ( this.currentShape != null ) {
            this.currentShape.render(ctx);
        }

        // *) 绘制傍边的信息条
        this.drawInfo(ctx);

    };

    GameScene.prototype.drawInfo = function(ctx) {

        if ( this.gameState === GameState.STATE_INIT ) {
            return;
        }

        ctx.strokeStyle = "rgba(0, 0, 180, 127)";
        ctx.strokeRect(210, 0, 100, 200);

        ctx.font = "16px Courier New";
        //设置字体填充颜色
        ctx.fillStyle = "blue";
        //从坐标点(50,50)开始绘制文字

        if ( this.nextShape !== null ) {
            ctx.fillText("Next:", 220, 18);
            this.nextShape.display(ctx, 220, 36);
        }

        ctx.fillText("Score: ", 220, 138);
        ctx.fillText("  "  + this.score, 220, 156);

    };

    // 测试是否可以
    GameScene.prototype.detect = function(cmd) {

        var tidx = this.currentShape.idx;
        var tx = this.currentShape.x;
        var ty = this.currentShape.y;

        switch(cmd) {
            case ActionType.ACTION_LEFT:
                tx = this.currentShape.x - 1;
                break;
            case ActionType.ACTION_RIGHT:
                tx = this.currentShape.x + 1;
                break;
            case ActionType.ACTION_CHANGE:
                tidx = (this.currentShape.idx + 1) % 4;
                break;
            case ActionType.ACTION_DOWN:
                ty = this.currentShape.y + 1;
                break;
        }
        var shapeArr = this.currentShape.shapes[tidx];

        return this.tetrisUnit.checkAvailable(tx, ty, shapeArr);

    };
    
    GameScene.prototype.detectGameOver = function() {
        var shapeArr = this.currentShape.shapes[this.currentShape.idx];
        return this.tetrisUnit.isOverlay(this.currentShape.x, this.currentShape.y, shapeArr);
    };

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");

    var gameScene = new GameScene();
    gameScene.initGame();
    gameScene.startGame();

    var fps = 60 || 0;
    setInterval(gameLogic, fps);

    function gameLogic() {
        gameScene.updateGame();
        gameScene.renderGame(ctx);
    }
})(window);



