
//TODO 
// initialise webgl
// draw a basic object eg box

// free camera motion
// render regular perspective projection

// fisheye view

//fps character object (s)

var shaderPrograms={};
var cubeBuffers={};
var cameraMat = mat4.create();
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

var mouseInfo = {
	x:0,
	y:0,
	pendingMovement:[0,0],
};

var pointerLocked=false;


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

    canvas.addEventListener("mousemove", function(evt){
		if (pointerLocked){
			mouseInfo.pendingMovement[0]+=-0.001* evt.movementX;	//TODO screen resolution dependent sensitivity.
			mouseInfo.pendingMovement[1]+=-0.001* evt.movementY;
		}
	});


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
    vfov:120,
    near:0.01,
    far:1000
};

var lastFrameTime = null;
var playerPos=[0,0,5];
var playerEyePosFromNeck=[0,0.2,-0.2]; //20cm above and ahead of neck, so 1.7m above groun d, 10cm forwards
var playerNeckPos=[0,0.5,0.1];  //relative to player centre which is 1m above ground.  1.5m above ground, 10cm back
var playerVel=[0,0,0];
var playerAcc=[0,0,0];
var preDragPlayerAcc=[0,0,0];
var playerRotation=0;
var playerElevation=0;
var boxPos=[0,0,0];
var groundPos=[0,-11,0];


var armElevationMultiplier=1.4; //elevate arms more than player look direction. 
    // - suspect this is natural - head isn't 90 deg
    //back when pointing gun upward.
     // NOTE could make gimbal lock situation worse - perhaps better use pointing direction and scale look elevation...
var torsoElevationMultiplier=0.3;   //torso doesn't elevate as much as view. neck does remaining rotation

