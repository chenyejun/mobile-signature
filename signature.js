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
// 获取当前元素距离屏幕顶部的偏移长度
function getElementTop(elem) {

    var elemTop = elem.offsetTop;//获得elem元素距相对定位的父元素的top
    elem = elem.offsetParent;//将elem换成起相对定位的父元素
    while (elem != null) {//只要还有相对定位的父元素 
        /*获得父元素 距他父元素的top值,累加到结果中 */
        elemTop += elem.offsetTop;
        //再次将elem换成他相对定位的父元素上;
        elem = elem.offsetParent;
    }
    return elemTop;
}

// 获取当前元素距离屏幕左边的偏移长度
function getElementLeft(elem) {
    var elemLeft = elem.offsetLeft;//获得elem元素距相对定位的父元素的Left
    elem = elem.offsetParent;//将elem换成起相对定位的父元素
    while (elem != null) {//只要还有相对定位的父元素 
        /*获得父元素 距他父元素的left值,累加到结果中 */
        elemLeft += elem.offsetLeft;
        //再次将elem换成他相对定位的父元素上;
        elem = elem.offsetParent;
    }
    return elemLeft;
}

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
    this.offsetLeft = getElementLeft(this.el);
    this.offsetTop = getElementTop(this.el);
    this.cxt.fillStyle = this.background;
    this.cxt.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.cxt.strokeStyle = this.color;
    this.cxt.lineWidth = this.lineWidth;
    this.cxt.lineCap = 'round';

    this.recordList = []; // 记录绘制记录
    this.previousPoint = []; // 记录上一步绘制的点集合
    this.state = 1;//画笔的状态,1为画，0为擦

    //开始绘制
    this.canvas.addEventListener('touchstart', function (e) {
        this.previousPoint = [];
        this.previousPoint.push({
            'event': e,
            'state': this.state,
            'lineWidth': this.lineWidth,
            'color': this.color
        });
        this.cxt.beginPath();
        e.preventDefault();
        // 减去canvas外层的offsetLeft，因为pageX是相对与屏幕边界的距离，如果外层包裹元素有padding，会导致画笔中心偏移
        this.cxt.moveTo(e.changedTouches[0].pageX - this.offsetLeft, e.changedTouches[0].pageY - this.offsetTop);
    }.bind(this), false);
    //绘制中
    this.canvas.addEventListener('touchmove', function (e) {
        this.previousPoint.push({
            'event': e,
            'state': this.state,
            'lineWidth': this.lineWidth,
            'color': this.color
        });
        this.cxt.lineTo(e.changedTouches[0].pageX - this.offsetLeft, e.changedTouches[0].pageY - this.offsetTop);
        this.cxt.stroke();
    }.bind(this), false);
    //结束绘制
    this.canvas.addEventListener('touchend', function () {
        this.cxt.closePath();
        this.recordList.push(this.previousPoint);
    }.bind(this), false);

    //清除画布
    this.clear = function () {
        // 清空纪录，清除画布
        this.recordList.length = 0;
        this.cxt.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    //保存图片，直接转base64
    this.save = function () {
        var imgBase64 = this.canvas.toDataURL();
        return imgBase64
    }
    // 上一步
    this.previous = function () {
        // 清除画布
        this.cxt.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.recordList.pop();
        this.resetCanvas();
    }

};

// 利用坐标点重新绘制
Signature.prototype.resetCanvas = function () {
    // 保存当前橡皮檫状态、笔触大小和颜色，因为draw方法会改变strokeStyle和lineWidth
    let state = this.state;
    let lineWidth = this.lineWidth;
    let color = this.color;
    for (var i = 0; i < this.recordList.length; i++) {
        this.draw(this.recordList[i]);
    }
    // 恢复橡皮檫状态、笔触大小和颜色
    this.eraser(state);
    this.modifyLineWidth(lineWidth);
    this.modifyColor(color);
}

Signature.prototype.draw = function (pointArr) {

    this.cxt.beginPath();
    this.cxt.moveTo(pointArr[0].event.changedTouches[0].pageX - this.offsetLeft, pointArr[0].event.changedTouches[0].pageY - this.offsetTop);
    for (var i = 1; i < pointArr.length; i++) {
        this.isState(pointArr[i].state);
        this.modifyLineWidth(pointArr[i].lineWidth);
        this.modifyColor(pointArr[i].color);
        this.cxt.lineTo(pointArr[i].event.changedTouches[0].pageX - this.offsetLeft, pointArr[i].event.changedTouches[0].pageY - this.offsetTop);
        this.cxt.stroke();
    }
    this.cxt.closePath();
}

//橡皮擦，state为0是橡皮檫，state为1是画笔
Signature.prototype.eraser = function (state) {
    this.state = state;
    this.isState(state);
}

//判断state的状态，进行画笔和橡皮檫的切换
Signature.prototype.isState = function (state) {
    if (state == '0') {
        //把笔画的颜色设置成背景颜色，模拟成橡皮檫
        this.cxt.strokeStyle = this.background;
    } else {
        this.cxt.strokeStyle = this.color;
    }
}

// 修改笔触大小
Signature.prototype.modifyLineWidth = function (lineWidth) {
    if (/^[0-9]+$/.test(lineWidth)) {
        this.lineWidth = lineWidth;
        this.cxt.lineWidth = lineWidth;
    } else {
        console.warn('modifyLineWidth方法参数请传入数字');
    }
}

// 修改笔触颜色
Signature.prototype.modifyColor = function (color) {
    this.color = color;
    this.cxt.strokeStyle = color;
}
