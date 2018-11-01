
var gl;

function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
    if(!gl.getExtension('OES_standard_derivatives')) {
        throw 'extension not support';
    }
}


function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

var shaderProgram;
var shaderProgram_dict = {};

function initShaders(fileNoExtend) {
    var vertexShader = getShader(gl, fileNoExtend+"Vert");
    var fragmentShader = getShader(gl, fileNoExtend+"Frag");

    shaderProgram = gl.createProgram();
    shaderProgram_dict[fileNoExtend] = shaderProgram;

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    
    shaderProgram.vertexFrontColorAttribute = gl.getAttribLocation(shaderProgram, "aFrontColor");
    gl.enableVertexAttribArray(shaderProgram.vertexFrontColorAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.invMatrixUniform = gl.getUniformLocation(shaderProgram, "invMatrix");

    shaderProgram.ambReflectUniform = gl.getUniformLocation(shaderProgram, "Ka");
    shaderProgram.diffReflectUniform = gl.getUniformLocation(shaderProgram, "Kd");
    shaderProgram.specReflectUniform = gl.getUniformLocation(shaderProgram, "Ks");
    shaderProgram.specDeviateUniform = gl.getUniformLocation(shaderProgram, "n");
}

function changeShader(){
    var stype = document.getElementById("sel_shader").value;
    shaderProgram = shaderProgram_dict[stype];
    gl.useProgram(shaderProgram);
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();
var invMatrix = mat4.create();

function PushMatrices() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function PopMatrices() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}


function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.invMatrixUniform, false, invMatrix);
}

function setReflectUniforms(params) {
    gl.uniform1f(shaderProgram.ambReflectUniform, params[0]);
    gl.uniform1f(shaderProgram.diffReflectUniform, params[1]);
    gl.uniform1f(shaderProgram.specReflectUniform, params[2]);
    gl.uniform1f(shaderProgram.specDeviateUniform, params[3]);
}

function SetLights(pos3, intensity3){
    var lightsource = gl.getUniformLocation(shaderProgram, "LightSource");
    var intensity_p = gl.getUniformLocation(shaderProgram, "Ip");
    gl.uniform3fv(lightsource, pos3.flat());
    gl.uniform3fv(intensity_p, intensity3.flat());
}
function turnOnLights(pos3, intensity3){
    for (var key in shaderProgram_dict) {
        var prog = shaderProgram_dict[key];
        gl.useProgram(prog);
        shaderProgram = prog;
        SetLights(pos3, intensity3);
    }
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}


var VertexPositionBuffer = [];
var VertexNormalBuffer = [];
var VertexFrontColorBuffer = [];
var VertexBackColorBuffer = [];

function handleLoadedModel(desData) {
    var desVertexPositionBuffer;
    var desVertexNormalBuffer;
    var desVertexFrontColorBuffer;
    var desVertexBackColorBuffer;

    desVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, desVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(desData.vertexNormals), gl.STATIC_DRAW);
    desVertexNormalBuffer.itemSize = 3;
    desVertexNormalBuffer.numItems = desData.vertexNormals.length / 3;

    desVertexFrontColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, desVertexFrontColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(desData.vertexFrontcolors), gl.STATIC_DRAW);
    desVertexFrontColorBuffer.itemSize = 3;
    desVertexFrontColorBuffer.numItems = desData.vertexFrontcolors.length / 3;
     
    desVertexBackColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, desVertexBackColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(desData.vertexBackcolors), gl.STATIC_DRAW);
    desVertexBackColorBuffer.itemSize = 3;
    desVertexBackColorBuffer.numItems = desData.vertexBackcolors.length / 3;

    desVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, desVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(desData.vertexPositions), gl.STATIC_DRAW);
    desVertexPositionBuffer.itemSize = 3;
    desVertexPositionBuffer.numItems = desData.vertexPositions.length / 3;

    VertexPositionBuffer.push(desVertexPositionBuffer);
    VertexNormalBuffer.push(desVertexNormalBuffer);
    VertexFrontColorBuffer.push(desVertexFrontColorBuffer);
    VertexBackColorBuffer.push(desVertexBackColorBuffer);    
}

var loaded = 0;
function loadModel(model) {    
    var request = new XMLHttpRequest();
    request.open("GET", model);
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            handleLoadedModel(JSON.parse(request.responseText));

            var output = document.getElementById("model_"+(loaded++));
            var sub = model.split(/[.\/]/);
            output.innerHTML = sub[sub.length-2];

            if(sub[sub.length-2]=="Easter"){
                all_reflect_params[loaded-1] = [0.2, 0.5, 0.2, 64.0];
            }else if(sub[sub.length-2]=="Car_road"){
                all_reflect_params[loaded-1] = [0.3, 0.2, 0.8, 50.0];
            }else{
                all_reflect_params[loaded-1] = [0.2, 0.3, 0.7, 50.0];
            }
        }
    }
    request.send();   
}

