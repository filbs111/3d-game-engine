
//TODO 
// initialise webgl
// draw a basic object eg box

// free camera motion
// render regular perspective projection

// fisheye view

//fps character object (s)

var shaderPrograms={};
var cubeBuffers={};
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function init(){

    //escape escapes pointer lock and exit fullscreen
	// - browsers seem to have this already, but electron apparently doesn't!
	//todo also cancel the logic that does a 1s delayed pointer lock on pressing F to fullscreen!
	document.addEventListener('keydown', function(event) {
	  if (event.key === 'Escape' || event.code === 'Escape') {
		console.log('Escape key was pressed!!');
		document.exitPointerLock();
		if (window.electronAPI){
			console.log("exiting fullscreen");
			window.electronAPI.exitFullscreen();
		}
	  }
	});
	
	window.addEventListener("keydown",function(evt){
		//console.log("key pressed : " + evt);
		var willPreventDefault=true;

		//number key to select special weapon
		var n = parseInt(evt.key);
		if (!isNaN(n)){
			if (n>0 && n<=numSpecialWeaps){	//1,2,3... 
				var weapNum = n-1;
				selectedSpecialWeapId = weapNum;
			}
		}else{
			switch (evt.keyCode){	
				case 70:	//F
					goFullscreen(canvas);
					break;
				default:
					willPreventDefault=false;
					break;
			}
		}
		if (willPreventDefault){evt.preventDefault()};
	});

	canvas = document.getElementById("mycanvas");
	
	document.addEventListener('pointerlockchange', function lockChangeCb() {
	  if (document.pointerLockElement === canvas ) {
			console.log('The pointer lock status is now locked');
			pointerLocked=true;
		} else {
			console.log('The pointer lock status is now unlocked');  
			pointerLocked=false;
	  }
	}, false);


    initGL();
    initShaders(shaderPrograms);initShaders=null;
    initTexture();
    initBuffers();
	getLocationsForShadersUsingPromises(
		()=>{
			requestAnimationFrame(drawScene);	//in callback because need to wait until shaders loaded
		}
	);


    gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
}

var bricktex;
function initTexture(){
    bricktex = makeTexture("img/brick-tex.jpg",gl.RGB,gl.UNSIGNED_SHORT_5_6_5); 
}

function initBuffers(){
    loadBufferData(cubeBuffers, levelCubeData);
}

var bind2dTextureIfRequired = (function createBind2dTextureIfRequiredFunction(){
	var currentlyBoundTextures=[];
	var currentBoundTex;
	return function(texToBind, texId = gl.TEXTURE0){	//TODO use different texture indices to keep textures loaded?
								//curently just assuming using tex 0, already set as active texture (is set active texture a fast gl call?)
		
		//workaround wierd bug
		if (texId == gl.TEXTURE3){
			currentlyBoundTextures[texId] = null;
		}

		currentBoundTex = currentlyBoundTextures[texId];	//note that ids typically high numbers. gl.TEXTURE0 and so on. seem to be consecutive numbers but don't know if guaranteed.
		
		//if (texToBind != currentBoundTex){
		if (true){
			gl.activeTexture(texId);
			gl.bindTexture(gl.TEXTURE_2D, texToBind);
			currentlyBoundTextures[texId] = texToBind;
		}
	}
})();

function texImage2DWithLogs(mssg, target, level, internalformat, width, height, border, format, type, offsetOrSource){
	console.log({"mssg":"called texImage2D "+mssg, "parameters":{target, level, internalformat, width, height, border, format, type, offsetOrSource}});
	gl.texImage2D(target, level, internalformat, width, height, border, format, type, offsetOrSource);
}

// function setMatrixUniforms(shaderProgram) {
//     gl.uniformMatrix4fv(shaderProgram.uniforms.uPMatrix, false, pMatrix);
//     gl.uniformMatrix4fv(shaderProgram.uniforms.uMVMatrix, false, mvMatrix);
// }

function drawObjectFromBuffers(bufferObj, shaderProg){
	prepBuffersForDrawing(bufferObj, shaderProg);
	drawObjectFromPreppedBuffers(bufferObj, shaderProg);
}
function prepBuffersForDrawing(bufferObj, shaderProg){

    
	gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProg.attributes.aVertexPosition, bufferObj.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	if (bufferObj.vertexNormalBuffer && shaderProg.attributes.aVertexNormal){
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexNormalBuffer);
		gl.vertexAttribPointer(shaderProg.attributes.aVertexNormal, bufferObj.vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferObj.vertexIndexBuffer);
	
	if (bufferObj.vertexTextureCoordBuffer && shaderProg.uniforms.uSampler){    
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexTextureCoordBuffer);
		gl.vertexAttribPointer(shaderProg.attributes.aTextureCoord, bufferObj.vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
		gl.activeTexture(gl.TEXTURE0);
		gl.uniform1i(shaderProg.uniforms.uSampler, 0);
	}

	gl.uniformMatrix4fv(shaderProg.uniforms.uPMatrix, false, pMatrix);
}
function drawObjectFromPreppedBuffers(bufferObj, shaderProg){
	gl.uniformMatrix4fv(shaderProg.uniforms.uMVMatrix, false, mvMatrix);
	gl.drawElements(gl.TRIANGLES, bufferObj.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

var enableDisableAttributes = (function generateEnableDisableAttributesFunc(){
	
	var maxNum = 16;
	var isEnabled = new Array(16);
	var shouldBeEnabled = new Array(16);

	for (var ii=0;ii<maxNum;ii++){
		isEnabled[ii] = false;
	}

	var swapArr;

	return function(shaderProg){
		//in webgl2, seems attributes don't necessarily take numbers from 0 to shaderProg.numActiveAttribs - 1
		
		for (var ii=0;ii<maxNum;ii++){
			shouldBeEnabled[ii] = false;
		}
		for (var attr of Object.values(shaderProg.attributes)){
			shouldBeEnabled[attr] = true;
		}

		for (var ii=0;ii<maxNum;ii++){
			if (shouldBeEnabled[ii]){
				if (!isEnabled[ii]){
					gl.enableVertexAttribArray(ii);
				}
			}else{
				if (isEnabled[ii]){
					gl.disableVertexAttribArray(ii);
				}
			}
		}

		swapArr = isEnabled;
		isEnabled = shouldBeEnabled;
		shouldBeEnabled = swapArr;	//now contains junk, but avoids memory churn
	};
})();


var camParams = {
    vfov:60,
    near:0.1,
    far:1000
};

function drawScene(frameTime){
	requestAnimationFrame(drawScene);

    //TODO iterate mechanics using controls

    //console.log("drawing scene");
    
    //clear colour

    gl.clearColor(0,1,1,1); //cyan
   	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


   

    mat4.perspective(camParams.vfov, gl.viewportWidth/ gl.viewportHeight, camParams.near, camParams.far, pMatrix); 

    var boxRotation = frameTime / 1000;
    
    //set camera position
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0, 0, -5]);
    //mat4.translate(mvMatrix, [-10, 0, 0]);


    mat4.rotateY(mvMatrix, boxRotation);


    //draw cube
    var activeProg = shaderPrograms.texmap;
    gl.useProgram(activeProg);
    enableDisableAttributes(activeProg);

    gl.disable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.CULL_FACE);


    bind2dTextureIfRequired(bricktex);
    drawObjectFromBuffers(cubeBuffers, activeProg);
}

