//
// interaction.js —— 鼠标与键盘事件（全部手写监听，不使用现成库）
//
// 鼠标：左键拖动平移、滚轮缩放（以光标位置为锚点）
// 键盘：1/2/3 切换渲染模式；空格 暂停/继续逐点生长动画
//

"use strict";

const Interaction = (function () {
    let canvas;
    let dragging = false;
    let lastPos = null;

    // 像素坐标 -> 裁剪坐标 [-1, 1]
    function toClip(e) {
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        return [x, y];
    }

    function attach(canvasEl, callbacks) {
        canvas = canvasEl;
        const view = Renderer.view;
        const data = Renderer.data;

        // 左键拖动平移
        canvas.addEventListener("mousedown", function (e) {
            if (e.button === 0) { dragging = true; lastPos = toClip(e); }
        });
        window.addEventListener("mouseup", function () {
            dragging = false; lastPos = null;
        });
        canvas.addEventListener("mousemove", function (e) {
            if (!dragging) return;
            const cur = toClip(e);
            // 位移除以缩放，保证屏幕上拖多少，图形就移动多少
            view.offset[0] += (cur[0] - lastPos[0]) / view.scale;
            view.offset[1] += (cur[1] - lastPos[1]) / view.scale;
            lastPos = cur;
        });

        // 滚轮缩放：缩放中心 = 光标所在位置
        canvas.addEventListener("wheel", function (e) {
            e.preventDefault();
            const factor = Math.pow(1.001, -e.deltaY);
            const mouse = toClip(e);
            const newScale = Math.min(50.0, Math.max(0.05, view.scale * factor));
            const realFactor = newScale / view.scale;
            // offset' = mouse + (offset - mouse) / realFactor
            view.offset[0] = mouse[0] + (view.offset[0] - mouse[0]) / realFactor;
            view.offset[1] = mouse[1] + (view.offset[1] - mouse[1]) / realFactor;
            view.scale = newScale;
        }, { passive: false });

        // 键盘：1/2/3 切换模式，空格 暂停/继续生长
        window.addEventListener("keydown", function (e) {
            if (e.key === "1") callbacks.onModeChange("points");
            else if (e.key === "2") callbacks.onModeChange("wireframe");
            else if (e.key === "3") callbacks.onModeChange("solid");
            else if (e.key === " ") {
                e.preventDefault();
                data.animating = !data.animating;
                callbacks.onPauseToggle(data.animating);
            }
        });
    }

    return { attach: attach };
})();
