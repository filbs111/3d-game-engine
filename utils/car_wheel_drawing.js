function drawWheels(wheelScale, activeProg, drawDebugMarkers, steeringAngle, frontWheelRotation, rearWheelRotation){
    drawWheelsGeneral(-4.95, -0.25, 1.6, wheelScale, activeProg, drawDebugMarkers, steeringAngle, frontWheelRotation, frontWheelRotation, rearWheelRotation, rearWheelRotation, wheelBuffers, wheelBuffers);
}

function drawWheelsMechanum(wheelScale, activeProg, drawDebugMarkers, steeringAngle, forwardRotate, sideRotate, turnRotate){
    drawWheelsGeneral(-5.2, -0, 2.1, wheelScale, activeProg, drawDebugMarkers, steeringAngle, 
        forwardRotate+sideRotate+turnRotate,
        forwardRotate-sideRotate-turnRotate,
        forwardRotate-sideRotate+turnRotate,
        forwardRotate+sideRotate-turnRotate,
        wheelBuffersMechanum, wheelBuffersMechanumFlipped);

        //+4 more wheels. TODO 
    drawWheelsGeneral(-3.95, -1.25, 2.1, wheelScale, activeProg, drawDebugMarkers, steeringAngle, 
        forwardRotate+sideRotate+turnRotate,
        forwardRotate-sideRotate-turnRotate,
        forwardRotate-sideRotate+turnRotate,
        forwardRotate+sideRotate-turnRotate,
        wheelBuffersMechanum, wheelBuffersMechanumFlipped);
}

function drawWheelsGeneral(frontness, backness, sideness, wheelScale, activeProg, drawDebugMarkers, steeringAngle, frontLeftWheelRotation, frontRightWheelRotation, rearLeftWheelRotation, rearRightWheelRotation, mesh1, mesh2){

    var savedmMatrix = mat4.create(mMatrix);

    gl.uniform3fv(activeProg.uniforms.uFlatColor, wheelColor);  

    mat4.set(savedmMatrix, mMatrix);
    mat4.translate(mMatrix, [sideness,0,backness]);   // +ve = right, up , back
    mat4.rotateX(mMatrix, rearRightWheelRotation);
    mat4.scale(mMatrix, wheelScale);
    drawObjectFromBuffers(mesh2, activeProg);    //right rear
    drawTestMarker();

    mat4.set(savedmMatrix, mMatrix);
    mat4.translate(mMatrix, [-sideness,0,backness]);
    mat4.rotateX(mMatrix, rearLeftWheelRotation);
    mat4.scale(mMatrix, wheelScale);
    drawObjectFromBuffers(mesh1, activeProg);    //left rear
    drawTestMarker();

    mat4.set(savedmMatrix, mMatrix);
    mat4.translate(mMatrix, [-sideness,0,frontness]);
    mat4.rotateY(mMatrix, steeringAngle);
    mat4.rotateX(mMatrix, frontLeftWheelRotation);
    mat4.scale(mMatrix, wheelScale);
    drawObjectFromBuffers(mesh2, activeProg);    //left front
    drawTestMarker();

    mat4.set(savedmMatrix, mMatrix);
    mat4.translate(mMatrix, [sideness,0,frontness]);
    mat4.rotateY(mMatrix, steeringAngle);
    mat4.rotateX(mMatrix, frontRightWheelRotation);
    mat4.scale(mMatrix, wheelScale);
    drawObjectFromBuffers(mesh1, activeProg);    //right front
    drawTestMarker();

    mat4.set(savedmMatrix, mMatrix);

    function drawTestMarker(){
        if (!drawDebugMarkers){return;}

        gl.uniform3fv(activeProg.uniforms.uFlatColor, [1,1,1]);  
        mat4.translate(mMatrix, [0,0.5,0]);
        mat4.scale(mMatrix, [0.5,0.5,0.1]);
        drawObjectFromBuffers(cubeBuffers, activeProg);

        gl.uniform3fv(activeProg.uniforms.uFlatColor, wheelColor);  
    }
}

function drawWheels2(wheelScale, activeProg, wheelMesh, wheelPositions, steeringAngle, wheelRotations){
    var savedmMatrix = mat4.create(mMatrix);
    gl.uniform3fv(activeProg.uniforms.uFlatColor, wheelColor);  

    var steeringAngles = [steeringAngle,steeringAngle,0,0];

    for (var ww=0;ww<wheelPositions.length;ww++){
        mat4.set(savedmMatrix, mMatrix);
        mat4.translate(mMatrix, wheelPositions[ww]);   // +ve = right, up , back

        mat4.rotateY(mMatrix, steeringAngles[ww]);
        mat4.rotateX(mMatrix, wheelRotations[ww]);

        mat4.scale(mMatrix, wheelScale);
        drawObjectFromBuffers(wheelMesh, activeProg);
        drawTestMarker();
    }

    function drawTestMarker(){
        //if (!drawDebugMarkers){return;}

        gl.uniform3fv(activeProg.uniforms.uFlatColor, [1,1,1]);  
        mat4.translate(mMatrix, [0,0.5,0]);
        mat4.scale(mMatrix, [0.5,0.5,0.1]);
        drawObjectFromBuffers(cubeBuffers, activeProg);

        gl.uniform3fv(activeProg.uniforms.uFlatColor, wheelColor);  
    }
}
