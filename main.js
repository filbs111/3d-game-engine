
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
var quadBuffersLR = {left:{},right:{}};
var cameraMat = mat4.create();
var cameraZoomAdjustInputSmoothed = 1.0;

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
var lucyBuffers={};

var haveUnclickedFire = 0;

//TODO tidy this up, use momentum etc! 
var carInfo = {
    pos:[0,0,0],
    speed: 0,
    vel: [0,0,0],
    acc: 0,
    accVec:[0,0,0],
    steeringAngle: 0
}

//2nd car with different physics model
var carInfo2 = {
    pos: [0,0],
    yawRate: 0,
    steeringAngle: 0,
    throttle: 0,
    velInCarFrame: [0,0],
    rearWheelAngVel: 0,
    frontWheelLongPos: 1.3, 
    rearWheelLongPos: -1.6, //bodge this back because hope will result in yaw force aligning car heading with velocity. TODO shift car model forwards so centre of mass is at 0
                            //seems realistic - weight balance of lister storm race car apparently 55/45 front/back, 1.6/(1.6+1.3) ~ .55
    frontWheelContactPatchOffsetInCarFrame: [0,0],
    rearWheelContactPatchOffsetInCarFrame: [0,0],

    frontAxleVelInCarFrame:0,
    rearAxleVelInCarFrame:0,

    slipVecFront:[0,0],
    slipVecRear:[0,0],
    slipVecFrontMultiplierToCap:0,
    slipVecRearMultiplierToCap:0,

    acceleration:[0,0],
    
    //invariants? 
    // length/angle over which tyre deflection decays
    // mass, angular mass? 
    // height of centre of mass for weight transfer
    // power, drivetrain mass
    // aero drag, rolling resistance
    // downforce
    // steering lock, speed dependence, input to steering angle method
}


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
					goFullscreen(canvascontainer);
					break;
                case 69:
                    //NOTE just switching between walk and car 2

                    var carModeToggle = document.getElementById("carmode_2");

                    if (carModeToggle.checked){
                        //get out of car
                        playerPos[0] = carInfo2.pos3[0];  //TODO appear at drivers side door
                        playerPos[2] = carInfo2.pos3[2];
                        carModeToggle.checked = false;
                    }else{
                         //TODO check proximity
                         carModeToggle.checked = !carModeToggle.checked;
                    }
                    break;
				default:
                    //console.log(evt.keyCode);
					willPreventDefault=false;
					break;
			}
		}
		if (willPreventDefault){evt.preventDefault()};
	});

	canvas = document.getElementById("bottom-canvas");
	canvascontainer = document.getElementById("canvas-container");

    overlaycanvas = document.getElementById("top-canvas");
    overlaycanvas.width = 960;
    overlaycanvas.height = 540;
    overlaycontext = overlaycanvas.getContext("2d");

	document.addEventListener('pointerlockchange', function lockChangeCb() {
	  if (document.pointerLockElement === canvascontainer ) {
			console.log('The pointer lock status is now locked');
			pointerLocked=true;
		} else {
			console.log('The pointer lock status is now unlocked');  
			pointerLocked=false;
	  }
	}, false);

    canvascontainer.addEventListener("mousemove", function(evt){
		if (pointerLocked){
			mouseInfo.pendingMovement[0]+=-0.001* evt.movementX;	//TODO screen resolution dependent sensitivity.
			mouseInfo.pendingMovement[1]+=-0.001* evt.movementY;
		}
	});
    canvascontainer.addEventListener("mousedown", function(evt){
		mouseInfo.buttons = evt.buttons;
		evt.preventDefault();
        //return false;
	});
	canvascontainer.addEventListener("mouseup", function(evt){
		mouseInfo.buttons = evt.buttons;
	});
	canvascontainer.addEventListener("mouseout", function(evt){
		mouseInfo.buttons = 0;
	});


    initGL();
    initShaders(shaderPrograms);initShaders=null;
    initTextures();
    initCubemapFramebuffer(cubemapView);
   	initTextureFramebuffer(rttView);
    initBuffers();
	getLocationsForShadersUsingPromises(
		()=>{
			requestAnimationFrame(drawScene);	//in callback because need to wait until shaders loaded
		}
	);


    loadBuffersFromObj2Or3File(listerBuffers, "./data/miscobjs/imported-lister.obj2", loadBufferData, 3);
    loadBuffersFromObj5File(lucyBuffers, "./data/lucy-withvertcolor.obj5", loadBufferData, 6);

    loadAnimationStuff();



    gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

    gl.depthFunc(gl.LEQUAL);    //if don't do this on linux brave, can't see background, though it is in range! seems like precision of depth buffer is less.

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
}

var biovisionAnimation = {};
function loadAnimationStuff(){
    BVH.read("./animation/cmuconvert-mb2-01-09/02/02_01.bvh", function(motion) { 

        console.log({
            info:"loaded biovision hierarchy animation", 
            motion
        });
        
        biovisionAnimation.data = motion;
        biovisionAnimation.loaded = true;
    });
}



var bricktex;
var concreteTex;
var cubemapTexture;
function initTextures(){
    //bricktex = makeTexture("img/brick-tex.jpg",gl.RGB,gl.UNSIGNED_SHORT_5_6_5);
    bricktex = makeTexture("img/Silverstone_Circuit_2020_2.png",gl.RGB,gl.UNSIGNED_SHORT_5_6_5);  //1665x1200px
    concreteTex = makeTexture("img/0033.jpg",gl.RGB,gl.UNSIGNED_SHORT_5_6_5);
    cubemapTexture = loadCubeMap("img/skyboxes/sp2/sp2_");
}

