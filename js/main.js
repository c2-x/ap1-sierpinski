//
// main.js —— 入口：装配渲染器、UI 与交互，启动渲染循环
//

"use strict";

window.onload = function () {
    const canvas = document.getElementById("gl-canvas");
    if (!Renderer.init(canvas)) return;

    UI.init();

    Interaction.attach(canvas, {
        onModeChange: function (m) { window.UI_setMode(m); },
        onPauseToggle: function (animating) { window.UI_syncPause(animating); }
    });

    (function loop() {
        Renderer.render(UI.params.pointSize);
        requestAnimFrame(loop);
    })();
};
