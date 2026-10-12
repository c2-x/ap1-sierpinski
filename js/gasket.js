//
// gasket.js —— 几何算法模块（纯函数，不接触 WebGL，可单独测试）
//
// 两种生成 Sierpinski 垫片的方法：
//   1. chaosGame()      混沌游戏（随机迭代）：p = (p + 随机顶点) / 2
//   2. sierpinskiSubdivision()  递归细分：subdivide(triangle, depth)
//
// 选做 E1：chaosGame 的顶点数参数化，可直接生成任意 n 边形垫片。
//

"use strict";

const Gasket = (function () {

    // 正 n 边形顶点，中心在原点，第一个顶点朝上，外接圆半径 radius
    function regularPolygon(n, radius) {
        const verts = [];
        for (let i = 0; i < n; i++) {
            const angle = Math.PI / 2 + (2 * Math.PI * i) / n;
            verts.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
        }
        return verts;
    }

    // 混沌游戏：反复执行 p = (p + 随机顶点) / 2
    // 前 warm 个点丢弃（初始点可能落在垫片外，避免杂点）
    function chaosGame(nPoints, nGon, radius) {
        nGon = nGon || 3;
        radius = radius || 0.8;
        const verts = regularPolygon(nGon, radius);
        const out = new Float32Array(nPoints * 2);
        let p = [0.0, 0.0];
        const warm = 20;
        for (let i = 0; i < nPoints + warm; i++) {
            const v = verts[Math.floor(Math.random() * nGon)];
            p[0] = (p[0] + v[0]) / 2;
            p[1] = (p[1] + v[1]) / 2;
            if (i >= warm) {
                out[(i - warm) * 2] = p[0];
                out[(i - warm) * 2 + 1] = p[1];
            }
        }
        return out;
    }

    function midpoint(a, b) {
        return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    }

    // 递归细分：把三角形分成 4 份，丢掉中间那份，其余 3 份递归
    // tri: [ [x,y], [x,y], [x,y] ]；out: 展开存放的顶点数组（每三角形 6 个数）
    function subdivide(tri, depth, out) {
        if (depth === 0) {
            out.push(tri[0][0], tri[0][1], tri[1][0], tri[1][1], tri[2][0], tri[2][1]);
            return;
        }
        const ab = midpoint(tri[0], tri[1]);
        const bc = midpoint(tri[1], tri[2]);
        const ca = midpoint(tri[2], tri[0]);
        subdivide([tri[0], ab, ca], depth - 1, out);
        subdivide([ab, tri[1], bc], depth - 1, out);
        subdivide([ca, bc, tri[2]], depth - 1, out);
    }

    // 生成 depth 层 Sierpinski 细分，返回：
    //   positions : Float32Array（每三角形 6 个数，实心无索引可直接画）
    //   triCount  : 三角形个数
    //   lineIndices: Uint16Array（线框模式用的索引，每个三角形 6 个索引）
    function sierpinskiSubdivision(depth) {
        const tri = [[0.0, 0.8], [-0.8, -0.6], [0.8, -0.6]];
        const flat = [];
        subdivide(tri, depth, flat);
        const positions = new Float32Array(flat);
        const triCount = positions.length / 6;

        // 线框：每个三角形 [a,b,c] -> 线段 a-b, b-c, c-a
        const lineIndices = new Uint16Array(triCount * 6);
        for (let t = 0; t < triCount; t++) {
            const b = t * 3;
            lineIndices.set([b, b + 1, b + 1, b + 2, b + 2, b], t * 6);
        }
        return { positions: positions, triCount: triCount, lineIndices: lineIndices };
    }

    // 配色方案：生成与顶点一一对应的 RGB 颜色数组
    // scheme: "red" | "cyan" | "rainbow"（rainbow 按顶点索引做色相渐变）
    function makeColors(count, scheme) {
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            let r, g, b;
            if (scheme === "red") {
                r = 0.90; g = 0.22; b = 0.15;
            } else if (scheme === "cyan") {
                r = 0.15; g = 0.75; b = 0.90;
            } else { // rainbow：HSV 色相沿顶点索引渐变
                const h = i / Math.max(count - 1, 1);
                const f = (n) => {
                    const k = (n + h * 6) % 6;
                    return 1 - Math.max(Math.min(k, 4 - k, 1), 0);
                };
                r = f(5); g = f(3); b = f(1);
            }
            colors[i * 3] = r; colors[i * 3 + 1] = g; colors[i * 3 + 2] = b;
        }
        return colors;
    }

    return {
        chaosGame: chaosGame,
        sierpinskiSubdivision: sierpinskiSubdivision,
        makeColors: makeColors
    };
})();
