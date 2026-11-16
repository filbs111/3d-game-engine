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

    frontWheelRotation:0,
    rearWheelRotation:0,

    brakePedal:0,
    acceleratorPedal:0,
    
    //invariants? 
    // length/angle over which tyre deflection decays
    // mass, angular mass? 
    // height of centre of mass for weight transfer
    // power, drivetrain mass
    // aero drag, rolling resistance
    // downforce
    // steering lock, speed dependence, input to steering angle method
}

var car2steeringVel = 0;
var car2steeringSmoothedSteeringInput = 0;

function processCar2Mechanics(timeChange, leftRight, forwardBack, enableControl){

    if (!enableControl){
        leftRight = 0;
        forwardBack = 0;
    }

    var brakeInput = keyThing.bKey();
    var acceleratorInput = keyThing.nKey();   //TODO use w/s for this!

    carInfo2.brakePedal = carInfo2.brakePedal*0.9+ 0.1*brakeInput;
    carInfo2.acceleratorPedal = carInfo2.acceleratorPedal*0.9+ 0.1*acceleratorInput;

    var brake = carInfo2.brakePedal;
    var accelerator = carInfo2.acceleratorPedal; 


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
    var speedMag = Math.sqrt(totalSpeedSq);

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
    // carInfo2.steeringAngularSpeed += 0.05*steeringAngleTarget;
    // carInfo2.steeringAngularSpeed*=0.95;
    // carInfo2.steeringAngle += carInfo2.steeringAngularSpeed;

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


    var brakebias = guiParams.car.brakeBias;

    var brakeAmount = 0.2*brake;   //rotate wheels slower than free wheeling speed. impact should mean constant braking force, but fading out near zero speed due
        //to smallValDeterminingLowSpeedResponse stuff. NOTE this number is quite large!

    var frontBrakeAmount = brakeAmount*brakebias;
    var rearBrakeAmount = brakeAmount*(1-brakebias);

    frontBrakeAmount+=0.002;    //like constant rolling resistance (though nicely goes to 0 for very slow speed)
    rearBrakeAmount+=0.002;     //""

    //proportional to 1/speed. TODO correct numbers.
    var availableAcelleration = 30.0/(0.1+speedMag);   //NOTE very high at zero speed - addition in denominator makes finite at zero. TODO something better - add before sqrt for hump
                //at zero, or drive continuous wheel speed, auto limit wheel spin, etc..

    var rearWheelBrakeAccAmount = rearBrakeAmount - 0.2*accelerator*availableAcelleration;    //NOTE accelerator wont work at zero speed like this due to smallValDeterminingLowSpeedResponse

    var rearWheelsRimVelVsGroundInCarFrame = rearWheelsVel.map(x=>x);
    rearWheelsRimVelVsGroundInCarFrame[1] *= rearWheelBrakeAccAmount;

    var frontWheelsRimVelVsGroundInCarFrame = frontWheelsVel.map(x=>x);
    var frontWheelDirectionInCarFrame = [Math.sin(carInfo2.steeringAngle), Math.cos(carInfo2.steeringAngle)];
    var dotDirectionWithVel = dotProd2(frontWheelDirectionInCarFrame, frontWheelsRimVelVsGroundInCarFrame);

    //rotate front wheels
    carInfo2.frontWheelRotation += dotDirectionWithVel*(1-frontBrakeAmount)*timeChangeSeconds/0.56;   //over wheel radius. TODO check radius

    //rotate rear wheels
    carInfo2.rearWheelRotation += rearWheelsVel[1]*(1-rearWheelBrakeAccAmount)*timeChangeSeconds/0.56;   //over wheel radius. TODO check radius


    for (var ii=0;ii<2;ii++){
        frontWheelsRimVelVsGroundInCarFrame[ii] -= dotDirectionWithVel*(1-frontBrakeAmount)*frontWheelDirectionInCarFrame[ii];
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


    //work out load on each wheel, and limit slip proportional to load.
    // use current previous frame acceleration to determine front, back tyre loads together with tyre positions, centre of mass.
    // balance torques.
    // 1) rearReactionForceOverCarMass * rearWheelLongPos + frontReactionForceOverCarMass * frontWheelLongPos = acceleration * heightOfCentreOfMassAboveGround
    // balance gravity and reaction 
    // 2) rearReactionForceOverCarMass + frontReactionForceOverCarMass = 1g
    // sub 2 into 1...
    // (1g -frontReactionForceOverCarMass)  * rearWheelLongPos + frontReactionForceOverCarMass * frontWheelLongPos = acceleration * heightOfCentreOfMassAboveGround
    // frontReactionForceOverCarMass * (-rearWheelLongPos + frontWheelLongPos) = -1g*rearWheelLongPos + acceleration * heightOfCentreOfMassAboveGround
    // frontReactionForceOverCarMass = (1g*rearWheelLongPos - acceleration * heightOfCentreOfMassAboveGround ) / ( rearWheelLongPos - frontWheelLongPos)
    // using 2, get rear value
    // rearReactionForceOverCarMass =  (1g*frontWheelLongPos + acceleration * heightOfCentreOfMassAboveGround ) / ( rearWheelLongPos - frontWheelLongPos)
    
    //NOTE some signs messed up above...

    //cap these vectors within some limit (TODO slip ratio/angle force fall off outside optimal circle)

    //check can retain existing behaviour
    carInfo2.centreMassHeight = -0.5;   // - because missed a sign somewhere? is acceleration measured rearwards?

    var slipVecCapMagConst = 0.3 / 9.81;   //guess number...
    var wheelbase = carInfo2.frontWheelLongPos - carInfo2.rearWheelLongPos;
    var accCofM = carInfo2.acceleration[1]*carInfo2.centreMassHeight; 
    var slipVecCapMagFront = slipVecCapMagConst * ( -9.81*carInfo2.rearWheelLongPos - accCofM ) / wheelbase;
    var slipVecCapMagRear = slipVecCapMagConst * ( 9.81*carInfo2.frontWheelLongPos + accCofM ) / wheelbase;

    var slipSqFront = dotProd2(frontWheelSlipVector, frontWheelSlipVector);
    var slipSqRear = dotProd2(rearWheelSlipVector, rearWheelSlipVector);

    var slipMagFront = Math.sqrt(slipSqFront);
    var slipVecFrontMultiplierToCap = Math.min(Math.abs(slipVecCapMagFront/slipMagFront), 1);
    frontWheelsCappedSlip = frontWheelSlipVector.map(x=>x*slipVecFrontMultiplierToCap);

    var slipMagRear= Math.sqrt(slipSqRear);
    var slipVecRearMultiplierToCap = Math.min(Math.abs(slipVecCapMagRear/slipMagRear), 1);
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

    //aero drag
    // force in direction of travel, proportional to speed squared, so speed*|speed|
    var aeroDragConst = -0.00005;   //TODO reasoned value - current value likely too high, because chosen to balance too high engine power
    var aeroDrag = carInfo2.velInCarFrame.map(x => x*aeroDragConst*speedMag);

    //apply forces
    var acceleration = [0,1].map(ii => frontWheelForceInCarFrame[ii] + rearWheelForceInCarFrame[ii] + aeroDrag[ii]).map(xx=> const2*xx);

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


    //damp yaw just in hope of making car more controllable. 
    carInfo2.yawRate *= 0.99;
}