function initBuffers(){
    loadBufferData(cubeBuffers, levelCubeData);
   	loadBufferData(quadBuffers, quadData);
   	loadBufferData(quadBuffersLR.left, quadDataLR.left);
   	loadBufferData(quadBuffersLR.right, quadDataLR.right);

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

    if (shaderProg.attributes.aVertexColor){
		//assume vertex coloured object has 3 pos, 3 colour (expect vertexPositionBuffer.itemSize = 6)
		//TODO use byte for colour instead of float?
		var iSize = bufferObj.vertexPositionBuffer.itemSize;
		var numColors = iSize - 3;
		gl.vertexAttribPointer(shaderProg.attributes.aVertexPosition, 3, gl.FLOAT, false, 4*iSize, 0);
		gl.vertexAttribPointer(shaderProg.attributes.aVertexColor, numColors, gl.FLOAT, false, 4*iSize, 4*3);
	}else{
		//assume want to skip over colour if present.
		var iSize = bufferObj.vertexPositionBuffer.itemSize;
		gl.vertexAttribPointer(shaderProg.attributes.aVertexPosition, 3, gl.FLOAT, false, 4*iSize, 0);
	}

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
    if (bufferObj.vertexTextureCoordBuffer && shaderProg.uniforms.uSampler2){    
		gl.activeTexture(gl.TEXTURE1);
		gl.uniform1i(shaderProg.uniforms.uSampler2, 1);
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
    near:0.1,
    far:20000
};

var lastFrameTime = null;
var lastFixedTimestepUpdateTime = 0;
var playerPos=[0,0,5];
var playerPosOld=[0,0,5];
var playerEyePosFromNeck=[0,0.2,-0.2]; //20cm above and ahead of neck, so 1.7m above groun d, 10cm forwards
var playerNeckPos=[0,0.5,0.1];  //relative to player centre which is 1m above ground.  1.5m above ground, 10cm back
var playerVel=[0,0,0];
var playerAcc=[0,0,0];
var preDragPlayerAcc=[0,0,0];
var playerRotation=0;
var playerElevation=0;
var playerRotationOld=0;
var playerElevationOld=0;
var boxPos=[0,0.1,0];   //move up a bit to sit above mirror plane
var groundPos=[0,-11,0];

//static camera position
var staticCamera = mat4.identity();
mat4.rotateX(staticCamera, -0.2); //elevate
mat4.translate(staticCamera,[0,0,9]);  //move back
mat4.rotateX(staticCamera, -0.2); //elevate more
var statCamPos = staticCamera.slice(12,15);

var carMatrix = mat4.identity();
mat4.translate(carMatrix,[8,-0.7,6]); //right, down a bit, back
var carMatrixOld = mat4.create(carMatrix);

var carCamera = mat4.create(carMatrix);
var carCameraOld = mat4.create(carCamera);


var carMatrix2 = mat4.identity();
mat4.translate(carMatrix2,[4,-0.7,6]); //right, down a bit, back
var carMatrix2Old = mat4.create(carMatrix2);

var carCamera2 = mat4.create(carMatrix2);
var carCamera2Old = mat4.create(carCamera2);



var lucyMatrix = mat4.identity();
mat4.translate(lucyMatrix,[-8,3,-6]); //left, up a bit, forwards
mat4.rotateY(lucyMatrix, -1);   //clockwise

var armElevationMultiplier=1.4; //elevate arms more than player look direction. 
    // - suspect this is natural - head isn't 90 deg
    //back when pointing gun upward.
     // NOTE could make gimbal lock situation worse - perhaps better use pointing direction and scale look elevation...
var torsoElevationMultiplier=0.4;   //torso doesn't elevate as much as view. neck does remaining rotation

var gunTurn=0;
var gunElevTemp=0;
var lastShotTime=-1000; //could be 0 but want to ensure ready for next shot

var cameraZoom = -1;

var xMoveSmooth=0;
var zMoveSmooth=0;

function getCarMode(){
    return document.getElementById("carmode_2").checked ? 2 : 
            document.getElementById("carmode_1").checked ? 1 :
            0;
}

function iterateMechanics(timeChange){
    //TODO take inputs more frequently?

    playerPosOld = playerPos.map(x=>x);
    playerRotationOld = playerRotation;
    playerElevationOld = playerElevation;

    var carMode = getCarMode();

    var forwardBack = keyThing.keystate(87)-keyThing.keystate(83);	//vertical W,S = up, down
    var leftRight = keyThing.keystate(65)-keyThing.keystate(68);    //lateral A,D

    //don't move player if in car
    var forwardBackWalk = carMode == 0 ? forwardBack : 0;
    var leftRightWalk = carMode == 0 ? leftRight : 0;

    var cosSin = [Math.cos(playerRotation), Math.sin(playerRotation)];
    var moveMultiplier = (forwardBackWalk==0 || leftRightWalk==0) ? 1: 0.7071

    var xMove = moveMultiplier*(forwardBackWalk*cosSin[0] + leftRightWalk*cosSin[1]);
    var zMove = moveMultiplier*(-forwardBackWalk*cosSin[1] + leftRightWalk*cosSin[0]);

    var turnInput = keyThing.leftKey() - keyThing.rightKey();
    var elevationInput = keyThing.upKey() - keyThing.downKey();

    var timeChange = 10;
    var accMultiply = Math.exp(-0.002*timeChange);
    
    //smooth out x,zmove. makes tilt due to input less instant.
    xMoveSmooth = xMoveSmooth*0.9 + 0.1*xMove;
    zMoveSmooth = zMoveSmooth*0.9 + 0.1*zMove;

    var preDragPlayerAccTarget = [zMoveSmooth,0,xMoveSmooth].map(xx=>xx*-0.00001);
    
    preDragPlayerAcc[0] = preDragPlayerAcc[0]*accMultiply + (1-accMultiply)*preDragPlayerAccTarget[0];
    preDragPlayerAcc[2] = preDragPlayerAcc[2]*accMultiply + (1-accMultiply)*preDragPlayerAccTarget[2];

    playerAcc = preDragPlayerAcc.map(x=>x); //copy

    //add drag proportional to speed.
    playerAcc[0]-=playerVel[0]*0.001;
    playerAcc[2]-=playerVel[2]*0.001;

    playerVel[2]+=timeChange*playerAcc[2];
    playerVel[0]+=timeChange*playerAcc[0];
    gunTurn += timeChange*turnInput*0.005;
    playerElevation -= timeChange*elevationInput*0.005;
    
    playerPos[2]+=playerVel[2]*timeChange;
    playerPos[0]+=playerVel[0]*timeChange;

    var amountToMove = new Array(2);
    var fractionToKeep = 0.9;
    for (var cc=0;cc<2;cc++){
        amountToMove[cc]=mouseInfo.pendingMovement[cc]*(1-fractionToKeep);
        mouseInfo.pendingMovement[cc]*=fractionToKeep;  //TODO if keep this, framerate independence.
    }

    gunTurn+=mouseInfo.pendingMovement[0];
    playerElevation-=mouseInfo.pendingMovement[1];
    //NOTE simple decoupled pitch, turn. perhaps better to have "free flight" rotation with auto-levelling - 
    // ie turn when elevated results in tilted view - perhaps similar to head movement preceding body movement - 
    // when body catches up and face in same compass direction as looking direction, view levels out.


    //for "free flight" system
    // how should body rotate? bend at waist? twist upper torso? 
    // should head also tilt over? 
    // simpleish system : elevate gun/arms and then rotate about tilted back "up" axis. 
    // gradually adjust player rotation, while retaining world pointing direction of gun, to reduce the gun's amount of turn.

    var gunTurnLimitRadians = 1;        //cap gun turn so arms don't go off screen, also indirectly limits rotation speed. TODO don't limit so harshly? 
    gunTurn = Math.max(-gunTurnLimitRadians, gunTurn);
    gunTurn = Math.min(gunTurnLimitRadians, gunTurn);

    var gunTurnFractionToTurn = 0.04;   //TODO dependence on update interval.

    var adjustment = 1.0/(0.1 + Math.cos(playerElevation)); //can go infinite when pointed up so add fudge factor in denominator

    var playerRotationAdjustment = gunTurn*adjustment*gunTurnFractionToTurn;    //TODO adjust elevation to keep gun pointed in same direction
    playerRotation-=playerRotationAdjustment;  
    gunTurn*=1 - gunTurnFractionToTurn;

    var elevationAdjustment = playerElevation*playerRotationAdjustment*gunTurn; //??
    playerElevation-=elevationAdjustment;

    //cap elevation
    playerElevation=Math.min(playerElevation, 0.7*Math.PI/2);   //pointing down!
    playerElevation=Math.max(playerElevation, -0.8*Math.PI/2);
        //0.7 because arms move more than view.

    var fireButtonDepressedNow = mouseInfo.buttons&1;

    var autofire = document.getElementById("autofire").checked;
    var timeSinceLastShot = lastFixedTimestepUpdateTime - lastShotTime;
    var roundsPerMin = 1200;
    var haveReloaded = timeSinceLastShot> 60_000/roundsPerMin;

    if (fireButtonDepressedNow && haveReloaded && (haveUnclickedFire || autofire)){
        //jerk gun. TODO temporary jerk (decay towards where was aiming before)
        gunTurn+= 0.1*gaussRand();
        gunElevTemp+= 0.1*gaussRand();
        lastShotTime = lastFixedTimestepUpdateTime;
        haveUnclickedFire = false;
    }

    if (!fireButtonDepressedNow){
        haveUnclickedFire=true;
    }

    playerElevation-=gunElevTemp*gunTurnFractionToTurn;
    gunElevTemp*=1 - gunTurnFractionToTurn;


    //faster switch for camera zooming
    var cameraAccMultiply = Math.exp(-0.02*timeChange);
    var cameraZoomAdjustInput = (mouseInfo.buttons&2)? 0.5: 1.0;     //adjust camera zoom by right click. TODO reduce fisheye as zoom in - make distance from screen or fov of screen in view be configurable.
    cameraZoomAdjustInputSmoothed = cameraZoomAdjustInputSmoothed*cameraAccMultiply + (1-cameraAccMultiply)*cameraZoomAdjustInput;



    //car motion. TODO turn off player motion when controlling car?
    var previousSpeed = carInfo.speed;




     //apply drag. TODO measure acc not including this because want to calculate acceleration due to tyre forces

    //when have a 2vec velocity, will want to do pythag, but for now speed is just scalar.
    //force magnitude is proportional to speed squared and in opposite direction to velocity, so calculate by -velocity*|velocity|
    //var speedSquared = carInfo.speed * carInfo.speed;
    //var speedScalar = Math.sqrt(speedSquared);

    var speedTimesDrag = Math.abs(carInfo.speed)*carParams.drag_const;  //dividing by 1000 because speed is movement per ms
    carInfo.speed -= carInfo.speed*speedTimesDrag*timeChange;


    //linear drag
    if (carMode !=1 ){
        carInfo.speed*=0.99;    //apply handbrake if not in car. NOTE really this should be grip limited. TODO make handbrake more constant (presumably is like a dynamic friction when moving)
    }else{
        carInfo.speed*=0.9999;   //something like rolling resistance. NOTE current aero drag tuned to produce documented top speed with zero rolling resitance. TODO tune to regain top speed, select
                                    //reasonable rolling resistance val.
    }


    carInfo.steeringAngle *= 0.98;


    var carForwardInput = 0;
    var steeringAngleTarget=0;
    if (carMode == 1){
        //a = v^2/r => r = a v^2
        // steering angle ~ car wheelbase / radius
        // so steering andle at which grip fails goes as 1/v^2.
        // in order to limit at low speed, just do 1/(vbodge^2 + v^2)
        var steeringStrength = 1/(1+ 10000*carInfo.speed*carInfo.speed);
        steeringStrength = Math.min(0.9, steeringStrength); //max out steering angle at low speed.
        steeringAngleTarget = -0.003*leftRight*steeringStrength;

        carForwardInput = forwardBack;
    }
        
    carInfo.steeringAngle += steeringAngleTarget;

    //carInfo.speed += timeChange*0.00001*(-carForwardInput);

    var smallHackNum = 0.00000000001;    //TODO replace this with number that gets 1g limit? 
    var speedMetresPerSec = 1000*carInfo.speed;
    var forwardsAccelerationMetresPerSecPerSec = -carForwardInput* carParams.engine_acc_const / Math.sqrt(smallHackNum+speedMetresPerSec*speedMetresPerSec);  // NOTE assumes +ve speed
    var forwardsAcceleration = forwardsAccelerationMetresPerSecPerSec/1000_000;
        //TODO apply engine power limit only to acceleration in direction of travel (braking is not limited in same way)

    //limit to within 1 g
    var oneGeeCap = 9.81/1_000_000;
    forwardsAcceleration = Math.min(Math.max(forwardsAcceleration,-oneGeeCap),oneGeeCap);

    carInfo.speed += timeChange*forwardsAcceleration;


    mat4.set(carMatrix, carMatrixOld);

    mat4.translate(carMatrix, [0,0,carInfo.speed*timeChange]);
    mat4.rotateY(carMatrix, carInfo.steeringAngle * timeChange*carInfo.speed);

    carInfo.acc = (carInfo.speed - previousSpeed)/timeChange;

    var newPos = carMatrix.slice(12,15);
    var newVel = carInfo.pos.map((xx,ii) => newPos[ii] - xx).map(xx=>xx/timeChange);
    carInfo.accVec = carInfo.vel.map((xx,ii) => newVel[ii] - xx).map(xx=>xx/timeChange);
    carInfo.vel = newVel;
    carInfo.pos = newPos;


    //do car camera stuff every physics frame. will interpret when render.
    mat4.set(carCamera, carCameraOld);
    mat4.set(carMatrix, carCamera);
    //mat4.translate(carCamera, [0,1,-2]);  //seems ~ cockpit view
    mat4.translate(carCamera, [0,0,-1.7]);   //centre of car appears to be ahead of car origin
    //mat4.rotateY(carCamera, 0*Math.PI/2); //quarter turns
    var steeringAngleCameraImpact = 2;  //+ve means camera lags. -ve means camera leads.
    mat4.rotateY(carCamera, steeringAngleCameraImpact*carInfo.steeringAngle); //NOTE steering angle unknown units here.
    
    //mat4.rotateY(carCamera, lastFixedTimestepUpdateTime*0.001);
    mat4.translate(carCamera, [0,2.4,4.2]);   //above and behind car

    //second car
    mat4.set(carCamera2, carCamera2Old);
    mat4.set(carMatrix2, carCamera2);
    
    //mat4.rotateY(carCamera2, Math.PI/4);   //quarter angle to help looking at ground motion vs wheels

    //rotate to face in direction of velocity, but with some preference for straight forwards, so no/0 when stopped.
    var camExtraYaw = Math.atan2(-carInfo2.velInCarFrame[0], -carInfo2.velInCarFrame[1] + 10 );
    mat4.rotateY(carCamera2, camExtraYaw);

    mat4.translate(carCamera2, [0,2.5,4.5]);   //above and behind car
    //mat4.translate(carCamera2, [0,3.5,7]);   //above and behind car



    //top-down view
    // mat4.translate(carCamera2, [0,10,1]);   //above and behind car
    // mat4.rotateX(carCamera2, -Math.PI/2);

    processCar2Mechanics(timeChange, leftRight, forwardBack, carMode == 2);
}

var car2steeringVel = 0;
var car2steeringSmoothedSteeringInput = 0;

function processCar2Mechanics(timeChange, leftRight, forwardBack, enableControl){

    if (!enableControl){
        leftRight = 0;
        forwardBack = 0;
    }

    var brake = keyThing.bKey();

    var accelerator = keyThing.nKey();   //TODO use w/s for this!

    //do something to make steering angle time derivative continuous, and total angle steered not proprtional to press duration.
    // maybe is equivalent to having some steering wheel position acceleration - TODO graph steering wheel position.

    car2steeringVel = leftRight*0.1 + car2steeringVel*0.9;
    car2steeringSmoothedSteeringInput = car2steeringSmoothedSteeringInput*0.9+car2steeringVel*0.1;

    leftRight=car2steeringSmoothedSteeringInput;

    var timeChangeSeconds = timeChange*0.001;
    
    //second car with different physics/controls
    mat4.set(carMatrix2, carMatrix2Old);

    /*

    //2nd car with different physics model
    var carInfo2 = {
        pos3: [0,0],
        yawRate: 0,
        steeringAngle: 0,
        throttle: 0,
        velInCarFrame: [0,0],
        rearWheelAngVel: 0,
        frontWheelLongPos: 2,
        rearWheelLongPos: -2,
        frontWheelContactPatchOffsetInCarFrame: [0,0],
        rearWheelContactPatchOffsetInCarFrame: [0,0],
    */

    carInfo2.pos3 = carMatrix2.slice(12,15);

    var totalSpeedSq = carInfo2.velInCarFrame.reduce((prev, current) => prev + current*current , 0);
    
    //steering angle dependent on speed similar to car 1. TODO units? assume rads for now...
    carInfo2.steeringAngle *= 0.95;
    var steeringAngleTarget=0;
    //a = v^2/r => r = a v^2
    // steering angle ~ car wheelbase / radius
    // so steering andle at which grip fails goes as 1/v^2.
    // in order to limit at low speed, just do 1/(vbodge^2 + v^2)
    var steeringStrength = 1/(1+ 0.002*totalSpeedSq);
    steeringStrength = Math.min(0.7, steeringStrength); //max out steering angle at low speed.
    steeringAngleTarget = 0.02*leftRight*steeringStrength;

    carInfo2.steeringAngle += steeringAngleTarget;

    //override with simple steering angle
    //carInfo2.steeringAngle = leftRight;
    
    //console.log(carInfo2.steeringAngle);

    //simple thrust like a rocket -  TODO slip ratio, real wheel speed
    var velInCarFrame = carInfo2.velInCarFrame;
    velInCarFrame[1] -= forwardBack * 0.1;

    // for (var ii=0;ii<2;ii++){
    //     velInCarFrame[ii]*=0.999;  //simple drag
    // }

    //move by speed
    mat4.translate(carMatrix2, [velInCarFrame[0],0,velInCarFrame[1]].map(x=>x*timeChangeSeconds));

    //calculate velocity of ground under wheel position in car frame (not contact patch)
    var const1 = -1;
    var const2 = 6;
    var const3 = -4;
    var const4 = -5;

    var rearWheelsVel = carInfo2.velInCarFrame.map(x=>x);
    rearWheelsVel[0]+=const1*carInfo2.rearWheelLongPos*carInfo2.yawRate;

    var frontWheelsVel = carInfo2.velInCarFrame.map(x=>x);
    frontWheelsVel[0]+=const1*carInfo2.frontWheelLongPos*carInfo2.yawRate;

    //store in order to display on overlay
    carInfo2.frontAxleVelInCarFrame = frontWheelsVel;
    carInfo2.rearAxleVelInCarFrame = rearWheelsVel;

    //calculate velocity of ground here relative to spinning tyre, ignoring contact patch movement.
    // for now, have zero slip ratio - freely driven light wheels. TODO modify for driven/braked wheels.

    var brakeAmount = 0.1*brake;   //rotate wheels slower than free wheeling speed. impact should mean constant braking force, but fading out near zero speed due
        //to smallValDeterminingLowSpeedResponse stuff. NOTE this number is quite large!

    brakeAmount+=0.002;  //like constant rolling resistance (though nicely goes to 0 for very slow speed)

    var rearWheelBrakeAccAmount = brakeAmount - 0.2*accelerator;    //NOTE accelerator wont work at zero speed like this due to smallValDeterminingLowSpeedResponse

    var rearWheelsRimVelVsGroundInCarFrame = rearWheelsVel.map(x=>x);
    rearWheelsRimVelVsGroundInCarFrame[1] *= rearWheelBrakeAccAmount;

    var frontWheelsRimVelVsGroundInCarFrame = frontWheelsVel.map(x=>x);
    var frontWheelDirectionInCarFrame = [Math.sin(carInfo2.steeringAngle), Math.cos(carInfo2.steeringAngle)];
    var dotDirectionWithVel = dotProd2(frontWheelDirectionInCarFrame, frontWheelsRimVelVsGroundInCarFrame);


    for (var ii=0;ii<2;ii++){
        frontWheelsRimVelVsGroundInCarFrame[ii] -= dotDirectionWithVel*(1-brakeAmount)*frontWheelDirectionInCarFrame[ii];
    }

    //calculate slip angle

    // rear wheel rolling speed : rearWheelsVel[1]
    // front wheel rolling speed : dotDirectionWithVel
    // maybe want to abs or square this to handle +ve, -ve.
    // NOTE for slip angle/ratio, could use absolute speed. better or worse? 

    //get a slip angle that doesn't need abs and doesn't have /0 problem by doing 1/sqrt(longvel^2 + smallval);

    // simple solution for linear drag at low speed. 
    // NOTE for slow speeds would slide down slope when parked etc (though no slopes here! 
    // this would be more complicated, would want damping for wobbles etc.
    var smallValDeterminingLowSpeedResponse = 0.2;
    var inverseSpeedFactorFrontWheel = 1/Math.sqrt(dotDirectionWithVel*dotDirectionWithVel + smallValDeterminingLowSpeedResponse);
    var inverseSpeedFactorRearWheel = 1/Math.sqrt(rearWheelsVel[1]*rearWheelsVel[1] + smallValDeterminingLowSpeedResponse);
    
    var frontWheelSlipVector = frontWheelsRimVelVsGroundInCarFrame.map(x=>x*inverseSpeedFactorFrontWheel);
    var rearWheelSlipVector = rearWheelsRimVelVsGroundInCarFrame.map(x=>x*inverseSpeedFactorRearWheel);

    //cap these vectors within some limit (TODO slip ratio/angle force fall off outside optimal circle)
    var slipVecCapMag = 0.15;   //guess number...

    var slipSqFront = dotProd2(frontWheelSlipVector, frontWheelSlipVector);
    var slipSqRear = dotProd2(rearWheelSlipVector, rearWheelSlipVector);

    var slipMagFront = Math.sqrt(slipSqFront);
    var slipVecFrontMultiplierToCap = Math.min(Math.abs(slipVecCapMag/slipMagFront), 1);
    frontWheelsCappedSlip = frontWheelSlipVector.map(x=>x*slipVecFrontMultiplierToCap);

    var slipMagRear= Math.sqrt(slipSqRear);
    var slipVecRearMultiplierToCap = Math.min(Math.abs(slipVecCapMag/slipMagRear), 1);
    rearWheelsCappedSlip = rearWheelSlipVector.map(x=>x*slipVecRearMultiplierToCap);

    //save for use in display
    carInfo2.slipVecFrontMultiplierToCap = slipVecFrontMultiplierToCap;
    carInfo2.slipVecRearMultiplierToCap = slipVecRearMultiplierToCap;
    carInfo2.slipVecFront = frontWheelSlipVector;
    carInfo2.slipVecRear = rearWheelSlipVector;

    //apply force to car proportional to this wheel rim vel vs ground, check steering behaviour approximately right TODO use slip angle
    //also apply torque

    var frontWheelForceInCarFrame = frontWheelsCappedSlip.map(x=>x*const4);
    var rearWheelForceInCarFrame = rearWheelsCappedSlip.map(x=>x*const4);

    //apply forces
    var acceleration = [0,1].map(ii => frontWheelForceInCarFrame[ii] + rearWheelForceInCarFrame[ii]).map(xx=> const2*xx);

    velInCarFrame[0]+=timeChangeSeconds* acceleration[0];
    velInCarFrame[1]+=timeChangeSeconds* acceleration[1];
    
    carInfo2.acceleration = acceleration;

    //apply torques
    carInfo2.yawRate += timeChangeSeconds* const3 * (frontWheelForceInCarFrame[0]*carInfo2.frontWheelLongPos + rearWheelForceInCarFrame[0]*carInfo2.rearWheelLongPos);

    var angleToRotateBy = carInfo2.yawRate * timeChangeSeconds;
    var cosSin = [Math.cos(angleToRotateBy), Math.sin(angleToRotateBy)];
    mat4.rotateY(carMatrix2, angleToRotateBy);  //degrees or rads?

    //also should rotate speed of car in its fram
    carInfo2.velInCarFrame = [ velInCarFrame[0]*cosSin[0] - velInCarFrame[1]*cosSin[1], velInCarFrame[1]*cosSin[0] + velInCarFrame[0]*cosSin[1] ];
}


function drawScene(frameTime){
	requestAnimationFrame(drawScene);
    
    if (lastFrameTime){
        var timeChange = frameTime-lastFrameTime;

        //prevent large time passing when switch back to tab
        timeChange = Math.min(timeChange, 100);

        var timeChangeForTimestep=10;   // 100FPS mechanics. TODO interpolate displayed motion
        //fixed timestep mechanics. TODO interpolation
        while (lastFixedTimestepUpdateTime<frameTime){
            lastFixedTimestepUpdateTime+=timeChangeForTimestep;
            iterateMechanics(timeChangeForTimestep);
            updateSpeedInfo(playerVel, playerAcc, carInfo.speed, carInfo.accVec );
        }        
    }
    lastFrameTime=frameTime;


    var interpolationFactor = (lastFixedTimestepUpdateTime-frameTime)/timeChangeForTimestep;    // from 0 to 1. shift back by 1 physics so 
                                                                                    //0 means time to display physics time minus 1 timestep - should display objects with "old" poses before latest physics iteration
                                                                                    // 1 means time to display is latest update - should display objects with "new" pose from latest physics iteration.
                                                                                    // intermediate value mean interpolate between old and new poses (linear blending might be fine unless angular step large.)

    //console.log("drawing scene");
    
    //clear colour

    gl.clearColor(0,1,1,1); //cyan
   	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    
    var boxRotation = frameTime / 1000;
    
    

    gl.disable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);


    var playerPosInterp = playerPos;
    var playerRotationInterp = playerRotation;
    var playerElevationInterp = playerElevation;

    if (document.getElementById("interpolate-camera").checked){
        playerPosInterp = playerPos.map((xx,ii) => xx* (1-interpolationFactor) + playerPosOld[ii] * interpolationFactor);
        playerRotationInterp = playerRotation * (1-interpolationFactor) + playerRotationOld * interpolationFactor;
        playerElevationInterp = playerElevation * (1-interpolationFactor) + playerElevationOld * interpolationFactor;
    }
    
    //draw a block for player's core.
    
    //for ease of use, and to allowing straightforward drawing of player objects for different cameras, 
    // calculate matrices of cameras (view) and objects (model) in same way,
    // and when rendering, invert camera matrix.
   
    var torsoMatrix = mat4.identity();
    mat4.translate(torsoMatrix, playerPosInterp);
    //tilt by player acceleration
    var accMag = Math.hypot.apply(null, playerAcc);
    var accTurnAngle = Math.atan2(playerAcc[2],playerAcc[0]);
    var accTilt = Math.atan(accMag*1_000_000/9.88);
    mat4.rotateY(torsoMatrix, -accTurnAngle);
    mat4.rotateZ(torsoMatrix, -accTilt * 0.75);    //0.75 is fudge to make more reasonable (tilt by 22.5 deg at 1g acc instead of 45)
    mat4.rotateY(torsoMatrix, accTurnAngle);
        //TODO smooth jerk (derivative of acceleration)

    mat4.rotateY(torsoMatrix, -playerRotationInterp);

    //defer drawing until calculate camera


    var upperTorsoMat = mat4.create(torsoMatrix);    
    mat4.rotateX(upperTorsoMat, -playerElevationInterp*torsoElevationMultiplier);
    var eyeMat = mat4.create(upperTorsoMat);
    mat4.translate(upperTorsoMat, [0,0.3,0]);
    mat4.translate(eyeMat, playerNeckPos);
    mat4.rotateX(eyeMat, -playerElevationInterp*(1-torsoElevationMultiplier));

    //offset forwards acceleration tilt?    //TODO adjust this properly - suspect equation not quite right.
    var forwardsAcc = Math.cos(playerRotationInterp)*playerAcc[2] - Math.sin(playerRotationInterp)*playerAcc[0];
    var forwardsTilt = Math.atan(forwardsAcc*1_000_000/9.88);
    mat4.rotateX(eyeMat, -forwardsTilt*0.75);

    //offset forwards acceleration for arms.
    var armRotationAdjustment = -forwardsTilt*0.75;
        //TODO have torso rotation do some of this adjustment (check looks sensible when have more humanlike model/proportions)

    var neckMat = mat4.create(eyeMat);
    mat4.translate(eyeMat, playerEyePosFromNeck);

    var carMode = getCarMode();

    if (document.getElementById("camfollowsplayer").checked){
        mat4.identity(staticCamera);
        mat4.translate(staticCamera, statCamPos);
        var camTarget = carMode == 2 ? carInfo2.pos3:
                        carMode == 1 ? carInfo.pos:
                        playerPosInterp;

        var difference = [camTarget[0]-statCamPos[0], camTarget[1]-statCamPos[1], camTarget[2]-statCamPos[2]];
        mat4.rotateY(staticCamera, Math.atan2(-difference[0], -difference[2]));   //pan
        var distance = Math.hypot.apply(null, difference);
        mat4.rotateX(staticCamera, Math.asin(difference[1]/distance)); //tilt (elevation)
    }


    var unmirroredCameraMat = mat4.create();
    if (document.getElementById("externalcam").checked){
        mat4.set(staticCamera, unmirroredCameraMat);
    }else if(carMode == 1){
        if (document.getElementById("interpolate-camera").checked){
            var carCameraInterpolated = simpleMatrixInterpolation(carCamera, carCameraOld, interpolationFactor);
            mat4.set(carCameraInterpolated, unmirroredCameraMat);
        }else{
            mat4.set(carCamera, unmirroredCameraMat);
        }
    }else if(carMode == 2){
        if (document.getElementById("interpolate-camera").checked){
            var carCameraInterpolated = simpleMatrixInterpolation(carCamera2, carCamera2Old, interpolationFactor);
            mat4.set(carCameraInterpolated, unmirroredCameraMat);
        }else{
            mat4.set(carCamera2, unmirroredCameraMat);
        }
    }else{
        mat4.set(eyeMat, unmirroredCameraMat);
    }
    mat4.inverse(unmirroredCameraMat);    //note .transpose won't work like does in 3sphere games, because these are standard 3d gfx mats, not SO4s.
    
    
    cameraZoom = parseFloat(document.getElementById("camerazoom").value);
    cameraZoom*=cameraZoomAdjustInputSmoothed;


    //calculation of fisheye zoom given ratio of distance from viewer to screen to distance for correct rectilinear viewing. 
    // assume that strength k is set right for n=2
    // k = (n^2 -1) / (6n^2)
    // calculate n from z
    //override ss
    var nNow = 2.15*cameraZoomAdjustInputSmoothed; //divide or multiply?
    simpleStrengthGlobal =  (nNow*nNow - 1)/ (6*nNow*nNow);

    if (document.getElementById("fisheyeselection_singleview").checked){

        var vertSizeFromVFov = cameraZoom;
        var horizSizeFromVFov = vertSizeFromVFov * (gl.viewportWidth/ gl.viewportHeight);
        calculateProjectionMatrixForIntermediateView(horizSizeFromVFov, vertSizeFromVFov, simpleStrengthGlobal, -0.33333, pMatrix);

        // draw to rttView

        gl.bindFramebuffer(gl.FRAMEBUFFER, rttView.framebuffer);

        //TODO scale to get 1:1 mapping in centre of screen taking screen resolution and fisheye curvature into account.
		var intermediate_view_width = 4096;
        var intermediate_view_height = 2048;

		gl.viewport( 0,0, intermediate_view_width, intermediate_view_height );
		setRttSize( rttView, intermediate_view_width, intermediate_view_height );	//todo stop setting this repeatedly

           	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        drawSingleScene(unmirroredCameraMat, true, eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation, frameTime, armRotationAdjustment, interpolationFactor);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        drawSingleScene(unmirroredCameraMat, false, eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation, frameTime, armRotationAdjustment, interpolationFactor);    

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);


        //temporary - just draw map intermediate view straight to the screen using no curvature.

        //activeProg = shaderPrograms.fullscreenTextured;
        activeProg = shaderPrograms.fullscreenTexturedDither;


        gl.useProgram(activeProg);
        enableDisableAttributes(activeProg);
        bind2dTextureIfRequired(rttView.texture);

        var invertedProjMat = mat4.create(pMatrix);
        //mat4.inverse(invertedProjMat);
        //mat4.transpose(invertedProjMat);    //?? 

        gl.uniformMatrix4fv(activeProg.uniforms.uPMatrix2, false, invertedProjMat);


        gl.disable(gl.CULL_FACE);   //?? bodge to try to get rendering to work!!!

        //repeated from cubemap rendering.
        var zoom = cameraZoom;    //larger number = more zoomed out
        var ratio = gl.viewportWidth/gl.viewportHeight;
        gl.uniform2f(activeProg.uniforms.uScaleXy, ratio*zoom, zoom);   //TODO apply zoom factor, (inverted?) screen dimens
        //gl.uniform2f(activeProg.uniforms.uScaleXy, 0.5,0.5);
        gl.uniform2f(activeProg.uniforms.uOffsetXy, 0, -0.3333);


        //for dithering
        gl.uniform2fv(activeProg.uniforms.uInvSize, [ratio*zoom/gl.viewportWidth, zoom/gl.viewportHeight].map(x=>x*2));
        //gl.uniform2f(activeProg.uniforms.uInvSize, 0.001, 0.001);


        gl.uniform1f(activeProg.uniforms.uSimpleStrength, simpleStrengthGlobal);

        drawObjectFromBuffers(quadBuffers, activeProg);

        gl.enable(gl.CULL_FACE);


        //TODO draw intermediate view to the screen using fisheye shader. t

    } else if (document.getElementById("fisheyeselection_doubleview").checked){

        var vertSizeFromVFov = cameraZoom;
        var horizSizeFromVFov = vertSizeFromVFov * (gl.viewportWidth/ gl.viewportHeight);

        var projMatrices = calculateLeftRightPanelProjMatrices(horizSizeFromVFov, vertSizeFromVFov, simpleStrengthGlobal, -0.33333);
    

        //TODO scale to get 1:1 mapping in centre of screen taking screen resolution and fisheye curvature into account.
		var intermediate_view_width = 4096;
        var intermediate_view_height = 2048;

        //draw left, right views
        drawLeftOrRight(projMatrices.projMatLeft, quadBuffersLR.left);
        drawLeftOrRight(projMatrices.projMatRight, quadBuffersLR.right);


        function drawLeftOrRight(projMatrix, panelBuffers){
            mat4.set(projMatrix, pMatrix);
        
            // draw to rttView
            gl.bindFramebuffer(gl.FRAMEBUFFER, rttView.framebuffer);
            
            gl.viewport( 0,0, intermediate_view_width, intermediate_view_height );
            setRttSize( rttView, intermediate_view_width, intermediate_view_height );	//todo stop setting this repeatedly

                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            drawSingleScene(unmirroredCameraMat, true, eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation, frameTime, armRotationAdjustment, interpolationFactor);
            gl.clear(gl.DEPTH_BUFFER_BIT);
            drawSingleScene(unmirroredCameraMat, false, eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation, frameTime, armRotationAdjustment, interpolationFactor);    

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

            //temporary - just draw map intermediate view straight to the screen using no curvature.

            //activeProg = shaderPrograms.fullscreenTextured;
            activeProg = shaderPrograms.fullscreenTexturedDither;


            gl.useProgram(activeProg);
            enableDisableAttributes(activeProg);
            bind2dTextureIfRequired(rttView.texture);


            var invertedProjMat = mat4.create(pMatrix);
            //mat4.inverse(invertedProjMat);
            //mat4.transpose(invertedProjMat);    //?? 

            gl.uniformMatrix4fv(activeProg.uniforms.uPMatrix2, false, invertedProjMat);


            gl.disable(gl.CULL_FACE);   //?? bodge to try to get rendering to work!!!

            //repeated from cubemap rendering.
            var zoom = cameraZoom;    //larger number = more zoomed out
            var ratio = gl.viewportWidth/gl.viewportHeight;
            gl.uniform2f(activeProg.uniforms.uScaleXy, ratio*zoom, zoom);   //TODO apply zoom factor, (inverted?) screen dimens
            //gl.uniform2f(activeProg.uniforms.uScaleXy, 0.5,0.5);
            gl.uniform2f(activeProg.uniforms.uOffsetXy, 0, -0.3333);


            //for dithering
            gl.uniform2fv(activeProg.uniforms.uInvSize, [ratio*zoom/gl.viewportWidth, zoom/gl.viewportHeight].map(x=>x*2));
            //gl.uniform2f(activeProg.uniforms.uInvSize, 0.001, 0.001);


            gl.uniform1f(activeProg.uniforms.uSimpleStrength, simpleStrengthGlobal);

            drawObjectFromBuffers(panelBuffers, activeProg);

            gl.enable(gl.CULL_FACE);
        }



    }else if (!document.getElementById("fisheyeselection_off").checked){

        //draw cubemap about current camera.
        // but for simplicity, make initial version using cubemap for intermediate views. render 6 cameras for each cubemap side, then map from cubemap onto the screen.
        // NOTE can do this more efficiently, (what is best depends on FOV), by drawing to 1,2,or 4 panels (last is "quad view" used in 3-sphere project), but this is generally
        // more complex.

        updateCubemap(unmirroredCameraMat, eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation, frameTime, armRotationAdjustment, interpolationFactor);

        renderViewUsingCmap();

    } else {


        var vFov = 2* Math.atan(cameraZoom) * 180/Math.PI;

        mat4.perspective(vFov, gl.viewportWidth/ gl.viewportHeight, camParams.near, camParams.far, pMatrix); 
        pMatrix[9]=-0.3333;       //shift centre of perspective one third up from centre to top of screen (so is 1/3 down screen top to bottom)


        drawSingleScene(unmirroredCameraMat, true, eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation, frameTime, armRotationAdjustment, interpolationFactor);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        drawSingleScene(unmirroredCameraMat, false, eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation, frameTime, armRotationAdjustment, interpolationFactor);    
    }

    //update overlay
    overlaydisplay.clear();
    overlaydisplay.drawDisplay(carMode);
}