// const tea_default = [-50, 0, -120];
const uno_default = [-2, 0, -5];
const des_default = [0, 0, -5];
const tres_default = [2, 0, -5];

var all_reflect_params = [[],[],[]];
var all_default = [uno_default, des_default, tres_default];
var all_trans = [[],[],[]];
var all_scale = [[],[],[]];
var all_rot = [[],[],[]];
var all_shear = [[],[],[]];

var lamp_pos = [[],[],[]];
var lamp_rgb = [[],[],[]];

var spinAngle = 180;
var spinInterval = 0.03;
var rgb = [1., 0., 0.];

function resetslide(){
    var xx = document.getElementById("slide_x");
    var yy = document.getElementById("slide_y");
    var zz = document.getElementById("slide_z");
    var model = document.getElementById("sel_model").value;
    var transform = document.getElementById("sel_transform").value;
    
    var scale, trans, dft, rot, shear;

    scale = all_scale[model];
    trans = all_trans[model];
    dft = all_default[model];
    rot = all_rot[model];
    shear = all_shear[model];

    if(transform=="scale"){
        xx.value = Math.round(Math.log10(scale[0])*500+500);
        yy.value = Math.round(Math.log10(scale[1])*500+500);
        zz.value = Math.round(Math.log10(scale[2])*500+500);
    }else if(transform=="trans"){
        xx.value = Math.round((trans[0]-dft[0])*100+500);
        yy.value = Math.round((trans[1]-dft[1])*100+500);
        zz.value = Math.round((trans[2]-dft[2])*100+500);
    }else if(transform=="rot"){
        xx.value = Math.round(rot[0]/0.36);
        yy.value = Math.round(rot[1]/0.36);
        zz.value = Math.round(rot[2]/0.36);
    }else if(transform=="shear"){
        xx.value = Math.round(shear[0]*500+500);
        yy.value = Math.round(shear[1]*500+500);
        zz.value = Math.round(shear[2]*500+500);
    }
}
function changeSlide(ele){
    var model = document.getElementById("sel_model").value;
    var transform = document.getElementById("sel_transform").value;
    var axis = 0;
    if(ele.id=="slide_x"){
        axis = 0;
    }else if(ele.id=="slide_y"){
        axis = 1;
    }else if(ele.id=="slide_z"){
        axis = 2;
    }

    if(transform=="scale"){
        all_scale[model][axis] = Math.pow(10,(ele.value-500)/500);
    }else if(transform=="trans"){
        all_trans[model][axis] = (ele.value - 500)/100 + all_default[model][axis];
    }else if(transform=="rot"){
        all_rot[model][axis] = ele.value * 0.36;
    }else if(transform=="shear"){
        all_shear[model][axis] = (ele.value - 500) / 500;
    }
}
function resetlampslide(){
    var xx = document.getElementById("slide2_x");
    var yy = document.getElementById("slide2_y");
    var zz = document.getElementById("slide2_z");
    var lamp = document.getElementById("sel_lamp").value;
    var mode = document.getElementById("sel_lamp_mod").value;
    
    var pos, rgb;

    pos = lamp_pos[lamp];
    rgb = lamp_rgb[lamp];

    if(mode=="pos"){
    	xx.value = Math.round(pos[0]*100+500);
        yy.value = Math.round(pos[1]*100+500);
        zz.value = Math.round(pos[2]*100+500);
    }else if(mode=="rgb"){
        xx.value = Math.round(rgb[0]*1000);
        yy.value = Math.round(rgb[1]*1000);
        zz.value = Math.round(rgb[2]*1000);
    }
}
function lampslidechange(ele){
    var lamp = document.getElementById("sel_lamp").value;
    var mode = document.getElementById("sel_lamp_mod").value;

    var axis = 0;
    if(ele.id=="slide2_x"){
        axis = 0;
    }else if(ele.id=="slide2_y"){
        axis = 1;
    }else if(ele.id=="slide2_z"){
        axis = 2;
    }

    if(mode=="pos"){
        lamp_pos[lamp][axis] = (ele.value - 500)/100;
    }else if(mode=="rgb"){
        lamp_rgb[lamp][axis] = ele.value / 1000;
    }
}
function reset(){
    spinAngle = 180;
    for (var i = 0; i < all_default.length; i++){
        all_trans[i] = all_default[i].slice(0, 3);
        all_scale[i] = [1.0, 1.0, 1.0];
        all_rot[i] = [90, 180, 0];
        all_shear[i] = [0, 0, 0];
    }
    for (var i = 0; i < lamp_pos.length; i++){
        lamp_pos[i] = [0.,0.,0.];
        lamp_rgb[i] = [1.,1.,1.];
    }
    resetslide();
    resetlampslide();
}

