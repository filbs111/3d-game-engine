function drawCar1(activeProg, interpolationFactor, wheelScale){
    gl.useProgram(activeProg);
    enableDisableAttributes(activeProg);
    gl.uniform3fv(activeProg.uniforms.uFlatColor, [0.0005,0.003,0.0005]);

    if (guiParams.camera.interpolate){
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


    mat4.scale(mMatrix,[1,1,1].map(x=>x*0.54));  //guess correct size - default seems far too big

    drawObjectFromBuffers(listerBuffers, activeProg);

    activeProg = shaderPrograms.flat;
    gl.useProgram(activeProg);
    enableDisableAttributes(activeProg);
    gl.uniform3fv(activeProg.uniforms.uFlatColor, wheelColor);

    if (wheelBuffers.isLoaded){
        drawWheels(wheelScale, activeProg, guiParams.car.drawWheelMarkers, -carInfo.steeringAngle, 0, 0);
    }

    mat4.scale(mMatrix,[1,1,1].map(x=>x/0.54)); //undo scale
    //draw a black rect as temp shadow
    mat4.translate(mMatrix, [0,-0.3,-1.6+0.12]);
    mat4.scale(mMatrix,[1.05,0.005,2.12]);
    drawObjectFromBuffers(cubeBuffers, activeProg);
}

function drawCar2(activeProg, interpolationFactor, wheelScale){
    gl.useProgram(activeProg);
    enableDisableAttributes(activeProg);
    gl.uniform3fv(activeProg.uniforms.uFlatColor, [0.5,0.005,0.005]);

    //gl.uniform3fv(activeProg.uniforms.uFlatColor, [0.02,0.02,0.04]);

    if (guiParams.camera.interpolate){
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
    
    
    activeProg = shaderPrograms.flat;
    gl.useProgram(activeProg);
    enableDisableAttributes(activeProg);

    if (wheelBuffers.isLoaded){
        drawWheels(wheelScale, activeProg, guiParams.car.drawWheelMarkers, carInfo2.steeringAngle, carInfo2.frontWheelRotation, carInfo2.rearWheelRotation);
    }

    gl.uniform3fv(activeProg.uniforms.uFlatColor, wheelColor); 

    mat4.scale(mMatrix,[1,1,1].map(x=>x/0.56)); //undo scale
    mat4.translate(mMatrix, carDrawPosOffset.map(x=>-x));   //undo translate

    //draw a black rect as temp shadow
    mat4.translate(mMatrix, [0,-0.3,0.12]);
    mat4.scale(mMatrix,[1.05,0.005,2.12]);
    drawObjectFromBuffers(cubeBuffers, activeProg);
}

function drawCar3(activeProg, interpolationFactor, wheelScale){

    gl.useProgram(activeProg);
    enableDisableAttributes(activeProg);
    gl.uniform3fv(activeProg.uniforms.uFlatColor, [0.001,0.001,0.001]);

    //gl.uniform3fv(activeProg.uniforms.uFlatColor, [0.02,0.02,0.04]);

    if (guiParams.camera.interpolate){
        var interpolatedCarMatrix = simpleMatrixInterpolation(carMatrix3, carMatrix3Old, interpolationFactor);
        mat4.set(interpolatedCarMatrix, mMatrix);
    }else{
        mat4.set(carMatrix3, mMatrix);
    }

    //move visual car back back a bit since seems 
    var carDrawPosOffset = [0,0,1.6];
    mat4.translate(mMatrix, carDrawPosOffset);

    mat4.scale(mMatrix,[1,1,1].map(x=>x*0.56));  //guess correct size - default seems far too big
    drawObjectFromBuffers(listerBuffers, activeProg);
    
    
    activeProg = shaderPrograms.flat;
    gl.useProgram(activeProg);
    enableDisableAttributes(activeProg);

    if (wheelBuffersMechanum.isLoaded && wheelBuffersMechanumFlipped.isLoaded){
        drawWheelsMechanum(wheelScale, activeProg, guiParams.car.drawWheelMarkers, 0, 
            carInfo3.wheelForwardRotate, 
            carInfo3.wheelSideRotate, 
            carInfo3.wheelTurnRotate*2); //TODO correct scaling. 
    }

    gl.uniform3fv(activeProg.uniforms.uFlatColor, wheelColor);  

    mat4.scale(mMatrix,[1,1,1].map(x=>x/0.56)); //undo scale
    mat4.translate(mMatrix, carDrawPosOffset.map(x=>-x));   //undo translate

    //draw a black rect as temp shadow
    mat4.translate(mMatrix, [0,-0.3,0.12]);
    mat4.scale(mMatrix,[1.05,0.005,2.12]);
    drawObjectFromBuffers(cubeBuffers, activeProg);
}

function drawCar4(activeProg, interpolationFactor, wheelScale){
    gl.useProgram(activeProg);
    enableDisableAttributes(activeProg);
    // gl.uniform3fv(activeProg.uniforms.uFlatColor, [0.5,0.5,0.5]); //white
    // gl.uniform3fv(activeProg.uniforms.uFlatColor, [0.5,0.005,0.005]); //red
    //gl.uniform3fv(activeProg.uniforms.uFlatColor, [0.005,0.01,0.005]); //green
    gl.uniform3fv(activeProg.uniforms.uFlatColor, [0.002,0.002,0.002]); //black

    if (guiParams.camera.interpolate){
        var interpolatedCarMatrix = simpleMatrixInterpolation(carInfo4.matrix, carInfo4.matrixOld, interpolationFactor);
        mat4.set(interpolatedCarMatrix, mMatrix);
    }else{
        mat4.set(carInfo4.matrix, mMatrix);
    }

    var savedMat = mat4.create(mMatrix);

    //move forward a bit in frame of car because centre of car mesh is towards back
    // + move downward because centre of mass of model is above origin.
    mat4.translate(mMatrix, [0,-0.2,1.5]);

    mat4.scale(mMatrix,[1,1,1].map(x=>x*0.56));  //guess correct size - default seems far too big
    drawObjectFromBuffers(listerBuffers, activeProg);

    activeProg = shaderPrograms.flat;
    gl.useProgram(activeProg);
    enableDisableAttributes(activeProg);

    if (wheelBuffers.isLoaded){
        mat4.set(savedMat, mMatrix);
        var wheelPositions=[];
        for (var ww=0;ww<4;ww++){
            var thisWheelOffset = carInfo4.wheelOffsets[ww];
            var thisWheelExtension = carInfo4.wheelExtensions[ww];
            var thisWheelPosition = vectorSum(thisWheelOffset, [0,-thisWheelExtension + 0.15, 0]); //weirdly, wheel offset front, side are switched!
            wheelPositions.push(thisWheelPosition);
        }

        drawWheels2(wheelScale.map(xx=>xx*0.6), activeProg, wheelBuffers, wheelPositions, carInfo4.steeringAngle, carInfo4.wheelRotations);  //what should wheel scale be?? other cars include *0.5 scale factor?
        //drawWheels(wheelScale, activeProg, guiParams.car.drawWheelMarkers, 0, 0, 0);
    }
}
