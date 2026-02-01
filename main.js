
//TODO 
// initialise webgl
// draw a basic object eg box

// free camera motion
// render regular perspective projection

// fisheye view

//fps character object (s)

var shaderPrograms={};
var cubeBuffers={};
var quadBuffers={};
var cameraMat = mat4.create();
var mvMatrix = mat4.create();
var mMatrix = mat4.create();
var pMatrix = mat4.create();

var mouseInfo = {
	x:0,
	y:0,
	pendingMovement:[0,0],
};

var pointerLocked=false;

var listerBuffers={};


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
    initTextures();
    initCubemapFramebuffer(cubemapView);
    initBuffers();
	getLocationsForShadersUsingPromises(
		()=>{
			requestAnimationFrame(drawScene);	//in callback because need to wait until shaders loaded
		}
	);


    loadBuffersFromObj2Or3File(listerBuffers, "./data/miscobjs/imported-lister.obj2", loadBufferData, 3);


    loadAnimationStuff();



    gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
}

var biovisionAnimation = {};
function loadAnimationStuff(){
    BVH.read("./animation/cmuconvert-mb2-01-09/01/01_01.bvh", function(motion) { 

        console.log({
            info:"loaded biovision hierarchy animation", 
            motion
        });
        
        biovisionAnimation.data = motion;
        biovisionAnimation.loaded = true;
    });
}



var bricktex;
var cubemapTexture;
function initTextures(){
    bricktex = makeTexture("img/brick-tex.jpg",gl.RGB,gl.UNSIGNED_SHORT_5_6_5);
    cubemapTexture = loadCubeMap("img/skyboxes/sp2/sp2_");
}

function initBuffers(){
    loadBufferData(cubeBuffers, levelCubeData);
   	loadBufferData(quadBuffers, quadData);
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

    if (shaderProg.uniforms.uPMatrix){
	    gl.uniformMatrix4fv(shaderProg.uniforms.uPMatrix, false, pMatrix);
    }

    if (shaderProg.uniforms.uSamplerCube){
		gl.activeTexture(gl.TEXTURE4);
		gl.uniform1i(shaderProg.uniforms.uSamplerCube, 4);	//??
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);
		//bind2dTextureIfRequired(cubemapTexture, gl.TEXTURE_CUBE_MAP);
	}

    if (shaderProg.uniforms.uSamplerCubeFisheye){
        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(shaderProg.uniforms.uSamplerCubeFisheye, 1);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapView.cubemapTexture);
