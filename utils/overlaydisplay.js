var overlaycanvas;
var overlaycontext;

var overlaydisplay = (function(){

    var geeMeterCentre = [90,100];
    var geeMeterRadiusOneGee = 20;
    var geeMeterMaxGees = 2.5;
    var geeMeterWholeRadius = geeMeterRadiusOneGee*geeMeterMaxGees;

    var geeMeterReading = [0,0];
    var speedMph = 0;


    function setSpeedMph(speed){
        speedMph = speed;
    }

    function clear(){
        overlaycontext.clearRect(0, 0, overlaycanvas.width, overlaycanvas.height);
    }

    function drawDisplay(carMode){
        
        var steeringAngleIndicatorLen = 20;

        if (carMode == 0){return;}

        //gee meter background
        overlaycontext.beginPath()
        overlaycontext.fillStyle = "rgba(0,0,0,0.5)";
        overlaycontext.beginPath();
        overlaycontext.arc(geeMeterCentre[0], geeMeterCentre[1], geeMeterWholeRadius, 0, 2 * Math.PI);
        overlaycontext.fill();
        overlaycontext.beginPath();
        overlaycontext.arc(geeMeterCentre[0], geeMeterCentre[1], geeMeterRadiusOneGee, 0, 2 * Math.PI);
        overlaycontext.fill();
        

        if (carMode == 1){
            //gee meter
            overlaycontext.fillStyle = "white";
            overlaycontext.fillRect(geeMeterCentre[0] + geeMeterRadiusOneGee*geeMeterReading[0] - 5, geeMeterCentre[1] + geeMeterRadiusOneGee*geeMeterReading[1] - 5, 10,10);

            //steering angle
            var steeringAngleCosSin = [Math.cos(carInfo.steeringAngle), Math.sin(carInfo.steeringAngle)];
            overlaycontext.beginPath();
            overlaycontext.moveTo(200 +steeringAngleIndicatorLen*steeringAngleCosSin[1], 100 -steeringAngleIndicatorLen*steeringAngleCosSin[0]);
            overlaycontext.lineTo(200 -steeringAngleIndicatorLen*steeringAngleCosSin[1], 100 +steeringAngleIndicatorLen*steeringAngleCosSin[0]);
            overlaycontext.stroke();

            //speedo
            var speedMph = -2.236936 * 1000* carInfo.speed;    //m/s to miles per hour
            drawSpeedo(100, 300, 70, -0.6, Math.PI + 1.2, 201, 20, speedMph);
        }

        if (carMode == 2){
            //gee meter
            overlaycontext.fillStyle = "white";
            var geeMeterReading2 = carInfo2.acceleration.map(xx=>xx/9.81);
            overlaycontext.fillRect(geeMeterCentre[0] + geeMeterRadiusOneGee*geeMeterReading2[0] - 5, geeMeterCentre[1] + geeMeterRadiusOneGee*geeMeterReading2[1] - 5, 10,10);

            overlaycontext.strokeStyle = "black";

            var slipVecFront = carInfo2.slipVecFront;
            var slipVecRear = carInfo2.slipVecRear;
            var velLineScale = 50;
            //velocity of front and back in cra frame WRT ground (not including wheel rotation)
            overlaycontext.beginPath();
            overlaycontext.moveTo(200, 100);
            overlaycontext.lineTo(200 + velLineScale*slipVecFront[0], 100 + velLineScale*slipVecFront[1]);
            overlaycontext.stroke();

            overlaycontext.beginPath();
            overlaycontext.moveTo(200, 150);
            overlaycontext.lineTo(200 + velLineScale*slipVecRear[0], 150 + velLineScale*slipVecRear[1]);
            overlaycontext.stroke();

            //show capping
            //NOTE bodge - capping is done AFTER removing component in direction of tyre.
            overlaycontext.strokeStyle = "green";

            slipVecFrontMultiplierToCap = carInfo2.slipVecFrontMultiplierToCap;
            slipVecRearMultiplierToCap = carInfo2.slipVecRearMultiplierToCap;

            overlaycontext.beginPath();
            overlaycontext.moveTo(200, 100);
            overlaycontext.lineTo(200 + velLineScale*slipVecFrontMultiplierToCap*slipVecFront[0], 100 + velLineScale*slipVecFrontMultiplierToCap*slipVecFront[1]);
            overlaycontext.stroke();

            overlaycontext.beginPath();
            overlaycontext.moveTo(200, 150);
            overlaycontext.lineTo(200 + velLineScale*slipVecRearMultiplierToCap*slipVecRear[0], 150 + velLineScale*slipVecRearMultiplierToCap*slipVecRear[1]);
            overlaycontext.stroke();

            overlaycontext.strokeStyle = "blue";

            //steering angle
            var steeringAngleCosSin2 = [Math.cos(carInfo2.steeringAngle), -Math.sin(carInfo2.steeringAngle)];
            overlaycontext.beginPath();
            overlaycontext.moveTo(200 , 100);
            overlaycontext.lineTo(200 +steeringAngleIndicatorLen*steeringAngleCosSin2[1], 100 -steeringAngleIndicatorLen*steeringAngleCosSin2[0]);
            overlaycontext.stroke();

            //steering angle of rear wheels = 0
            overlaycontext.beginPath();
            overlaycontext.moveTo(200 , 150);
            overlaycontext.lineTo(200, 150 -steeringAngleIndicatorLen);
            overlaycontext.stroke();

            //calculate speed. just take forwards speed. (how is speed displayed in car measured? wheel speed?)
            var speedMph = -2.236936 * carInfo2.velInCarFrame[1];    //m/s to miles per hour

            drawSpeedo(100, 300, 70, -0.6, Math.PI + 1.2, 201, 20, speedMph);
        }
    }


    function setGeeMeter(accVecGees){
        //car z angle something like Math.atan(carMatrix[0], carMatrix[2])
        // car matrix is only rotated about z angle, so can just use XZ components of it. here probably carMatrix[0] = carMatrix[10], carMatrix[2] = -carMatrix[8]
        geeMeterReading = [accVecGees[0]*carMatrix[0] + accVecGees[2]*carMatrix[2], accVecGees[0]*carMatrix[8] + accVecGees[2]*carMatrix[10]];
    }

    function drawSpeedo(xPos, yPos, radius, minAngle, angleRange, maxSpeed, speedIncrement, currentSpeed){
        overlaycontext.beginPath()
        overlaycontext.strokeStyle = "white";
        overlaycontext.beginPath();
        overlaycontext.arc(xPos, yPos, radius, Math.PI + minAngle, Math.PI + minAngle+angleRange);  //add PI so starts from left and goes clockwise
        overlaycontext.stroke();

        var innerRad = radius*0.9;
        var innerRad2 = radius*0.2;
        var outerRad = radius*1;
        var numberRad = radius*0.75;

        
        //draw radial speed markers
        overlaycontext.strokeStyle = "white";
        overlaycontext.font = "10px Arial";

        for (var speed=0;speed<=maxSpeed; speed+=speedIncrement){
            overlaycontext.beginPath();
            var angle = minAngle + speed*angleRange/maxSpeed;
            var cosSin = [-Math.cos(angle), -Math.sin(angle)];
            
            overlaycontext.moveTo(xPos + cosSin[0]*innerRad, yPos + cosSin[1]*innerRad);
            overlaycontext.lineTo(xPos + cosSin[0]*outerRad, yPos + cosSin[1]*outerRad);
            overlaycontext.stroke();

            //TODO speed numbers
            overlaycontext.fillText(speed.toFixed(0), xPos + cosSin[0]*numberRad - 8, yPos + cosSin[1]*numberRad + 3);
        }

        //show current speed needle
        overlaycontext.strokeStyle = "red";
        overlaycontext.beginPath();
        var angle = minAngle + angleRange*currentSpeed/maxSpeed;
        var cosSin = [-Math.cos(angle), -Math.sin(angle)];
        overlaycontext.moveTo(xPos + cosSin[0]*innerRad2, yPos + cosSin[1]*innerRad2);
        overlaycontext.lineTo(xPos + cosSin[0]*outerRad, yPos + cosSin[1]*outerRad);
        overlaycontext.stroke();

        //print speed
        overlaycontext.font = "15px Arial";
        overlaycontext.fillText(currentSpeed.toFixed(1) + "mph",xPos - 30, yPos + 40);  //TODO dependence on radius
    }


    return {
        clear,
        setSpeedMph,
        drawDisplay,
        setGeeMeter
    }
})();