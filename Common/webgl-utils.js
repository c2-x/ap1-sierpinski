//
// webgl-utils.js
// 教材配套工具库（源自 Google 的同名公开代码）的等价实现。
//

// 跨浏览器兼容的 requestAnimationFrame
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

// 从 canvas 获取 WebGL 2.0 上下文；失败时提示
function setupWebGL(canvas) {
    var names = ["webgl2", "webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    var context = null;
    for (var i = 0; i < names.length; ++i) {
        try {
            context = canvas.getContext(names[i]);
        } catch (e) { }
        if (context) break;
    }
    if (!context) {
        alert("WebGL is not available!");
    }
    return context;
}
