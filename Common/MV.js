//
// MV.js —— 教材配套矩阵/向量工具库（Angel & Shreiner 公开代码）的等价子集实现。
// 覆盖课程项目常用类型与运算：vec2 / vec3 / vec4 / mat2 / mat3 / mat4、
// 平移/旋转/缩放矩阵、flatten()（将 JS 数组转成 Float32Array 供 gl.bufferData 使用）。
// AP1 实际只用 vec2 与 flatten；其余保留以便 AP2 / AP3 复用。
//

//----------------------------------------------------------------------------
// 基础工具
//----------------------------------------------------------------------------

function _argumentsToArray(args) {
    return [].concat.apply([], Array.prototype.slice.apply(args));
}

function radians(degrees) {
    return degrees * Math.PI / 180.0;
}

function degrees(radians) {
    return radians * 180.0 / Math.PI;
}

//----------------------------------------------------------------------------
// 向量
//----------------------------------------------------------------------------

function vec2() {
    var out = new Float32Array(2);
    out.type = 'vec2';
    var v = _argumentsToArray(arguments);
    if (v.length === 0) return out;
    if (v.length === 1) { out[0] = v[0]; out[1] = v[0]; return out; }
    out[0] = v[0]; out[1] = v[1];
    return out;
}

function vec3() {
    var out = new Float32Array(3);
    out.type = 'vec3';
    var v = _argumentsToArray(arguments);
    if (v.length === 0) return out;
    if (v.length === 1) { out[0] = out[1] = out[2] = v[0]; return out; }
    out[0] = v[0]; out[1] = v[1]; out[2] = v[2];
    return out;
}

function vec4() {
    var out = new Float32Array(4);
    out.type = 'vec4';
    var v = _argumentsToArray(arguments);
    if (v.length === 0) return out;
    if (v.length === 1) { out[0] = out[1] = out[2] = out[3] = v[0]; return out; }
    out[0] = v[0]; out[1] = v[1]; out[2] = v[2];
    out[3] = v.length > 3 ? v[3] : 1.0; // vec3 提升为齐次坐标
    return out;
}

function add(u, v) {
    var result = new Float32Array(u.length);
    result.type = u.type;
    for (var i = 0; i < u.length; i++) result[i] = u[i] + v[i];
    return result;
}

function subtract(u, v) {
    var result = new Float32Array(u.length);
    result.type = u.type;
    for (var i = 0; i < u.length; i++) result[i] = u[i] - v[i];
    return result;
}

function scale(s, u) {
    if (typeof s === 'object' && u === undefined) { var t = s; s = u; u = t; }
    var result = new Float32Array(u.length);
    result.type = u.type;
    for (var i = 0; i < u.length; i++) result[i] = s * u[i];
    return result;
}

function dot(u, v) {
    var sum = 0.0;
    for (var i = 0; i < u.length; i++) sum += u[i] * v[i];
    return sum;
}

function cross(u, v) {
    var result = vec3(
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0]
    );
    return result;
}

function length(u) {
    return Math.sqrt(dot(u, u));
}

function normalize(u) {
    var len = length(u);
    var result = new Float32Array(u.length);
    result.type = u.type;
    for (var i = 0; i < u.length; i++) result[i] = u[i] / len;
    return result;
}

function mix(u, v, s) {
    var result = new Float32Array(u.length);
    result.type = u.type;
    for (var i = 0; i < u.length; i++) result[i] = (1.0 - s) * u[i] + s * v[i];
    return result;
}

//----------------------------------------------------------------------------
// 矩阵（按列主序存储，与 WebGL 一致）
//----------------------------------------------------------------------------

function mat2() {
    var v = _argumentsToArray(arguments);
    var m = [];
    switch (v.length) {
        case 0: v = [1, 0, 0, 1];
        case 1: m.push(vec2(v[0], v[0])); m.push(vec2(v[0], v[0])); break;
        default: m.push(vec2(v)); v.splice(0, 2); m.push(vec2(v)); break;
    }
    m.matrix = true;
    return m;
}

function mat3() {
    var v = _argumentsToArray(arguments);
    var m = [];
    switch (v.length) {
        case 0: v = [1, 0, 0, 0, 1, 0, 0, 0, 1];
        case 1: m.push(vec3(v[0], 0, 0)); m.push(vec3(0, v[0], 0)); m.push(vec3(0, 0, v[0])); break;
        default:
            m.push(vec3(v[0], v[1], v[2]));
            m.push(vec3(v[3], v[4], v[5]));
            m.push(vec3(v[6], v[7], v[8]));
            break;
    }
    m.matrix = true;
    return m;
}

function mat4() {
    var v = _argumentsToArray(arguments);
    var m = [];
    switch (v.length) {
        case 0: v = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        case 1:
            m.push(vec4(v[0], 0, 0, 0)); m.push(vec4(0, v[0], 0, 0));
            m.push(vec4(0, 0, v[0], 0)); m.push(vec4(0, 0, 0, v[0]));
            break;
        default:
            m.push(vec4(v[0], v[1], v[2], v[3]));
            m.push(vec4(v[4], v[5], v[6], v[7]));
            m.push(vec4(v[8], v[9], v[10], v[11]));
            m.push(vec4(v[12], v[13], v[14], v[15]));
            break;
    }
    m.matrix = true;
    return m;
}

// 单位矩阵
function identityMatrix() { // 教材部分版本写作 mat4() 或 identity()
    return mat4();
}

