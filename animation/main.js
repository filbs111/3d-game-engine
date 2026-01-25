var canvas = document.querySelector("#mycanvas");
canvas.width = 512;
canvas.height = 512;
var context = canvas.getContext("2d");
context.fillStyle = "blue";
context.strokeStyle = "gray";

/*
TODO
browse many files
include points for offset and colour differently
read order of rotations from data instead of hardcoding up front
draw lines between succesive matrices in skeleton ("bones")
frame interpolation, slow motion option to test

import into 3d FPS project
draw rotated boxes at points (use 4x4 mat directly)
draw lines between mats in 3d - can make dotted and filled lines using many boxes/spheres
"proper" lines using rotated boxes to enclose 2 matrix endpoints
*/

testToUnderstandGlMatrix();

var animationData;


//seems rotation order varies, and order of specification matters.
//assume that used consistently throughout whatever file. TODO support mixed.
//var rotationMethods = [mat4.rotateZ, mat4.rotateX, mat4.rotateY];   //ZXY  apparently BVH rotation order is usually zxy, but examples vary!!!
//var rotationMethods = [mat4.rotateX, mat4.rotateZ, mat4.rotateY];   //XZY - seen in "poser friendly"
var rotationMethods = [mat4.rotateZ, mat4.rotateY, mat4.rotateX];   //ZYX
// var rotationMethods = [mat4.rotateX, mat4.rotateY, mat4.rotateZ];   //XYZ

BVH.read('./cmuconvert-mb2-01-09/01/01_01.bvh', function(motion) { 
//BVH.read('./cmuconvert-mb2-01-09/02/02_01.bvh', function(motion) { 
// BVH.read('./Example1.bvh', function(motion) { 

    console.log(motion);

    //in order to render this -  
    // for drawing the skeleton as is - with the 0th frame disregarded or not (might be bind pose - does it matter?)
    // use the static offsets defined in the skeleton to draw spots. 
    // when drawing the animation - 
    // should determine what order to apply rotations and offsets
    // if want to do interpolation guess want quats but don't need for just drawing keyframes. 
    
    animationData = motion;
    requestAnimationFrame(drawAnimation);

    // var animatedMats = generateMatricesListForPoints(motion.root, mat4.identity(), 123);
    // console.log(animatedMats);
});

function drawAnimation(currentTime){
    requestAnimationFrame(drawAnimation);

    var maxAnimationFrameNum = animationData.numFrames;
    var frameDuration = animationData.frameTime * 1000;    //ms
    var animationFrame = Math.floor((Math.floor(currentTime / frameDuration)) % maxAnimationFrameNum); //TODO ensure within bounds

    var animatedMats = generateMatricesListForPoints(animationData.root, mat4.identity(), animationFrame);


    context.clearRect(0, 0, canvas.width, canvas.height);

    var positionsToDraw = [];

    var cameraTurnRads = parseFloat(document.getElementById("cameraturn").value) * Math.PI/180;

    animatedMats.forEach(matWithInfo => {
        //console.log(mat);
        var pos = matWithInfo.mat.slice(12,15);    //?
        // var pos = [matWithInfo.mat[3], matWithInfo.mat[7], matWithInfo.mat[11]];

        // var matToInvert = mat4.create( matWithInfo.mat);
        // mat4.inverse(matToInvert);
        //var pos = matToInvert.slice(12,15);

        var horiz = pos[0]*Math.cos(cameraTurnRads) + pos[2]*Math.sin(cameraTurnRads);
        var vert = -pos[1];

        var posOnCanvas = [horiz*7 + 256, vert*7 + 256];
        positionsToDraw.push(posOnCanvas);
        context.fillRect(posOnCanvas[0], posOnCanvas[1], 5,5);
    //    context.strokeText(matWithInfo.id, posOnCanvas[0], posOnCanvas[1]);
    });

     context.fillText("frame: " + animationFrame,20,20);
}

function generateMatricesListForPoints(bone, inputMat, frameIndex){
    //TODO make this yield matrices to avoid creating large array? (maybe retain a stack of mats as traverse skeleton)
    
    //make recursive - assume for now that offset is applied then animation rotation+offset. (?)

    var matsToReturn = [];

    var firstMat = mat4.create(inputMat);
    // var firstMat = mat4.identity();

    translateMatXyz(firstMat, [bone.offsetX, bone.offsetY, bone.offsetZ]);

    var secondMat = mat4.create(firstMat);

    //apply animation of this bone. TODO get order right!
    var animFrame = bone.frames[frameIndex];
    if (bone.channels.length==6){
        // rotateMatZyz(secondMat, animFrame.slice(3));
        translateMatXyz(secondMat, animFrame.slice(0,3));
        rotateMat(secondMat, animFrame.slice(3));
    }else{
        rotateMat(secondMat, animFrame);
    }

    if (bone.hasEnd){
        var endMat = mat4.create(secondMat);
        translateMatXyz(endMat, [bone.endOffsetX, bone.endOffsetY, bone.endOffsetZ]);
        matsToReturn.push({mat:endMat, id:bone.id, info:"after end offset"});
    }

   
    matsToReturn.push({mat:secondMat, id:bone.id, info:"after pose"});


    if (!bone.children || bone.children.length == 0){
        return matsToReturn;
    }

    var matArrs = [matsToReturn];

    bone.children.forEach(childBone => matArrs.push(generateMatricesListForPoints(childBone, secondMat, frameIndex)));

    return matArrs.flat();
}

function translateMatXyz(mat, xyz){
    mat4.translate(mat, xyz);
}

function rotateMat(mat, angles){
    var rads = angles.map(x=>x*Math.PI/180);

    rotationMethods[0](mat, rads[0]);
    rotationMethods[1](mat, rads[1]);
    rotationMethods[2](mat, rads[2]);
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
