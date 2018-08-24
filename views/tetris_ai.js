/**
 * Created by renjie on 2015/7/3.
 */

(function(window) {

    /*
    * @brief    走法生成器
    */
    function MoveGenerator() {
    }

    /*
    * @brief	生成可行落点和路径线路
    */
    MoveGenerator.prototype.generate = function(tetrisUnit, shape) {

        var keymapFunc = function(x, y, idx) {
            return "" + x + ":" + y + ":" + idx;
        }

        var moveMapFunc = function(step) {
            return {x:step.x, y:step.y, idx:step.idx};
        }

        var results = [];

        var boards = tetrisUnit.boards;
        var rownum = tetrisUnit.row;
        var colnum = tetrisUnit.col;
        var shapeArrs = shape.shapes;

        var occupy = {};

        var actionQueues = [];
        actionQueues.push({x:shape.x, y:shape.y, idx:shape.idx, prev:-1});
        occupy[keymapFunc(shape.x, shape.y, shape.idx)] = true;

        var head = 0;
        while ( head < actionQueues.length )  {
            var step = actionQueues[head];

            // 1). 向左移动一步
            var tx = step.x - 1;
            var ty = step.y;
            var tidx = step.idx;
            if ( tetrisUnit.checkAvailable(tx, ty, shapeArrs[tidx]) ) {
                var key = keymapFunc(tx, ty, tidx);
                if ( !occupy.hasOwnProperty(key) ) {
                    actionQueues.push({x:tx, y:ty, idx:tidx, prev:head});
                    occupy[key] = true;
                }
            }

            // 2). 向右移动一步
            tx = step.x + 1;
            ty = step.y;
            tidx = step.idx;
            if ( tetrisUnit.checkAvailable(tx, ty, shapeArrs[tidx]) ) {
                var key = keymapFunc(tx, ty, tidx);
                if ( !occupy.hasOwnProperty(key) ) {
                    actionQueues.push({x:tx, y:ty, idx:tidx, prev:head});
                    occupy[key] = true;
                }
            }
            // 3). 旋转一步
            tx = step.x;
            ty = step.y;
            tidx = (step.idx + 1) % 4;
            if ( tetrisUnit.checkAvailable(tx, ty, shapeArrs[tidx]) ) {
                var key = keymapFunc(tx, ty, tidx);
                if ( !occupy.hasOwnProperty(key) ) {
                    actionQueues.push({x:tx, y:ty, idx:tidx, prev:head});
                    occupy[key] = true;
                }
            }

            // 4). 向下移动一步
            tx = step.x;
            ty = step.y + 1;
            tidx = step.idx;
            if ( tetrisUnit.checkAvailable(tx, ty, shapeArrs[tidx]) ) {
                var key = keymapFunc(tx, ty, tidx);
                if ( !occupy.hasOwnProperty(key) ) {
                    actionQueues.push({x:tx, y:ty, idx:tidx, prev:head});
                    occupy[key] = true;
                }
            } else {

                // *) 若不能向下了, 则为方块的一个终结节点.
                var tmpMoves = [];
                tmpMoves.push(moveMapFunc(step));
                var tprev = step.prev;
                while ( tprev != -1 ) {
                    tmpMoves.push(moveMapFunc(actionQueues[tprev]));
                    tprev = actionQueues[tprev].prev;
                }
                tmpMoves.reverse();

                results.push({last:step, moves:tmpMoves});
            }
            head++;
        }
        return results;

    }

    function AIStrategy() {
        this.generator = new MoveGenerator();
        this.evalutor = new PierreDellacherieEvaluator();
    }

    /*
     * @brief 作出最优的策略
     * @return  {dest:{x:{x}, y:{y}, idx:{idx}}, [{action_list}]}
     */
     AIStrategy.prototype.makeBestDecision = function(tetrisUnit, shape) {

        var bestMove = null;
        var bestScore = -1000000;

        // 1) 生成所有可行的落点, 以及对应的路径线路
        var allMoves = this.generator.generate(tetrisUnit, shape);

        // 2) 遍历每个可行的落点, 选取最优的局面落点
        for ( var i = 0; i < allMoves.length; i++ ) {
            var step = allMoves[i].last;

            var shapeArrs = shape.shapes;
            var bkBoards = tetrisUnit.applyAction2Data(step.x, step.y, shapeArrs[step.idx]);

            // 2.1) 对每个潜在局面进行评估
            var tscore = this.evalutor.evaluate(bkBoards, {x:step.x, y:step.y, shapeArr:shapeArrs[step.idx]});

            // 2.2) 选取更新最好的落点和路径线路
            if ( bestMove === null || tscore > bestScore ) {
                bestScore = tscore;
                bestMove = allMoves[i].moves;
            }
        }
        console.log("生成最优策略：",{score:bestScore, action_moves:bestMove});
        // 3) 返回最优可行落点, 及其路径线路
        return {score:bestScore, action_moves:bestMove};

     }

    // ===================================
    // @brief landing height
    function landingHeight(boards, shape) {
        var rownum = boards.length;
        var colnum = boards[0].length;

        var tx = shape.x;
        var ty = shape.y;
        var shapeArr = shape.shapeArr;

        for ( var i = 0; i < 4; i++ ) {
            for ( var j = 0; j < 4; j++ ) {
                if ( shapeArr[i][j] === 1 ) {
                    return rownum - (ty + i);
                }
            }
        }
    }

    // @brief 消行个数
    function rowsEliminated(boards, shape) {
        var rownum = boards.length;
        var colnum = boards[0].length;

        var tx = shape.x;
        var ty = shape.y;
        var shapeArr = shape.shapeArr;

        var eliminatedNum = 0;
        var eliminatedGridNum = 0;
        for ( var i = 0; i < rownum; i++ ) {
            var flag = true;
            for ( var j = 0; j < colnum; j++ ) {
                if ( boards[i][j] == 0 ) {
                    flag = false;
                    break;
                }
            }
            if ( flag === true ) {
                eliminatedNum++;
                if ( i >= ty && i < ty + 4 ) {
                    for ( var s = 0; s < 4; s++ ) {
                        if ( shapeArr[i - ty][s] === 1 ) {
                            eliminatedGridNum++;
                        }
                    }
                }
            }
        }
        return eliminatedNum * eliminatedGridNum;
    }

    // @brief 行变换个数
    function rowTransitions(boards) {

        var rownum = boards.length;
        var colnum = boards[0].length;

        var totalTransNum = 0;
        for ( var i = 0; i < rownum; i++ ) {
            var nowTransNum = 0;
            var prevColor = 1;
            for ( var j = 0; j < colnum; j++ ) {
                if ( boards[i][j] != prevColor ) {
                    nowTransNum++;
                    prevColor = boards[i][j];
                }
            }
            if ( prevColor === 0 ) {
                nowTransNum++;
            }
            totalTransNum += nowTransNum;
        }

        return totalTransNum;
    }

    // @brief 列变换个数
    function colTransitions(boards) {
        var rownum = boards.length;
        var colnum = boards[0].length;

        var totalTransNum = 0;
        for ( var i = 0; i < colnum; i++ ) {
            var nowTransNum = 0;
            var prevColor = 1;
            for ( var j = 0; j < rownum; j++ ) {
                if ( boards[j][i] != prevColor ) {
                    nowTransNum++;
                    prevColor = boards[j][i];
                }
            }
            if ( prevColor === 0 ) {
                nowTransNum++;
            }
            totalTransNum += nowTransNum;
        }

        return totalTransNum;
    }

    // @brief 空洞个数
    function emptyHoles(boards) {
        var rownum = boards.length;
        var colnum = boards[0].length;

        var totalEmptyHoles = 0;
        for ( var i = 0; i < colnum; i++ ) {
            var j = 0;
            var emptyHoles = 0;
            for ( ; j < rownum; j++ ) {
                if ( boards[j][i] === 1 ) {
                    j++;
                    break;
                }
            }
            for ( ; j < rownum; j++ ) {
                if ( boards[j][i] === 0 ) {
                    emptyHoles++;
                }
            }
            totalEmptyHoles += emptyHoles;
        }
        return totalEmptyHoles;
    }

    // @brief 井的个数
    function wellNums(boards) {
        var rownum = boards.length;
        var colnum = boards[0].length;

        var i = 0, j = 0, wellDepth = 0, tDepth = 0;

        var totalWellDepth = 0;
        // *) 获取最左边的井数
        wellDepth = 0;
        tDepth = 0;
        for ( j = 0; j < rownum; j++ ) {
            if ( boards[j][0] === 0 && boards[j][1] === 1 ) {
                tDepth++;
            } else {
                wellDepth += tDepth * (tDepth + 1) / 2;
                tDepth = 0;
            }
        }
        wellDepth += tDepth * (tDepth + 1) / 2;
        totalWellDepth += wellDepth;

        // *) 获取中间的井数
        wellDepth = 0;
        for ( i = 1; i < colnum - 1; i++ ) {
            tDepth = 0;
            for ( j = 0; j < rownum; j++ ) {
                if ( boards[j][i] === 0 && boards[j][i - 1] === 1 && boards[j][i + 1] === 1 ) {
                    tDepth++;
                } else {
                    wellDepth += tDepth * (tDepth + 1) / 2;
                    tDepth = 0;
                }
            }
            wellDepth += tDepth * (tDepth + 1) / 2;
        }
        totalWellDepth += wellDepth;

        // *) 获取最右边的井数
        wellDepth = 0;
        tDepth = 0;
        for ( j = 0; j < rownum; j++ ) {
            if ( boards[j][colnum - 1] === 0 && boards[j][colnum - 2] === 1 ) {
                tDepth++;
            } else {
                wellDepth += tDepth * (tDepth + 1) / 2;
                tDepth = 0;
            }
        }
        wellDepth += tDepth * (tDepth + 1) / 2;
        totalWellDepth += wellDepth;

        return totalWellDepth;

    }

    function Evaluator() {
    }

    Evaluator.prototype.evaluate = function(boards) {
    }

    function PierreDellacherieEvaluator() {
    }

    PierreDellacherieEvaluator.prototype = new Evaluator();
    PierreDellacherieEvaluator.prototype.constructor = PierreDellacherieEvaluator;

    PierreDellacherieEvaluator.prototype.evaluate = function(boards, shape) {
        return (-4.500158825082766) * landingHeight(boards, shape)              // 下落高度
                + (3.4181268101392694) * rowsEliminated(boards, shape)          // 消行个数
                + (-3.2178882868487753) * rowTransitions(boards)                // 行变换
                + (-9.348695305445199) * colTransitions(boards)                 // 列变化
                + (-7.899265427351652) * emptyHoles(boards)                     // 空洞个数
                + (-3.3855972247263626) * wellNums(boards);                     // 井数
    }

    window.PierreDellacherieEvaluator = PierreDellacherieEvaluator;
    window.AIStrategy = AIStrategy;

})(window);
//    AIStrategy.prototype.makeBestDecision = function(tetrisUnit, shape) {
//
//        var keymapFunc = function(x, y, idx) {
//            return "" + x + ":" + y + ":" + idx;
//        }
//
//        var moveMapFunc = function(step) {
//            return {x:step.x, y:step.y, idx:step.idx};
//        }
//
//        var bestMove = null;
//        var bestScore = -1000000;
//
//        var boards = tetrisUnit.boards;
//        var rownum = tetrisUnit.row;
//        var colnum = tetrisUnit.col;
//        var shapeArrs = shape.shapes;
//
//        var occupy = {}
//
//        var actionQueues = [];
//        actionQueues.push({x:shape.x, y:shape.y, idx:shape.idx, prev:-1});
//        occupy[keymapFunc(shape.x, shape.y, shape.idx)] = true;
//
//        var head = 0;
//        while ( head < actionQueues.length )  {
//            var step = actionQueues[head];
//
//            // 1). 向左移动一步
//            var tx = step.x - 1;
//            var ty = step.y;
//            var tidx = step.idx;
//            if ( tetrisUnit.checkAvailable(tx, ty, shapeArrs[tidx]) ) {
//                var key = keymapFunc(tx, ty, tidx);
//                if ( !occupy.hasOwnProperty(key) ) {
//                    actionQueues.push({x:tx, y:ty, idx:tidx, prev:head});
//                    occupy[key] = true;
//                }
//            }
//
//            // 2). 向右移动一步
//            tx = step.x + 1;
//            ty = step.y;
//            tidx = step.idx;
//            if ( tetrisUnit.checkAvailable(tx, ty, shapeArrs[tidx]) ) {
//                var key = keymapFunc(tx, ty, tidx);
//                if ( !occupy.hasOwnProperty(key) ) {
//                    actionQueues.push({x:tx, y:ty, idx:tidx, prev:head});
//                    occupy[key] = true;
//                }
//            }
//
//            // 3). 旋转一步
//            tx = step.x;
//            ty = step.y;
//            tidx = (step.idx + 1) % 4;
//            if ( tetrisUnit.checkAvailable(tx, ty, shapeArrs[tidx]) ) {
//                var key = keymapFunc(tx, ty, tidx);
//                if ( !occupy.hasOwnProperty(key) ) {
//                    actionQueues.push({x:tx, y:ty, idx:tidx, prev:head});
//                    occupy[key] = true;
//                }
//            }
//
//            // 4). 向下移动一步
//            tx = step.x;
//            ty = step.y + 1;
//            tidx = step.idx;
//            if ( tetrisUnit.checkAvailable(tx, ty, shapeArrs[tidx]) ) {
//                var key = keymapFunc(tx, ty, tidx);
//                if ( !occupy.hasOwnProperty(key) ) {
//                    actionQueues.push({x:tx, y:ty, idx:tidx, prev:head});
//                    occupy[key] = true;
//                }
//            } else {
//                var bkBoards = tetrisUnit.applyAction2Data(step.x, step.y, shapeArrs[step.idx]);
//                var tscore = this.evalutor.evaluate(bkBoards, {x:step.x, y:step.y, shapeArr:shapeArrs[step.idx]});
//
//                if ( bestMove === null || bestScore < tscore ) {
//                    bestMove = [];
//                    bestMove.push(moveMapFunc(step));
//                    var tprev = step.prev;
//                    while ( tprev != -1 ) {
//                        bestMove.push(moveMapFunc(actionQueues[tprev]));
//                        tprev = actionQueues[tprev].prev;
//                    }
//
//                    bestMove.reverse();
//                    bestScore = tscore;
//                }
//
//            }
//            head++;
//        }
//
//        return {score:bestScore, action_moves:bestMove};
//
//    }




