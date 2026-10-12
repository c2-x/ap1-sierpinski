//
// renderer.js —— WebGL 渲染模块：着色器、VBO、绘制与"逐点生长"动画
//
// 顶点变换：gl_Position = (a_position + u_offset) * u_scale
//   u_offset（平移）与 u_scale（缩放）由鼠标交互写入 uniform，
//   避免每帧重新上传顶点数据。
//

"use strict";

const Renderer = (function () {
    let gl, program;
    let posBuffer, colorBuffer, lineIndexBuffer;
    let aPosition, aColor, uOffset, uScale, uPointSize;

    // 当前要画的数据
    const data = {
        positions: null, // Float32Array
        colors: null,    // Float32Array
        lineIndices: null,
        mode: "points",  // points | wireframe | solid
        shownCount: 0,   // 点云模式已生长的顶点数
        animating: true  // 空格控制的生长动画开关
    };

    // 视图状态（鼠标交互写这里）
    const view = { offset: [0.0, 0.0], scale: 1.0 };

    function init(canvas) {
        gl = setupWebGL(canvas);
        if (!gl) return false;

        program = initShaders(gl, "vertex-shader", "fragment-shader");
        gl.useProgram(program);

        aPosition = gl.getAttribLocation(program, "a_position");
        aColor = gl.getAttribLocation(program, "a_color");
        uOffset = gl.getUniformLocation(program, "u_offset");
        uScale = gl.getUniformLocation(program, "u_scale");
        uPointSize = gl.getUniformLocation(program, "u_pointSize");

        posBuffer = gl.createBuffer();
        colorBuffer = gl.createBuffer();
        lineIndexBuffer = gl.createBuffer();

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.08, 0.09, 0.12, 1.0);
        return true;
    }

    // 上传一组顶点数据（positions: Float32Array，colors: Float32Array）
    // mode: "points" | "wireframe" | "solid"，决定这一批数据用哪种图元绘制
    function setData(positions, colors, lineIndices, mode) {
        data.positions = positions;
        data.colors = colors;
        data.lineIndices = lineIndices || null;
        data.mode = mode;    // 关键：渲染模式必须随数据一起同步
        data.shownCount = 0; // 新数据从头开始生长

        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);

        if (lineIndices) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lineIndices, gl.STATIC_DRAW);
        }
    }

    function render(pointSize) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2fv(uOffset, view.offset);
        gl.uniform1f(uScale, view.scale);
        gl.uniform1f(uPointSize, data.mode === "points" ? pointSize : 1.0);

        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aColor);

        if (data.mode === "points") {
            // 逐点生长动画：每帧追加一批点，达到上限后停住
            if (data.animating && data.shownCount < data.positions.length / 2) {
                data.shownCount = Math.min(data.shownCount + 300, data.positions.length / 2);
                // 长满时通知 UI 更新状态文字（只触发一次）
                if (data.shownCount === data.positions.length / 2 && onGrowthComplete) {
                    onGrowthComplete();
                }
            }
            gl.drawArrays(gl.POINTS, 0, data.shownCount);
        } else if (data.mode === "wireframe") {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
            gl.drawElements(gl.LINES, data.lineIndices.length, gl.UNSIGNED_SHORT, 0);
        } else { // solid
            gl.drawArrays(gl.TRIANGLES, 0, data.positions.length / 2);
        }
    }

    let onGrowthComplete = null; // 生长完成时的回调（UI 用来刷新状态文字）

    return {
        init: init,
        setData: setData,
        render: render,
        data: data,
        view: view,
        gl: function () { return gl; },
        set onGrowthComplete(cb) { onGrowthComplete = cb; }
    };
})();