mat4.shear=function(a,b){
    mat4.multiply(a, [1, b[0], b[1], 0, 0, 1, b[2], 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    return a;
}

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // SetLights([[0., 2., -1.], [2., 5., -5.], [5., 0., -5.]], [[1.0,1.0,1.0], rgb, [3.0,3.0,3.0]]);
    SetLights(lamp_pos, lamp_rgb);
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 150.0, pMatrix);
    mat4.identity(mvMatrix);

    for(var i = 0; i < VertexPositionBuffer.length; i++){
        if (VertexPositionBuffer[i] == null || VertexNormalBuffer[i] == null || VertexFrontColorBuffer[i] == null || VertexBackColorBuffer[i] == null) {
           return;
        }

        var scale, trans, dft, rot, shear;

        scale = all_scale[i];
        trans = all_trans[i];
        dft = all_default[i];
        rot = all_rot[i];
        shear = all_shear[i];

        PushMatrices();

        // mat4.identity(mvMatrix);
        
        /*order: scale,rotate,shear -> translation. since matrices are multiplied to the right of mvMatrix.*/
        mat4.translate(mvMatrix, trans);
        mat4.scale(mvMatrix, scale);
        mat4.rotate(mvMatrix, degToRad(spinAngle), [0, 1, 0]);
        mat4.rotate(mvMatrix, degToRad(rot[0]), [1, 0, 0]);
        mat4.rotate(mvMatrix, degToRad(rot[1]), [0, 1, 0]);
        mat4.rotate(mvMatrix, degToRad(rot[2]), [0, 0, 1]);
        mat4.shear(mvMatrix, shear);

        mat4.inverse(mvMatrix, invMatrix);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, VertexPositionBuffer[i]);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, VertexPositionBuffer[i].itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, VertexNormalBuffer[i]);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, VertexNormalBuffer[i].itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, VertexFrontColorBuffer[i]);
        gl.vertexAttribPointer(shaderProgram.vertexFrontColorAttribute, VertexFrontColorBuffer[i].itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        setReflectUniforms(all_reflect_params[i]);
        gl.drawArrays(gl.TRIANGLES, 0, VertexPositionBuffer[i].numItems);

        PopMatrices();
    }
}


var lastTime = 0;
var startTime = 0;
var counter = 0;
var inter = 75;
var d_red = [0, -1, 0, 0, 1, 0]
var d_grn = [1, 0, 0, -1, 0, 0]
var d_blu = [0, 0, 1, 0, 0, -1]
var changingcol = [1, 0, 2, 1, 0, 2]

function clamp(a,b,c){return Math.max(b,Math.min(c,a));};
function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
        spinAngle += spinInterval * elapsed;

        
        rgb[0]+=d_red[counter]/inter
        rgb[1]+=d_grn[counter]/inter
        rgb[2]+=d_blu[counter]/inter
        // if (Math.max(...rgb)>1.0 || Math.min(...rgb)<0.0)
        if (rgb[changingcol[counter]]>1.0 || rgb[changingcol[counter]]<0.0){
            clamp(rgb[0], 0.0, 1.0);
            clamp(rgb[1], 0.0, 1.0);
            clamp(rgb[2], 0.0, 1.0);
            counter = (counter+1)%d_red.length;
        }
    }
    lastTime = timeNow;
}

function change_spin(val){
    spinInterval = val
}


function tick() {
    requestAnimFrame(tick);
    drawScene();
    animate();
}


function webGLStart() {
    var canvas = document.getElementById("ICG-canvas");
    initGL(canvas);
    initShaders("gouraud");
    initShaders("phong");
    initShaders("flat");
    initShaders("toon");
    turnOnLights([[0., 2., -1.], [2., 5., -5.], [5., 0., -5.]], [[1.0,1.0,1.0], [1.0,1.0,1.0], [3.0,3.0,3.0]]);
    startTime = new Date().getTime();
    loadModel("Models/Kangaroo.json");
    loadModel("Models/Easter.json");
    loadModel("Models/Mig27.json");    

    gl.clearColor(0.0, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);

    reset();
    changeShader();
    tick();
}