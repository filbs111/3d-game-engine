
var carInfo3 = {    //mechanum
    pos:[0,0,0],
    //rotation:0, //guess don't need because just using a matrix to track this for other cars!
    yawRate: 0,
    smoothedTurnInput:0,
    velInCarFrame: [0,0],
    acceleration:[0,0],
    wheelForwardRotate:0,
    wheelSideRotate:0,
    wheelTurnRotate:0
}


function processMechanumCarMechanics(timeChange, leftRight, forwardBack, mechanumTurn, enableControl){
    if (!enableControl){
        leftRight = 0;
        forwardBack = 0;
        mechanumTurn = 0;
    }


    mat4.set(carMatrix3, carMatrix3Old);


    var timeChangeSeconds = timeChange*0.001;


    //TODO modify carInfo3 according to inputs

    //TODO mechanum wheel rotation calculation given angular and linear velocity

    //TODO draw car 3
    //TODO put a camera on car3


    var velInCarFrame = carInfo3.velInCarFrame;

    velInCarFrame[0]*=0.99;
    velInCarFrame[1]*=0.99;

    var moveScale = 0.1;  //??
    velInCarFrame[0] -= moveScale* leftRight;
    velInCarFrame[1] -= moveScale* forwardBack;

    carInfo3.smoothedTurnInput += 0.01*mechanumTurn;
    carInfo3.smoothedTurnInput*=0.95;

    carInfo3.yawRate += carInfo3.smoothedTurnInput;
    carInfo3.yawRate *= 0.99;    //NOTE with this basic system total movement or turn simply proportional to button pressed time. TODO something better.

    //TODO nonlinearity of input?

    //var adjustedYawRate = 0.01*Math.pow(carInfo3.yawRate,3);

    var angleToRotateBy = carInfo3.yawRate * timeChangeSeconds;

    carInfo3.wheelTurnRotate+=angleToRotateBy;

    var cosSin = [Math.cos(angleToRotateBy), Math.sin(angleToRotateBy)];
    mat4.rotateY(carMatrix3, angleToRotateBy);  //degrees or rads?

    //also should rotate speed of car in its frame
    carInfo3.velInCarFrame = [ velInCarFrame[0]*cosSin[0] - velInCarFrame[1]*cosSin[1], velInCarFrame[1]*cosSin[0] + velInCarFrame[0]*cosSin[1] ];

    //move by speed
    mat4.translate(carMatrix3, [velInCarFrame[0],0,velInCarFrame[1]].map(x=>x*timeChangeSeconds));

    carInfo3.wheelForwardRotate += velInCarFrame[1]*timeChangeSeconds;
    carInfo3.wheelSideRotate -= velInCarFrame[0]*timeChangeSeconds;
}