function drawSingleScene(unmirroredCameraMat, mirrorInGroundPlane, eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation, frameTime, armRotationAdjustment, interpolationFactor){
        //NOTE passing in eyeMat, neckMat, upperTorsoMat, torsoMatrix, boxRotation is awkward. 
        //TODO create scene description and use for render?

    var carMode = getCarMode();

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

    activeProg = shaderPrograms.texmapWithDetail;
    gl.useProgram(activeProg);
    enableDisableAttributes(activeProg);
    bind2dTextureIfRequired(bricktex);
    bind2dTextureIfRequired(concreteTex, gl.TEXTURE1);

    //draw ground blocker object if in not mirror mode, so don't overwrite view through mirror.
    // if (!mirrorInGroundPlane){
    //     gl.colorMask(false, false, false, false);
    //     setupDrawMatrixForObjectAtPosition([groundPos[0],groundPos[1]+10, groundPos[2]]);    //top face of cube
    //     mat4.scale(mMatrix,[100,0,100]);
    //     drawObjectFromBuffers(cubeBuffers, activeProg);
    //     gl.colorMask(true, true, true, true);
    // }

    //draw ground
    // TODO draw ground partially transparent.
    if (!mirrorInGroundPlane){
        setupDrawMatrixForObjectAtPosition(groundPos);
        var mapScaleFactor = 0.5* 100/91; //100m scale on image is 91px, and cube is 2 units wide
        mat4.scale(mMatrix,[mapScaleFactor*1655,9.99,mapScaleFactor*1200]);   //9.99 so the blocker mirror plane is drawn in front! 
        drawObjectFromBuffers(cubeBuffers, activeProg);
    }


    var activeProg = shaderPrograms.simpleCubemap;
    gl.useProgram(activeProg);
    enableDisableAttributes(activeProg);

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


    if (carMode == 0){
        gl.uniform3fv(activeProg.uniforms.uFlatColor, [0.1,0.5,0.1]);

        //setup gun mat (also used later for x-hair
        var gunMat = mat4.create(torsoMatrix);
        mat4.rotateX(gunMat, -playerElevation*torsoElevationMultiplier);
        mat4.translate(gunMat, playerNeckPos);
        mat4.translate(gunMat, [0,0,-0.2]);  //moving forward in this frame maybe could do by shoulder centre pos instead. ( playerNeckPos + [0,0,0.2])
        mat4.rotateX(gunMat, -playerElevation*(armElevationMultiplier-torsoElevationMultiplier) + gunElevTemp);
        mat4.rotateX(gunMat, armRotationAdjustment);

        mat4.rotateY(gunMat, gunTurn);

        mat4.translate(gunMat, [0,0.05,-1]);    //1m - end of arm, up by 5cm

        if (document.getElementById("drawbody").checked){

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
        }
    }

    function drawArm2(activeProg, torsoMatrix, handedness, doubleGuns){
        var armMat = mat4.create(torsoMatrix);
        mat4.rotateX(armMat, -playerElevation*torsoElevationMultiplier + gunElevTemp);
        mat4.translate(armMat, playerNeckPos);
        mat4.translate(armMat, [0.2*handedness,0,-0.2]);  //moving forward in this frame maybe could do by shoulder centre pos instead. ( playerNeckPos + [0,0,0.2])
        
        mat4.rotateX(armMat, -playerElevation*(armElevationMultiplier-torsoElevationMultiplier));
        mat4.rotateX(armMat, armRotationAdjustment);

        mat4.rotateY(armMat, gunTurn);  //note with this arms don't quite match gun because order of rotations


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


    
    //draw car
    activeProg = shaderPrograms.envmap;
    gl.useProgram(activeProg);
    enableDisableAttributes(activeProg);
    gl.uniform3fv(activeProg.uniforms.uFlatColor, [0.001,0.005,0.001]);

    if (document.getElementById("interpolate-camera").checked){
        var interpolatedCarMatrix = simpleMatrixInterpolation(carMatrix, carMatrixOld, interpolationFactor);
        mat4.set(interpolatedCarMatrix, mMatrix);
    }else{
        mat4.set(carMatrix, mMatrix);
    }

    // //draw cube at car's position to check size is right.
    // var carScale = [1.981,1.32,4.547].map(xx=>xx/2);   //width, height, length  of car in blueprint
    // var boxShift = [0,0.3,-1.4];
    // mat4.translate(mMatrix,boxShift);
    // mat4.scale(mMatrix, carScale);
    // drawObjectFromBuffers(cubeBuffers, activeProg);
    // mat4.scale(mMatrix, carScale.map(xx=>1/xx));
    // mat4.translate(mMatrix,boxShift.map(x=>-x));


    mat4.scale(mMatrix,[1,1,1].map(x=>x*0.56));  //guess correct size - default seems far too big
    if (listerBuffers.isLoaded){
        drawObjectFromBuffers(listerBuffers, activeProg);
    }

    //second car
    if (listerBuffers.isLoaded){

        gl.uniform3fv(activeProg.uniforms.uFlatColor, [0.02,0.001,0.001]);
        if (document.getElementById("interpolate-camera").checked){
            var interpolatedCarMatrix = simpleMatrixInterpolation(carMatrix2, carMatrix2Old, interpolationFactor);
            mat4.set(interpolatedCarMatrix, mMatrix);
        }else{
            mat4.set(carMatrix2, mMatrix);
        }

        //move visual car back back a bit since seems 
        var carDrawPosOffset = [0,0,1.6];
        mat4.translate(mMatrix, carDrawPosOffset);

        mat4.scale(mMatrix,[1,1,1].map(x=>x*0.56));  //guess correct size - default seems far too big
        drawObjectFromBuffers(listerBuffers, activeProg);
        
        mat4.scale(mMatrix,[1,1,1].map(x=>x/0.56)); //undo scale
        mat4.translate(mMatrix, carDrawPosOffset.map(x=>-x));   //undo translate


        var wheelMarkerScale = [.1,1,.2];

        //marker for wheels
        mat4.translate(mMatrix, [0,0,-carInfo2.rearWheelLongPos]);
        mat4.scale(mMatrix,wheelMarkerScale);
        drawObjectFromBuffers(cubeBuffers, activeProg);

        //undo scale
        mat4.scale(mMatrix,wheelMarkerScale.map(x=>1/x));
        mat4.translate(mMatrix, [0,0,-(carInfo2.frontWheelLongPos-carInfo2.rearWheelLongPos)]);
        mat4.rotateY(mMatrix, carInfo2.steeringAngle);
        mat4.scale(mMatrix,wheelMarkerScale);

        drawObjectFromBuffers(cubeBuffers, activeProg);

    }

    




    //draw cube
    setupDrawMatrixForObjectAtPosition(boxPos);
    mat4.rotateY(mMatrix, boxRotation);
    drawObjectFromBuffers(cubeBuffers, activeProg);



    // draw statue
    activeProg = shaderPrograms.vertexColorWithEnvmap;
        // activeProg = shaderPrograms.envmap;

    gl.useProgram(activeProg);
    enableDisableAttributes(activeProg);
    gl.uniform3fv(activeProg.uniforms.uFlatColor, [1,1,1].map(x=>0.05*x));
    mat4.set(lucyMatrix, mMatrix);
    mat4.scale(mMatrix,[1,1,1].map(x=>x*0.05));
    if (lucyBuffers.isLoaded){
        drawObjectFromBuffers(lucyBuffers, activeProg);
    }


    //draw x-hair.
    if (carMode == 0){
        activeProg = shaderPrograms.flat;
        gl.useProgram(activeProg);
        enableDisableAttributes(activeProg);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.uniform3fv(activeProg.uniforms.uFlatColor, [2,0.1,0.1]);

        //TODO disable lighting
        if (!mirrorInGroundPlane){ //drawing final scene
            mat4.set(gunMat, mMatrix);
            mat4.translate(mMatrix, [0,0,-100]);
            mat4.scale(mMatrix,[1,1,1]); 
            drawObjectFromBuffers(cubeBuffers, activeProg);
        }
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
    }
}


function setupDrawMatrixForObjectAtPosition(objPos){
    mat4.identity(mMatrix);
    mat4.translate(mMatrix, objPos);
}

function updateSpeedInfo(vel, acc, carMovePerMs, carAccMsPerSec){
    //world scale is metres
    //vel is in metres per millisecond

    var velMag = Math.hypot.apply(null, vel);
    var personSpeeds = movePerMsToVariousSpeedUnits(velMag);

    var carSpeeds = movePerMsToVariousSpeedUnits(Math.abs(carMovePerMs));

    var accMag = Math.hypot.apply(null, acc);
    var accMetresPerSecondSquared = accMag*1_000_000;
    var accGees = accMetresPerSecondSquared/9.81;

    //var carAccMetresPerSecondSquared = carAccMsPerSec*1_000_000;    //LONGITUDINAL ONLY
    var carAccMag = Math.hypot.apply(null, carAccMsPerSec);
    var carAccMetresPerSecondSquared = carAccMag*1_000_000;
    var carAccGees = carAccMetresPerSecondSquared/9.81;

    var carAccGeesVec = carAccMsPerSec.map(xx => xx*1_000_000/9.81);

    overlaydisplay.setGeeMeter(carAccGeesVec);
    overlaydisplay.setSpeedMph(carSpeeds.mph);

    document.getElementById("speedinfo").innerHTML = 
        "speed: " + 
        personSpeeds.metresPerSecond.toFixed(2) + "m/s " + 
        personSpeeds.kph.toFixed(2) + "km/h " +
        personSpeeds.mph.toFixed(2)+"mph ," +
        "acceleration: " +
        accMetresPerSecondSquared.toFixed(2) + "m/s^2 " + 
        accGees.toFixed(2) + "g. " + 
        "car speed: " +
        carSpeeds.mph.toFixed(0) + " mph, " + 
        "car acceleration: " + carAccGees.toFixed(2)  + "g.";
}

function movePerMsToVariousSpeedUnits(movePerMs){
    var metresPerSecond = movePerMs*1000;
    var kph = metresPerSecond*3.6;
    return {
        metresPerSecond,
        kph,
        mph: kph/1.6
    };
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

    //scale relative to world origin?
    var correctiveScaleFactor = 0.065;
    var animWorldPosition = [0,-1,5];
    
    mat4.translate(cameraMat, animWorldPosition);
    mat4.scale(cameraMat, [1,1,1].map(x=>x*correctiveScaleFactor));

    animatedMats.forEach(matWithInfo => {
        //a bone with matrices ends matWithInfo.mat , matWithInfo.from

        mat4.set(matWithInfo.mat, mMatrix);
        mat4.scale(mMatrix,[1,1,1].map(x=>x*0.5));

       	prepBuffersForDrawing(cubeBuffers, activeProg);
        drawObjectFromPreppedBuffers(cubeBuffers, activeProg);

        //draw a dotted line taking rotation of end bone and translation along path from "from" mat to "mat" mat
        var startPosition = matWithInfo.from.slice(12,15);
        var endPosition = matWithInfo.mat.slice(12,15);
        //TODO num points dependent on length 
        var difference = endPosition.map((xx,ii)=> xx-startPosition[ii] );
        var numsteps = 8;
        for (var ii=0;ii<numsteps;ii++){
            mat4.set(matWithInfo.from, mMatrix);

            //mat4.translate(mMatrix, difference.map(xx=>ii*xx/numsteps));  //this doesn't work AFAIK because it's in local object frame.
            mMatrix[12] +=difference[0]*ii/numsteps;
            mMatrix[13] +=difference[1]*ii/numsteps;
            mMatrix[14] +=difference[2]*ii/numsteps;

            mat4.scale(mMatrix,[1,1,1].map(x=>x*0.5));
            drawObjectFromPreppedBuffers(cubeBuffers, activeProg);
        }
    });

    //reset camera scale
    mat4.scale(cameraMat, [1,1,1].map(x=>x/correctiveScaleFactor));
    mat4.translate(cameraMat, animWorldPosition.map(x=>-x));
}

function simpleMatrixInterpolation(newMat, oldMat, interpolationFactor){
    var interpolationFactor2 = 1-interpolationFactor;
    var interpolatedMat = mat4.create();
    for (var ii=0;ii<16;ii++){
        interpolatedMat[ii] = newMat[ii] *interpolationFactor2 + oldMat[ii]*interpolationFactor;
    }
    return interpolatedMat;
}