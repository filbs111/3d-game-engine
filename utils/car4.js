var wheelCentreHeight = -0.05;

var car4LastVel = [0,0,0];  //for acceleration measurement
var car4MeasuredAcc = [0,0,0];

var carInfo4 = {    //for testing 6dof movement, wheels/suspension that sense ground.
                    // then add slip stuff, engine, body collision etc...
    pos:[-25,0,2],
    posOld:[-25,0,2], //used for display interpolation (currently for camera. TODO use for car too)
    vel:[0,0,0],
    quat:[0,0,0,1], //orientation
    //quat:[1,0,0,0], //orientation
    angVel:[0,0,0], //in frame of vehicle or world??
    //TODO mass, angular momentum instead of angular vel, moment of inertia, wheel positions etc.

    matrix: mat4.identity(),   //used for display (converted from pos, quat)
    matrixOld: mat4.identity(), //used for interpolation for display
    wheelOffsets : [    //side up back
        [0.9, wheelCentreHeight, -1.3],   //front right
        [-0.9, wheelCentreHeight, -1.3],  //front left
        [0.9, wheelCentreHeight, 1.35],    //back right
        [-0.9, wheelCentreHeight, 1.35]   //back left
    ],
    wheelReactionForces: [0,0,0,0], //stored for debug display

    wheelExtensions : [1,1,1,1].map(xx=>xx*0.6),

    sphereCastLength : 0.42,
    springConstant: -40,
    damperConstant: 5000,

    steeringAngle:0,
    steeringDirections:[[0,1],[0,1],[0,1],[0,1]],
    wheelRotations:[0,0,0,0],
    hittingDisplacementLimit:[false,false,false,false],
    brakePedal:0,
    acceleratorPedal:0
}
carInfo4.wheelExtensions = [1,1,1,1].map(xx=>xx*carInfo4.sphereCastLength);
carInfo4.wheelContactPointInCarFrameVelocities = [1,1,1,1].map(xx=>[0,0,0]);    //for debug display.
carInfo4.wheelRollSpeeds = [0,0,0,0]; 
carInfo4.patchFreewheelingVelocities = [1,1,1,1].map(xx=>[0,0,0]); 
carInfo4.patchDisplacements = [1,1,1,1].map(xx=>[0,0,0]);


var testPoints = [];

var carCamera4Quat = [0,0,0,1];
var carCamera4QuatOld = [0,0,0,1];

var car4QuatTest1 = [0,0,0,0];
var car4QuatTest2 = [0,0,0,0];


