/**
 * 移动端手写签名
 * author：zhangfx
 * 改造：chyj，添加橡皮檫功能
 * 
 * @param {object}
 *                 el:         挂载的节点
 *                 lineWidth:  线条宽度
 *                 color:      线条颜色
 *                 background: 背景颜色
 */
"use strict";
function Signature(obj) {
    if (!obj || !obj.el) {
        console.log('请传入必要的参数');
        return;
    }
    this.el = obj.el;
    this.lineWidth = obj.lineWidth || 1;
    this.color = obj.color || '#000000';
    this.background = obj.background || '#ffffff';

    this.canvas = document.createElement('canvas');
    this.el.appendChild(this.canvas);
    this.cxt = this.canvas.getContext('2d');
    this.canvas.width = this.el.clientWidth;
    this.canvas.height = this.el.clientHeight;
    this.offsetLeft = this.el.offsetLeft;
    this.offsetTop = this.el.offsetTop;
    this.cxt.fillStyle = this.background;
    this.cxt.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.cxt.strokeStyle = this.color;
    this.cxt.lineWidth = this.lineWidth;
    this.cxt.lineCap = 'round';

    this.recordList = []; // 记录绘制记录
    this.previousPoint = []; // 记录上一步绘制的点集合
    this.state = 1;//画笔的状态,1为画，0为擦

    //开始绘制
    this.canvas.addEventListener('touchstart', function(e) {
        this.previousPoint = [];
        this.previousPoint.push({'event':e,'state':this.state});
        this.cxt.beginPath();
        e.preventDefault();
        // 减去canvas外层的offsetLeft，因为pageX是相对与屏幕边界的距离，如果外层包裹元素有padding，会导致画笔中心偏移
        this.cxt.moveTo(e.changedTouches[0].pageX - this.offsetLeft, e.changedTouches[0].pageY - this.offsetTop);
    }.bind(this), false);
    //绘制中
    this.canvas.addEventListener('touchmove', function(e) {
        this.previousPoint.push({'event':e,'state':this.state});
        this.cxt.lineTo(e.changedTouches[0].pageX - this.offsetLeft, e.changedTouches[0].pageY - this.offsetTop);
        this.cxt.stroke();
    }.bind(this), false);
    //结束绘制
    this.canvas.addEventListener('touchend', function() {
        this.cxt.closePath();
        this.recordList.push(this.previousPoint);
    }.bind(this), false);

    //清除画布
    this.clear = function () {
        this.cxt.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    //保存图片，直接转base64
    this.save = function () {
        var imgBase64 = this.canvas.toDataURL();
        console.log(imgBase64);
        return imgBase64
    }
    // 上一步
    this.previous = function () {
        this.clear();
        this.recordList.pop();
        console.log(this.recordList);
        this.resetCanvas();
    }

};

// 利用坐标点重新绘制
Signature.prototype.resetCanvas=function(){
     for (var i = 0; i < this.recordList.length; i++) {
            this.draw(this.recordList[i]);
        }
}

Signature.prototype.draw=function(pointArr){

    this.cxt.beginPath();
    this.cxt.moveTo(pointArr[0].event.changedTouches[0].pageX - this.offsetLeft, pointArr[0].event.changedTouches[0].pageY - this.offsetTop);
    for(var i = 1; i < pointArr.length; i++) { 
        this.isState(pointArr[i].state);
        this.cxt.lineTo(pointArr[i].event.changedTouches[0].pageX - this.offsetLeft, pointArr[i].event.changedTouches[0].pageY - this.offsetTop);
        this.cxt.stroke();
    }
    this.cxt.closePath();
}

//橡皮擦，state为0是橡皮檫，state为1是画笔
Signature.prototype.eraser=function(state){
     this.state=state;
     this.isState(state);
}

//判断state的状态，进行画笔和橡皮檫的切换
Signature.prototype.isState=function(state){
     if(state == '0'){  
         //把笔画的颜色设置成背景颜色，模拟成橡皮檫
         this.cxt.strokeStyle=this.background; 
     }else{
         this.cxt.strokeStyle=this.color;
     }
}

// 修改笔触大小
Signature.prototype.modifyLineWidth=function(lineWidth){
    if (/^[0-9]+$/.test(lineWidth)) {
        this.lineWidth = lineWidth;
        this.cxt.lineWidth = lineWidth;
    } else {
        console.warn('modifyLineWidth方法参数请传入数字');
    }
}

// 修改笔触颜色
Signature.prototype.modifyColor=function(color){
    this.color = color;
    this.cxt.strokeStyle = color;
}
