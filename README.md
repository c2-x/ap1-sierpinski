# AP1 · 交互式 2D 分形 — Sierpinski 垫片

在线演示（公网 URL）：https://c2-x.github.io/ap1-sierpinski/

课程项目（Angel & Shreiner, Interactive Computer Graphics, 8th ed., Ch2-3）。
原生 WebGL 2.0 + JavaScript，使用教材配套工具库风格（Common/ 下 initShaders.js / MV.js / webgl-utils.js），无构建步骤。


## 运行方式
任意静态服务器从项目根目录启动即可，例如：

cd ap1

python -m http.server 8000

浏览器打开 http://localhost:8000/。直接双击 index.html（file://）在多数浏览器因安全限制无法加载，请使用静态服务器。


## 实现要点
两种生成算法

1. 混沌游戏（随机迭代）—— js/gasket.js: chaosGame()
   反复执行 p = (p + 随机顶点) / 2，前20个点丢弃（避免初始点落在垫片外的杂点），其余以 Float32Array 组织、经 gl.bufferData 上传 VBO，用 gl.POINTS 渲染。
   该实现把多边形边数参数化，切换边数即可得到四边形 / 五边形 / 六边形混沌游戏垫片（选做 E1）。
2. 递归细分 —— js/gasket.js: subdivide()
   对三角形取三边中点，分成4个小三角形并丢弃中间一个，其余3个递归；深度为0时输出顶点。深度0~6均可运行（深度6 共729个三角形）。
   同一批顶点数据支持三种渲染模式：点云 gl.POINTS、线框 gl.LINES（每三角形6个索引）、实体 gl.TRIANGLES。




### 数据流
Float32Array → gl.bufferData → VBO → gl.vertexAttribPointer → 顶点着色器 attribute。