function drawScene(frameTime){
	requestAnimationFrame(drawScene);

    //TODO iterate mechanics using controls

    var forwardBack = keyThing.keystate(87)-keyThing.keystate(83);	//vertical W,S = up, down
    var leftRight = keyThing.keystate(65)-keyThing.keystate(68);    //lateral A,D

    var cosSin = [Math.cos(playerRotation), Math.sin(playerRotation)];
    var moveMultiplier = (forwardBack==0 || leftRight==0) ? 1: 0.7071

    var xMove = moveMultiplier*(forwardBack*cosSin[0] + leftRight*cosSin[1]);
    var zMove = moveMultiplier*(-forwardBack*cosSin[1] + leftRight*cosSin[0]);

    var turnInput = keyThing.leftKey() - keyThing.rightKey();
    var elevationInput = keyThing.upKey() - keyThing.downKey();

    if (lastFrameTime){
        var timeChange = frameTime-lastFrameTime;

        var accMultiply = Math.exp(-0.002*timeChange);
        var preDragPlayerAccTarget = [zMove,0,xMove].map(xx=>xx*-0.00001);
       
        preDragPlayerAcc[0] = preDragPlayerAcc[0]*accMultiply + (1-accMultiply)*preDragPlayerAccTarget[0];
        preDragPlayerAcc[2] = preDragPlayerAcc[2]*accMultiply + (1-accMultiply)*preDragPlayerAccTarget[2];

        playerAcc = preDragPlayerAcc.map(x=>x); //copy

        //add drag proportional to speed.
        playerAcc[0]-=playerVel[0]*0.001;
        playerAcc[2]-=playerVel[2]*0.001;

        playerVel[2]+=timeChange*playerAcc[2];
        playerVel[0]+=timeChange*playerAcc[0];
        playerRotation -= timeChange*turnInput*0.005;
        playerElevation -= timeChange*elevationInput*0.005;

        //cap elevation
        playerElevation=Math.min(playerElevation, 0.7*Math.PI/2);   //pointing down!
        playerElevation=Math.max(playerElevation, -0.7*Math.PI/2);
            //0.7 because arms move more than view.

        //TODO fixed timestep mechanics
        
        playerPos[2]+=playerVel[2]*timeChange;
        playerPos[0]+=playerVel[0]*timeChange;

        updateSpeedInfo(playerVel, playerAcc);
    }
    lastFrameTime=frameTime;


    var amountToMove = new Array(2);
    var fractionToKeep = 0.9;
    for (var cc=0;cc<2;cc++){
        amountToMove[cc]=mouseInfo.pendingMovement[cc]*(1-fractionToKeep);
        mouseInfo.pendingMovement[cc]*=fractionToKeep;  //TODO if keep this, framerate independence.
    }

    playerRotation-=mouseInfo.pendingMovement[0];
    playerElevation-=mouseInfo.pendingMovement[1];
    //NOTE simple decoupled pitch, turn. perhaps better to have "free flight" rotation with auto-levelling - 
    // ie turn when elevated results in tilted view - perhaps similar to head movement preceding body movement - 
    // when body catches up and face in same compass direction as looking direction, view levels out.

    //console.log("drawing scene");
    
    //clear colour

    gl.clearColor(0,1,1,1); //cyan
   	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);



    mat4.perspective(camParams.vfov, gl.viewportWidth/ gl.viewportHeight, camParams.near, camParams.far, pMatrix); 

    var boxRotation = frameTime / 1000;
    
    
    
    var activeProg = shaderPrograms.texmap;
    gl.useProgram(activeProg);
    enableDisableAttributes(activeProg);

    gl.disable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);

    bind2dTextureIfRequired(bricktex);
    


    
    //draw a block for player's core.
    
    //for ease of use, and to allowing straightforward drawing of player objects for different cameras, 
    // calculate matrices of cameras (view) and objects (model) in same way,
    // and when rendering, invert camera matrix.
   
    var torsoMatrix = mat4.identity();
    mat4.translate(torsoMatrix, playerPos);
    //tilt by player acceleration
    var accMag = Math.hypot.apply(null, playerAcc);
    var accTurnAngle = Math.atan2(playerAcc[2],playerAcc[0]);
    var accTilt = Math.atan(accMag*1_000_000/9.88);
    mat4.rotateY(torsoMatrix, -accTurnAngle);
    mat4.rotateZ(torsoMatrix, -accTilt * 0.75);    //0.75 is fudge to make more reasonable (tilt by 22.5 deg at 1g acc instead of 45)
    mat4.rotateY(torsoMatrix, accTurnAngle);
        //TODO smooth jerk (derivative of acceleration)

    mat4.rotateY(torsoMatrix, -playerRotation);

    //defer drawing until calculate camera


    var eyeMat = mat4.create(torsoMatrix);
    mat4.rotateX(eyeMat, -playerElevation*torsoElevationMultiplier);
    mat4.translate(eyeMat, playerNeckPos);
    mat4.rotateX(eyeMat, -playerElevation*(1-torsoElevationMultiplier));
    mat4.translate(eyeMat, playerEyePosFromNeck);

    if (document.getElementById("externalcam").checked){
        mat4.identity(cameraMat);
    }else{
        mat4.set(eyeMat, cameraMat);
        mat4.inverse(cameraMat);    //note .transpose won't work like does in 3sphere games, because these are standard 3d gfx mats, not SO4s.
    }

    //draw eye
    drawCubeWithScale(activeProg, eyeMat, [0.05,0.05,0.05]);    //10cm cube

    // draw torso
    drawCubeWithScale(activeProg, torsoMatrix, [0.2,0.2,0.1]);  //40 cm wide, 40cm tall, 20cm deep. top is like bottom of rib cage

    //draw gun
    var gunMat = mat4.create(torsoMatrix);
    mat4.rotateX(gunMat, -playerElevation*torsoElevationMultiplier);
    mat4.translate(gunMat, playerNeckPos);
    mat4.translate(gunMat, [0,0,-0.2]);  //moving forward in this frame maybe could do by shoulder centre pos instead. ( playerNeckPos + [0,0,0.2])
    mat4.rotateX(gunMat, -playerElevation*(armElevationMultiplier-torsoElevationMultiplier));
    mat4.translate(gunMat, [0,0.05,-1]);    //1m - end of arm, up by 5cm
    drawCubeWithScale(activeProg, gunMat, [0.025,0.1,0.1]);
    
    drawArm2(activeProg, torsoMatrix, 1);   //right arm
    drawArm2(activeProg, torsoMatrix, -1);  //left arm

    function drawArm2(activeProg, torsoMatrix, handedness){
        var armMat = mat4.create(torsoMatrix);
        mat4.rotateX(armMat, -playerElevation*torsoElevationMultiplier);
        mat4.translate(armMat, playerNeckPos);
        mat4.translate(armMat, [0.2*handedness,0,-0.2]);  //moving forward in this frame maybe could do by shoulder centre pos instead. ( playerNeckPos + [0,0,0.2])
        mat4.rotateX(armMat, -playerElevation*(armElevationMultiplier-torsoElevationMultiplier) + handedness*0.06);

        mat4.rotateY(armMat, 0.2*handedness); //turn shoulder about up vector
        mat4.translate(armMat, [0,0,-0.5]);    //move forwards by 0.5 for elbow

        drawCubeWithScale(activeProg, armMat, [0.05,0.05,0.5]); //10cm x 10cm x 1m
    }

    //draw cube
    setupDrawMatrixForObjectAtPosition(boxPos);
    mat4.rotateY(mvMatrix, boxRotation);
    drawObjectFromBuffers(cubeBuffers, activeProg);

    //draw ground
    setupDrawMatrixForObjectAtPosition(groundPos);
    mat4.scale(mvMatrix,[10,10,10]);
    drawObjectFromBuffers(cubeBuffers, activeProg);

    //draw a tower to indicate up direction
    setupDrawMatrixForObjectAtPosition([0,0,10]);
    mat4.scale(mvMatrix,[1,100,1]);
    drawObjectFromBuffers(cubeBuffers, activeProg);

}