function processCar4Mechanics(timeChange){
        //NOTE doing multiple samll timestep physics updates to avoid simulation blowing up, but some of this only needs to be done for rendering. TODO move out rendering only parts.

    //carInfo4

    //controls to move and control car. initial version - immediate movement and rotation. (no momentum)
    //use quaternion for orientation
    // conversion from quaternion to draw matrix

    // ability to move car forwards/backwards
    // conversion to car up/side vectors etc to draw test points showing car axes, wheel position
    // use raycast to detect points under wheels
    // linear momentum
    // angular momentum simple isotropic mass distribution version
    // apply torques from wheel/suspension
    // ability to turn gravity on/off
    // angular momentum, using moment of inertia, check behavious seems right with no gravity
    // applying friction force due to movement of wheel contact point.
    // rotating wheels, slip angle
    // steered wheels
    // brakes
    // acceleration through wheels
    // finding normal direction/actual wheel contact point (point on the sphere) - though small sphere cast probably works OK (roughly on ground)

       
    var adjustedQuat = carInfo4.quat;
    carInfo4.matrix = matFromPosAndQuat(carInfo4.pos, adjustedQuat);



    //some test points
    testPoints = [];
    var carPos = carInfo4.matrix.slice(12,15);
    var sideDirection = carInfo4.matrix.slice(0,3);

    var upDirection = carInfo4.matrix.slice(4,7);
    var backDirection = carInfo4.matrix.slice(8,11);

    testPoints.push({pos:vectorSum(sideDirection, carPos), color:[1,0,0]});  //side
    testPoints.push({pos:vectorSum(upDirection, carPos),color:[0,1,0]});  //up
    testPoints.push({pos:vectorSum(backDirection.map(x=>x*2.3), carPos), color:[0,0,1]});  //back

    //add extra test points to see world axes. observe that car local axes and world axes have same handedness
    var pointAboveCar = vectorSum([0,2,0], carPos);
    testPoints.push({pos:pointAboveCar, color:[0.2,0.2,0.2]});  //0
    testPoints.push({pos:vectorSum([1,0,0], pointAboveCar), color:[1,0,0]});  //x
    testPoints.push({pos:vectorSum([0,1,0], pointAboveCar),color:[0,1,0]});  //y
    testPoints.push({pos:vectorSum([0,0,1], pointAboveCar), color:[0,0,1]});  //z
    

    var sphereCastLength = carInfo4.sphereCastLength;
    var sphereCastSphereRad = 0.2;

    var newWheelExtensions = [];

    //explicitly moves these points, though could just do mat4 translate, and this is basically just a matrix multiply
    for (var ww=0;ww<carInfo4.wheelOffsets.length;ww++){
        var wheelOffset = carInfo4.wheelOffsets[ww];

        var wheelStartPos = vectorSum( vectorSum( backDirection.map(x=>x*wheelOffset[2]), sideDirection.map(x=>x*wheelOffset[0])), vectorSum(upDirection.map(x=>x*wheelOffset[1]), carPos));    //NOTE could write as matrix methods.

        var wheelEndPos =  vectorSum( wheelStartPos, upDirection.map(x=>x*-sphereCastLength));
        var wheelCollision = rayBvhTriangleCollisionTopLevel(wheelStartPos, wheelEndPos, cityBvh, cityPosition, cityScale, sphereCastSphereRad);
    
        newWheelExtensions[ww] = sphereCastLength*Math.min(wheelCollision.fractionAlongRay, 1);

        testPoints.push({pos:wheelStartPos, color:[1,1,1]});
        testPoints.push({pos:wheelEndPos, color:[1,1,1]});

        if (wheelCollision.fractionAlongRay<1){
            testPoints.push({pos:wheelCollision.collisionPos, color:[0.5,0.5,0.5]});
        }
    }

    //apply forces, torques given wheel extensions (spring force), change in wheel extension (damper force)
    var wheelExtensionChanges = carInfo4.wheelExtensions.map( (xx,ii) => newWheelExtensions[ii]-xx);
    var wheelExtensionSpeedsOfChange = wheelExtensionChanges.map(xx=>xx/timeChange);

    var wheelForces = newWheelExtensions.map( (xx,ii) => Math.min(0, carInfo4.springConstant*(sphereCastLength-xx) + carInfo4.damperConstant*wheelExtensionSpeedsOfChange[ii]))
        //TODO limit force to +ve

    var carForceTotal = [0,0,0];
    var carTorqueTotal = [0,0,0];
    for (var ww=0;ww<carInfo4.wheelOffsets.length;ww++){
        var wheelOffset = carInfo4.wheelOffsets[ww];
        carForceTotal[1] += wheelForces[ww]; //this is force in frame of car
        var thisTorque = crossProduct(wheelOffset,[0,wheelForces[ww],0]);   //torque in frame of car
        carTorqueTotal = vectorSum(carTorqueTotal, thisTorque);
    }

    if (guiParams.carMode == "car4"){
        var turnInput = keyThing.leftKey() - keyThing.rightKey();
        var elevationInput = keyThing.upKey() - keyThing.downKey();
        var rollInput = keyThing.keystate(69)-keyThing.keystate(81);

        carTorqueTotal[0]-= 10*elevationInput;
        carTorqueTotal[1]-= 10*turnInput;
        carTorqueTotal[2]+= 10*rollInput;
    }

    
    carInfo4.wheelExtensions = newWheelExtensions;


    //forward thrust
    if (guiParams.carMode == "car4"){
        var forwardBack = keyThing.keystate(87)-keyThing.keystate(83);	//vertical W,S = up, down
        var forwardThrust = forwardBack*0.01*timeChange;
        var forwardThrustVec = backDirection.map( xx=> -xx*forwardThrust);
        carInfo4.vel = vectorSum(carInfo4.vel, forwardThrustVec);
    }


    var brakeInput = keyThing.bKey();
    var acceleratorInput = keyThing.nKey();   //TODO use w/s for this!

    carInfo4.brakePedal = carInfo4.brakePedal*0.9+ 0.1*brakeInput;  //timestep dependence
    carInfo4.acceleratorPedal = carInfo4.acceleratorPedal*0.9+ 0.1*acceleratorInput;

    var brake = carInfo4.brakePedal;
    var accelerator = carInfo4.acceleratorPedal; 



    //calculate wheel spin speeds (free wheeling)
    //calculate wheel speed relative to ground
    //calculate motion of point at bottom of wheel relative to ground, subtract motion in roll direction (assume free wheeling)
    //calculate deflections y combining influence of movement over frame, and existing deflection
    //limit deflections to circle of grip
    //apply force/torque using deflections. spring and damper.

    var steeringDirectionFront = [Math.sin(carInfo4.steeringAngle), Math.cos(carInfo4.steeringAngle)];
    var steeringDirectionBack = [0,1];
    carInfo4.steeringDirections = [steeringDirectionFront,steeringDirectionFront,steeringDirectionBack,steeringDirectionBack];


    //for debug display
    carInfo4.wheelReactionForces = wheelForces;

    var carVelInCarFrame = [sideDirection,upDirection,backDirection].map(vec=>dotProduct(vec, carInfo4.vel));   //1st part from carMatrix. TODO formulate more neatly?


    var patchVelocities = [];
    var wheelRollSpeeds = [];
    var patchFreewheelingVelocities = [];
    for (var ww=0;ww<4;ww++){
        var thisWheelOffset = carInfo4.wheelOffsets[ww];    //TODO adjust downward to get bottom of tyre in car frame
        var contactPatchPositionInCarFrame = thisWheelOffset;   //TODO adjust vertical position of contact in car frame due to suspension displacement
        var patchVelocityDueToAngVel = crossProduct(contactPatchPositionInCarFrame, carInfo4.angVel);
            //TODO include upward component due to rate of change of suspension movement (though currently not used for display/force calculation)
        var patchVelocity = vectorSum(carVelInCarFrame, patchVelocityDueToAngVel);
        patchVelocities.push(patchVelocity);

        var steerDir2d = carInfo4.steeringDirections[ww];
        var steerDir3d = [steerDir2d[0], 0, steerDir2d[1]];
        var wheelRollSpeed = dotProduct(patchVelocity, steerDir3d);
        wheelRollSpeeds.push(wheelRollSpeed);

        var accelerationMultiplier = ww>1 ? 1 : 0.5;   //more power to rear wheels. TODO limit to engine power
        var accelerationFactorThisWheel = accelerator*accelerationMultiplier;

        //hack in some torque vectoring in hope of helping car turn. NOTE this is AWD, contradicting above! 
        var tVectoringSign = (ww%2 == 0) ? 1:-1;
        var tVectoringThisWheel = tVectoringSign*carInfo4.steeringAngle;

        var rollSpeedAccountingForBraking = wheelRollSpeed * (1- 0.13*brake + 0.2*accelerationFactorThisWheel + 0.5*tVectoringThisWheel);    //simple braking. tuned so just enough to get 1g deceleration
            //since grip force prop to displacement, and displacement max prop to wheel loading, adding brake balance so that more heavily loaded wheels brake harder might be useful

        var velToSubtract = steerDir3d.map(xx=>xx*rollSpeedAccountingForBraking);  //TODO check sign
        var patchFreewheelingVelocity = vectorDifference(patchVelocity, velToSubtract);
        patchFreewheelingVelocities.push(patchFreewheelingVelocity);

        
        var patchDisplacementMultipliers = tyreDeflectionWeights(0.01*wheelRollSpeed);    //TODO tune input multiplier, work out what decay length implies. critical slip angle at high speed
                                                                                            //can test approximately by moving car forward with wheel side forces turned off, see what slip angle (like angle of attack)
                                                                                            //  before deflection hits limit. smaller multiplier gives smaller slip angle to hit tyre deflection limit.

        var existingPatchDisplacement = carInfo4.patchDisplacements[ww];
        var newMovementPatchDisplacement = patchFreewheelingVelocity.map(xx=>xx*timeChange*0.001);  //TODO units?
        var patchDisplacement = vectorSum( existingPatchDisplacement.map(xx=>xx*patchDisplacementMultipliers.existingDeflection), newMovementPatchDisplacement.map(xx=>xx*patchDisplacementMultipliers.newMovement));

        //limit displacement to circle with radius proportional to ground reaction force. TODO tune to get ~1G / set a variable that use both to get displacement limit and from displacement to force.
        var uncappedPatchDisplacementMag = Math.hypot.apply(null, patchDisplacement);
        var displacementLimit = 0.01*Math.abs(wheelForces[ww]); // TODO tune constant so sensible. want displacement max something like 1 cm

        if (uncappedPatchDisplacementMag>displacementLimit){
            var multiplier = displacementLimit/uncappedPatchDisplacementMag;
            patchDisplacement = patchDisplacement.map(xx=>xx*multiplier);
            carInfo4.hittingDisplacementLimit[ww] = true;
        }else{
            carInfo4.hittingDisplacementLimit[ww] = false;
        }

        patchDisplacement[1]=0; //y patch displacement makes no sense. TODO consider whether this should be countered earlier.

        var changeInPatchDisplacement = vectorDifference(patchDisplacement,carInfo4.patchDisplacements[ww]);

        carInfo4.patchDisplacements[ww] = patchDisplacement;

        var forceToAdd = vectorSum( patchDisplacement.map(xx=>100*xx), changeInPatchDisplacement.map(xx=>10000*xx/timeChange)); //TODO choose sensible multipliers

        carForceTotal = vectorSum(carForceTotal, forceToAdd);

        var torqueToAdd = crossProduct(thisWheelOffset, forceToAdd); //todo reuse code to add both linear and angular impuluse (used elsewhere for reaction forces)

        carTorqueTotal = vectorSum(carTorqueTotal, torqueToAdd);
    }
    carInfo4.wheelContactPointInCarFrameVelocities = patchVelocities;
    carInfo4.wheelRollSpeeds = wheelRollSpeeds;
    for(var ww=0;ww<4;ww++){
        carInfo4.wheelRotations[ww] = carInfo4.wheelRotations[ww] + carInfo4.wheelRollSpeeds[ww]*timeChange*0.001/0.56;  //0.56 = wheel radius
    }
    carInfo4.patchFreewheelingVelocities = patchFreewheelingVelocities;





    //application of torque - could track angular momentum in world frame which is conserved, or track in car frame.
    //for now use isotropic moment of intertia so conserved in frame of car too.

    var scaledTorqueImpulse = carTorqueTotal.map(xx=>0.0002*timeChange*xx);  //quick adjustment to change amount of rotation

    carInfo4.angVel = vectorSum(carInfo4.angVel, scaledTorqueImpulse);

    //just decay angvel for testing
    if (guiParams.car.angularDrag){
        carInfo4.angVel = carInfo4.angVel.map(xx=>xx*0.998);
    }

    var angImpulse = carInfo4.angVel.map(xx=>xx*timeChange*0.001);

    angImpulse = angImpulse.map(xx=>0.5*xx);    //0.5 because quaternion axis angle formula has theta/2

    var angImpulseMag = Math.hypot.apply(null, angImpulse );

    var sinAng = Math.sin(angImpulseMag);
    var factor = angImpulseMag == 0 ? 0 : sinAng/angImpulseMag;
    var angImpulseTimesSineNormalised = angImpulse.map(xx=>xx*factor);

    //NOTE signs and order bit messy, guess due to mismatch in how glmatrix does quat to mat4, and how quat multiplication lib taken from 3sphere project works.
    // have tested that torques for different axes produce consistently handed rotations about those axes OK.
    var quatToRotate = [Math.cos(angImpulseMag), angImpulseTimesSineNormalised[2], -angImpulseTimesSineNormalised[1], angImpulseTimesSineNormalised[0]];

    normalise_quat(quatToRotate);

    carInfo4.quat = multiply_quaternions(carInfo4.quat, quatToRotate); 

    //normalise quat? seems quat tend to be bit less than length 1
    var quatLen = Math.hypot.apply(null, carInfo4.quat);
    carInfo4.quat = carInfo4.quat.map(xx=>xx/quatLen);

    //gravity
    if (guiParams.car.gravity){
        carInfo4.vel[1]-=0.00981*timeChange;
    }

    var impulse = carForceTotal.map(xx=> -0.001*xx*timeChange);

    var sideImpulse = impulse[0];
    var upImpulse = impulse[1];
    var backImpulse = impulse[2];

    carInfo4.vel = vectorSum(carInfo4.vel, backDirection.map(xx=>xx*backImpulse));  //TODO matrix formulation
    carInfo4.vel = vectorSum(carInfo4.vel, upDirection.map(xx=>xx*upImpulse));
    carInfo4.vel = vectorSum(carInfo4.vel, sideDirection.map(xx=>xx*sideImpulse));

    carInfo4.pos = vectorSum(carInfo4.pos, carInfo4.vel.map(xx=>xx*timeChange*0.001));
}
