/*
    算法参考：
    高红波,王卫星.一种二值图像连通区域标记的新算法[J].计算机应用,2007(11):2776-2777+2785.
    https://kns.cnki.net/kcms/detail/detail.aspx?dbcode=CJFD&dbname=CJFD2007&filename=JSJY200711053
*/

const structStack = require("./structStack");

var debugFlag = false;
if (debugFlag){
    var map = [
        [1,0,0,0,0],
        [1,1,0,0,1],
        [0,1,1,0,0],
        [0,0,0,0,1],
        [1,1,1,1,1],
        [0,0,0,0,0]
    ];
    var sz = [6, 5];
    var result = connectedComponents(map, sz);
    console.log(result);
}

function connectedComponents(map, sz){
    //找出所有横向连接目标段
    var rowConnected = [];
    for (let i = 0; i < sz[0]; i++){
        let p = 0, q = 0;
        for (let j = 0; j < sz[1]; j++){
            if (map[i][j] > 0){
                if (j == 0 || map[i][j-1] == 0) p = j;
                if (j == sz[1] - 1){ q = j; rowConnected.push({p, q, i, s:-1}); }
            } else if (map[i][j-1] > 0){ q = j-1; rowConnected.push({p, q, i, s:-1}); }
        }
    }
    if (debugFlag){
        console.log("横向连接目标段");
        console.log(rowConnected);
    }

    //找出纵向连接区域
    var stack = new structStack();
    var firstPara, numMark = 0;
    while(firstPara = (rowConnected.find((value, index) => value.s == -1))){
        stack.push(firstPara);
        stack.peek().s = numMark++;
        while(!stack.isEmpty()){
            let connectPara = rowConnected.find((value, index) => 
            value.s < 0 && 
            Math.abs(value.i - stack.peek().i) == 1 && 
            value.p <= stack.peek().q && 
            value.q >= stack.peek().p);
            if (connectPara){
                connectPara.s = stack.peek().s
                stack.push(connectPara);
            } else{
                stack.pop();
            }
        }
    }
    if (debugFlag){
        console.log("纵向连接区域");
        console.log(rowConnected);
    }

    var marks = [];
    var map2 = new Array(sz[0]).fill(-1);
    map2 = map2.map(() => new Array(sz[1]).fill(-1));
    for (let indexMark = 0; indexMark < numMark; indexMark++){
        let paras = rowConnected.filter((value, index) => value.s == indexMark);
        let location = {up: Infinity, down: -Infinity, left: Infinity, right: -Infinity};
        let size = 0;
        paras.forEach((value, index) => {
            location.up >= value.i && (location.up = value.i);
            location.down <= value.i && (location.down = value.i);
            location.left >= value.p && (location.left = value.p);
            location.right <= value.q && (location.right = value.q);
            for (let j = value.p; j <= value.q; j++) map2[value.i][j] = indexMark;
            size += value.q - value.p + 1;
        })
        let mark = {
            paras, 
            size, 
            position: {
                x: location.left, y: location.up, 
                w: location.right - location.left + 1, h: location.down - location.up + 1
            }
        }
        marks.push(mark);
    }
    if (debugFlag){
        console.log("矩形框");
        console.log(marks);
    }
    return({marks, paras: rowConnected, map: map2})
}

module.exports = connectedComponents;