//        		gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);

    }

}
function drawObjectFromPreppedBuffers(bufferObj, shaderProg){
    if (shaderProg.uniforms.uMVMatrix){
	    gl.uniformMatrix4fv(shaderProg.uniforms.uMVMatrix, false, mvMatrix);
    }else if (shaderProg.uniforms.uMMatrix){
        gl.uniformMatrix4fv(shaderProg.uniforms.uMMatrix, false, mMatrix);
        gl.uniformMatrix4fv(shaderProg.uniforms.uVMatrix, false, cameraMat);  //TODO set less frequently
    }
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
    near:0.01,
    far:20000
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
var boxPos=[0,0.1,0];   //move up a bit to sit above mirror plane
var groundPos=[0,-11,0];

//static camera position
var staticCamera = mat4.identity();
mat4.rotateX(staticCamera, -0.2); //elevate
mat4.translate(staticCamera,[0,0,9]);  //move back
mat4.rotateX(staticCamera, -0.2); //elevate more
var statCamPos = staticCamera.slice(12,15);

var carMatrix = mat4.identity();
mat4.translate(carMatrix,[8,-0.47,6]); //right, down a bit, back


var armElevationMultiplier=1.4; //elevate arms more than player look direction. 
    // - suspect this is natural - head isn't 90 deg
    //back when pointing gun upward.
     // NOTE could make gimbal lock situation worse - perhaps better use pointing direction and scale look elevation...
var torsoElevationMultiplier=0.4;   //torso doesn't elevate as much as view. neck does remaining rotation

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

    
    var boxRotation = frameTime / 1000;
    
    

    gl.disable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);

    
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


    var upperTorsoMat = mat4.create(torsoMatrix);    
    mat4.rotateX(upperTorsoMat, -playerElevation*torsoElevationMultiplier);
    var eyeMat = mat4.create(upperTorsoMat);
    mat4.translate(upperTorsoMat, [0,0.3,0]);
    mat4.translate(eyeMat, playerNeckPos);
    mat4.rotateX(eyeMat, -playerElevation*(1-torsoElevationMultiplier));
    var neckMat = mat4.create(eyeMat);
    mat4.translate(eyeMat, playerEyePosFromNeck);

    if (document.getElementById("camfollowsplayer").checked){
        mat4.identity(staticCamera);
        mat4.translate(staticCamera, statCamPos);
        var difference = [playerPos[0]-statCamPos[0], playerPos[1]-statCamPos[1], playerPos[2]-statCamPos[2]];
        mat4.rotateY(staticCamera, Math.atan2(-difference[0], -difference[2]));   //pan
        var distance = Math.hypot.apply(null, difference);
        mat4.rotateX(staticCamera, Math.asin(difference[1]/distance)); //tilt (elevation)
    }

    var unmirroredCameraMat = mat4.create();
    if (document.getElementById("externalcam").checked){
        mat4.set(staticCamera, unmirroredCameraMat);
    }else{
        mat4.set(eyeMat, unmirroredCameraMat);
    }
    mat4.inverse(unmirroredCameraMat);    //note .transpose won't work like does in 3sphere games, because these are standard 3d gfx mats, not SO4s.
    

    if (!document.getElementById("fisheyeselection_off").checked){

        //draw cubemap about current camera.
        // but for simplicity, make initial version using cubemap for intermediate views. render 6 cameras for each cubemap side, then map from cubemap onto the screen.
        // NOTE can do this more efficiently, (what is best depends on FOV), by drawing to 1,2,or 4 panels (last is "quad view" used in 3-sphere project), but this is generally
        // more complex.

        updateCubemap(unmirroredCameraMat, eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation, frameTime);

        renderViewUsingCmap();

    }else{

        var cameraZoom = parseFloat(document.getElementById("camerazoom").value); 
        var vFov = 2* Math.atan(cameraZoom) * 180/Math.PI;

        mat4.perspective(vFov, gl.viewportWidth/ gl.viewportHeight, camParams.near, camParams.far, pMatrix); 
        pMatrix[9]=-0.33;       //shift centre of perspective one third up from centre to top of screen (so is 1/3 down screen top to bottom)

        drawSingleScene(unmirroredCameraMat, true, eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation, frameTime);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        drawSingleScene(unmirroredCameraMat, false, eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation, frameTime);    
    }
}