// 方阵转置（输入为列主序的数组表示）
function transpose(m) {
    var result = [];
    for (var i = 0; i < m.length; ++i) {
        result.push([]);
        for (var j = 0; j < m[i].length; ++j) {
            result[i].push(m[j][i]);
        }
    }
    result.matrix = true;
    return result;
}

// 矩阵乘法（支持矩阵×矩阵、矩阵×向量、标量×矩阵）
function mult(u, v) {
    var result = [];

    if (u.matrix && v.matrix) { // 矩阵 × 矩阵
        for (var i = 0; i < u.length; ++i) {
            result.push([]);
            for (var j = 0; j < v.length; ++j) {
                var sum = 0.0;
                for (var k = 0; k < u.length; ++k) {
                    sum += u[i][k] * v[k][j];
                }
                result[i].push(sum);
            }
        }
        result.matrix = true;
        return result;
    }

    if (u.matrix && (u.length === v.length)) { // 矩阵 × 向量
        for (var i = 0; i < v.length; i++) {
            var sum = 0.0;
            for (var j = 0; j < v.length; j++) {
                sum += u[i][j] * v[j];
            }
            result.push(sum);
        }
        result.type = v.type;
        return result;
    }

    if (typeof u === 'number' && v.matrix) { // 标量 × 矩阵
        for (var i = 0; i < v.length; i++) {
            result.push([]);
            for (var j = 0; j < v[i].length; j++) {
                result[i].push(u * v[i][j]);
            }
        }
        result.matrix = true;
        return result;
    }
}

//----------------------------------------------------------------------------
// 平移 / 旋转 / 缩放
//----------------------------------------------------------------------------

function translate(x, y, z) {
    if (Array.isArray(x) && x.length === 3) { z = x[2]; y = x[1]; x = x[0]; }
    var result = mat4();
    result[0][3] = x;
    result[1][3] = y;
    result[2][3] = z;
    return result;
}

function rotate(angle, axis) {
    if (Array.isArray(axis)) axis = vec3(axis);
    var v = normalize(axis);
    var x = v[0], y = v[1], z = v[2];
    var c = Math.cos(radians(angle));
    var omc = 1.0 - c;
    var s = Math.sin(radians(angle));

    return mat4(
        x * x * omc + c, x * y * omc + z * s, x * z * omc - y * s, 0.0,
        x * y * omc - z * s, y * y * omc + c, y * z * omc + x * s, 0.0,
        x * z * omc + y * s, y * z * omc - x * s, z * z * omc + c, 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

function scalem(x, y, z) { // 教材中函数名为 scale，此处改名避免与上面的标量 scale 冲突
    if (Array.isArray(x) && x.length === 3) { z = x[2]; y = x[1]; x = x[0]; }
    var result = mat4();
    result[0][0] = x;
    result[1][1] = y;
    result[2][2] = z;
    return result;
}

function rotateX(theta) { return rotate(theta, vec3(1, 0, 0)); }
function rotateY(theta) { return rotate(theta, vec3(0, 1, 0)); }
function rotateZ(theta) { return rotate(theta, vec3(0, 0, 1)); }

// 正交 / 透视投影
function ortho(left, right, bottom, top, near, far) {
    var w = right - left, h = top - bottom, d = far - near;
    var result = mat4();
    result[0][0] = 2.0 / w;
    result[1][1] = 2.0 / h;
    result[2][2] = -2.0 / d;
    result[0][3] = -(left + right) / w;
    result[1][3] = -(top + bottom) / h;
    result[2][3] = -(near + far) / d;
    return result;
}

function perspective(fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(radians(fovy) / 2.0);
    var d = far - near;
    var result = mat4();
    result[0][0] = f / aspect;
    result[1][1] = f;
    result[2][2] = -(near + far) / d;
    result[2][3] = -2 * near * far / d;
    result[3][2] = -1.0;
    result[3][3] = 0.0;
    return result;
}

function lookAt(eye, at, up) {
    var v = normalize(subtract(at, eye));  // view direction
    var n = normalize(cross(v, up));       // side
    var u = normalize(cross(n, v));        // corrected up
    v = scale(-1, v);                      // back direction

    var result = mat4(
        n[0], u[0], v[0], 0.0,
        n[1], u[1], v[1], 0.0,
        n[2], u[2], v[2], 0.0,
        0.0, 0.0, 0.0, 1.0
    );
    return mult(result, translate(scale(-1, eye)));
}

function normalize2(u) { return normalize(u); }

//----------------------------------------------------------------------------
// flatten: 把 vec 数组 / 矩阵转成 Float32Array（列主序），直接喂给 gl.bufferData
//----------------------------------------------------------------------------

function flatten(v) {
    if (v.matrix === true) v = transpose(v);
    var n = v.length;
    var elemsAreArrays = Array.isArray(v[0]) || v[0].type === 'vec2' ||
        v[0].type === 'vec3' || v[0].type === 'vec4';

    if (elemsAreArrays) {
        var size = v[0].length;
        var floats = new Float32Array(n * size);
        for (var i = 0; i < n; ++i) {
            for (var j = 0; j < size; ++j) {
                floats[i * size + j] = v[i][j];
            }
        }
        return floats;
    } else {
        var floats2 = new Float32Array(n);
        for (var i = 0; i < n; ++i) floats2[i] = v[i];
        return floats2;
    }
}
