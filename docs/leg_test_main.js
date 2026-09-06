var mycanvas = document.querySelector("#mycanvas");
//mycanvas.style.backgroundColor = "lime";

var ctx = mycanvas.getContext("2d");

var canvasSize = 512;
var canvasCentre = canvasSize/2;
mycanvas.width = canvasSize;
mycanvas.height= canvasSize;

requestAnimationFrame(updateCanvas);

var lastFrameTime=0;
var ang=0;

var standardRunValues = {
    hipAverageAngle: -0.1,
    hipAngleHalfRange: 1,
    kneeAverageAngle: 1,
    kneeAngleHalfRange: 1,
    kneeAngleLag: 1.5,
    bobPhase: -0.2
};

var otherRunValues = {
    hipAverageAngle: 0.19, hipAngleHalfRange: 0.87, kneeAverageAngle: 0.94, kneeAngleHalfRange: 0.99, kneeAngleLag: 1.5,
    bobPhase: -0.2
}

var standardWalkValues = {
    hipAverageAngle: -0.1,
    hipAngleHalfRange: .5,
    kneeAverageAngle: .3,
    kneeAngleHalfRange: .3,
    kneeAngleLag: 1.5,
    bobPhase: -0.25
};

var bobPhase = 0;

var latestSettings; //global so can print

function updateCanvas(frameTime){
    //console.log("drawing legs");
    requestAnimationFrame(updateCanvas);

    ctx.strokeStyle = "blue";

    ctx.clearRect(0,0,canvasSize,canvasSize);

    //draw a clock hand
    var handLength = canvasCentre *0.9;



    
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


    var wholeRangeScale = parseFloat(document.getElementById("wholeRangeScale").value);

    var legSettings = {
        hipAverageAngle: parseFloat(document.getElementById("hipAverageAngle").value),
        hipAngleHalfRange: wholeRangeScale*parseFloat(document.getElementById("hipAngleHalfRange").value),
        kneeAverageAngle: wholeRangeScale*parseFloat(document.getElementById("kneeAverageAngle").value),
        kneeAngleHalfRange: wholeRangeScale*parseFloat(document.getElementById("kneeAngleHalfRange").value),
        kneeAngleLag: parseFloat(document.getElementById("kneeAngleLag").value),
        bobPhase: -0.2
    };

    latestSettings = legSettings;

    //legSettings = standardRunValues;
    //legSettings = standardWalkValues;

    var runAmount = parseFloat(document.getElementById("animBlend").value);
    var walkAmount = 1-runAmount;    

    var runToBlend = otherRunValues;
    var walkToBlend = standardWalkValues;
    //TODO how to get to blend amounts from desired movement speed so that foot speed about right?  

    //override settings from sliders
    var legSettings = {
        hipAverageAngle: walkAmount*walkToBlend.hipAverageAngle + runAmount*runToBlend.hipAverageAngle,
        hipAngleHalfRange: walkAmount*walkToBlend.hipAngleHalfRange + runAmount*runToBlend.hipAngleHalfRange,
        kneeAverageAngle: walkAmount*walkToBlend.kneeAverageAngle + runAmount*runToBlend.kneeAverageAngle,
        kneeAngleHalfRange: walkAmount*walkToBlend.kneeAngleHalfRange + runAmount*runToBlend.kneeAngleHalfRange,
        kneeAngleLag: walkAmount*walkToBlend.kneeAngleLag + runAmount*runToBlend.kneeAngleLag,
        bobPhase: walkAmount*walkToBlend.bobPhase + runAmount*runToBlend.bobPhase
    };

    bobPhase = legSettings.bobPhase;    //hack - because used elsewhere 

    var reverseAnim = document.getElementById("reverseAnim").checked;
    //var cycleSpeed = parseFloat(document.getElementById("cycleSpeed").value);

    var cycleSpeed = 3*runAmount + 1*walkAmount;

    ang+= cycleSpeed*(frameTime-lastFrameTime)*0.004;

    lastFrameTime = frameTime;

    var bob = 10* Math.pow(Math.sin(ang + legSettings.bobPhase),2);


    drawLegs(legSettings, reverseAnim? -ang :ang, bob);
}


function drawLegs(legSettings, currentAngleInput, bob){

    var {hipAverageAngle, hipAngleHalfRange, kneeAverageAngle, kneeAngleHalfRange, kneeAngleLag} = legSettings;

    //angles are relative to bone attached to.
    var jointPositions = calcJointPositions(hipAverageAngle, hipAngleHalfRange, kneeAverageAngle, kneeAngleHalfRange, kneeAngleLag, currentAngleInput, bob);

    var jointPositionsOtherLeg = calcJointPositions(hipAverageAngle, hipAngleHalfRange, kneeAverageAngle, kneeAngleHalfRange, kneeAngleLag, currentAngleInput + Math.PI, bob);

    drawSingleLeg("blue", jointPositions);
    drawSingleLeg("orange", jointPositionsOtherLeg);

    //draw path ankle takes.
    var resultsArr=[];
    for (var aa=0;aa<2*Math.PI;aa+=0.01){
        var thisbob = 10* Math.pow(Math.sin(aa+bobPhase),2); //if reversed, aa might not work same as -ang
        resultsArr.push(calcJointPositions(hipAverageAngle, hipAngleHalfRange, kneeAverageAngle, kneeAngleHalfRange, kneeAngleLag, aa, thisbob).anklePos);
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

function calcJointPositions(hipAverageAngle, hipAngleHalfRange, kneeAverageAngle, kneeAngleHalfRange, kneeAngleLag, currentAngleInput, bob){
    //angles are relative to bone attached to.
    var thighLength = canvasCentre *0.5;
    var calfLength = canvasCentre *0.5;

    var hipAngle = hipAverageAngle + Math.sin(currentAngleInput)*hipAngleHalfRange;
    var kneeAngle = kneeAverageAngle + Math.sin(currentAngleInput -kneeAngleLag)*kneeAngleHalfRange;

    var hipPos = [canvasCentre, canvasCentre/2 + bob];
    var kneePos = [hipPos[0] + thighLength*Math.sin(hipAngle), hipPos[1] + thighLength*Math.cos(hipAngle) + bob];
    var anklePos = [kneePos[0] + calfLength*Math.sin(hipAngle+kneeAngle) , kneePos[1] + calfLength*Math.cos(hipAngle+kneeAngle) + bob];

    return {
        hipPos,
        kneePos,
        anklePos
    }
}