function drawSingleScene(unmirroredCameraMat, mirrorInGroundPlane, eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation, frameTime){
        //NOTE passing in eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation is awkward. 
        //TODO create scene description and use for render?

    mat4.set(unmirroredCameraMat, cameraMat);

    if (mirrorInGroundPlane){
       var groundHeight = 1;
       mat4.translate(cameraMat, [0,-groundHeight,0]);  //unnecessary if put ground to y=0
       mat4.scale(cameraMat, [1,-1,1]);
       mat4.translate(cameraMat, [0,groundHeight,0]);   //""
       gl.cullFace(gl.FRONT);
        //TODO set clip plane

    }else{
       gl.cullFace(gl.BACK);
    }


    activeProg = shaderPrograms.texmap;
    gl.useProgram(activeProg);
    enableDisableAttributes(activeProg);
    bind2dTextureIfRequired(bricktex);

    //draw ground blocker object if in not mirror mode, so don't overwrite view through mirror.
    if (!mirrorInGroundPlane){
        gl.colorMask(false, false, false, false);
        setupDrawMatrixForObjectAtPosition([groundPos[0],groundPos[1]+10, groundPos[2]]);    //top face of cube
        mat4.scale(mMatrix,[10,0,10]);
        drawObjectFromBuffers(cubeBuffers, activeProg);
        gl.colorMask(true, true, true, true);
    }


    //draw cube
    setupDrawMatrixForObjectAtPosition(boxPos);
    mat4.rotateY(mMatrix, boxRotation);
    drawObjectFromBuffers(cubeBuffers, activeProg);

    //draw ground
    // TODO draw ground partially transparent.
    if (!mirrorInGroundPlane){
        setupDrawMatrixForObjectAtPosition(groundPos);
        mat4.scale(mMatrix,[10,9.99,10]);   //9.99 so the blocker mirror plane is drawn in front! 
        drawObjectFromBuffers(cubeBuffers, activeProg);
    }


    activeProg = shaderPrograms.flat;
    gl.useProgram(activeProg);
    enableDisableAttributes(activeProg);

    //draw a tower to indicate up direction
    gl.uniform3fv(activeProg.uniforms.uFlatColor, [0.25,0.25,0.25]);
    setupDrawMatrixForObjectAtPosition([0,0,10]);
    mat4.scale(mMatrix,[1,100,1]);
    drawObjectFromBuffers(cubeBuffers, activeProg);


    //draw external camera (will be invisible if external camera checked because cull backfaces)
    mat4.set(staticCamera, mMatrix);
    gl.uniform3fv(activeProg.uniforms.uFlatColor, [0.8,0.8,0.8]);
    mat4.scale(mMatrix,[0.2,0.2,0.4]);
    drawObjectFromBuffers(cubeBuffers, activeProg);



    gl.uniform3fv(activeProg.uniforms.uFlatColor, [0.1,0.5,0.1]);


    //draw eye
    drawCubeWithScale(activeProg, eyeMat, [0.05,0.05,0.05]);    //10cm cube

    //draw neck
    drawCubeWithScale(activeProg, neckMat, [0.05,0.05,0.05]); 

    //draw uppoer torso
    drawCubeWithScale(activeProg, upperTorsoMat, [0.25,0.2,0.1]); 

    // draw torso
    drawCubeWithScale(activeProg, torsoMatrix, [0.2,0.2,0.1]);  //40 cm wide, 40cm tall, 20cm deep. top is like bottom of rib cage


    //draw legs. 
    //TODO make movement correspond to movement speed and direction. 
    //temporary - just constant animation.
    var legSwing = 0.5*Math.sin(boxRotation*4);
    var legMat = mat4.create(torsoMatrix);
    mat4.rotateX(legMat, legSwing);
    mat4.translate(legMat, [0.1,-0.5,0]);
    drawCubeWithScale(activeProg, legMat, [0.1,0.5,0.1]);   //right leg

    mat4.set(torsoMatrix, legMat);
    mat4.rotateX(legMat, -legSwing);
    mat4.translate(legMat, [-0.1,-0.5,0]);
    drawCubeWithScale(activeProg, legMat, [0.1,0.5,0.1]);   //left leg


    //draw gun
    var gunMat = mat4.create(torsoMatrix);
    mat4.rotateX(gunMat, -playerElevation*torsoElevationMultiplier);
    mat4.translate(gunMat, playerNeckPos);
    mat4.translate(gunMat, [0,0,-0.2]);  //moving forward in this frame maybe could do by shoulder centre pos instead. ( playerNeckPos + [0,0,0.2])
    mat4.rotateX(gunMat, -playerElevation*(armElevationMultiplier-torsoElevationMultiplier));
    

    mat4.translate(gunMat, [0,0.05,-1]);    //1m - end of arm, up by 5cm

    var doubleGuns = document.getElementById("doubleguns").checked;
    if (doubleGuns){
        mat4.translate(gunMat, [-0.2,0,0]);
        drawCubeWithScale(activeProg, gunMat, [0.025,0.1,0.1]);
        mat4.translate(gunMat, [0.4,0,0]);
        drawCubeWithScale(activeProg, gunMat, [0.025,0.1,0.1]);
    }else{
        drawCubeWithScale(activeProg, gunMat, [0.025,0.1,0.1]);
    }
    
    drawArm2(activeProg, torsoMatrix, 1, doubleGuns);   //right arm
    drawArm2(activeProg, torsoMatrix, -1, doubleGuns);  //left arm

    function drawArm2(activeProg, torsoMatrix, handedness, doubleGuns){
        var armMat = mat4.create(torsoMatrix);
        mat4.rotateX(armMat, -playerElevation*torsoElevationMultiplier);
        mat4.translate(armMat, playerNeckPos);
        mat4.translate(armMat, [0.2*handedness,0,-0.2]);  //moving forward in this frame maybe could do by shoulder centre pos instead. ( playerNeckPos + [0,0,0.2])
        
        mat4.rotateX(armMat, -playerElevation*(armElevationMultiplier-torsoElevationMultiplier));
        if (!doubleGuns){
            mat4.rotateX(armMat, handedness*0.06);
            mat4.rotateY(armMat, 0.2*handedness); //turn shoulder about up vector
        }else{
            mat4.rotateX(armMat, 0.06);
        }

        mat4.translate(armMat, [0,0,-0.5]);    //move forwards by 0.5 for elbow

        drawCubeWithScale(activeProg, armMat, [0.05,0.05,0.5]); //10cm x 10cm x 1m
    }


    //mocap data
    drawBiovisionAnimation(biovisionAnimation, frameTime, activeProg);

    
    //draw x-hair.
    gl.uniform3fv(activeProg.uniforms.uFlatColor, [2,0.1,0.1]);
    //TODO disable lighting, disable depth test/write? 
    if (!mirrorInGroundPlane){ //drawing final scene
        mat4.set(gunMat, mMatrix);
        mat4.translate(mMatrix, [0,0,-100]);
        mat4.scale(mMatrix,[1,1,1]); 
        drawObjectFromBuffers(cubeBuffers, activeProg);
    }
    
    //draw car
    gl.uniform3fv(activeProg.uniforms.uFlatColor, [0.002,0.006,0.02]);
    mat4.set(carMatrix, mMatrix);
    mat4.scale(mMatrix,[1,1,1]);
    if (listerBuffers.isLoaded){
        drawObjectFromBuffers(listerBuffers, activeProg);
    }
    


    var activeProg = shaderPrograms.simpleCubemap;
    gl.useProgram(activeProg);

    //skybox
	//draw skybox. maybe efficient to do in screen space. 
	//for now just make very big
	var skyboxScale = 10000;
    mat4.set(cameraMat,mvMatrix);
    setupDrawMatrixForObjectAtPosition([0,0,0]);
	mat4.scale(mvMatrix, [skyboxScale,skyboxScale,-skyboxScale]);
	gl.uniformMatrix4fv(activeProg.uniforms.uMVMatrix, false, mvMatrix);        //set modelview matrix
	//if (cubeBuffers.isLoaded){
		drawObjectFromBuffers(cubeBuffers, activeProg);
	//}
}


