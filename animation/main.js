var canvas = document.querySelector("#mycanvas");

var canvasHalfSize = 400;

canvas.width = canvasHalfSize*2;
canvas.height = canvasHalfSize*2;
var context = canvas.getContext("2d");
context.fillStyle = "blue";
context.strokeStyle = "#bbb";

/*
TODO
frame interpolation, slow motion option to test

import into 3d FPS project
draw rotated boxes at points (use 4x4 mat directly)
draw lines between mats in 3d - can make dotted and filled lines using many boxes/spheres
"proper" lines using rotated boxes to enclose 2 matrix endpoints
*/

testToUnderstandGlMatrix();


var animationFileList = [
    './cmuconvert-mb2-01-09/01/01_01.bvh',
    './cmuconvert-mb2-01-09/02/02_01.bvh',
    './cmuconvert141-144/144/144_01.bvh',
];

var animations = animationFileList.map(animFilename=>{return {animFilename, loaded:false}});
var selectNode = document.getElementById("animselect");

animations.forEach((animData, ii) => {
    let el = document.createElement("option");
    el.textContent = animData.animFilename;
    el.value = ii;
    selectNode.appendChild(el);
});

var currentAnimSelection = 0;
selectNode.options[0].selected = true;

selectNode.addEventListener('change', evt => {
    console.log("made a selection");
    console.log(evt);
    currentAnimSelection = selectNode.value;
    console.log("selected animation: " + currentAnimSelection);
});


requestAnimationFrame(drawAnimation);

//just kick off loading all.
//TODO if more files, load on demand
animations.forEach((animData, ii) => {
    BVH.read(animData.animFilename, function(motion) { 

        console.log(motion);

        //in order to render this -  
        // for drawing the skeleton as is - with the 0th frame disregarded or not (might be bind pose - does it matter?)
        // use the static offsets defined in the skeleton to draw spots. 
        // when drawing the animation - 
        // should determine what order to apply rotations and offsets
        // if want to do interpolation guess want quats but don't need for just drawing keyframes. 
        
        animData.data = motion;
        animData.loaded = true;

        // var animatedMats = generateMatricesListForPoints(motion.root, mat4.identity(), 123);
        // console.log(animatedMats);
    });
});

function drawAnimation(currentTime){
    requestAnimationFrame(drawAnimation);

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!animations[currentAnimSelection].loaded){
        context.strokeText("loading...", canvasHalfSize, canvasHalfSize);
        return;
    }

    var animationData = animations[currentAnimSelection].data;

    var maxAnimationFrameNum = animationData.numFrames;
    var frameDuration = animationData.frameTime * 1000;    //ms
    var animationFrame = Math.floor((Math.floor(currentTime / frameDuration)) % maxAnimationFrameNum); //TODO ensure within bounds

    var animatedMats = generateMatricesListForPoints(animationData.root, mat4.identity(), animationFrame);



    var positionsToDraw = [];

    var cameraTurnRads = parseFloat(document.getElementById("cameraturn").value) * Math.PI/180;

    animatedMats.forEach(matWithInfo => {
        var posstart = matWithInfo.from.slice(12,15);
        var posend = matWithInfo.mat.slice(12,15);
        
        var posOnCanvasStart = posOnCanvas(posstart, cameraTurnRads);
        var posOnCanvasEnd = posOnCanvas(posend, cameraTurnRads);

        if (matWithInfo.info == "after pose"){
            context.setLineDash([3,7]);
        }

        context.beginPath(); // Start a new path
        context.moveTo(posOnCanvasStart[0], posOnCanvasStart[1]);
        context.lineTo(posOnCanvasEnd[0], posOnCanvasEnd[1]);
        context.stroke(); // Render the path

        context.setLineDash([]);

        positionsToDraw.push(posOnCanvasEnd);
        context.fillRect(posOnCanvasEnd[0], posOnCanvasEnd[1], 5,5);
    //    context.strokeText(matWithInfo.id, posOnCanvas[0], posOnCanvas[1]);
    });

     context.fillText("frame: " + animationFrame,20,20);
}



function posOnCanvas(pos, cameraTurnRads){
    var horiz = pos[0]*Math.cos(cameraTurnRads) + pos[2]*Math.sin(cameraTurnRads);
    var vert = -pos[1];

    var posOnCanvas = [horiz*10 + canvasHalfSize, vert*10 + canvasHalfSize];
    return posOnCanvas;
}

function testToUnderstandGlMatrix(){
    
    console.log("testing matrix stuff");

    var randnums = Array(12).fill().map(_=>Math.random());

    var matrixA = mat4.identity();
    mat4.translate(matrixA, randnums.slice(0,3));
    mat4.rotateX(matrixA, randnums[3]);
    mat4.rotateY(matrixA, randnums[4]);
    mat4.rotateZ(matrixA, randnums[5]);

    var matrixB = mat4.identity();
    mat4.translate(matrixB, randnums.slice(6,9));
    mat4.rotateX(matrixB, randnums[9]);
    mat4.rotateY(matrixB, randnums[10]);
    mat4.rotateZ(matrixB, randnums[11]);

    var multipliedMatrix = mat4.create(matrixA);
    mat4.multiply(multipliedMatrix, matrixB);

    var allSequentialMatrix = mat4.identity();
    mat4.translate(allSequentialMatrix, randnums.slice(0,3));
    mat4.rotateX(allSequentialMatrix, randnums[3]);
    mat4.rotateY(allSequentialMatrix, randnums[4]);
    mat4.rotateZ(allSequentialMatrix, randnums[5]);
    mat4.translate(allSequentialMatrix, randnums.slice(6,9));
    mat4.rotateX(allSequentialMatrix, randnums[9]);
    mat4.rotateY(allSequentialMatrix, randnums[10]);
    mat4.rotateZ(allSequentialMatrix, randnums[11]);

    console.log({
        multipliedMatrix,
        allSequentialMatrix
    });
}