function setCameraMatrixToEyes(torsoMatrix){
    var eyeMat = mat4.create(torsoMatrix);
    mat4.rotateX(eyeMat, -playerElevation*torsoElevationMultiplier);
    mat4.translate(eyeMat, playerNeckPos);
    mat4.rotateX(eyeMat, -playerElevation*(1-torsoElevationMultiplier));
    mat4.translate(eyeMat, playerEyePosFromNeck);

    mat4.set(eyeMat, cameraMat);

    mat4.inverse(cameraMat);    //note .transpose won't work like does in 3sphere games, because these are standard 3d gfx mats, not SO4s.
}

function setupDrawMatrixForObjectAtPosition(objPos){
    mat4.set(cameraMat, mvMatrix);
    mat4.translate(mvMatrix, objPos);
}

function updateSpeedInfo(vel, acc){
    //world scale is metres
    //vel is in metres per millisecond
    var velMag = Math.hypot.apply(null, vel);
    var speedMetresPerSecond = velMag*1000;
    var speedKmPerH = speedMetresPerSecond*3.6;
    var speedMilesPerHour = speedKmPerH/1.6;

    var accMag = Math.hypot.apply(null, acc);
    var accMetresPerSecondSquared = accMag*1_000_000;
    var accGees = accMetresPerSecondSquared/9.81;

    document.getElementById("speedinfo").innerHTML = 
        "speed: " + 
        speedMetresPerSecond.toFixed(2) + "m/s " + 
        speedKmPerH.toFixed(2) + "km/h " +
        speedMilesPerHour.toFixed(2)+"mph ," +
        "acceleration: " +
        accMetresPerSecondSquared.toFixed(2) + "m/s^2 " + 
        accGees.toFixed(2) + "g";
}

function drawCubeWithScale(shaderProg, objMatrix, scaleVec){
    mat4.set(cameraMat, mvMatrix);
    mat4.multiply(mvMatrix, objMatrix);   //mvMatrix model view

    mat4.scale(mvMatrix, scaleVec);
    drawObjectFromBuffers(cubeBuffers, shaderProg);
}
