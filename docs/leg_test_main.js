var mycanvas = document.querySelector("#mycanvas");
//mycanvas.style.backgroundColor = "lime";

var ctx = mycanvas.getContext("2d");

var canvasSize = 512;
var canvasCentre = canvasSize/2;
mycanvas.width = canvasSize;
mycanvas.height= canvasSize;

requestAnimationFrame(updateCanvas);


function updateCanvas(frameTime){
    //console.log("drawing legs");
    requestAnimationFrame(updateCanvas);

    ctx.strokeStyle = "blue";

    ctx.clearRect(0,0,canvasSize,canvasSize);

    //draw a clock hand
    var handLength = canvasCentre *0.9;
    var ang = frameTime*0.002;
    // var cosSin = [Math.cos(ang),Math.sin(ang)];

    // ctx.beginPath();
    // ctx.moveTo(canvasCentre,canvasCentre);

    // ctx.lineTo(canvasCentre + handLength*cosSin[0], canvasCentre + handLength*cosSin[1]);
    // ctx.stroke();

    //draw a leg
    //for these vals ankle path is something like a wing shape
    // var hipAverageAngle = document.getElementById("hipAverageAngle").ariaValueMax;
    // drawLegs(-0.5, 1, 
    //     1.2, 1.2, 
    //     1.3,  ang);

    var hipAverageAngle = parseFloat(document.getElementById("hipAverageAngle").value);
    var hipAngleHalfRange = parseFloat(document.getElementById("hipAngleHalfRange").value);
    var kneeAverageAngle = parseFloat(document.getElementById("kneeAverageAngle").value);
    var kneeAngleHalfRange = parseFloat(document.getElementById("kneeAngleHalfRange").value);
    var kneeAngleLag = parseFloat(document.getElementById("kneeAngleLag").value);

    var reverseAnim = document.getElementById("reverseAnim").checked;

    drawLegs(hipAverageAngle, hipAngleHalfRange, 
        kneeAverageAngle, kneeAngleHalfRange, 
        kneeAngleLag, reverseAnim? -ang :ang);
}


function drawLegs(hipAverageAngle, hipAngleHalfRange, kneeAverageAngle, kneeAngleHalfRange, kneeAngleLag, currentAngleInput){
    //angles are relative to bone attached to.
    var jointPositions = calcJointPositions(hipAverageAngle, hipAngleHalfRange, kneeAverageAngle, kneeAngleHalfRange, kneeAngleLag, currentAngleInput);

    var jointPositionsOtherLeg = calcJointPositions(hipAverageAngle, hipAngleHalfRange, kneeAverageAngle, kneeAngleHalfRange, kneeAngleLag, currentAngleInput + Math.PI);

    drawSingleLeg("blue", jointPositions);
    drawSingleLeg("orange", jointPositionsOtherLeg);

    //draw path ankle takes.
    var resultsArr=[];
    for (var aa=0;aa<2*Math.PI;aa+=0.01){
        resultsArr.push(calcJointPositions(hipAverageAngle, hipAngleHalfRange, kneeAverageAngle, kneeAngleHalfRange, kneeAngleLag, aa).anklePos);
    }

    ctx.beginPath();
    var lastItem = resultsArr[resultsArr.length-1];
    ctx.moveTo(lastItem[0],lastItem[1]);
    for (var ii=0;ii<resultsArr.length;ii++){
        ctx.lineTo(resultsArr[ii][0],resultsArr[ii][1]);
    }
    ctx.stroke();
}

function drawSingleLeg(colorString, jointPositions){
    //console.log({hipAverageAngle, hipAngleHalfRange, kneeAverageAngle, kneeAngleHalfRange, kneeAngleLag, currentAngleInput, 
   //     hipAngle, kneeAngle, hipPos, kneePos, anklePos});
    ctx.strokeStyle = colorString;

    ctx.beginPath();
    ctx.moveTo(jointPositions.hipPos[0],jointPositions.hipPos[1]);
    ctx.lineTo(jointPositions.kneePos[0],jointPositions.kneePos[1]);
    ctx.lineTo(jointPositions.anklePos[0],jointPositions.anklePos[1]);
    ctx.stroke();
}

function calcJointPositions(hipAverageAngle, hipAngleHalfRange, kneeAverageAngle, kneeAngleHalfRange, kneeAngleLag, currentAngleInput){
    //angles are relative to bone attached to.
    var thighLength = canvasCentre *0.5;
    var calfLength = canvasCentre *0.5;

    var hipAngle = hipAverageAngle + Math.sin(currentAngleInput)*hipAngleHalfRange;
    var kneeAngle = kneeAverageAngle + Math.sin(currentAngleInput -kneeAngleLag)*kneeAngleHalfRange;

    var hipPos = [canvasCentre, canvasCentre/2];
    var kneePos = [hipPos[0] + thighLength*Math.sin(hipAngle), hipPos[1] + thighLength*Math.cos(hipAngle)];
    var anklePos = [kneePos[0] + calfLength*Math.sin(hipAngle+kneeAngle) , kneePos[1] + calfLength*Math.cos(hipAngle+kneeAngle)];

    return {
        hipPos,
        kneePos,
        anklePos
    }
}