function setupDrawMatrixForObjectAtPosition(objPos){
    mat4.identity(mMatrix);
    mat4.translate(mMatrix, objPos);
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
    mat4.set(objMatrix, mMatrix);

    mat4.scale(mMatrix, scaleVec);
    drawObjectFromBuffers(cubeBuffers, shaderProg);
}


function drawBiovisionAnimation(anim, currentTime, activeProg){

    if (!biovisionAnimation.loaded){
        return;
    }

    var animationData = anim.data;

    var maxAnimationFrameNum = animationData.numFrames;
    var frameDuration = animationData.frameTime * 1000;    //ms
    var animationFrame = Math.floor((Math.floor(currentTime / frameDuration)) % maxAnimationFrameNum); //TODO ensure within bounds

    // console.log({
    //     currentTime,
    //     maxAnimationFrameNum,
    //     animationFrame
    // });

    var animatedMats = generateMatricesListForPoints(animationData.root, mat4.identity(), animationFrame);

    animatedMats.forEach(matWithInfo => {
        //a bone with matrices ends matWithInfo.mat , matWithInfo.from

        mat4.set(matWithInfo.mat, mMatrix);
        mat4.scale(mMatrix,[1,1,1].map(x=>x*0.5));
        drawObjectFromBuffers(cubeBuffers, activeProg);
    });
}
